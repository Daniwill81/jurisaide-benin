import logging
from typing import List

from fastapi import APIRouter, Depends, Query, Request, status

from api.models import User
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.query.jurisprudence import JurisprudenceQuery

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/similaires", status_code=status.HTTP_200_OK)
async def get_similar_cases(
    request: Request,
    q: str = Query(..., description="Query text to find similar cases"),
    k: int = Query(3, description="Number of cases to return"),
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> List[dict]:
    """
    Find historical legal cases similar to the provided query text.
    """
    try:
        logger.info(f"User {request_user.id} searching for similar cases: {q[:50]}...")
        results = await JurisprudenceQuery.find_similar_cases(q, k=k)
        return results
    except Exception as e:
        logger.error(f"Error in /similaires: {str(e)}")
        return []


@router.get("/", status_code=status.HTTP_200_OK)
async def list_cases(
    request: Request,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
):
    """
    List available historical cases.
    """
    return await JurisprudenceQuery.get_all_cases()
