'use client';

import Navbar from '@/components/layout/navbar';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    dossiers: 0, 
    calculations: 0,
    licenciements: 0,
    demissions: 0
  });
  const [recentDossiers, setRecentDossiers] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dossiersData = await apiFetch<any>('/dossiers/');
        const calculationsData = await apiFetch<any>('/calculations/');
        const dashboardStats = await apiFetch<any>('/dossiers/stats/dashboard/');
        
        setStats({
          dossiers: dossiersData.count || 0,
          calculations: calculationsData.count || 0,
          licenciements: dashboardStats.licenciements || 0,
          demissions: dashboardStats.demissions || 0
        });
        setRecentDossiers(dossiersData.data?.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bonjour, {user?.first_name}</h1>
          <p className="text-slate-500 mt-2 font-medium">Bienvenue sur votre espace de gestion juridique JurisAide.</p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="Dossiers Actifs" value={stats.dossiers} color="indigo" />
          <StatCard title="Calculs Effectués" value={stats.calculations} color="blue" />
          <StatCard title="Documents Générés" value={0} color="emerald" />
          <StatCard title="Temps Gagné" value="~14h" color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Actions & Dossiers */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Dossiers récents</h2>
                <Link href="/dossiers" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Voir tout &rarr;</Link>
              </div>
              <div className="space-y-4">
                {recentDossiers.length > 0 ? (
                  recentDossiers.map((d: any) => (
                    <Link key={d.id} href={`/dossiers/${d.id}`} className="group block bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-colors">
                            <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{d.title}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Crée le {new Date(d.created).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">{d.status}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">Aucun dossier récent</p>
                    <Link href="/dossiers/nouveau" className="mt-4 inline-block text-sm font-bold text-indigo-600">Créer mon premier dossier</Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-6">
            <section className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-2">Simulateur Rapide</h3>
                <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-80">Effectuez une simulation d'indemnités sans créer de dossier complet.</p>
                <Link href="/calculateur?simulate=true" className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-800/20 transition-all active:scale-95">Calculer maintenant</Link>
              </div>
              <svg className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Statistiques du mois</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Licenciements</span>
                   <span className="font-bold text-slate-900">{stats.licenciements}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${stats.licenciements}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Démissions</span>
                   <span className="font-bold text-slate-900">{stats.demissions}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${stats.demissions}%` }}></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: string | number, color: string }) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-black text-slate-900">{value}</span>
        <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
      </div>
    </div>
  );
}
