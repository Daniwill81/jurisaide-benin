'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface FormData {
  employee_name: string;
  employee_email: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  avg_salary: number;
  daily_salary: number;
  category: string;
  contract_type: string;
  termination_reason: string;
  remaining_leave_days: number;
  annual_leave_entitlement: number;
  notes: string;
}

interface CalculationResult {
  id: string;
  employee_name: string;
  seniority_years: number;
  severance_pay: number;
  notice_period_pay: number;
  leave_pay: number;
  total: number;
  breakdown: Record<string, unknown> | null;
}

const CATEGORIES = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'MANAGER', label: 'Manager' },
];

const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI (Indefinite)' },
  { value: 'CDD', label: 'CDD (Fixed-Term)' },
  { value: 'APPRENTICESHIP', label: 'Apprenticeship' },
];

const TERMINATION_REASONS = [
  { value: 'DISMISSAL', label: 'Dismissal' },
  { value: 'RESIGNATION', label: 'Resignation' },
  { value: 'MUTUAL_AGREEMENT', label: 'Mutual Agreement' },
];

export default function EditCalculationPage() {
  const { user, authKey } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!user || !authKey) return;

    const fetchCalculation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/calculations/${id}/`, {
          headers: {
            'Authorization': `Basic ${btoa(`${authKey}:${authKey}`)}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch calculation');

        const data = await response.json();
        setFormData({
          employee_name: data.employee_name,
          employee_email: data.employee_email || '',
          employee_id: data.employee_id || '',
          start_date: data.start_date,
          end_date: data.end_date,
          avg_salary: data.avg_salary,
          daily_salary: data.daily_salary,
          category: data.category,
          contract_type: data.contract_type,
          termination_reason: data.termination_reason || '',
          remaining_leave_days: data.remaining_leave_days,
          annual_leave_entitlement: data.annual_leave_entitlement,
          notes: data.notes || '',
        });
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCalculation();
  }, [id, user, authKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !authKey || !formData) {
      setError('Missing required data');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/v1/calculations/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${authKey}:${authKey}`)}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update calculation');
      }

      const data = await response.json();
      setResult(data);
      setShowResult(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to edit a calculation</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Calculation not found'}</p>
          <Link
            href={`/calculateur/${id}`}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to calculation
          </Link>
        </div>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Updated Successfully</h1>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide mb-1">Seniority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.seniority_years.toFixed(1)} yrs
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide mb-1">Severance</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {(result.severance_pay / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide mb-1">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {(result.total / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href={`/calculateur/${id}`}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              View Calculation
            </Link>
            <Link
              href="/calculateur"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/calculateur/${id}`}
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-flex items-center"
          >
            ← Back to calculation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Edit Calculation</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Employee Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="employee_name"
                  value={formData.employee_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="employee_email"
                    value={formData.employee_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Dates */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Period</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Monthly Salary (FCFA)
                </label>
                <input
                  type="number"
                  name="avg_salary"
                  value={formData.avg_salary}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                  <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {CONTRACT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termination Reason</label>
                <select
                  name="termination_reason"
                  value={formData.termination_reason}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select reason (optional)</option>
                  {TERMINATION_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>{reason.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Leave Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Leave Days</label>
                <input
                  type="number"
                  name="remaining_leave_days"
                  value={formData.remaining_leave_days}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Leave Entitlement</label>
                <input
                  type="number"
                  name="annual_leave_entitlement"
                  value={formData.annual_leave_entitlement}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
