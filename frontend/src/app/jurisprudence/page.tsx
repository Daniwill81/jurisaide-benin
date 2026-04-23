'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api';

export default function JurisprudencePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const data = await apiFetch<any[]>(`/jurisprudence/similaires?q=${encodeURIComponent(query)}&k=5`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Recherche de Jurisprudence</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Trouvez des cas similaires basés sur le droit du travail béninois pour enrichir vos dossiers et argumentations.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Licenciement abusif pour motif économique sans préavis..."
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 top-3 bottom-3 px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {results.length > 0 ? (
            results.map((case_item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest mb-2">
                      {Math.round(case_item.score * 100)}% Similaire
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">{case_item.title}</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-400">{case_item.metadata?.court_name || 'Tribunal de Cotonou'}</p>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {case_item.summary}
                </p>
                <div className="flex gap-2">
                  {case_item.metadata?.tags?.map((tag: string, tidx: number) => (
                    <span key={tidx} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : !loading && query && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">Aucun résultat trouvé pour cette recherche.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
