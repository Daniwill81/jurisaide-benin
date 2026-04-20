"""
Calculation WebAPI.

RESTful API endpoints for calculation operations.
"""

from fastapi import APIRouter, Depends, Request, status

from sap.fastapi.pagination import CursorInfo, PaginatedData

from api.models import User
from api.models.calcul import CalculationRequest
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.serializers.calcul import (
    CalculationSerializer,
    WriteCalculationSerializer,
)
from api.query.calcul import CalculationQuery
from api.controllers.calcul import CalculationController

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create(
    request: Request,
    serializer_write: WriteCalculationSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> dict:
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

    return {
        "id": str(calculation.id),
        "employee_name": calculation.employee_name,
        "employee_email": calculation.employee_email,
        "seniority_years": result.seniority_years,
        "severance_pay": result.severance_pay,
        "notice_period_pay": result.notice_period_pay,
        "leave_pay": result.leave_pay,
        "total": result.total,
        "breakdown": result.breakdown,
        "articles": result.articles,
        "created_at": calculation.created_at,
    }


@router.get("/", status_code=status.HTTP_200_OK)
async def listing(
    request: Request,
    request_user: User = Depends(user_auth.require(RoleEnum.get_list_authenticated())),
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
) -> dict:
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

    return {
        "id": str(calculation.id),
        "employee_name": calculation.employee_name,
        "employee_email": calculation.employee_email,
        "employee_id": calculation.employee_id,
        "start_date": calculation.start_date.date(),
        "end_date": calculation.end_date.date(),
        "avg_salary": calculation.avg_salary,
        "daily_salary": calculation.daily_salary,
        "category": calculation.category.value,
        "contract_type": calculation.contract_type.value,
        "termination_reason": calculation.termination_reason.value if calculation.termination_reason else None,
        "remaining_leave_days": calculation.remaining_leave_days,
        "annual_leave_entitlement": calculation.annual_leave_entitlement,
        "status": calculation.status,
        "seniority_years": result.seniority_years,
        "severance_pay": result.severance_pay,
        "notice_period_pay": result.notice_period_pay,
        "leave_pay": result.leave_pay,
        "total": result.total,
        "breakdown": result.breakdown,
        "articles": result.articles,
        "created_at": calculation.created_at,
        "updated_at": calculation.updated_at,
        "notes": calculation.notes,
    }


@router.put("/{pk}/", status_code=status.HTTP_202_ACCEPTED)
async def update(
    request: Request,
    pk: str,
    serializer_write: WriteCalculationSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> dict:
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

    return {
        "id": str(updated_calculation.id),
        "employee_name": updated_calculation.employee_name,
        "employee_email": updated_calculation.employee_email,
        "seniority_years": result.seniority_years,
        "severance_pay": result.severance_pay,
        "notice_period_pay": result.notice_period_pay,
        "leave_pay": result.leave_pay,
        "total": result.total,
        "breakdown": result.breakdown,
        "articles": result.articles,
        "updated_at": updated_calculation.updated_at,
    }


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
