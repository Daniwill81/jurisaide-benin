import os
import sys
import asyncio
import re
from pathlib import Path
from datetime import datetime

# Add backend to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from api.models import LegalCase, User
from api.llm.vector_store import cases_store
from AppMain.settings import AppSettings

def parse_jurisprudence_md(content: str) -> dict:
    """
    Parse the structured Markdown files of jurisprudence.
    """
    data = {
        "case_title": "",
        "court_name": "",
        "decision_date": datetime.utcnow(),
        "summary": "",
        "facts": "",
        "legal_reasoning": "",
        "outcome": "",
        "tags": []
    }
    
    # Title
    title_match = re.search(r"^# (.*?)$", content, re.MULTILINE)
    if title_match:
        data["case_title"] = title_match.group(1).strip()
        
    # Reference
    ref_match = re.search(r"\*\*Référence:\*\*\s*(.*?)\s*$", content, re.MULTILINE)
    if ref_match:
        data["case_title"] += f" ({ref_match.group(1).strip()})"
        
    # Tribunal
    tribunal_match = re.search(r"\*\*Tribunal:\*\*\s*(.*?)\s*$", content, re.MULTILINE)
    if tribunal_match:
        data["court_name"] = tribunal_match.group(1).strip()
        
    # Jugement Date
    date_match = re.search(r"\*\*Jugement:\*\*\s*(\d{2} \w+ \d{4})", content)
    if date_match:
        # Simple date parsing or just use the string if it fails
        try:
            # This is a bit complex due to French months, so we'll just use a dummy or try to map
            pass
        except:
            pass
            
    # Sections extraction
    sections = {
        "facts": r"## 💼 FAITS ÉTABLIS(.*?)(?=##|$)",
        "legal_reasoning": r"## ⚖️ POINTS DE DROIT(.*?)(?=##|$)",
        "outcome": r"## 💰 INDEMNITÉS ACCORDÉES(.*?)(?=##|$)",
        "summary": r"## 📋 IDENTIFICATION DES PARTIES(.*?)(?=##|$)"
    }
    
    for key, pattern in sections.items():
        match = re.search(pattern, content, re.DOTALL)
        if match:
            data[key] = match.group(1).strip()
            
    # Tags based on content
    if "Licenciement Abusif" in content:
        data["tags"].append("Licenciement Abusif")
    if "Préavis" in content:
        data["tags"].append("Préavis")
    if "Congés" in content:
        data["tags"].append("Congés Payés")
        
    return data

async def index_jurisprudence():
    """
    Read markdown files from docs/legal/jurisprudence and index them.
    """
    # Initialize DB
    settings = AppSettings
    mongo = settings.MONGO
    if mongo.username and mongo.password:
        uri = f"{mongo.protocol}://{mongo.username}:{mongo.password}@{mongo.host}"
    else:
        uri = f"{mongo.protocol}://{mongo.host}"
    
    if mongo.port:
        uri += f":{mongo.port}"
    
    uri += f"/{mongo.db}"
    if mongo.params:
        uri += f"?{mongo.params}"

    client = AsyncIOMotorClient(uri)
    await init_beanie(database=client[settings.MONGO.db], document_models=[LegalCase, User])
    
    juris_path = Path("docs/legal/jurisprudence")
    if not juris_path.exists():
        # Try relative to script
        juris_path = Path(__file__).parent.parent / "docs/legal/jurisprudence"
        
    if not juris_path.exists():
        print(f"Directory {juris_path} not found.")
        return

    print(f"Indexing from {juris_path}")

    cases_to_db = []
    
    for md_file in juris_path.glob("*.md"):
        if md_file.name == "README.md" or md_file.name == "INDEX.md":
            continue
            
        print(f"Processing {md_file.name}...")
        content = md_file.read_text(encoding="utf-8")
        
        parsed_data = parse_jurisprudence_md(content)
        
        # Save to DB
        legal_case = LegalCase(**parsed_data)
        await legal_case.insert()
        cases_to_db.append(legal_case)
        
        # Index in Vector Store
        # We index the full content for better search
        cases_store.add_documents(
            texts=[content],
            metadatas=[{
                "case_id": str(legal_case.id),
                "title": legal_case.case_title,
                "court": legal_case.court_name
            }],
            ids=[str(legal_case.id)]
        )

    print(f"Successfully indexed {len(cases_to_db)} cases.")

if __name__ == "__main__":
    asyncio.run(index_jurisprudence())
