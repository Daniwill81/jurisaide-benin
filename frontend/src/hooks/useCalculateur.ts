'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface CalculationResult {
  id: string;
  seniority_years: number;
  severance_pay: number;
  notice_period_pay: number;
  leave_pay: number;
  total: number;
  breakdown: any;
  articles: Record<string, string>;
}

export function useCalculateur() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<CalculationResult>('/calculations/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setResult(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { calculate, result, loading, error, reset };
}
