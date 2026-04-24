'use client';

import Navbar from '@/components/layout/navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredDossiers = dossiers.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    (d.client_name && d.client_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] selection:bg-indigo-100 overflow-x-hidden">
      <Navbar />

      {/* Decorative Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[35%] h-[35%] bg-indigo-100/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] bg-blue-100/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <main className="max-w-7xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8"
        >
          <div className="max-w-2xl">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Bibliothèque de <span className="text-indigo-600">Dossiers</span></h1>
            <p className="text-lg text-slate-500 font-medium">Suivez l'évolution de vos dossiers clients et gérez vos archives juridiques en toute simplicité.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Rechercher un dossier..." 
                className="w-full sm:w-80 pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <Link href="/dossiers/nouveau" className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              Nouveau Dossier
            </Link>
          </div>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="bg-white/50 backdrop-blur-sm h-64 rounded-[3rem] animate-pulse border border-slate-100" />)
          ) : filteredDossiers.length > 0 ? (
            filteredDossiers.map((d: any) => (
              <DossierCard key={d.id} dossier={d} />
            ))
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="col-span-full text-center py-32 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-slate-100"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Aucun dossier à l&apos;horizon</h3>
              <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10">Commencez par créer votre premier dossier pour organiser votre pratique juridique.</p>
              <Link href="/dossiers/nouveau" className="inline-flex items-center justify-center px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                Créer un dossier
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function DossierCard({ dossier }: { dossier: any }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link href={`/dossiers/${dossier.id}`} className="block group bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100/40 hover:border-indigo-100 transition-all relative overflow-hidden h-full">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${
              dossier.status === 'ouvert' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'
            }`}>
              {dossier.status}
            </span>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">J</div>
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 leading-tight">{dossier.title}</h3>
          <p className="text-sm text-slate-500 font-medium line-clamp-3 min-h-[4.5rem] leading-relaxed mb-8">{dossier.description || 'Aucune description spécifiée pour ce dossier.'}</p>

          <div className="flex items-center justify-between border-t border-slate-50 pt-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Dernière modification</span>
              <span className="text-xs font-bold text-slate-600">{new Date(dossier.updated || dossier.created).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-600 flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
