"""
Test Cases for Legal Calculations - JurisAide Bénin

This module contains tested calculation examples that should be validated
against official Beninese labor law sources and real jurisprudence.

IMPORTANT: These test cases are for VALIDATION purposes only.
Each case should be cross-referenced with actual court decisions or
official government examples before being used in production.

Status: ⚠️ PROVISIONAL - REQUIRES VALIDATION WITH OFFICIAL SOURCES
"""

from datetime import datetime, timedelta

from api.models.enums import WorkerCategory
from api.xlib.labor_code import (calculate_leave_pay,
                                 calculate_notice_period_pay,
                                 calculate_seniority, calculate_severance_pay)

# ================================================================================
# TEST CASE 1: Worker with 8 years tenure - Severance Calculation
# ================================================================================


def test_case_1_severance_8_years():
    """
    SCENARIO:
        Worker type: Employé (Employee)
        Start date: 2016-01-15
        End date: 2024-01-15 (8 years exactly)
        Average monthly salary: 500,000 FCFA
        Reason: Company closure/restructuring

    CALCULATION BREAKDOWN:
        Seniority: 8.0 years

        Bracket 1 (Years 1-5): 5 × 500,000 × 0.30 = 750,000 FCFA
        Bracket 2 (Years 6-8): 3 × 500,000 × 0.35 = 525,000 FCFA

        TOTAL SEVERANCE: 1,275,000 FCFA

    LEGAL REFERENCE:
        Article 44 - Loi 98-004
        Status: REQUIRES VERIFICATION

    VALIDATION:
        [ ] Result matches official calculation method
        [ ] Verified with similar cases in jurisprudence
        [ ] Confirmed with labor ministry guidance
    """
    start_date = datetime(2016, 1, 15)
    end_date = datetime(2024, 1, 15)
    avg_salary = 500_000

    seniority = calculate_seniority(start_date, end_date)
    severance = calculate_severance_pay(avg_salary, seniority)

    expected_severance = 1_275_000

    print(
        f"""
    TEST CASE 1: 8-Year Employee Severance
    =====================================
    Seniority: {seniority:.2f} years
    Average salary: {avg_salary:,} FCFA/month
    Calculated severance: {severance:,.0f} FCFA
    Expected severance: {expected_severance:,} FCFA
    Match: {'✅ PASS' if abs(severance - expected_severance) < 0.01 else '❌ FAIL'}
    """
    )

    assert abs(severance - expected_severance) < 0.01


# ================================================================================
# TEST CASE 2: Senior Manager with 12+ years - Maximum rate bracket
# ================================================================================


def test_case_2_severance_12_years():
    """
    SCENARIO:
        Worker type: Cadre (Manager)
        Start date: 2010-06-01
        End date: 2024-01-15 (13.58 years)
        Average monthly salary: 2,000,000 FCFA
        Reason: Retirement

    CALCULATION BREAKDOWN:
        Seniority: 13.58 years

        Bracket 1 (Years 1-5): 5 × 2,000,000 × 0.30 = 3,000,000 FCFA
        Bracket 2 (Years 6-10): 5 × 2,000,000 × 0.35 = 3,500,000 FCFA
        Bracket 3 (Years 11-13.58): 3.58 × 2,000,000 × 0.40 = 2,864,000 FCFA

        TOTAL SEVERANCE: 9,364,000 FCFA

    LEGAL REFERENCE:
        Article 44 - Loi 98-004
        Status: REQUIRES VERIFICATION
    """
    start_date = datetime(2010, 6, 1)
    end_date = datetime(2024, 1, 15)
    avg_salary = 2_000_000

    seniority = calculate_seniority(start_date, end_date)
    severance = calculate_severance_pay(avg_salary, seniority)

    expected_severance = 9_364_000

    print(
        f"""
    TEST CASE 2: 13+ Year Manager Severance
    =======================================
    Seniority: {seniority:.2f} years
    Average salary: {avg_salary:,} FCFA/month
    Calculated severance: {severance:,.0f} FCFA
    Expected severance: {expected_severance:,} FCFA
    Match: {'✅ PASS' if abs(severance - expected_severance) < 0.01 else '❌ FAIL'}
    """
    )

    assert abs(severance - expected_severance) < 0.01


# ================================================================================
# TEST CASE 3: Notice Period - Different Worker Categories
# ================================================================================


