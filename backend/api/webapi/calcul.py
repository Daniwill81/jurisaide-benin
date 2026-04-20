"""
Calculation WebAPI.

RESTful API endpoints for calculation operations.
"""

from api.controllers.calcul import CalculationController
from api.models import User
from api.models.calcul import CalculationRequest
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.query.calcul import CalculationQuery
from api.serializers.calcul import (CalculationSerializer,
                                    WriteCalculationSerializer)
from fastapi import APIRouter, Depends, Request, status
from sap.fastapi.pagination import CursorInfo, PaginatedData

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create(
    request: Request,
    serializer_write: WriteCalculationSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> CalculationSerializer:
    """
    Create a new calculation request and return the calculated result.

    This endpoint accepts employment details and returns all calculated benefits
    (severance, notice period, leave compensation) according to Beninese labor law.
    """
    await serializer_write.run_async_validators()

    # Create the calculation request
    calculation = await CalculationController.create_calculation(
        serializer_write, request_user
    )

    # Get the calculation result
    result = await CalculationController.get_calculation_result(calculation)

    return CalculationSerializer.read_with_result(calculation, result)


@router.get("/", status_code=status.HTTP_200_OK)
async def listing(
    request: Request,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> PaginatedData[CalculationSerializer]:
    """
    List all calculations created by the authenticated user.

    Supports filtering by employee name, email, category, and status.
    """
    cursor = CursorInfo(request=request)
    query = CalculationQuery(user=request_user, filters=request.query_params)

    if search_text := request.query_params.get("q"):
        qs = await query.get_search(search_text)
    else:
        qs = await query.get_qs()
        cursor_params = cursor.get_beanie_query_params()
        qs = qs.find(**cursor_params)

    instance_list = await qs.to_list()

    cursor.set_count(await qs.count())
    result: PaginatedData[CalculationSerializer] = CalculationSerializer.read_page(
        instance_list,
        request=request,
        cursor_info=cursor,
    )
    return result


@router.get("/{pk}/", status_code=status.HTTP_200_OK)
async def retrieve(
    request: Request,
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> CalculationSerializer:
    """
    Retrieve a specific calculation request with its result.

    Returns detailed calculation information including breakdown by component.
    """
    calculation = await CalculationRequest.get_or_404(pk)

    # Verify user access
    if calculation.user_id and calculation.user_id != request_user.id:
        if request_user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")

    result = await CalculationController.get_calculation_result(calculation)

    return CalculationSerializer.read_with_result(calculation, result)


@router.put("/{pk}/", status_code=status.HTTP_202_ACCEPTED)
async def update(
    request: Request,
    pk: str,
    serializer_write: WriteCalculationSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> CalculationSerializer:
    """Update a calculation request."""
    calculation = await CalculationRequest.get_or_404(pk)

    # Verify user access
    if calculation.user_id and calculation.user_id != request_user.id:
        if request_user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")

    serializer_write.instance = calculation
    await serializer_write.run_async_validators()
    updated_calculation = await serializer_write.update()

    result = await CalculationController.get_calculation_result(updated_calculation)

    return CalculationSerializer.read_with_result(updated_calculation, result)


@router.delete("/{pk}/", status_code=status.HTTP_204_NO_CONTENT)
async def destroy(
    request: Request,
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> None:
    """Delete a calculation request."""
    calculation = await CalculationRequest.get_or_404(pk)

    # Verify user access
    if calculation.user_id and calculation.user_id != request_user.id:
        if request_user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")

    await calculation.delete()
