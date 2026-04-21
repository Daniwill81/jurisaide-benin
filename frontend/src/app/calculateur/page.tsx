'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface Calculation {
  id: string;
  employee_name: string;
  employee_email: string;
  start_date: string;
  end_date: string;
  avg_salary: number;
  seniority_years: number;
  total: number;
  status: string;
  created_at: string;
}

export default function CalculationsPage() {
  const { user, authKey } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || !authKey) return;

    const fetchCalculations = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);

        const response = await fetch(
          `/api/v1/calculations/?${params.toString()}`,
          {
            headers: {
              'Authorization': `Basic ${btoa(`${authKey}:${authKey}`)}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch calculations');

        const data = await response.json();
        setCalculations(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCalculations();
  }, [user, authKey, searchQuery]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to view calculations</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Calculations
          </h1>
          <p className="text-gray-600">Manage and view all your labor calculation requests</p>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4 items-center">
          <Link
            href="/calculateur"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-md"
          >
            + New Calculation
          </Link>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : calculations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No calculations found</p>
            <Link
              href="/calculateur"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first calculation →
            </Link>
          </div>
        ) : (
          /* Calculations Table */
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Seniority
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((calc) => (
                    <tr
                      key={calc.id}
                      className="border-b border-gray-100 hover:bg-blue-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {calc.employee_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {calc.employee_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {calc.seniority_years.toFixed(1)} years
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-indigo-600">
                        {formatCurrency(calc.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(calc.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/calculateur/${calc.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
