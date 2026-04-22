'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/formatters';
import Link from 'next/link';

interface Calculation {
  id: string;
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
  status: string;
  notes: string;
  created: string;
  updated: string;
  seniority_years: number;
  severance_pay: number;
  notice_period_pay: number;
  leave_pay: number;
  total: number;
  breakdown: Record<string, unknown> | null;
  articles: unknown[] | null;
}

export default function CalculationDetailPage() {
  const { user, authKey } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        setCalculation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCalculation();
  }, [id, user, authKey]);

  const handleDelete = async () => {
    if (!authKey) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/v1/calculations/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(`${authKey}:${authKey}`)}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete calculation');

      router.push('/calculateur');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to view details</p>
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

  if (error || !calculation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Calculation not found'}</p>
          <Link
            href="/calculateur"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to calculations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/calculateur"
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-flex items-center"
          >
            ← Back to calculations
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">{calculation.employee_name}</h1>
          <p className="text-gray-600 mt-2">Calculation ID: {calculation.id}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Employee Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                  <p className="text-gray-900 font-medium">{calculation.employee_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-gray-900 break-all">{calculation.employee_email}</p>
                </div>
                {calculation.employee_id && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Employee ID</p>
                    <p className="text-gray-900">{calculation.employee_id}</p>
                  </div>
                )}
              </div>

              <hr className="my-6" />

              <h3 className="font-semibold text-gray-900 mb-3">Employment</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                  <p className="text-gray-900">{calculation.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Contract Type</p>
                  <p className="text-gray-900">{calculation.contract_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                  <p className="text-gray-900">{formatDate(calculation.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                  <p className="text-gray-900">{formatDate(calculation.end_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center & Right - Results */}
          <div className="lg:col-span-2">
            {/* Total Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg shadow-lg p-8 text-white mb-8">
              <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Total Indemnities</p>
              <h2 className="text-5xl font-bold mb-8">{formatCurrency(calculation.total)}</h2>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-indigo-100 text-xs uppercase tracking-wide mb-1">Severance</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculation.severance_pay)}</p>
                </div>
                <div>
                  <p className="text-indigo-100 text-xs uppercase tracking-wide mb-1">Notice Period</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculation.notice_period_pay)}</p>
                </div>
                <div>
                  <p className="text-indigo-100 text-xs uppercase tracking-wide mb-1">Leave</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculation.leave_pay)}</p>
                </div>
              </div>
            </div>

            {/* Calculation Details */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Seniority</p>
                    <p className="text-gray-900 font-medium text-lg">
                      {calculation.seniority_years.toFixed(1)} years
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Average Salary</p>
                    <p className="text-gray-900 font-medium text-lg">
                      {formatCurrency(calculation.avg_salary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Daily Salary</p>
                    <p className="text-gray-900 font-medium">
                      {formatCurrency(calculation.daily_salary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Leave Days</p>
                    <p className="text-gray-900 font-medium">
                      {calculation.remaining_leave_days} days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            {calculation.breakdown && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown</h3>
                <div className="bg-gray-50 rounded p-4 text-sm max-h-64 overflow-y-auto">
                  <pre className="text-gray-700 text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(calculation.breakdown, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Link
                href={`/calculateur/${id}/edit`}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition text-center"
              >
                Edit Calculation
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="text-gray-900">{formatDate(calculation.created)}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-900">{formatDate(calculation.updated)}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="text-gray-900 capitalize">{calculation.status}</p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Calculation?
              </h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The calculation and all its data will be permanently deleted.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
