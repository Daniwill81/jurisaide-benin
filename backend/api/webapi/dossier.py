from fastapi import APIRouter, Depends, Request, status

from sap.fastapi.pagination import CursorInfo, PaginatedData

from api.models import Dossier, User
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.serializers.dossier import DossierSerializer, WriteDossierSerializer

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
async def listing(
    request: Request,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> PaginatedData[DossierSerializer]:
    """List all dossiers for the current user."""
    cursor = CursorInfo(request=request)
    qs = Dossier.find(Dossier.user_id == request_user.id)

    cursor_params = cursor.get_beanie_query_params()
    qs = qs.find(**cursor_params)

    instance_list = await qs.to_list()
    cursor.set_count(await Dossier.find(Dossier.user_id == request_user.id).count())

    return DossierSerializer.read_page(instance_list, request=request, cursor_info=cursor)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create(
    request: Request,
    serializer_write: WriteDossierSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DossierSerializer:
    """Create a new dossier."""
    instance = await serializer_write.create(request_user=request_user)
    return DossierSerializer.read(instance)


@router.get("/{pk}/", status_code=status.HTTP_200_OK)
async def retrieve(
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DossierSerializer:
    """Retrieve a specific dossier."""
    instance = await Dossier.find_one(Dossier.id == pk, Dossier.user_id == request_user.id)
    if not instance:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Dossier not found")
    return DossierSerializer.read(instance)


@router.put("/{pk}/", status_code=status.HTTP_202_ACCEPTED)
async def update(
    pk: str,
    serializer_write: WriteDossierSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DossierSerializer:
    """Update a dossier."""
    instance = await Dossier.find_one(Dossier.id == pk, Dossier.user_id == request_user.id)
    if not instance:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Dossier not found")

    serializer_write.instance = instance
    await serializer_write.update()
    return DossierSerializer.read(instance)


@router.delete("/{pk}/", status_code=status.HTTP_204_NO_CONTENT)
async def destroy(
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> None:
    """Delete a dossier."""
    instance = await Dossier.find_one(Dossier.id == pk, Dossier.user_id == request_user.id)
    if instance:
        await instance.delete()
