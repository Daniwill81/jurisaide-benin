"""
Calculation Controller.

Handles business logic for calculation requests and results.
"""

import logging
from datetime import datetime
from typing import Any, Optional

from api.models import User
from api.models.calcul import AuditTrail, CalculationRequest, CalculationResult
from api.models.enums import WorkerCategory
from api.serializers.calcul import WriteCalculationSerializer

logger = logging.getLogger(__name__)


class CalculationController:
    """Controller for managing calculation operations."""

    @staticmethod
    async def create_calculation(
        serializer: WriteCalculationSerializer,
        user: Optional[User] = None,
    ) -> CalculationRequest:
        """Create a new calculation request."""
        try:
            logger.info(f"Creating calculation for user {user.id if user else 'anonymous'}")
            logger.debug(f"Calculation data: employee={serializer.employee_name}, email={serializer.employee_email}, "
                        f"category={serializer.category}, salary={serializer.avg_salary}")
            
            # Create instance from serializer data
            calculation_data: dict[str, Any] = {
                "employee_name": serializer.employee_name,
                "employee_email": serializer.employee_email,
                "employee_id": serializer.employee_id,
                "start_date": datetime.combine(serializer.start_date, datetime.min.time()),
                "end_date": datetime.combine(serializer.end_date, datetime.min.time()),
                "avg_salary": serializer.avg_salary,
                "daily_salary": serializer.daily_salary or (serializer.avg_salary / 26.0),
                "category": serializer.category,
                "contract_type": serializer.contract_type,
                "termination_reason": serializer.termination_reason,
                "remaining_leave_days": serializer.remaining_leave_days,
                "annual_leave_entitlement": serializer.annual_leave_entitlement,
                "notes": serializer.notes,
                "status": "completed",
                "user_id": user.id if user else None,
                "audit_trail": [
                    AuditTrail(
                        action="created",
                        user_id=user.id if user else None,
                        changes={},
                    )
                ],
            }

            calculation = CalculationRequest(**calculation_data)
            await calculation.insert()
            logger.info(f"Calculation created successfully: id={calculation.id}")

            return calculation
        except Exception as e:
            logger.error(f"Error creating calculation: {str(e)}", exc_info=True)
            raise

    @staticmethod
    async def update_calculation(
        # calculation: CalculationRequest,
        serializer: WriteCalculationSerializer,
        user: Optional[User] = None,
    ) -> CalculationRequest:
        """Update an existing calculation request."""
        try:
            logger.info(f"Updating calculation for user {user.id if user else 'anonymous'}")
            logger.debug(f"Update data: {serializer.model_dump()}")
            
            updated = await serializer.update()
            logger.debug(f"Calculation updated: id={updated.id}")

            # Update audit trail
            updated.audit_trail.append(
                AuditTrail(
                    action="updated",
                    user_id=user.id if user else None,
                    changes={},
                )
            )
            updated.updated_at = datetime.utcnow()

            await updated.save()
            logger.info(f"Calculation update saved: id={updated.id}")
            return updated
        except Exception as e:
            logger.error(f"Error updating calculation: {str(e)}", exc_info=True)
            raise

    @staticmethod
    async def get_calculation_result(
        calculation: CalculationRequest,
    ) -> CalculationResult:
        """Get the calculated result for a calculation request."""
        try:
            logger.info(f"Getting calculation result: id={calculation.id}")
            logger.debug(f"Calculation details: start={calculation.start_date}, end={calculation.end_date}, "
                        f"salary={calculation.avg_salary}, category={calculation.category}")
            
            # Convert dates if needed
            start_dt = calculation.start_date
            end_dt = calculation.end_date

            # Import here to avoid circular imports
            from api.xlib.labor_code import (
                calculate_leave_pay,
                calculate_notice_period_pay,
                calculate_seniority,
                calculate_severance_pay,
            )

            # Calculate seniority
            seniority_years = calculate_seniority(start_dt, end_dt)
            logger.debug(f"Seniority calculated: {seniority_years} years")

            # Calculate components
            severance = calculate_severance_pay(calculation.avg_salary, seniority_years)
            logger.debug(f"Severance: {severance} FCFA")
            
            notice_period = calculate_notice_period_pay(calculation.avg_salary, calculation.category)
            logger.debug(f"Notice period: {notice_period} FCFA")
            
            leave = calculate_leave_pay(
                calculation.daily_salary or (calculation.avg_salary / 26.0),
                calculation.remaining_leave_days,
            )
            logger.debug(f"Leave pay: {leave} FCFA")

            total = severance + notice_period + leave
            logger.debug(f"Total calculated: {total} FCFA (severance={severance} + notice={notice_period} + leave={leave})")

            # Build breakdown details
            breakdown: dict[str, Any] = {
                "seniority_years": round(seniority_years, 2),
                "severance_pay": {
                    "amount": round(severance, 2),
                    "formula": "Selon Article 44 - Loi 98-004",
                    "details": CalculationController._get_severance_details(seniority_years),
                },
                "notice_period_pay": {
                    "amount": round(notice_period, 2),
                    "formula": "Selon Article 53 - Loi 98-004",
                    "category": calculation.category.value,
                    "months": CalculationController._get_notice_months(calculation.category),
                },
                "leave_pay": {
                    "amount": round(leave, 2),
                    "formula": "Selon Article 113 - Loi 98-004",
                    "remaining_days": calculation.remaining_leave_days,
                    "daily_rate": round(calculation.daily_salary or (calculation.avg_salary / 26.0), 2),
                },
            }

            result = CalculationResult(
                calculation_id=str(calculation.id),
                request_id=str(calculation.id),
                seniority_years=round(seniority_years, 2),
                severance_pay=round(severance, 2),
                notice_period_pay=round(notice_period, 2),
                leave_pay=round(leave, 2),
                total=round(total, 2),
                breakdown=breakdown,
            )
            logger.info(f"Calculation result completed: total={result.total}")
            return result
        except Exception as e:
            logger.error(f"Error calculating result: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def _get_severance_details(seniority_years: float) -> dict[str, dict[str, float | str]]:
        """Get details of severance calculation by brackets."""
        details: dict[str, dict[str, float | str]] = {}

        if seniority_years >= 1:
            bracket_1 = min(seniority_years, 5)
            details["bracket_1_to_5_years"] = {
                "years": round(bracket_1, 2),
                "rate": "30%",
            }

        if seniority_years > 5:
            bracket_2 = min(seniority_years - 5, 5)
            details["bracket_6_to_10_years"] = {
                "years": round(bracket_2, 2),
                "rate": "35%",
            }

        if seniority_years > 10:
            bracket_3 = seniority_years - 10
            details["bracket_above_10_years"] = {
                "years": round(bracket_3, 2),
                "rate": "40%",
            }

        return details

    @staticmethod
    def _get_notice_months(category: WorkerCategory) -> int:
        """Get notice period in months by category."""
        notice_months = {
            WorkerCategory.OUVRIER: 1,
            WorkerCategory.EMPLOYE: 1,
            WorkerCategory.AGENT_MAITRISE: 2,
            WorkerCategory.CADRE: 3,
        }
        return notice_months.get(category, 1)
