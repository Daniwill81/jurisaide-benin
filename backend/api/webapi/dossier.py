import logging

from beanie import PydanticObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status

from sap.fastapi.pagination import CursorInfo, PaginatedData

from api.models import Dossier, User
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.serializers.dossier import DossierSerializer, WriteDossierSerializer
from api.tasks.similarity_scorer import process_dossier_ai

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
    background_tasks: BackgroundTasks,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DossierSerializer:
    """Create a new dossier."""
    try:
        logger.info(f"Creating dossier for user {request_user.id}")
        logger.debug(f"Serializer data: {serializer_write.model_dump()}")
        instance = await serializer_write.create(request_user=request_user)
        logger.info(f"Dossier created with id: {instance.id}")
        background_tasks.add_task(process_dossier_ai, str(instance.id))
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
        if instance:
            logger.error(f"DEBUG: Dossier {pk} raw calculation_requests: {instance.calculation_requests}")
            # Try to fetch them manually one by one if the list seems to contain only links
            for i, req in enumerate(instance.calculation_requests):
                try:
                    if hasattr(req, "fetch"):
                        fetched = await req.fetch()
                        logger.error(f"  Req {i} fetched: {type(fetched)}")
                except Exception as e:
                    logger.error(f"  Error fetching req {i}: {e}")

            await instance.fetch_all_links()
            logger.error(f"DEBUG: Dossier {pk} final calculation_requests count: {len(instance.calculation_requests)}")
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
    background_tasks: BackgroundTasks,
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
        await instance.fetch_all_links()
        logger.info(f"Dossier {pk} updated successfully")
        background_tasks.add_task(process_dossier_ai, pk)
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
