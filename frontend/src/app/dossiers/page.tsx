'use client';

import Navbar from '@/components/layout/navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const response = await apiFetch<any>('/dossiers/');
        setDossiers(response.data || []);
        setCount(response.count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossiers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vos Dossiers</h1>
            <p className="text-slate-500 mt-2 font-medium">Gérez et suivez l'ensemble de vos dossiers clients ({count}).</p>
          </div>
          <Link href="/dossiers/nouveau" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Nouveau dossier
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="bg-white h-48 rounded-3xl animate-pulse" />)
          ) : dossiers.length > 0 ? (
            dossiers.map((d: any) => (
              <DossierCard key={d.id} dossier={d} />
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-slate-500 font-bold text-xl">Aucun dossier trouvé</p>
              <p className="text-slate-400 mt-1">Commencez par créer votre premier dossier client.</p>
              <Link href="/dossiers/nouveau" className="mt-6 inline-block px-8 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all">Créer un dossier</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DossierCard({ dossier }: { dossier: any }) {
  const statusColors: any = {
    'ouvert': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'en_attente': 'bg-orange-50 text-orange-600 border-orange-100',
    'fermé': 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <Link href={`/dossiers/${dossier.id}`} className="group bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[dossier.status] || statusColors['ouvert']}`}>
            {dossier.status}
          </div>
          <p className="text-[10px] font-mono text-slate-400">ID: {dossier.id.slice(-8)}</p>
        </div>

        <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{dossier.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] mb-6">{dossier.description || 'Aucune description fournie.'}</p>

        <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{dossier.user_id ? 'Client Asssocié' : 'Calcul Libre'}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(dossier.created).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </Link>
  );
}
