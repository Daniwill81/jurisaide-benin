'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/formatters';

interface FormData {
  employee_name: string;
  employee_email: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  avg_salary: number;
  daily_salary: number;
  category: 'EMPLOYEE' | 'DIRECTOR' | 'MANAGER' | '';
  contract_type: 'CDI' | 'CDD' | 'APPRENTICESHIP' | '';
  termination_reason: 'DISMISSAL' | 'RESIGNATION' | 'MUTUAL_AGREEMENT' | '';
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

export default function NewCalculationPage() {
  const { user, authKey } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    employee_name: '',
    employee_email: '',
    employee_id: '',
    start_date: '',
    end_date: '',
    avg_salary: 0,
    daily_salary: 0,
    category: '',
    contract_type: '',
    termination_reason: '',
    remaining_leave_days: 0,
    annual_leave_entitlement: 30,
    notes: '',
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'result'>('form');

  // Calculate daily salary when avg_salary changes
  useEffect(() => {
    if (formData.avg_salary) {
      setFormData(prev => ({
        ...prev,
        daily_salary: prev.avg_salary / 26,
      }));
    }
  }, [formData.avg_salary]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !authKey) {
      setError('Please log in first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/calculations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${authKey}:${authKey}`)}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create calculation');
      }

      const data = await response.json();
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to create a calculation</p>
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Calculation Complete</h1>
            <p className="text-gray-600 mt-2">Here&apos;s the detailed breakdown for {result.employee_name}</p>
          </div>

          {/* Result Cards */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Name</p>
                    <p className="text-gray-900 font-medium">{result.employee_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Seniority</p>
                    <p className="text-gray-900 font-medium">{result.seniority_years.toFixed(1)} years</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Total */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6">
                <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Total Indemnities</p>
                <p className="text-4xl font-bold text-indigo-600 mb-6">
                  {formatCurrency(result.total)}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Severance Pay</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(result.severance_pay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notice Period</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(result.notice_period_pay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leave Compensation</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(result.leave_pay)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            {result.breakdown && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h3>
                <div className="bg-gray-50 rounded p-4 text-sm">
                  <pre className="text-gray-700 overflow-auto">
                    {JSON.stringify(result.breakdown, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setStep('form');
                setResult(null);
              }}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              New Calculation
            </button>
            <button
              onClick={() => router.push('/calculateur')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              View All Calculations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            New Calculation
          </h1>
          <p className="text-gray-600">
            Enter employee and employment details to calculate indemnities
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Employee Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Employee Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="employee_name"
                  value={formData.employee_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="employee_email"
                    value={formData.employee_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="jean@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="EMP001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Dates */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Employment Period
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Salary Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Monthly Salary (FCFA) *
                </label>
                <input
                  type="number"
                  name="avg_salary"
                  value={formData.avg_salary}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="150000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Salary (FCFA)
                </label>
                <input
                  type="number"
                  name="daily_salary"
                  value={formData.daily_salary}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="Auto-calculated"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated as monthly / 26</p>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Employment Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Type *
                  </label>
                  <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    {CONTRACT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Termination Reason
                </label>
                <select
                  name="termination_reason"
                  value={formData.termination_reason}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select reason (optional)</option>
                  {TERMINATION_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Leave Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Leave Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remaining Leave Days
                </label>
                <input
                  type="number"
                  name="remaining_leave_days"
                  value={formData.remaining_leave_days}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Leave Entitlement
                </label>
                <input
                  type="number"
                  name="annual_leave_entitlement"
                  value={formData.annual_leave_entitlement}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Indemnities'}
          </button>
        </form>
      </div>
    </div>
  );
}
