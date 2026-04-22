"""
Calculation WebAPI.

RESTful API endpoints for calculation operations.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from sap.fastapi.pagination import CursorInfo, PaginatedData

from api.controllers.calcul import CalculationController
from api.models import User
from api.models.calcul import CalculationRequest
from api.models.enums import RoleEnum
from api.models.user.auth import user_auth
from api.query.calcul import CalculationQuery
from api.serializers.calcul import CalculationSerializer, WriteCalculationSerializer

logger = logging.getLogger(__name__)

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
    try:
        logger.info(f"Creating calculation for user {request_user.id}")
        logger.debug(f"Serializer data: {serializer_write.model_dump()}")
        logger.debug(f"Request details: method={request.method}, url={request.url.path}, client={request.client}")
        # await serializer_write.run_async_validators()

        # Create the calculation request
        calculation = await CalculationController.create_calculation(serializer_write, request_user)
        logger.info(f"Calculation created with id: {calculation.id}")

        # Get the calculation result
        result = await CalculationController.get_calculation_result(calculation)
        logger.info(f"Calculation result generated for id: {calculation.id}")

        return CalculationSerializer.read_with_result(calculation, result)
    except Exception as e:
        logger.error(f"Error creating calculation: {str(e)}", exc_info=True)
        raise


@router.get("/", status_code=status.HTTP_200_OK)
async def listing(
    request: Request,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> PaginatedData[CalculationSerializer]:
    """
    List all calculations created by the authenticated user.

    Supports filtering by employee name, email, category, and status.
    """
    try:
        logger.info(f"Listing calculations for user {request_user.id}")
        cursor = CursorInfo(request=request)
        query = CalculationQuery(user=request_user, filters=request.query_params)
        logger.debug(f"Query filters: {dict(request.query_params)}")

        if search_text := request.query_params.get("q"):
            logger.info(f"Searching calculations with text: {search_text}")
            qs = query.get_search(search_text)
        else:
            qs = query.get_qs()
            cursor.set_count(await qs.count())
            cursor_params = cursor.get_beanie_query_params()
            logger.debug(f"Cursor params: {cursor_params}")
            qs = qs.find(**cursor_params)

        instance_list = await qs.to_list()
        logger.info(f"Found {len(instance_list)} calculations")

        result = await CalculationSerializer.read_page_with_results(
            instance_list,
            request=request,
            cursor_info=cursor,
        )
        return result
    except Exception as e:
        logger.error(f"Error listing calculations: {str(e)}", exc_info=True)
        raise


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
    try:
        logger.info(f"Retrieving calculation {pk} for user {request_user.id}")
        calculation = await CalculationRequest.get_or_404(pk)
        logger.debug(f"Calculation found: {calculation.id}")

        # Verify user access
        if calculation.user_id and calculation.user_id != request_user.id:
            logger.warning(f"Access denied for user {request_user.id} to calculation {pk}")
            if request_user.role != RoleEnum.ADMIN:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        result = await CalculationController.get_calculation_result(calculation)
        logger.info(f"Calculation result retrieved for {pk}")

        return CalculationSerializer.read_with_result(calculation, result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving calculation {pk}: {str(e)}", exc_info=True)
        raise


@router.put("/{pk}/", status_code=status.HTTP_202_ACCEPTED)
async def update(
    request: Request,
    pk: str,
    serializer_write: WriteCalculationSerializer,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> CalculationSerializer:
    """Update a calculation request."""
    try:
        logger.info(f"Updating calculation {pk} for user {request_user.id}")
        logger.debug(f"Update data: {serializer_write.model_dump()}")
        calculation = await CalculationRequest.get_or_404(pk)
        logger.debug(f"Calculation found: {calculation.id}")

        # Verify user access
        if calculation.user_id and calculation.user_id != request_user.id:
            logger.warning(f"Access denied for user {request_user.id} to calculation {pk}")
            if request_user.role != RoleEnum.ADMIN:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        serializer_write.instance = calculation
        # await serializer_write.run_async_validators()
        updated_calculation = await serializer_write.update()
        logger.info(f"Calculation {pk} updated successfully")

        result = await CalculationController.get_calculation_result(updated_calculation)
        logger.info(f"Updated calculation result generated for {pk}")

        return CalculationSerializer.read_with_result(updated_calculation, result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating calculation {pk}: {str(e)}", exc_info=True)
        raise


@router.delete("/{pk}/", status_code=status.HTTP_204_NO_CONTENT)
async def destroy(
    request: Request,
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> None:
    """Delete a calculation request."""
    try:
        logger.info(f"Deleting calculation {pk} for user {request_user.id}")
        calculation = await CalculationRequest.get_or_404(pk)
        logger.debug(f"Calculation found: {calculation.id}")

        # Verify user access
        if calculation.user_id and calculation.user_id != request_user.id:
            logger.warning(f"Access denied for user {request_user.id} to delete calculation {pk}")
            if request_user.role != RoleEnum.ADMIN:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        await calculation.delete()
        logger.info(f"Calculation {pk} deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calculation {pk}: {str(e)}", exc_info=True)
        raise
