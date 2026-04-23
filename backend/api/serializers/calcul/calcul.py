"""
Calculation Serializers.

Handle data validation and serialization for calculation requests and results.
"""

import datetime
import logging
from typing import Any, Optional

import pydantic
from beanie import PydanticObjectId
from fastapi import Request

from sap.fastapi import ObjectSerializer, WriteObjectSerializer
from sap.fastapi.pagination import CursorInfo, PaginatedData

from api.models.calcul import CalculationRequest, CalculationResult
from api.models.enums import ContractType, TerminationReason, WorkerCategory
from api.xlib.labor_code import (
    calculate_leave_pay,
    calculate_notice_period_pay,
    calculate_seniority,
    calculate_severance_pay,
)

logger = logging.getLogger(__name__)


class CalculationSerializer(ObjectSerializer[CalculationRequest]):
    """Serialize the `CalculationRequest` object for retrieve and listing.

    Includes calculation results when available.
    """

    id: PydanticObjectId
    employee_name: str
    employee_email: Optional[str] = None
    employee_phone: Optional[str] = None
    start_date: datetime.date
    end_date: datetime.date
    avg_salary: float
    daily_salary: Optional[float] = None
    category: WorkerCategory
    contract_type: ContractType = ContractType.CDI
    termination_reason: Optional[TerminationReason] = None
    remaining_leave_days: float = 0.0
    annual_leave_entitlement: float = 30.0
    status: str
    created: datetime.datetime
    updated: datetime.datetime
    notes: Optional[str] = None

    # Calculated fields (populated by controller)
    seniority_years: Optional[float] = None
    severance_pay: Optional[float] = None
    notice_period_pay: Optional[float] = None
    leave_pay: Optional[float] = None
    total: Optional[float] = None
    breakdown: Optional[dict[str, Any]] = None
    articles: Optional[dict[str, str]] = None

    @classmethod
    def read(
        cls, instance: CalculationRequest, exclude: set[str] | None = None, include_results: bool = False
    ) -> "CalculationSerializer":
        """Read the calculation request from the model."""
        # Fields that are not in the database model must ALWAYS be excluded from super().read
        # to avoid AttributeError, as they are calculated or provided elsewhere.
        calculated_fields = {
            "seniority_years",
            "severance_pay",
            "notice_period_pay",
            "leave_pay",
            "total",
            "breakdown",
            "articles",
        }

        if exclude:
            calculated_fields.update(exclude)

        # We always exclude them from the initial model dump
        serializer = super().read(instance, exclude=calculated_fields)

        if include_results:
            # PRIORITIZE STORED RESULTS if they exist in the DB
            if instance.total is not None:
                serializer.seniority_years = instance.seniority_years
                serializer.severance_pay = instance.severance_pay
                serializer.notice_period_pay = instance.notice_period_pay
                serializer.leave_pay = instance.leave_pay
                serializer.total = instance.total
                serializer.breakdown = instance.breakdown
                serializer.articles = instance.articles
            else:
                # FALLBACK TO RECALCULATION for older records or if missing
                import datetime

                from api.xlib.labor_code import (
                    calculate_leave_pay,
                    calculate_notice_period_pay,
                    calculate_seniority,
                    calculate_severance_pay,
                )

                # Convert dates
                start_dt = instance.start_date
                if isinstance(start_dt, datetime.date) and not isinstance(start_dt, datetime.datetime):
                    start_dt = datetime.datetime.combine(start_dt, datetime.time())

                end_dt = instance.end_date
                if isinstance(end_dt, datetime.date) and not isinstance(end_dt, datetime.datetime):
                    end_dt = datetime.datetime.combine(end_dt, datetime.time())

                seniority_years = calculate_seniority(start_dt, end_dt)
                severance = calculate_severance_pay(instance.avg_salary, seniority_years)
                notice_period = calculate_notice_period_pay(instance.avg_salary, instance.category)
                leave = calculate_leave_pay(
                    instance.daily_salary or (instance.avg_salary / 26.0), instance.remaining_leave_days
                )
                total = severance + notice_period + leave

                serializer.seniority_years = round(seniority_years, 2)
                serializer.severance_pay = round(severance, 2)
                serializer.notice_period_pay = round(notice_period, 2)
                serializer.leave_pay = round(leave, 2)
                serializer.total = round(total, 2)

        return serializer

    @classmethod
    def read_with_result(cls, instance: CalculationRequest, result: "CalculationResult") -> "CalculationSerializer":
        """
        Read serializer with enriched calculation results.

        Args:
            instance: The CalculationRequest database object
            result: The CalculationResult with calculated values

        Returns:
            CalculationSerializer instance with calculated fields populated
        """
        try:
            logger.debug(f"Building serializer with result for calculation {instance.id}")
            serializer = cls.read(instance)
            serializer.seniority_years = result.seniority_years
            serializer.severance_pay = result.severance_pay
            serializer.notice_period_pay = result.notice_period_pay
            serializer.leave_pay = result.leave_pay
            serializer.total = result.total
            serializer.breakdown = result.breakdown
            serializer.articles = result.articles
            logger.info(f"Serializer built successfully for calculation {instance.id} (total={result.total})")
            return serializer
        except Exception as e:
            logger.error(f"Error building serializer with result: {str(e)}", exc_info=True)
            raise

    @classmethod
    async def read_page_with_results(
        cls,
        instance_list: list[CalculationRequest],
        request: Request,
        cursor_info: CursorInfo,
    ) -> PaginatedData["CalculationSerializer"]:
        """
        Read paginated results with enriched calculation data.

        For each calculation in the page, fetch its result and populate fields.
        """
        from api.controllers.calcul import CalculationController

        enriched_list: list[CalculationSerializer] = []
        for instance in instance_list:
            result = await CalculationController.get_calculation_result(instance)
            enriched_list.append(cls.read_with_result(instance, result))

        page_next = cursor_info.get_next()
        page_previous = cursor_info.get_previous()
        return PaginatedData(
            count=cursor_info.get_count(),
            next=str(request.url.include_query_params(cursor=page_next)) if page_next else None,
            previous=str(request.url.include_query_params(cursor=page_previous)) if page_previous else None,
            data=enriched_list,
        )


