"""
Calculation API - Usage Examples

This file demonstrates how to use the calculation API with practical examples
based on Beninese labor law.
"""

# Example 1: Simple Employee Termination (8 years, employee category)
# ===================================================================

example_request_1 = {
    "employee_name": "Jean Dupont",
    "employee_email": "jean.dupont@example.com",
    "employee_id": "EMP001",
    "start_date": "2015-01-15",
    "end_date": "2023-01-15",
    "avg_salary": 500000.0,
    "category": "employe",
    "contract_type": "cdi",
    "termination_reason": "licenciement",
    "remaining_leave_days": 10.0,
    "annual_leave_entitlement": 30.0,
    "notes": "Termination for economic reasons"
}

"""
Expected Result for Example 1:
- Seniority: 8.0 years
- Severance Pay: 1,275,000 FCFA
  * Years 1-5: 5 × 500,000 × 30% = 750,000
  * Years 6-8: 3 × 500,000 × 35% = 525,000
- Notice Period Pay: 500,000 FCFA (1 month as employee)
- Leave Compensation: ~230,769 FCFA (10 days × 23,077 FCFA/day)
- TOTAL: 2,005,769 FCFA
"""

# Example 2: Senior Manager Termination (15 years, cadre category)
# ================================================================

example_request_2 = {
    "employee_name": "Marie Adèle Sowa",
    "employee_email": "marie.sowa@example.com",
    "employee_id": "EMP002",
    "start_date": "2008-06-01",
    "end_date": "2023-06-01",
    "avg_salary": 2000000.0,
    "category": "cadre",
    "contract_type": "cdi",
    "termination_reason": "rupture_negociee",
    "remaining_leave_days": 20.0,
    "annual_leave_entitlement": 30.0,
    "notes": "Mutual agreement termination"
}

"""
Expected Result for Example 2:
- Seniority: 15.0 years
- Severance Pay: 4,250,000 FCFA
  * Years 1-5: 5 × 2,000,000 × 30% = 3,000,000
  * Years 6-10: 5 × 2,000,000 × 35% = 3,500,000
  * Years 11-15: 5 × 2,000,000 × 40% = 4,000,000
  * Total: 10,500,000 FCFA
- Notice Period Pay: 6,000,000 FCFA (3 months for cadre)
- Leave Compensation: ~1,538,462 FCFA (20 days × 76,923 FCFA/day)
- TOTAL: 18,038,462 FCFA
"""

# Example 3: Short-term Worker (8 months, ouvrier category)
# ===========================================================

example_request_3 = {
    "employee_name": "Kouassi Aminu",
    "employee_email": "kouassi.aminu@example.com",
    "employee_id": "EMP003",
    "start_date": "2024-08-01",
    "end_date": "2025-04-01",
    "avg_salary": 350000.0,
    "category": "ouvrier",
    "contract_type": "cdi",
    "termination_reason": "licenciement",
    "remaining_leave_days": 5.0,
    "annual_leave_entitlement": 30.0,
    "notes": "Worker with less than 1 year tenure"
}

"""
Expected Result for Example 3:
- Seniority: 0.67 years (8 months - less than 1 year)
- Severance Pay: 0 FCFA (no severance for less than 1 year)
- Notice Period Pay: 350,000 FCFA (1 month for ouvrier)
- Leave Compensation: ~67,308 FCFA (5 days × 13,462 FCFA/day)
- TOTAL: 417,308 FCFA
"""

# Example 4: Supervisor with Extra Leave Days (12 years, agent_maitrise)
# ======================================================================

example_request_4 = {
    "employee_name": "Assogba Modeste",
    "employee_email": "assogba.modeste@example.com",
    "employee_id": "EMP004",
    "start_date": "2011-03-10",
    "end_date": "2023-03-10",
    "avg_salary": 800000.0,
    "category": "agent_maitrise",
    "contract_type": "cdi",
    "termination_reason": "demission",
    "remaining_leave_days": 25.0,
    "annual_leave_entitlement": 30.0,
    "notes": "Resignation by employee"
}

"""
Expected Result for Example 4:
- Seniority: 12.0 years
- Severance Pay: 2,550,000 FCFA
  * Years 1-5: 5 × 800,000 × 30% = 1,200,000
  * Years 6-10: 5 × 800,000 × 35% = 1,400,000
  * Years 11-12: 2 × 800,000 × 40% = 640,000
- Notice Period Pay: 1,600,000 FCFA (2 months for agent_maitrise)
- Leave Compensation: ~769,231 FCFA (25 days × 30,769 FCFA/day)
- TOTAL: 4,919,231 FCFA
"""

