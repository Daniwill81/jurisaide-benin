'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api';

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

  if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><div className="pt-32 text-center">Chargement...</div></div>;
  if (!dossier) return <div className="min-h-screen bg-slate-50"><Navbar /><div className="pt-32 text-center text-red-500 font-bold">Dossier introuvable</div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              dossier.status === 'ouvert' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {dossier.status}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{dossier.title}</h1>
          </div>
          <button
            onClick={handleStatusChange}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              dossier.status === 'ouvert'
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            }`}
          >
            {dossier.status === 'ouvert' ? 'Clôturer le dossier' : 'Réouvrir le dossier'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">

            {/* AI Summary */}
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Résumé IA</h2>
                {dossier.classification && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                    {dossier.classification}
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-4">
                {dossier.summary || 'Résumé en cours de génération...'}
              </p>
            </section>

            {/* Description */}
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Description complète</h2>
              <p className="text-slate-600 leading-relaxed">{dossier.description || 'Aucune description fournie.'}</p>
            </section>

            {/* Calculations */}
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Historique des calculs</h2>
                <button
                  onClick={() => router.push(`/calculateur?dossierId=${id}`)}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                >
                  + Ajouter
                </button>
              </div>

              {dossier.calculation_requests?.length > 0 ? (
                <div className="space-y-4">
                  {dossier.calculation_requests.map((calc: any) => (
                    <div
                      key={calc.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer"
                      onClick={() => router.push(`/calculateur/${calc.id}`)}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{calc.employee_name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Calculé le {new Date(calc.created).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-indigo-600">{calc.total?.toLocaleString() || 0} XOF</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{calc.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">Aucun calcul lié à ce dossier pour le moment.</p>
                </div>
              )}
            </section>

            {/* ── Document Generation Panel ──────────────────────── */}
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Documents Légaux</h2>
                  <p className="text-sm text-slate-400 mt-1">Générez et téléchargez vos documents PDF officiels.</p>
                </div>
                <Link
                  href="/documents"
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  Voir tous →
                </Link>
              </div>

              {/* Generator row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                  id="doc-type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
                <button
                  id="generate-doc-btn"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {generating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Génération...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Générer le document
                    </>
                  )}
                </button>
              </div>

              {genError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
                  {genError}
                </div>
              )}

              {/* Generated docs list */}
              {docs.length > 0 ? (
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{doc.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(doc.generated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloading === doc.id}
                        className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {downloading === doc.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        PDF
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-medium italic">
                    Aucun document généré pour ce dossier.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-6">Informations Client</h2>
              <div className="space-y-4">
                <InfoRow label="Nom complet" value={dossier.client_name || 'Non renseigné'} />
                <InfoRow label="Email" value={dossier.client_email || 'Non renseigné'} />
                <InfoRow label="Téléphone" value={dossier.client_phone || 'Non renseigné'} />
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">Timeline de l&apos;affaire</h2>
              <div className="space-y-6 relative border-l-2 border-slate-100 ml-2 pl-6 py-2">
                <TimelineItem date={new Date(dossier.created).toLocaleDateString()} text="Ouverture du dossier" active />
                {docs.length > 0 && (
                  <TimelineItem
                    date={new Date(docs[0].generated_at).toLocaleDateString()}
                    text={`${docs.length} document(s) généré(s)`}
                  />
                )}
              </div>
            </section>

            {dossier.similar_cases?.length > 0 && (
              <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4">Cas Similaires</h2>
                <div className="space-y-4">
                  {dossier.similar_cases.map((case_item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate pr-2">{case_item.title}</p>
                        <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {Math.round(case_item.score * 100)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{case_item.summary}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/jurisprudence')}
                  className="w-full mt-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all"
                >
                  Voir toute la jurisprudence
                </button>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TimelineItem({ date, text, active }: { date: string; text: string; active?: boolean }) {
  return (
    <div className="relative">
      <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${active ? 'bg-indigo-600' : 'bg-slate-300'}`} />
      <p className="text-[10px] font-bold text-slate-400 mb-1">{date}</p>
      <p className="font-bold text-slate-700 text-sm">{text}</p>
    </div>
  );
}

