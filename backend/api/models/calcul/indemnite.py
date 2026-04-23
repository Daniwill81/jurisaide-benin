from datetime import datetime
from typing import Optional

from pydantic import Field

from sap.beanie import Document, Link

from api.models.enums import WorkerCategory
from api.models.user.user import User


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

    class Settings:
        name = "calculation_audits"
