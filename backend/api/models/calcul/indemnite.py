from datetime import datetime
from typing import Optional

from api.models.enums import WorkerCategory
from api.models.user.user import User
from beanie import Document, Link
from pydantic import Field


class CalculationAudit(Document):
    user: Optional[Link[User]] = None
    start_date: datetime
    end_date: datetime
    avg_salary: float
    category: WorkerCategory
    seniority_years: float
    severance_pay: float
    notice_period_pay: float
    leave_pay: float
    total: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "calculation_audits"