def test_case_3_notice_periods():
    """
    SCENARIO:
        Compare notice compensation across worker categories
        Average monthly salary for all: 1,000,000 FCFA

    CALCULATIONS:
        Ouvrier/Employé: 1,000,000 × 1 = 1,000,000 FCFA
        Agent de maîtrise: 1,000,000 × 2 = 2,000,000 FCFA
        Cadre: 1,000,000 × 3 = 3,000,000 FCFA

    LEGAL REFERENCE:
        Article 42 - Loi 98-004
        Status: REQUIRES VERIFICATION
    """
    avg_salary = 1_000_000

    notice_ouvrier = calculate_notice_period_pay(avg_salary, WorkerCategory.OUVRIER)
    notice_agent = calculate_notice_period_pay(
        avg_salary, WorkerCategory.AGENT_MAITRISE
    )
    notice_cadre = calculate_notice_period_pay(avg_salary, WorkerCategory.CADRE)

    print(
        f"""
    TEST CASE 3: Notice Period by Category
    =======================================
    Base salary: {avg_salary:,} FCFA/month
    
    Ouvrier/Employé: {notice_ouvrier:,} FCFA (1 month)
    Agent de maîtrise: {notice_agent:,} FCFA (2 months)
    Cadre: {notice_cadre:,} FCFA (3 months)
    """
    )

    assert notice_ouvrier == 1_000_000
    assert notice_agent == 2_000_000
    assert notice_cadre == 3_000_000


# ================================================================================
# TEST CASE 4: Leave Compensation - Unused Days at Termination
# ================================================================================


def test_case_4_leave_compensation():
    """
    SCENARIO:
        Employee worked for 1 full year
        Monthly salary: 600,000 FCFA
        Days taken: 20 days
        Days remaining at termination: 10 days

    CALCULATION:
        Daily salary: 600,000 / 26 = 23,076.92 FCFA/day
        Leave compensation: 23,076.92 × 10 = 230,769 FCFA

    ⚠️ CRITICAL QUESTION:
        Is the divisor 26 or 30 days? MUST VERIFY!

    LEGAL REFERENCE:
        Article 113 - Loi 98-004
        Status: REQUIRES VERIFICATION
    """
    monthly_salary = 600_000
    remaining_days = 10

    # Current implementation uses divisor 26
    daily_salary_div26 = monthly_salary / 26
    leave_comp_div26 = calculate_leave_pay(daily_salary_div26, remaining_days)

    # Alternative calculation with divisor 30
    daily_salary_div30 = monthly_salary / 30
    leave_comp_div30 = calculate_leave_pay(daily_salary_div30, remaining_days)

    print(
        f"""
    TEST CASE 4: Leave Compensation
    ================================
    Monthly salary: {monthly_salary:,} FCFA
    Remaining days: {remaining_days} days
    
    Using divisor 26 (current):
        Daily rate: {daily_salary_div26:,.2f} FCFA
        Compensation: {leave_comp_div26:,.2f} FCFA
    
    Using divisor 30 (alternative):
        Daily rate: {daily_salary_div30:,.2f} FCFA
        Compensation: {leave_comp_div30:,.2f} FCFA
    
    ⚠️ DIFFERENCE: {abs(leave_comp_div26 - leave_comp_div30):,.2f} FCFA
    
    ACTION: Verify official divisor before production use!
    """
    )


# ================================================================================
# TEST CASE 5: Combined Total Compensation at Termination
# ================================================================================