class WriteCalculationSerializer(WriteObjectSerializer[CalculationRequest]):
    """Serialize the `CalculationRequest` object for create and update."""

    employee_name: str
    employee_email: Optional[pydantic.EmailStr] = None
    employee_phone: Optional[str] = None
    start_date: datetime.date
    end_date: datetime.date
    avg_salary: float = pydantic.Field(gt=0, description="Salaire moyen mensuel en FCFA")
    daily_salary: Optional[float] = None
    category: WorkerCategory
    contract_type: ContractType = ContractType.CDI
    termination_reason: Optional[TerminationReason] = None
    remaining_leave_days: float = pydantic.Field(default=0.0, ge=0)
    annual_leave_entitlement: float = pydantic.Field(default=30.0, ge=0)
    notes: Optional[str] = None

    # The fields below are not serialized
    instance: CalculationRequest | None = None

    @pydantic.field_validator("end_date")
    @classmethod
    def validate_end_date(cls, value: datetime.date, info: pydantic.ValidationInfo) -> datetime.date:
        """Verify that end_date is after start_date."""
        try:
            logger.debug(f"Validating end_date: {value}")
            if "start_date" in info.data and value <= info.data["start_date"]:
                logger.warning(f"Validation failed: end_date {value} <= start_date {info.data['start_date']}")
                raise ValueError("La date de fin doit être après la date de début.")
            logger.debug(f"End date validation passed: {value}")
            return value
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error validating end_date: {str(e)}", exc_info=True)
            raise

    @pydantic.field_validator("daily_salary", mode="before")
    @classmethod
    def calculate_daily_salary(cls, value: Optional[float], info: pydantic.ValidationInfo) -> Optional[float]:
        """Calculate daily salary if not provided (monthly salary / 26)."""
        try:
            logger.debug(f"Validating daily_salary: {value}")
            if value is None and "avg_salary" in info.data:
                calculated = float(info.data["avg_salary"]) / 26.0
                logger.info(f"Daily salary calculated from avg_salary: {calculated} ({info.data['avg_salary']} / 26)")
                return calculated
            return value
        except Exception as e:
            logger.error(f"Error calculating daily_salary: {str(e)}", exc_info=True)
            raise

    def calculate_result(self) -> CalculationResult:
        """Calculate the result based on the serializer data."""
        try:
            logger.info(f"Calculating result for employee: {self.employee_name}")
            logger.debug(
                f"Calculation input: start={self.start_date}, end={self.end_date}, "
                f"salary={self.avg_salary}, category={self.category}"
            )

            # Convert dates to datetime if they're date objects
            start_dt = (
                datetime.datetime.combine(self.start_date, datetime.time())
                if isinstance(self.start_date, datetime.date)
                else self.start_date
            )
            end_dt = (
                datetime.datetime.combine(self.end_date, datetime.time())
                if isinstance(self.end_date, datetime.date)
                else self.end_date
            )

            # Calculate seniority
            seniority_years = calculate_seniority(start_dt, end_dt)
            logger.debug(f"Seniority: {seniority_years} years")

            # Calculate components
            severance = calculate_severance_pay(self.avg_salary, seniority_years)
            logger.debug(f"Severance: {severance} FCFA")

            notice_period = calculate_notice_period_pay(self.avg_salary, self.category)
            logger.debug(f"Notice period: {notice_period} FCFA")

            leave = calculate_leave_pay(self.daily_salary or (self.avg_salary / 26.0), self.remaining_leave_days)
            logger.debug(f"Leave pay: {leave} FCFA")

            total = severance + notice_period + leave
            logger.info(f"Result calculated: total={total} FCFA")

            # Build breakdown details
            breakdown = {
                "seniority_years": round(seniority_years, 2),
                "severance_pay": {
                    "amount": round(severance, 2),
                    "formula": "Selon Article 44 - Loi 98-004",
                    "details": self._get_severance_details(seniority_years),
                },
                "notice_period_pay": {
                    "amount": round(notice_period, 2),
                    "formula": "Selon Article 53 - Loi 98-004",
                    "category": self.category.value,
                    "months": self._get_notice_months(self.category),
                },
                "leave_pay": {
                    "amount": round(leave, 2),
                    "formula": "Selon Article 113 - Loi 98-004",
                    "remaining_days": self.remaining_leave_days,
                    "daily_rate": round(self.daily_salary or (self.avg_salary / 26.0), 2),
                },
            }

            return CalculationResult(
                seniority_years=round(seniority_years, 2),
                severance_pay=round(severance, 2),
                notice_period_pay=round(notice_period, 2),
                leave_pay=round(leave, 2),
                total=round(total, 2),
                breakdown=breakdown,
            )
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

    async def update(self, **kwargs: Any) -> CalculationRequest:
        """Update the calculation request in the database."""
        try:
            logger.info(f"Updating calculation: {self.employee_name}")
            logger.debug(f"Update fields: start={self.start_date}, end={self.end_date}, salary={self.avg_salary}")

            assert self.instance

            data_to_update = {
                "employee_name": self.employee_name,
                "employee_email": self.employee_email,
                "employee_phone": self.employee_phone,
                "start_date": (
                    datetime.datetime.combine(self.start_date, datetime.time())
                    if isinstance(self.start_date, datetime.date)
                    else self.start_date
                ),
                "end_date": (
                    datetime.datetime.combine(self.end_date, datetime.time())
                    if isinstance(self.end_date, datetime.date)
                    else self.end_date
                ),
                "avg_salary": self.avg_salary,
                "daily_salary": self.daily_salary or (self.avg_salary / 26.0),
                "category": self.category,
                "contract_type": self.contract_type,
                "termination_reason": self.termination_reason,
                "remaining_leave_days": self.remaining_leave_days,
                "annual_leave_entitlement": self.annual_leave_entitlement,
                "notes": self.notes,
            }

            instance: CalculationRequest = self.instance.model_copy(update=data_to_update)
            await instance.save()
            self.instance = instance
            logger.info(f"Calculation updated successfully: {instance.id}")
            return instance
        except Exception as e:
            logger.error(f"Error updating calculation: {str(e)}", exc_info=True)
            raise
