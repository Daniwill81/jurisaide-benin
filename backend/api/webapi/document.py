from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.models.user.user import User
from api.models.document.document_genere import DocumentGenere
from api.models.dossier.dossier import Dossier
from api.models.calcul.indemnite import CalculationAudit
from api.controllers.document import DocumentController
from beanie import PydanticObjectId

router = APIRouter(prefix="/document", tags=["Documents"])

@router.post("/generer")
async def generer_document(
    type_doc: str,
    dossier_id: str,
    audit_id: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER]))
):
    """
    Génère un document légal pour un dossier et un calcul spécifique.
    """
    dossier = await Dossier.get(dossier_id)
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier non trouvé")
    
    audit = await CalculationAudit.get(audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit de calcul non trouvé")

    if type_doc == "lettre_licenciement":
        doc = await DocumentController.generate_dismissal_letter(request_user, dossier, audit)
    elif type_doc == "recu_indemnite":
        doc = await DocumentController.generate_indemnity_receipt(request_user, dossier, audit)
    else:
        raise HTTPException(status_code=400, detail="Type de document invalide")

    return doc

@router.get("/list", response_model=List[DocumentGenere])
async def lister_documents(
    dossier_id: Optional[str] = None,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER]))
):
    """
    Liste les documents générés par l'utilisateur, optionnellement filtrés par dossier.
    """
    query = {"user.$id": request_user.id}
    if dossier_id:
        query["dossier.$id"] = PydanticObjectId(dossier_id)
    
    docs = await DocumentGenere.find(query).to_list()
    return docs

@router.get("/{document_id}", response_model=DocumentGenere)
async def get_document(
    document_id: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER]))
):
    """
    Récupère les détails d'un document spécifique.
    """
    doc = await DocumentGenere.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    return doc
