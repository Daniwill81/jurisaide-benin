import os
import sys
import re
from typing import List
from pypdf import PdfReader

# Add backend to path to import app modules
sys.path.append(os.getcwd())

from api.llm.vector_store import articles_store

def index_labor_code(pdf_path: str):
    """
    Parse the Labor Code PDF and index it in ChromaDB.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File {pdf_path} not found.")
        return

    print(f"Reading PDF: {pdf_path}")
    reader = PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"

    # Regex to find articles. It usually looks like "Art. 1.-" or "Article 1.-"
    articles = re.split(r'(Article\s+\d+[\s\.\-]+)', full_text)
    
    texts = []
    metadatas = []
    
    for i in range(1, len(articles), 2):
        article_header = articles[i].strip()
        article_content = articles[i+1].strip()
        
        # Extract article number
        match = re.search(r'Article\s+(\d+)', article_header)
        article_num = match.group(1) if match else "Inconnu"
        
        full_article_text = f"{article_header} {article_content}"
        
        texts.append(full_article_text)
        metadatas.append({
            "law_name": "Loi 98-004 (Code du Travail)",
            "article_number": article_num,
            "source": pdf_path
        })

    print(f"Found {len(texts)} articles. Indexing...")
    
    articles_store.add_documents(texts=texts, metadatas=metadatas)
    print("Indexing complete.")

if __name__ == "__main__":
    index_labor_code("docs/Loi no 98-004 du 27 janvier 1998.pdf")
