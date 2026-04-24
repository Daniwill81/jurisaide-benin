'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

type GeneratedDoc = {
  id: string;
  title: string;
  document_type: string;
  download_url: string;
  generated_at: string;
};

const DOC_TYPES = [
  { key: 'lettre_licenciement', label: 'Lettre de Licenciement' },
  { key: 'recu_indemnites', label: "Reçu d'Indemnités" },
];

export default function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<GeneratedDoc[]>([]);
  const [selectedType, setSelectedType] = useState('lettre_licenciement');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const fetchDossier = useCallback(async () => {
    try {
      const response = await apiFetch<any>(`/dossiers/${id}/`);
      setDossier(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await apiFetch<GeneratedDoc[]>(`/documents/?dossier_id=${id}`);
      setDocs(data || []);
    } catch {
      // Non-blocking
    }
  }, [id]);

  useEffect(() => {
    fetchDossier();
    fetchDocs();
  }, [fetchDossier, fetchDocs]);

  const handleStatusChange = async () => {
    const newStatus = dossier.status === 'ouvert' ? 'fermé' : 'ouvert';
    try {
      await apiFetch(`/dossiers/${id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          title: dossier.title,
          description: dossier.description,
          status: newStatus,
          client_name: dossier.client_name,
          client_email: dossier.client_email,
          client_phone: dossier.client_phone,
          calculation_requests: dossier.calculation_requests.map((c: any) => c.id),
        }),
      });
      setDossier({ ...dossier, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const doc = await apiFetch<GeneratedDoc>('/documents/generer', {
        method: 'POST',
        body: JSON.stringify({ dossier_id: id, document_type: selectedType }),
      });
      setDocs((prev) => [doc, ...prev]);
    } catch (err: any) {
      setGenError(err.message || 'Erreur lors de la génération.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (doc: GeneratedDoc) => {
    setDownloading(doc.id);
    try {
      const res = await apiFetch<{ url: string }>(`/documents/${doc.id}/download/`);
      window.open(res.url, '_blank');
    } catch {
      window.open(doc.download_url, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fafbfc]"><Navbar /><div className="pt-40 flex justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div></div>;
  if (!dossier) return <div className="min-h-screen bg-[#fafbfc]"><Navbar /><div className="pt-40 text-center text-red-500 font-black text-2xl">Dossier introuvable</div></div>;

  return (
    <div className="min-h-screen bg-[#fafbfc] selection:bg-indigo-100 overflow-x-hidden">
      <Navbar />

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      <main className="max-w-7xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              dossier.status === 'ouvert' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-slate-400 shadow-slate-100'
            }`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                  dossier.status === 'ouvert' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {dossier.status}
                </span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {dossier.id.slice(-8)}</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{dossier.title}</h1>
            </div>
          </div>
          <button
            onClick={handleStatusChange}
            className={`px-8 py-4 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-2xl ${
              dossier.status === 'ouvert'
                ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {dossier.status === 'ouvert' ? 'Clôturer ce dossier' : 'Réouvrir le dossier'}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* AI Intelligence Card */}
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-100/50 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-bl-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Intelligence IA</h2>
                  </div>
                  {dossier.classification && (
                    <span className="px-4 py-1 bg-white/10 backdrop-blur-md text-indigo-300 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                      {dossier.classification}
                    </span>
                  )}
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                  <p className="text-indigo-100/90 leading-relaxed font-medium italic text-lg">
                    {dossier.summary || 'Analyse en cours par notre moteur IA...'}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Calculations Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Historique des calculs</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Tous les scenarios d&apos;indemnisation.</p>
                </div>
                <button
                  onClick={() => router.push(`/calculateur?dossierId=${id}`)}
                  className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              {dossier.calculation_requests?.length > 0 ? (
                <div className="space-y-4">
                  {dossier.calculation_requests.map((calc: any) => (
                    <motion.div
                      whileHover={{ x: 10 }}
                      key={calc.id}
                      className="flex items-center justify-between p-6 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/30 transition-all cursor-pointer group"
                      onClick={() => router.push(`/calculateur/${calc.id}`)}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{calc.employee_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Calculé le {new Date(calc.created).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div>
                          <p className="text-lg font-black text-slate-900">{calc.total?.toLocaleString() || 0} <span className="text-xs">XOF</span></p>
                          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{calc.category}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold italic">Aucun calcul n&apos;est lié à ce dossier.</p>
                </div>
              )}
            </motion.section>

            {/* Documents Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Documents PDF</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Actes officiels générés pour le dossier.</p>
                </div>
              </div>

              {/* Enhanced Generator */}
              <div className="bg-slate-50/50 p-8 rounded-[2.5rem] mb-10 border border-slate-100/50">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full pl-6 pr-12 py-4 bg-white border border-slate-200 rounded-[1.5rem] font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none transition-all shadow-sm"
                    >
                      {DOC_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 text-white font-black rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {generating ? <span className="animate-pulse">Génération...</span> : 'Générer le PDF'}
                    {!generating && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  </button>
                </div>
                {genError && <p className="mt-4 text-xs font-bold text-red-500 ml-2">⚠️ {genError}</p>}
              </div>

              {docs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {docs.map((doc) => (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      key={doc.id}
                      className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{doc.title}</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(doc.generated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloading === doc.id}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        {downloading === doc.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50/30 rounded-[2.5rem] border border-slate-100 border-dashed">
                  <p className="text-slate-400 font-bold italic">Aucun document n&apos;a été généré.</p>
                </div>
              )}
            </motion.section>
          </div>

          {/* Sidebar Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-10"
          >
            {/* Client Card */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Détails Client
              </h3>
              <div className="space-y-6">
                <SideInfoRow label="Nom de l'employé" value={dossier.client_name || 'Non renseigné'} icon="👤" />
                <SideInfoRow label="Email direct" value={dossier.client_email || 'Non renseigné'} icon="📧" />
                <SideInfoRow label="Ligne directe" value={dossier.client_phone || 'Non renseigné'} icon="📞" />
              </div>
            </section>

            {/* Jurisprudence Section */}
            {dossier.similar_cases?.length > 0 && (
              <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  Cas Similaires
                </h3>
                <div className="space-y-4">
                  {dossier.similar_cases.map((case_item: any, idx: number) => (
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      key={idx} 
                      className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all shadow-sm group"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-black text-slate-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">{case_item.title}</p>
                        <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">
                          {Math.round(case_item.score * 100)}% Match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic leading-relaxed">{case_item.summary}</p>
                    </motion.div>
                  ))}
                </div>
                <Link
                  href="/jurisprudence"
                  className="w-full mt-8 py-4 bg-slate-50 text-slate-600 text-xs font-black rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 flex items-center justify-center gap-2"
                >
                  Explorer la base →
                </Link>
              </section>
            )}

            {/* Mini Timeline */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50">
              <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                Chronologie
              </h3>
              <div className="space-y-8 relative border-l-2 border-slate-50 ml-3 pl-8 py-2">
                <TimelineStep 
                  date={new Date(dossier.created).toLocaleDateString()} 
                  text="Ouverture" 
                  active 
                />
                {docs.length > 0 && (
                  <TimelineStep
                    date={new Date(docs[0].generated_at).toLocaleDateString()}
                    text="Génération Docs"
                  />
                )}
                <div className="absolute top-0 bottom-0 -left-[2px] w-[2px] bg-indigo-100 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 2 }}
                    className="w-full bg-indigo-600"
                   />
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function SideInfoRow({ label, value, icon }: { label: string; value: string, icon: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function TimelineStep({ date, text, active }: { date: string; text: string; active?: boolean }) {
  return (
    <div className="relative">
      <div className={`absolute -left-[39px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${active ? 'bg-indigo-600' : 'bg-slate-300'}`} />
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{date}</p>
      <p className="font-black text-slate-700 text-sm">{text}</p>
    </div>
  );
}
