import os
import sys
import asyncio
from pathlib import Path

# Add backend to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from api.llm.vector_store import articles_store


async def index_markdown_files():
    """
    Read markdown files from docs/legal and index them.
    """
    legal_docs_path = Path("docs/legal")
    if not legal_docs_path.exists():
        print(f"Directory {legal_docs_path} not found.")
        return

    texts = []
    metadatas = []
    ids = []

    for md_file in legal_docs_path.glob("*.md"):
        if md_file.name == "README.md" or md_file.name == "TEMPLATE_ARTICLE.md":
            continue
            
        print(f"Processing {md_file.name}...")
        content = md_file.read_text(encoding="utf-8")
        
        # Simple extraction of article number from filename
        # e.g., article_44.md -> Art. 44
        article_num = md_file.stem.replace("article_", "Art. ")
        
        texts.append(content)
        metadatas.append({
            "law_name": "Loi 98-004",
            "article_number": article_num,
            "source": str(md_file)
        })
        ids.append(f"98-004-{article_num}")

    if texts:
        articles_store.add_documents(texts=texts, metadatas=metadatas, ids=ids)
        print(f"Successfully indexed {len(texts)} articles.")
    else:
        print("No articles found to index.")


if __name__ == "__main__":
    asyncio.run(index_markdown_files())
