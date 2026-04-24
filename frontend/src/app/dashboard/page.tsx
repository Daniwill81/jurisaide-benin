'use client';

import Navbar from '@/components/layout/navbar';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    dossiers: 0, 
    calculations: 0,
    licenciements: 0,
    demissions: 0
  });
  const [recentDossiers, setRecentDossiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] selection:bg-indigo-100">
      <Navbar />
      
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/40 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[25%] h-[25%] bg-blue-100/40 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <main className="max-w-7xl mx-auto pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                Bonjour, <span className="text-indigo-600">{user?.first_name}</span>
              </h1>
              <p className="text-lg text-slate-500 mt-2 font-medium">Votre centre de pilotage juridique JurisAide est prêt.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/dossiers/nouveau" 
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Nouveau Dossier
              </Link>
            </div>
          </div>
        </motion.header>

        {/* Quick Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <StatCard 
            title="Dossiers Actifs" 
            value={stats.dossiers} 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
            color="indigo" 
          />
          <StatCard 
            title="Calculs Effectués" 
            value={stats.calculations} 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            color="blue" 
          />
          <StatCard 
            title="Documents PDF" 
            value={0} 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            color="violet" 
          />
          <StatCard 
            title="Efficacité IA" 
            value="98.4%" 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            color="emerald" 
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Activity Section */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 space-y-8"
          >
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Activités récentes</h2>
                <Link href="/dossiers" className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">Tout voir</Link>
              </div>
              
              <div className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-3xl" />)
                ) : recentDossiers.length > 0 ? (
                  recentDossiers.map((d: any) => (
                    <Link 
                      key={d.id} 
                      href={`/dossiers/${d.id}`} 
                      className="group flex items-center justify-between p-6 rounded-3xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:shadow-indigo-100 transition-all">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{d.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(d.created).toLocaleDateString('fr-FR')}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{d.client_name || 'Client Inconnu'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          d.status === 'ouvert' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {d.status}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold mb-4">Votre tableau de bord est encore calme.</p>
                    <Link href="/dossiers/nouveau" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Créer mon premier dossier</Link>
                  </div>
                )}
              </div>
            </section>
          </motion.div>

          {/* Right Column: Shortcuts & Mini Stats */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Quick Action Card */}
            <section className="relative p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-2xl font-black mb-3">Simulateur Rapide</h3>
                <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">Prêt pour un calcul express sans enregistrement ?</p>
                <Link 
                  href="/calculateur?simulate=true" 
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Calculer maintenant
                </Link>
              </div>
            </section>

            {/* Visual Analytics Mini-Card */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
              <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Tendances du mois</h3>
              <div className="space-y-6">
                <MiniProgressBar label="Licenciements" value={stats.licenciements} color="indigo" />
                <MiniProgressBar label="Démissions" value={stats.demissions} color="orange" />
                
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total ce mois</p>
                    <p className="text-xl font-black text-slate-900">{stats.calculations} Calculs</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: ReactNode, color: string }) {
  const colorMap: any = {
    indigo: 'bg-indigo-600 shadow-indigo-100',
    blue: 'bg-blue-600 shadow-blue-100',
    violet: 'bg-violet-600 shadow-violet-100',
    emerald: 'bg-emerald-600 shadow-emerald-100',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col"
    >
      <div className={`w-12 h-12 ${colorMap[color]} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        <h4 className="text-3xl font-black text-slate-900">{value}</h4>
      </div>
    </motion.div>
  );
}

function MiniProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
  const barColors: any = {
    indigo: 'bg-indigo-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-black text-slate-900">{value}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${barColors[color]} rounded-full`}
        />
      </div>
    </div>
  );
}
