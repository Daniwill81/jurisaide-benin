from typing import Optional
from beanie import Document, Link
from pydantic import Field
from datetime import datetime
from api.models.user.user import User
from api.models.dossier.dossier import Dossier

class DocumentGenere(Document):
    """
    Modèle pour les documents générés (lettres, reçus, etc.).
    """
    titre: str
    type_document: str  # 'lettre_licenciement', 'recu_indemnite', etc.
    url_s3: str
    date_generation: datetime = Field(default_factory=datetime.utcnow)
    
    user: Link[User]
    dossier: Optional[Link[Dossier]] = None

    class Settings:
        name = "documents_generes"
