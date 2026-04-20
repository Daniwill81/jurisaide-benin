# Calculation API Documentation

This module provides REST API endpoints for calculating employee severance,
notice period, and leave compensation according to Beninese labor law.

## API Endpoints

- `POST /api/v1/calculations/` - Create and calculate
- `GET /api/v1/calculations/` - List calculations
- `GET /api/v1/calculations/{id}/` - Get calculation details
- `PUT /api/v1/calculations/{id}/` - Update calculation
- `DELETE /api/v1/calculations/{id}/` - Delete calculation

## Legal References

- Article 44 (Loi 98-004): Severance pay (Indemnité de Licenciement)
- Article 53 (Loi 98-004): Notice period pay (Indemnité de Préavis)
- Article 113 (Loi 98-004): Leave compensation (Indemnité de Congés Payés)
- Loi 2017-05: Conditions d'embauche et résiliation

## Example Request Body

```json
{
    "employee_name": "Jean Dupont",
    "employee_email": "jean@example.com",
    "employee_id": "12345",
    "start_date": "2015-01-15",
    "end_date": "2023-01-15",
    "avg_salary": 500000.0,
    "category": "employe",
    "contract_type": "cdi",
    "termination_reason": "licenciement",
    "remaining_leave_days": 10.0,
    "annual_leave_entitlement": 30.0,
    "notes": "Optional notes about the calculation"
}
```

## Example Response

```json
{
    "id": "507f1f77bcf86cd799439011",
    "employee_name": "Jean Dupont",
    "employee_email": "jean@example.com",
    "seniority_years": 8.0,
    "severance_pay": 1275000.0,
    "notice_period_pay": 500000.0,
    "leave_pay": 230769.23,
    "total": 2005769.23,
    "breakdown": {
        "seniority_years": 8.0,
        "severance_pay": {
            "amount": 1275000.0,
            "formula": "Selon Article 44 - Loi 98-004",
            "details": {
                "bracket_1_to_5_years": {
                    "years": 5.0,
                    "rate": "30%"
                },
                "bracket_6_to_10_years": {
                    "years": 3.0,
                    "rate": "35%"
                }
            }
        },
        "notice_period_pay": {
            "amount": 500000.0,
            "formula": "Selon Article 53 - Loi 98-004",
            "category": "employe",
            "months": 1
        },
        "leave_pay": {
            "amount": 230769.23,
            "formula": "Selon Article 113 - Loi 98-004",
            "remaining_days": 10.0,
            "daily_rate": 23076.92
        }
    },
    "articles": {
        "severance": "Art. 44",
        "notice": "Art. 53",
        "leave": "Art. 113",
        "legal_basis": "Loi 98-004 du 27 janvier 1998"
    },
    "created_at": "2024-04-20T10:30:00",
    "updated_at": "2024-04-20T10:30:00"
}
```

## Worker Categories (WorkerCategory)

- `ouvrier` - Worker
- `employe` - Employee
- `agent_maitrise` - Supervisor
- `cadre` - Manager/Executive

## Contract Types (ContractType)

- `cdi` - Contrat à Durée Indéterminée (Permanent)
- `cdd` - Contrat à Durée Déterminée (Fixed-term)

## Termination Reasons (TerminationReason)

- `licenciement` - Termination by employer
- `demission` - Resignation
- `rupture_negociee` - Mutual agreement
- `fin_contrat` - End of contract

## Authentication

All endpoints require Basic Authentication with the user's auth_key.

Headers:

```bash
Authorization: Basic base64(auth_key:auth_key)
```

or

```bash
X-Beans-Authorization: Basic base64(auth_key:auth_key)
```

## Calculation Rules

### 1. SEVERANCE PAY (Article 44)

- Less than 1 year: 0 FCFA
- 1-5 years: seniority × salary × 30%
- 6-10 years: (5 × salary × 30%) + ((seniority-5) × salary × 35%)
- \> 10 years: (5 × salary × 30%) + (5 × salary × 35%) + ((seniority-10) × salary × 40%)

### 2. NOTICE PERIOD PAY (Article 53)

- Ouvrier/Employé: 1 month notice
- Agent de maîtrise: 2 months notice
- Cadre: 3 months notice

Compensation = Monthly Salary × Notice Duration

### 3. LEAVE COMPENSATION (Article 113)

- Daily Salary = Monthly Salary / 26
- Compensation = Daily Salary × Remaining Days

### 4. TOTAL

Total = Severance + Notice Period + Leave
