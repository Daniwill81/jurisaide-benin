'use client';

import { useState, useEffect, FormEvent } from 'react';
import Navbar from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function JurisprudencePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
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
    <div className="min-h-screen bg-[#fafbfc] selection:bg-indigo-100 overflow-x-hidden">
      <Navbar />

      {/* Decorative Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-100/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <main className="max-w-7xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-sm border border-indigo-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Intelligence Juridique
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6">Moteur de <span className="text-indigo-600">Jurisprudence</span></h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Interrogez notre base de données sémantique pour trouver des précédents pertinents basés sur le droit du travail béninois.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Décrivez une situation juridique (ex: Licenciement abusif...)"
              className="w-full bg-white/80 backdrop-blur-xl border-2 border-slate-100 rounded-[2.5rem] px-10 py-6 text-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-2xl shadow-slate-200/50 group-hover:shadow-indigo-100/30 font-medium"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-4 top-4 bottom-4 px-10 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyse...
                </div>
              ) : 'Analyser'}
            </button>
          </form>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              results.map((case_item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex px-4 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-green-100 shadow-sm">
                            {Math.round(case_item.score * 100)}% Pertinence
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{case_item.metadata?.date || '2024'}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{case_item.title}</h3>
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{case_item.metadata?.court_name || 'TRIBUNAL DE COTONOU'}</p>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-8">
                      <p className="text-slate-600 leading-relaxed font-medium italic">
                        {case_item.summary}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {case_item.metadata?.tags?.map((tag: string, tidx: number) => (
                        <span key={tidx} className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-default">
                          #{tag}
                        </span>
                      ))}
                      {!case_item.metadata?.tags && ['Droit du Travail', 'Bénin', 'Jurisprudence'].map((tag, tidx) => (
                         <span key={tidx} className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                           #{tag}
                         </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : !loading && query && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-slate-100"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Aucun précédent trouvé</h3>
                <p className="text-slate-500 font-medium">Affinez votre description pour obtenir des résultats plus précis.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
