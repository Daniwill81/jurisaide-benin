"""
# WebAPI.

The API endpoint  is queried by other applications
to communicate with this application. This endpoint usually relies
on a header based authenticated encoded in the request headers.
Commonly Basic or Bearer Auth.

It should accept and returns data formatted in JSON.

The API is structured with  Representational state transfer architecture:
https://en.wikipedia.org/wiki/Representational_state_transfer
"""

from app.query.user import UserQuery
from fastapi import APIRouter, Depends, Request, status

from sap.fastapi.pagination import CursorInfo, PaginatedData

from api.models import User
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.serializers.user import UserSerializer, WriteUserSerializer

router = APIRouter()


@router.get("/current/", status_code=status.HTTP_200_OK)
async def current(request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER]))) -> UserSerializer:
    """Retrieve the currently authenticated user."""
    return UserSerializer.read(request_user)


@router.get("/", status_code=status.HTTP_200_OK)
async def listing(
    request: Request,
    request_user: User = Depends(user_auth.require(RoleEnum.get_list_authenticated())),
) -> PaginatedData[UserSerializer]:
    """Retrieve all user."""
    cursor = CursorInfo(request=request)
    query = UserQuery(user=request_user, filters=request.query_params)

    if search_text := request.query_params.get("q"):
        qs = await query.get_search(search_text)
    else:
        qs = await query.get_qs()
        cursor_params = cursor.get_beanie_query_params()

        qs = qs.find(**cursor_params)

    instance_list = await qs.to_list()

    cursor.set_count(await qs.count())
    result: PaginatedData[UserSerializer] = UserSerializer.read_page(
        instance_list,
        request=request,
        cursor_info=cursor,
    )
    return result


@router.put("/{pk}/", status_code=status.HTTP_202_ACCEPTED)
async def update(
    request: Request,
    pk: str,
    serializer_write: WriteUserSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> UserSerializer:
    """Update an user."""
    serializer_write.instance = await User.get_or_404(pk)
    await serializer_write.run_async_validators(request=request)
    instance = await serializer_write.update(request=request, request_user=request_user)
    return UserSerializer.read(instance)
