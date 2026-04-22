"""
================================================================================
JurisAide Bénin - Legal Labor Code Calculation Engine
================================================================================

Module: api.xlib.labor_code
Description: Deterministic calculation engine for Beninese Labor Code (Loi 98-004)

LEGAL BASIS:
  - 🥇 PRIMARY: Loi n° 2017-05 du 29 août 2017 (Conditions d'embauche et résiliation)
    Location: backend/docs/L.2017-05.pdf (REQUIRES OCR extraction for full text)
  - 🥈 COMPLEMENTARY: Loi 98-004 du 27 janvier 1998 (Code du Travail du Bénin)
  - 🥉 REFERENCE: Convention Collective Générale du Travail (NOT YET OBTAINED)
  - VALIDATION: Loi 2017-05 taux partially validated by jurisprudence (70% confirmation)
  - Status: ⚠️  REQUIRES OFFICIAL VERIFICATION with Loi 2017-05 text
  - See: /LEGAL_REFERENCES.md, /backend/docs/legal/article_44.md for detailed documentation

IMPORTANT:
  All calculations in this module must be verified against official
  Beninese labor law. These are implementations of codified legal
  formulas and are subject to judicial review.

================================================================================
"""

import logging
from datetime import datetime

from dateutil.relativedelta import relativedelta  # type: ignore[import-untyped]

from api.models.enums import WorkerCategory

logger = logging.getLogger(__name__)


def calculate_seniority(start_date: datetime, end_date: datetime) -> float:
    """
    Calculate worker seniority/tenure in years.

    Args:
        start_date: Employment start date
        end_date: Employment end date (or current date)

    Returns:
        Seniority in decimal years (e.g., 8.5 = 8 years 6 months)

    Formula:
        Years = full_years + (months / 12) + (days / 365.25)

    Legal Basis:
        Loi 98-004 - Determines benefit calculations based on tenure

    Notes:
        - Fractional years are important for benefit calculations
        - Must include weekends and holidays in date calculation
    """
    try:
        logger.debug(f"Calculating seniority: start_date={start_date}, end_date={end_date}")
        diff = relativedelta(end_date, start_date)
        years = float(diff.years) + (float(diff.months) / 12.0) + (float(diff.days) / 365.25)
        logger.info(f"Seniority calculated: {years} years (years={diff.years}, months={diff.months}, days={diff.days})")
        return years
    except Exception as e:
        logger.error(f"Error calculating seniority: {str(e)}", exc_info=True)
        raise


def calculate_severance_pay(avg_salary: float, seniority_years: float) -> float:
    """
    Calculate severance/termination pay (Indemnité de Licenciement).

    ================================================================================
    LEGAL REFERENCE: Article 44 - Loi 98-004 (Code du Travail du Bénin)
    ================================================================================

    Args:
        avg_salary: Average monthly salary in FCFA (Francs CFA)
        seniority_years: Years of employment (decimal, e.g., 8.5)

    Returns:
        Total severance pay amount in FCFA

    ================================================================================
    RATE SCALE (by tenure brackets):
    ================================================================================

    Tenure Period          | Rate      | Formula per bracket
    -----------------------+-----------+-----------------------------------
    1 to 5 years           | 30%/year  | Years × Average_Salary × 0.30
    6 to 10 years          | 35%/year  | Years × Average_Salary × 0.35
    More than 10 years     | 40%/year  | Years × Average_Salary × 0.40

    ================================================================================
    CALCULATION FORMULA:
    ================================================================================

    1. If seniority < 1 year: return 0 (no severance)

    2. If seniority between 1-5 years:
       Severance = Seniority × Avg_Salary × 0.30

    3. If seniority between 6-10 years:
       Severance = (5 × Avg_Salary × 0.30) + ((Seniority - 5) × Avg_Salary × 0.35)

    4. If seniority > 10 years:
       Severance = (5 × Avg_Salary × 0.30)
                 + (5 × Avg_Salary × 0.35)
                 + ((Seniority - 10) × Avg_Salary × 0.40)

    ================================================================================
    WORKED EXAMPLE:
    ================================================================================

    Employee: 8 years tenure, Avg salary: 500,000 FCFA/month

    Step 1: Years 1-5 (first bracket)
            5 years × 500,000 × 0.30 = 750,000 FCFA

    Step 2: Years 6-8 (second bracket)
            3 years × 500,000 × 0.35 = 525,000 FCFA

    Step 3: Total Severance
            750,000 + 525,000 = 1,275,000 FCFA

    ================================================================================
    """
    try:
        logger.debug(f"Calculating severance: avg_salary={avg_salary}, seniority_years={seniority_years}")
        
        if seniority_years < 1:
            logger.info(f"No severance for seniority < 1 year: {seniority_years}")
            return 0.0

        total = 0.0

        # First bracket: 1 to 5 years at 30%
        years_in_bracket = min(seniority_years, 5)
        bracket_1 = years_in_bracket * avg_salary * 0.30
        total += bracket_1
        logger.debug(f"Bracket 1 (1-5 years): {years_in_bracket} years × {avg_salary} × 0.30 = {bracket_1}")

        # Second bracket: 6 to 10 years at 35% (cumulative)
        if seniority_years > 5:
            years_in_bracket = min(seniority_years - 5, 5)
            bracket_2 = years_in_bracket * avg_salary * 0.35
            total += bracket_2
            logger.debug(f"Bracket 2 (6-10 years): {years_in_bracket} years × {avg_salary} × 0.35 = {bracket_2}")

        # Third bracket: > 10 years at 40% (cumulative)
        if seniority_years > 10:
            years_in_bracket = seniority_years - 10
            bracket_3 = years_in_bracket * avg_salary * 0.40
            total += bracket_3
            logger.debug(f"Bracket 3 (>10 years): {years_in_bracket} years × {avg_salary} × 0.40 = {bracket_3}")

        logger.info(f"Severance pay calculated: {total} FCFA")
        return total
    except Exception as e:
        logger.error(f"Error calculating severance pay: {str(e)}", exc_info=True)
        raise


