'use client';

import { useState } from 'react';

export function useDossier() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDossiers = async (authKey: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/dossiers/', {
        headers: {
          'Authorization': `Basic ${btoa(`${authKey}:${authKey}`)}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch dossiers');

      const data = await response.json();
      setDossiers(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { dossiers, loading, error, fetchDossiers };
}