def test_case_5_total_termination_package():
    """
    SCENARIO:
        Complete termination scenario

        Employee: Employé (Employee)
        Tenure: 6.5 years
        Start date: 2017-07-15
        End date: 2024-01-15
        Monthly salary: 400,000 FCFA
        Unused leave days: 15 days
        Reason: Economic dismissal

    COMPONENTS:
        1. Severance pay (Art. 44)
        2. Notice period (Art. 42)
        3. Leave compensation (Art. 113)

        TOTAL PACKAGE: To be calculated

    LEGAL REFERENCE:
        Multiple articles - Status: REQUIRES VERIFICATION
    """
    start_date = datetime(2017, 7, 15)
    end_date = datetime(2024, 1, 15)
    monthly_salary = 400_000
    remaining_leave_days = 15
    category = WorkerCategory.EMPLOYE

    # Calculate components
    seniority = calculate_seniority(start_date, end_date)
    severance = calculate_severance_pay(monthly_salary, seniority)
    notice = calculate_notice_period_pay(monthly_salary, category)

    # Daily salary (assuming divisor 26)
    daily_salary = monthly_salary / 26
    leave_comp = calculate_leave_pay(daily_salary, remaining_leave_days)

    total = severance + notice + leave_comp

    print(
        f"""
    TEST CASE 5: Complete Termination Package
    ==========================================
    
    EMPLOYEE INFO:
        Category: Employé
        Tenure: {seniority:.2f} years
        Monthly salary: {monthly_salary:,} FCFA
    
    SEVERANCE COMPONENTS:
        1. Severance pay (Art. 44): {severance:,.0f} FCFA
        2. Notice period (Art. 42): {notice:,.0f} FCFA
        3. Leave compensation (Art. 113): {leave_comp:,.0f} FCFA
        
        TOTAL PACKAGE: {total:,.0f} FCFA
    
    BREAKDOWN:
        - Severance: {severance/total*100:.1f}%
        - Notice: {notice/total*100:.1f}%
        - Leave: {leave_comp/total*100:.1f}%
    
    STATUS: ⚠️ REQUIRES VALIDATION
    """
    )

    return {
        "seniority": seniority,
        "severance": severance,
        "notice": notice,
        "leave_compensation": leave_comp,
        "total": total,
    }


# ================================================================================
# VALIDATION CHECKLIST
# ================================================================================

VALIDATION_CHECKLIST = """
================================================================================
VALIDATION CHECKLIST FOR TEST CASES
================================================================================

Before considering these calculations valid for production:

GENERAL REQUIREMENTS:
    [ ] All test cases reviewed by Beninese labor law expert
    [ ] Source documents (Loi 98-004, décrets) obtained and archived
    [ ] Official labor ministry guidance consulted
    [ ] At least 3 real jurisprudence cases used for cross-validation
    [ ] Results match official labor ministry examples

ARTICLE 42 (PRÉAVIS):
    [ ] Notice periods confirmed (1/2/3 months)
    [ ] Category definitions match official classification
    [ ] Salary inclusion rules defined
    [ ] Exceptions documented

ARTICLE 44 (SEVERANCE):
    [ ] Rates confirmed (30%, 35%, 40%)
    [ ] Bracket boundaries verified (5, 10 years)
    [ ] Fractional year handling confirmed
    [ ] Minimum employment period verified
    [ ] Cause-based termination rules documented

ARTICLE 113 (LEAVE):
    [ ] Annual entitlement confirmed (2.5 days/month?)
    [ ] Daily divisor confirmed (26 or 30?)
    [ ] Carry-over rules clarified
    [ ] Minimum employment period verified

IMPLEMENTATION:
    [ ] Code matches official formulas exactly
    [ ] Comments cite specific legal sources
    [ ] Error messages are informative
    [ ] Edge cases handled (< 1 year, fractions, etc.)
    [ ] Audit trail tracks all calculations

TESTING:
    [ ] Unit tests written for each function
    [ ] Integration tests with real scenarios
    [ ] Regression tests created
    [ ] Edge cases tested
    [ ] All tests pass with margin of error < 1 FCFA

DEPLOYMENT:
    [ ] Legal review completed
    [ ] Production deployment date set
    [ ] User documentation created
    [ ] Training provided to staff
    [ ] Error handling and logging in place
    [ ] Regular audit schedule established

================================================================================
"""

if __name__ == "__main__":
    print(VALIDATION_CHECKLIST)
    print("\n" + "=" * 80 + "\n")

    # Run all test cases
    test_case_1_severance_8_years()
    test_case_2_severance_12_years()
    test_case_3_notice_periods()
    test_case_4_leave_compensation()
    test_case_5_total_termination_package()

    print(
        """
    ================================================================================
    TEST EXECUTION COMPLETE
    ================================================================================
    
    STATUS: ⚠️ PROVISIONAL - All results require validation against official sources
    
    NEXT STEPS:
        1. Contact Beninese labor ministry
        2. Obtain official calculation examples
        3. Cross-validate each test case
        4. Document any differences
        5. Obtain legal approval for production use
    
    ================================================================================
    """
    )
