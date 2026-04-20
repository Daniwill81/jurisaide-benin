from datetime import datetime

from pydantic import BaseModel

from api.models.enums import WorkerCategory


class CalculationRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    avg_salary: float
    category: WorkerCategory
    remaining_leave_days: float = 0.0


class CalculationResult(BaseModel):
    severance_pay: float
    notice_period_pay: float
    leave_pay: float
    total: float
    seniority_years: float
    articles: dict = {"severance": "Art. 44", "notice": "Art. 42", "leave": "Art. 113"}