# API Usage with curl
# ===================

"""
1. Create a Calculation:

curl -X POST http://localhost:8000/api/v1/calculations/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Basic <base64_encoded_credentials>" \\
  -d '{
    "employee_name": "Jean Dupont",
    "start_date": "2015-01-15",
    "end_date": "2023-01-15",
    "avg_salary": 500000.0,
    "category": "employe",
    "remaining_leave_days": 10.0
  }'

2. List Calculations:

curl http://localhost:8000/api/v1/calculations/ \\
  -H "Authorization: Basic <base64_encoded_credentials>"

3. Get Specific Calculation:

curl http://localhost:8000/api/v1/calculations/{id}/ \\
  -H "Authorization: Basic <base64_encoded_credentials>"

4. Update Calculation:

curl -X PUT http://localhost:8000/api/v1/calculations/{id}/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Basic <base64_encoded_credentials>" \\
  -d '{
    "employee_name": "Jean Dupont",
    "start_date": "2015-01-15",
    "end_date": "2023-06-15",
    "avg_salary": 550000.0,
    "category": "employe",
    "remaining_leave_days": 5.0
  }'

5. Delete Calculation:

curl -X DELETE http://localhost:8000/api/v1/calculations/{id}/ \\
  -H "Authorization: Basic <base64_encoded_credentials>"
"""

# Python Example with requests library
# =====================================

"""
import requests
import json
from datetime import date

# Setup
API_URL = "http://localhost:8000/api/v1"
AUTH = ("your_auth_key", "your_auth_key")

# Create a calculation
data = {
    "employee_name": "Jean Dupont",
    "employee_email": "jean@example.com",
    "start_date": "2015-01-15",
    "end_date": "2023-01-15",
    "avg_salary": 500000.0,
    "category": "employe",
    "remaining_leave_days": 10.0
}

response = requests.post(
    f"{API_URL}/calculations/",
    json=data,
    auth=AUTH
)

if response.status_code == 201:
    result = response.json()
    print(f"Total Compensation: {result['total']} FCFA")
    print(f"Breakdown: {json.dumps(result['breakdown'], indent=2)}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())

# List all calculations
response = requests.get(
    f"{API_URL}/calculations/",
    auth=AUTH
)

calculations = response.json()
for calc in calculations.get('data', []):
    print(f"{calc['employee_name']}: {calc['total']} FCFA")

# Get specific calculation
response = requests.get(
    f"{API_URL}/calculations/507f1f77bcf86cd799439011/",
    auth=AUTH
)

if response.status_code == 200:
    calc = response.json()
    print(f"Employee: {calc['employee_name']}")
    print(f"Seniority: {calc['seniority_years']} years")
    print(f"Total: {calc['total']} FCFA")
"""

# Legal Notes and Validation
# ==========================

"""
IMPORTANT NOTES:

1. LEGAL BASIS:
   - All calculations strictly follow Loi 98-004 du 27 janvier 1998 (Code du Travail)
   - Severance rates (30%, 35%, 40%) are per Loi 2017-05
   - Notice periods are per Article 53 of Loi 98-004

2. SALARY CALCULATIONS:
   - Average Salary: Total compensation including salary and standard benefits
   - Daily Salary: Calculated as Monthly Salary / 26 (working days)
   - Note: This may need adjustment per collective agreements

3. LEAVE COMPENSATION:
   - Annual Entitlement: 30 days per year (2.5 days/month)
   - Remaining Days: Days not taken at termination
   - Payment: Daily Rate × Remaining Days

4. VALIDATION CHECKLIST:
   ✓ Seniority calculation includes exact months/days
   ✓ Severance uses progressive bracket system
   ✓ Notice periods vary by worker category
   ✓ Leave calculated on 26-day working month
   ✓ All amounts in FCFA (Francs CFA)

5. POTENTIAL ADJUSTMENTS:
   - Check collective agreements for higher benefits
   - Verify category definitions match current regulations
   - Confirm daily salary calculation method (26 vs 30 days)
   - Review actual salary components included
   - Validate with official labor court decisions
"""
