"""
Test for Legal Calculations.

Tests calculation logic against legal requirements from Beninese labor law.
"""

from datetime import datetime

from api.xlib.labor_code import (
    calculate_seniority,
    calculate_severance_pay,
    calculate_notice_period_pay,
    calculate_leave_pay,
)
from api.models.enums import WorkerCategory


class TestSeniority:
    """Test seniority calculation."""

    def test_seniority_exact_years(self):
        """Test seniority for exact year periods."""
        start = datetime(2015, 1, 1)
        end = datetime(2020, 1, 1)
        seniority = calculate_seniority(start, end)
        assert seniority == 5.0

    def test_seniority_with_months(self):
        """Test seniority with fractional months."""
        start = datetime(2015, 1, 1)
        end = datetime(2015, 7, 1)  # 6 months
        seniority = calculate_seniority(start, end)
        assert abs(seniority - 0.5) < 0.01

    def test_seniority_less_than_one_year(self):
        """Test seniority less than one year."""
        start = datetime(2024, 6, 1)
        end = datetime(2025, 1, 1)  # 7 months
        seniority = calculate_seniority(start, end)
        assert 0.5 < seniority < 1.0

    def test_seniority_eight_years(self):
        """Test seniority calculation from legal example."""
        # Legal example: 8 years tenure
        start = datetime(2015, 1, 1)
        end = datetime(2023, 1, 1)
        seniority = calculate_seniority(start, end)
        assert seniority == 8.0


class TestSeverancePay:
    """Test severance pay calculation (Article 44)."""

    def test_severance_less_than_one_year(self):
        """Severance is 0 for tenure < 1 year."""
        result = calculate_severance_pay(500000, 0.5)
        assert result == 0.0

    def test_severance_one_year(self):
        """Severance at minimum: 1 year × salary × 30%."""
        result = calculate_severance_pay(500000, 1.0)
        expected = 500000 * 0.30
        assert result == expected

    def test_severance_five_years(self):
        """Severance for 5 years (at bracket boundary)."""
        result = calculate_severance_pay(500000, 5.0)
        expected = 5 * 500000 * 0.30
        assert result == expected

    def test_severance_legal_example_8_years(self):
        """
        Test with legal example from documentation.

        Employee: 8 years tenure, Avg salary: 500,000 FCFA/month
        Expected: 1,275,000 FCFA
        """
        result = calculate_severance_pay(500000, 8.0)

        # Years 1-5 @ 30%: 5 × 500,000 × 0.30 = 750,000
        bracket_1 = 5 * 500000 * 0.30
        assert bracket_1 == 750000

        # Years 6-8 @ 35%: 3 × 500,000 × 0.35 = 525,000
        bracket_2 = 3 * 500000 * 0.35
        assert bracket_2 == 525000

        # Total
        expected = 750000 + 525000
        assert result == expected
        assert result == 1275000

    def test_severance_ten_years(self):
        """Severance at 10 years (bracket boundary)."""
        result = calculate_severance_pay(500000, 10.0)

        # Years 1-5 @ 30%: 5 × 500,000 × 0.30 = 750,000
        bracket_1 = 5 * 500000 * 0.30

        # Years 6-10 @ 35%: 5 × 500,000 × 0.35 = 875,000
        bracket_2 = 5 * 500000 * 0.35

        expected = bracket_1 + bracket_2
        assert result == expected
        assert result == 1625000

    def test_severance_above_10_years(self):
        """Severance above 10 years uses all brackets."""
        result = calculate_severance_pay(500000, 15.0)

        # Years 1-5 @ 30%: 5 × 500,000 × 0.30 = 750,000
        bracket_1 = 5 * 500000 * 0.30

        # Years 6-10 @ 35%: 5 × 500,000 × 0.35 = 875,000
        bracket_2 = 5 * 500000 * 0.35

        # Years 11-15 @ 40%: 5 × 500,000 × 0.40 = 1,000,000
        bracket_3 = 5 * 500000 * 0.40

        expected = bracket_1 + bracket_2 + bracket_3
        assert result == expected
        assert result == 2625000


class TestNoticePeriodPay:
    """Test notice period pay calculation (Article 53)."""

    def test_notice_ouvrier(self):
        """Worker (ouvrier): 1 month notice."""
        result = calculate_notice_period_pay(400000, WorkerCategory.OUVRIER)
        expected = 400000 * 1
        assert result == expected

    def test_notice_employe(self):
        """Employee (employé): 1 month notice."""
        result = calculate_notice_period_pay(400000, WorkerCategory.EMPLOYE)
        expected = 400000 * 1
        assert result == expected

    def test_notice_agent_maitrise(self):
        """Supervisor (agent de maîtrise): 2 months notice."""
        result = calculate_notice_period_pay(700000, WorkerCategory.AGENT_MAITRISE)
        expected = 700000 * 2
        assert result == expected
        assert result == 1400000

    def test_notice_cadre(self):
        """Manager (cadre): 3 months notice."""
        result = calculate_notice_period_pay(2000000, WorkerCategory.CADRE)
        expected = 2000000 * 3
        assert result == expected
        assert result == 6000000


class TestLeavePay:
    """Test leave compensation calculation (Article 113)."""

    def test_leave_no_remaining_days(self):
        """No compensation if no remaining days."""
        result = calculate_leave_pay(23077, 0)
        assert result == 0.0

    def test_leave_legal_example(self):
        """
        Test with legal example.

        Employee: 12 months, Monthly salary: 600,000 FCFA
        - Daily salary: 600,000 / 26 = 23,077 FCFA/day
        - Remaining days at termination: 10 days
        - Leave compensation: 23,077 × 10 = 230,770 FCFA
        """
        daily_salary = 600000 / 26
        result = calculate_leave_pay(daily_salary, 10)
        assert abs(result - 230769.23) < 1  # Allow small rounding difference

    def test_leave_full_month(self):
        """Test leave with full month of remaining days."""
        # 600,000 / 26 = 23,077 per day
        daily_salary = 600000 / 26
        result = calculate_leave_pay(daily_salary, 26)  # Full month
        assert abs(result - 600000) < 1


class TestTotalCompensation:
    """Test total compensation calculation."""

    def test_total_8_years_employee(self):
        """
        Complete example: 8-year employee terminated.

        Employee: 8 years, salary 500,000, 10 remaining leave days
        """
        seniority = calculate_seniority(
            datetime(2015, 1, 1),
            datetime(2023, 1, 1)
        )
        assert seniority == 8.0

        severance = calculate_severance_pay(500000, seniority)
        assert severance == 1275000  # 750k + 525k

        notice = calculate_notice_period_pay(500000, WorkerCategory.EMPLOYE)
        assert notice == 500000  # 1 month

        leave = calculate_leave_pay(500000 / 26, 10)
        expected_leave = (500000 / 26) * 10
        assert abs(leave - expected_leave) < 1

        total = severance + notice + leave
        assert total > 1700000
