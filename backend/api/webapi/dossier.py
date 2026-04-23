import logging

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from sap.fastapi.pagination import CursorInfo, PaginatedData

from api.models import Dossier, User
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.serializers.dossier import DossierSerializer, WriteDossierSerializer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
async def listing(
    request: Request,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> PaginatedData[DossierSerializer]:
    """List all dossiers for the current user."""
    try:
        logger.info(f"Listing dossiers for user {request_user.id}")
        cursor = CursorInfo(request=request)
        qs = Dossier.find(Dossier.user_id == request_user.id)
        logger.debug(f"Query params: {dict(request.query_params)}")

        cursor_params = cursor.get_beanie_query_params()
        logger.debug(f"Cursor params: {cursor_params}")
        qs = qs.find(**cursor_params)

        instance_list = await qs.to_list()
        total_count = await Dossier.find(Dossier.user_id == request_user.id).count()
        logger.info(f"Found {len(instance_list)} dossiers (total: {total_count})")
        cursor.set_count(total_count)

        return DossierSerializer.read_page(instance_list, request=request, cursor_info=cursor)
    except Exception as e:
        logger.error(f"Error listing dossiers: {str(e)}", exc_info=True)
        raise


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create(
    request: Request,
    serializer_write: WriteDossierSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DossierSerializer:
    """Create a new dossier."""
    try:
        logger.info(f"Creating dossier for user {request_user.id}")
        logger.debug(f"Serializer data: {serializer_write.model_dump()}")
        instance = await serializer_write.create(request_user=request_user)
        logger.info(f"Dossier created with id: {instance.id}")
        return DossierSerializer.read(instance)
    except Exception as e:
        logger.error(f"Error creating dossier: {str(e)}", exc_info=True)
        raise


@router.get("/{pk}/", status_code=status.HTTP_200_OK)
async def retrieve(
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DossierSerializer:
    """Retrieve a specific dossier."""
    try:
        logger.info(f"Retrieving dossier {pk} for user {request_user.id}")
        instance = await Dossier.find_one(
            Dossier.id == PydanticObjectId(pk), Dossier.user_id == request_user.id, fetch_links=True
        )
        if not instance:
            logger.warning(f"Dossier {pk} not found for user {request_user.id}")
            raise HTTPException(status_code=404, detail="Dossier not found")
        logger.info(f"Dossier {pk} retrieved successfully")
        return DossierSerializer.read(instance)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving dossier {pk}: {str(e)}", exc_info=True)
        raise


@router.put("/{pk}/", status_code=status.HTTP_202_ACCEPTED)
async def update(
    pk: str,
    serializer_write: WriteDossierSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DossierSerializer:
    """Update a dossier."""
    try:
        logger.info(f"Updating dossier {pk} for user {request_user.id}")
        logger.debug(f"Update data: {serializer_write.model_dump()}")
        instance = await Dossier.find_one(Dossier.id == PydanticObjectId(pk), Dossier.user_id == request_user.id)
        if not instance:
            logger.warning(f"Dossier {pk} not found for user {request_user.id}")
            raise HTTPException(status_code=404, detail="Dossier not found")

        serializer_write.instance = instance
        await serializer_write.update()
        logger.info(f"Dossier {pk} updated successfully")
        return DossierSerializer.read(instance)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dossier {pk}: {str(e)}", exc_info=True)
        raise


@router.delete("/{pk}/", status_code=status.HTTP_204_NO_CONTENT)
async def destroy(
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> None:
    """Delete a dossier."""
    try:
        logger.info(f"Deleting dossier {pk} for user {request_user.id}")
        instance = await Dossier.find_one(Dossier.id == PydanticObjectId(pk), Dossier.user_id == request_user.id)
        if instance:
            await instance.delete()
            logger.info(f"Dossier {pk} deleted successfully")
        else:
            logger.warning(f"Dossier {pk} not found for deletion for user {request_user.id}")
    except Exception as e:
        logger.error(f"Error deleting dossier {pk}: {str(e)}", exc_info=True)
        raise
