'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface Calculation {
  id: string;
  employee_name: string;
  employee_email: string;
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
        const data = await apiFetch<Calculation>(`/calculations/${id}/`);
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
      await apiFetch(`/calculations/${id}/`, {
        method: 'DELETE',
      });

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
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] shadow-2xl p-8 text-white mb-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <p className="text-indigo-300 text-sm font-bold uppercase tracking-[0.2em] mb-2">Total à percevoir</p>
              <h2 className="text-5xl md:text-6xl font-black mb-10 tracking-tight">{formatCurrency(calculation.total)}</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                <div className="pb-4 md:pb-0 md:pr-6">
                  <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest mb-1">Licenciement</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculation.severance_pay)}</p>
                </div>
                <div className="py-4 md:py-0 md:px-6">
                  <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest mb-1">Préavis</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculation.notice_period_pay)}</p>
                </div>
                <div className="pt-4 md:pt-0 md:pl-6">
                  <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest mb-1">Congés</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculation.leave_pay)}</p>
                </div>
              </div>
            </div>

            {/* Calculation Details */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 mb-8 border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                Paramètres du calcul
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ancienneté</p>
                  <p className="text-slate-900 font-black text-xl">{calculation.seniority_years.toFixed(2)} <span className="text-sm font-normal text-slate-500">ans</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salaire Moyen</p>
                  <p className="text-slate-900 font-black text-xl">{formatCurrency(calculation.avg_salary)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salaire Jour</p>
                  <p className="text-slate-900 font-bold">{formatCurrency(calculation.daily_salary)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Congés Dus</p>
                  <p className="text-slate-900 font-bold">{calculation.remaining_leave_days} jours</p>
                </div>
              </div>
            </div>

            {/* Breakdown - Professional Design */}
            {calculation.breakdown && (
              <div className="space-y-6 mb-8">
                <h3 className="text-xl font-black text-slate-900 px-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                  Détail du décompte
                </h3>
                
                {/* Severance Breakdown */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Indemnité de Licenciement</span>
                    <span className="text-xs font-mono text-slate-400">Art. 44 - Loi 98-004</span>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      {Object.entries((calculation.breakdown as any).severance_pay?.details || {}).map(([key, detail]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                            <span className="text-slate-600">Tranche {key.includes('1_to_5') ? '1 à 5 ans' : key.includes('6_to_10') ? '6 à 10 ans' : 'plus de 10 ans'}</span>
                          </div>
                          <div className="font-semibold text-slate-900">
                            {detail.years} ans × {detail.rate}
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 mt-4 border-t border-slate-50 flex justify-between items-center font-black text-lg text-indigo-600">
                        <span>Total partiel</span>
                        <span>{formatCurrency((calculation.breakdown as any).severance_pay?.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notice & Leave Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notice */}
                  <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 p-8">
                    <div className="flex justify-between items-start mb-6">
                      <span className="font-bold text-slate-900">Préavis</span>
                      <span className="text-[10px] font-mono text-slate-400">Art. 53</span>
                    </div>
                    <div className="text-sm text-slate-600 mb-4">
                      Base : <span className="font-semibold text-slate-900">{(calculation.breakdown as any).notice_period_pay?.months} mois</span> de salaire
                    </div>
                    <div className="font-black text-2xl text-indigo-600">
                      {formatCurrency((calculation.breakdown as any).notice_period_pay?.amount)}
                    </div>
                  </div>

                  {/* Leave */}
                  <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 p-8">
                    <div className="flex justify-between items-start mb-6">
                      <span className="font-bold text-slate-900">Congés Payés</span>
                      <span className="text-[10px] font-mono text-slate-400">Art. 113</span>
                    </div>
                    <div className="text-sm text-slate-600 mb-4">
                      <span className="font-semibold text-slate-900">{(calculation.breakdown as any).leave_pay?.remaining_days} jours</span> × {formatCurrency((calculation.breakdown as any).leave_pay?.daily_rate)}/j
                    </div>
                    <div className="font-black text-2xl text-indigo-600">
                      {formatCurrency((calculation.breakdown as any).leave_pay?.amount)}
                    </div>
                  </div>
                </div>
                {/* Legal Citations (RAG) */}
                {(calculation.breakdown as any).citations?.length > 0 && (
                  <div className="bg-slate-900 rounded-[2rem] shadow-2xl p-8 text-white">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                      Citations Légales Pertinentes
                    </h3>
                    <div className="space-y-6">
                      {(calculation.breakdown as any).citations.map((cite: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-indigo-500/30 pl-6 py-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">{cite.law}</span>
                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">{cite.article}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed italic">"{cite.content}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
