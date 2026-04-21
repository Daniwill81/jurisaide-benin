"""
Calculation Models for Beninese Labor Law.

Models for storing and managing calculation requests and results
based on Loi 98-004 and Loi 2017-05.
"""

from datetime import datetime
from typing import Any, Optional

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field

from api.models.enums import ContractType, TerminationReason, WorkerCategory


class AuditTrail(BaseModel):
    """Track calculation changes and history."""

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str  # 'created', 'updated', 'deleted'
    user_id: Optional[PydanticObjectId] = None
    changes: dict[str, Any] = Field(default_factory=dict)


class CalculationRequest(Document):
    """
    Represents a calculation request for severance, notice period, and leave compensation.

    This document stores all input parameters needed to calculate employee benefits
    according to Beninese labor law.
    """

    # Employee Information
    employee_name: str
    employee_email: Optional[str] = None
    employee_id: Optional[str] = None

    # Employment Period
    start_date: datetime
    end_date: datetime

    # Salary Information
    avg_salary: float = Field(gt=0, description="Average monthly salary in FCFA")
    daily_salary: Optional[float] = None

    # Employment Classification
    category: WorkerCategory
    contract_type: ContractType = ContractType.CDI
    termination_reason: Optional[TerminationReason] = None

    # Leave Information
    remaining_leave_days: float = Field(default=0.0, ge=0)
    annual_leave_entitlement: float = Field(default=30.0)

    # Audit & Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[PydanticObjectId] = None
    status: str = Field(default="pending")  # pending, completed, archived
    notes: Optional[str] = None
    audit_trail: list[AuditTrail] = Field(default_factory=list)

    class Settings:
        """Settings for the database collection."""

        name = "calculation_request"
        indexes = [
            ("employee_name",),
            ("employee_email",),
            ("created_at",),
            ("user_id",),
            ("status",),
        ]


class CalculationResult(BaseModel):
    """
    Result of a calculation request.

    Contains all calculated benefits and their legal references.
    """

    # Calculation Identifiers
    calculation_id: Optional[str] = None
    request_id: Optional[str] = None

    # Calculated Values
    seniority_years: float = Field(description="Years of employment")
    severance_pay: float = Field(default=0.0, description="Indemnité de Licenciement (Art. 44)")
    notice_period_pay: float = Field(default=0.0, description="Indemnité de Préavis (Art. 53)")
    leave_pay: float = Field(default=0.0, description="Indemnité de Congés Payés (Art. 113)")
    total: float = Field(default=0.0, description="Total compensation in FCFA")

    # Legal References
    articles: dict[str, str] = Field(
        default_factory=lambda: {
            "severance": "Art. 44",
            "notice": "Art. 53",
            "leave": "Art. 113",
            "legal_basis": "Loi 98-004 du 27 janvier 1998",
        }
    )

    # Calculation Details
    calculation_timestamp: datetime = Field(default_factory=datetime.utcnow)
    breakdown: dict[str, Any] = Field(default_factory=dict, description="Detailed calculation breakdown")
