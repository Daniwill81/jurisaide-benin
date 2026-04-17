from datetime import datetime
from dateutil.relativedelta import relativedelta
from api.models.enums import WorkerCategory

def calculate_seniority(start_date: datetime, end_date: datetime) -> float:
    """Returns seniority in years."""
    diff = relativedelta(end_date, start_date)
    years = diff.years + (diff.months / 12.0) + (diff.days / 365.25)
    return years

def calculate_severance_pay(avg_salary: float, seniority_years: float) -> float:
    """
    Art 44: Indemnité de licenciement.
    Rates:
    - 1 to 5 years: 30%
    - 6 to 10 years: 35%
    - > 10 years: 40%
    """
    if seniority_years < 1:
        return 0.0
    
    total = 0.0
    
    # First 5 years
    years_in_bracket = min(seniority_years, 5)
    total += years_in_bracket * avg_salary * 0.30
    
    if seniority_years > 5:
        # Years 6 to 10
        years_in_bracket = min(seniority_years - 5, 5)
        total += years_in_bracket * avg_salary * 0.35
        
    if seniority_years > 10:
        # Above 10 years
        years_in_bracket = seniority_years - 10
        total += years_in_bracket * avg_salary * 0.40
        
    return total

def calculate_notice_period_pay(avg_salary: float, category: WorkerCategory) -> float:
    """
    Art 42: Préavis.
    Typical values:
    - Ouvrier/Employé: 1 month
    - Agent de maîtrise: 2 months
    - Cadre: 3 months
    """
    months = 1
    if category == WorkerCategory.AGENT_MAITRISE:
        months = 2
    elif category == WorkerCategory.CADRE:
        months = 3
    
    return avg_salary * months

def calculate_leave_pay(daily_salary: float, remaining_days: float) -> float:
    """
    Art 113: Indemnité compensatrice de congés payés.
    """
    return daily_salary * remaining_days