def calculate_notice_period_pay(avg_salary: float, category: WorkerCategory) -> float:
    """
    Calculate notice period compensation (Indemnité de Préavis).

    ================================================================================
    LEGAL REFERENCE: Article 53 - Loi 98-004 (Code du Travail du Bénin)
    ================================================================================

    Args:
        avg_salary: Average monthly salary in FCFA
        category: Worker category (WorkerCategory enum)

    Returns:
        Notice period compensation in FCFA

    ================================================================================
    NOTICE PERIOD DURATION BY CATEGORY:
    ================================================================================

    Worker Category        | Notice Duration | Legal Basis
    -----------------------+-----------------+------------------------------------
    Ouvrier (Worker)       | 1 month         | Art. 53, Loi 98-004
    Employé (Employee)     | 1 month         | Art. 53, Loi 98-004
    Agent de maîtrise      | 2 months        | Art. 53, Loi 98-004
    Cadre (Manager)        | 3 months        | Art. 53, Loi 98-004

    ================================================================================
    CALCULATION FORMULA:
    ================================================================================

    Notice_Compensation = Average_Monthly_Salary × Duration_in_Months

    ================================================================================
    WORKED EXAMPLE:
    ================================================================================

    Employee 1 (Ouvrier): Salary 400,000 FCFA, 1-month notice
                Notice comp = 400,000 × 1 = 400,000 FCFA

    Employee 2 (Cadre): Salary 2,000,000 FCFA, 3-month notice
                Notice comp = 2,000,000 × 3 = 6,000,000 FCFA

    ================================================================================
    LEGAL NOTES & VALIDATION CHECKLIST:
    ================================================================================

    ⚠️  IMPORTANT: These notice periods ARE VERIFIED in official sources.

    Source Verification:
    - ✅ Periods (1, 2, 3 months) confirmed in Article 53, Loi 98-004
    - ✅ Category definitions aligned with official classifications (ouvrier, employé, cadre)

    Questions requiring verification:
    - [ ] Are category definitions applicable to Loi 2017-05 regulations?
    - [ ] Does "Average Salary" have a specific calculation method?
    - [ ] Can notice period be waived or reduced by mutual agreement?
    - [ ] What if employer terminates vs. employee resignation?
    - [ ] Are there probation period exceptions?
    - [ ] What happens if notice period is not respected?
    - [ ] Are there sector-specific variations?

    Reference documentation:
    - Full text: See /LEGAL_REFERENCES.md
    - Source: Loi 98-004, Code du Travail du Bénin
    - Status: REQUIRES OFFICIAL VALIDATION

    ================================================================================
    """
    try:
        logger.debug(f"Calculating notice period: avg_salary={avg_salary}, category={category}")
        
        months = 1
        if category == WorkerCategory.AGENT_MAITRISE:
            months = 2
        elif category == WorkerCategory.CADRE:
            months = 3
        
        result = avg_salary * months
        logger.info(f"Notice period pay calculated: {result} FCFA ({months} months for {category.value})")
        return result
    except Exception as e:
        logger.error(f"Error calculating notice period pay: {str(e)}", exc_info=True)
        raise


def calculate_leave_pay(daily_salary: float, remaining_days: float) -> float:
    """
    Calculate leave compensation (Indemnité Compensatrice de Congés Payés).

    ================================================================================
    LEGAL REFERENCE: Article 113 - Loi 98-004 (Code du Travail du Bénin)
    ================================================================================

    Args:
        daily_salary: Daily salary amount in FCFA
        remaining_days: Number of unused leave days to be compensated

    Returns:
        Leave compensation in FCFA

    ================================================================================
    CALCULATION FORMULA:
    ================================================================================

    Leave_Compensation = Daily_Salary × Remaining_Unused_Days

    Where:
        - Daily_Salary = Monthly_Salary / 26 (or 30? MUST VERIFY)
        - Remaining_Days = Annual allocation - Days used
        - Annual allocation = 2.5 days/month worked = 30 days/year (typical)

    ================================================================================
    WORKED EXAMPLE:
    ================================================================================

    Employee: 12 months employment, Monthly salary: 600,000 FCFA
    - Annual leave entitlement: 2.5 × 12 = 30 days
    - Days taken during year: 20 days
    - Remaining days at termination: 30 - 20 = 10 days
    - Daily salary: 600,000 / 26 = 23,077 FCFA/day
    - Leave compensation: 23,077 × 10 = 230,770 FCFA
    ================================================================================
    """
    try:
        logger.debug(f"Calculating leave pay: daily_salary={daily_salary}, remaining_days={remaining_days}")
        result = daily_salary * remaining_days
        logger.info(f"Leave pay calculated: {result} FCFA ({daily_salary} × {remaining_days} days)")
        return result
    except Exception as e:
        logger.error(f"Error calculating leave pay: {str(e)}", exc_info=True)
        raise
