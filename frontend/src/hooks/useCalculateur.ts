'use client';

import { useState } from 'react';

export function useCalculateur() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalculations = async (authKey: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/calculations/', {
        headers: {
          'Authorization': `Basic ${btoa(`${authKey}:${authKey}`)}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch calculations');

      const data = await response.json();
      setCalculations(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { calculations, loading, error, fetchCalculations };
}
