'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api';

export default function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [dossier, setDossier] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const response = await apiFetch<any>(`/dossiers/${id}/`);
        setDossier(response);
        
        // Fetch documents for this dossier
        const docsResponse = await apiFetch<any[]>(`/documents/list?dossier_id=${id}`);
        setDocuments(docsResponse);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id]);

  const handleGenerateDocument = async (calcId: string, type: string) => {
    setGenerating(`${calcId}-${type}`);
    try {
      const doc = await apiFetch<any>('/documents/generer', {
        method: 'POST',
        body: JSON.stringify({
          type_doc: type,
          dossier_id: id,
          audit_id: calcId
        })
      });
      setDocuments([doc, ...documents]);
      alert('Document généré avec succès !');
    } catch (err) {
      console.error('Failed to generate document', err);
      alert('Erreur lors de la génération du document');
    } finally {
      setGenerating(null);
    }
  };

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
          calculation_requests: dossier.calculation_requests.map((c: any) => c.id)
        }),
      });
      setDossier({ ...dossier, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
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
          <div className="lg:col-span-2 space-y-8">
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

            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Description complète</h2>
              <p className="text-slate-600 leading-relaxed">{dossier.description || 'Aucune description fournie.'}</p>
            </section>

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
                    <div key={calc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => router.push(`/calculateur/${calc.id}`)}>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{calc.employee_name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Calculé le {new Date(calc.created).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-indigo-600">{calc.total?.toLocaleString() || 0} XOF</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{calc.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 border-t border-slate-200 pt-4">
                        <button 
                          disabled={generating === `${calc.id}-lettre_licenciement`}
                          onClick={() => handleGenerateDocument(calc.id, 'lettre_licenciement')}
                          className="flex-1 py-2 bg-white text-[10px] font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
                        >
                          {generating === `${calc.id}-lettre_licenciement` ? 'Génération...' : 'Lettre Licenciement'}
                        </button>
                        <button 
                          disabled={generating === `${calc.id}-recu_indemnite`}
                          onClick={() => handleGenerateDocument(calc.id, 'recu_indemnite')}
                          className="flex-1 py-2 bg-white text-[10px] font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
                        >
                          {generating === `${calc.id}-recu_indemnite` ? 'Génération...' : 'Reçu Indemnités'}
                        </button>
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

            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Documents générés</h2>
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc: any) => (
                    <a 
                      key={doc.id} 
                      href={doc.url_s3} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group"
                    >
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M13 13H8"/><path d="M13 17H8"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{doc.titre}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{new Date(doc.date_generation).toLocaleDateString()}</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">Aucun document généré pour le moment.</p>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-6">Informations Client</h2>
              <div className="space-y-4">
                <InfoRow label="Nom complet" value={dossier.client_name || "Non renseigné"} />
                <InfoRow label="Email" value={dossier.client_email || "Non renseigné"} />
                <InfoRow label="Téléphone" value={dossier.client_phone || "Non renseigné"} />
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">Timeline de l'affaire</h2>
              <div className="space-y-6 relative border-l-2 border-slate-100 ml-2 pl-6 py-2">
                <TimelineItem date={new Date(dossier.created).toLocaleDateString()} text="Ouverture du dossier" active />
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

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TimelineItem({ date, text, active }: { date: string, text: string, active?: boolean }) {
  return (
    <div className="relative">
      <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${active ? 'bg-indigo-600' : 'bg-slate-300'}`} />
      <p className="text-[10px] font-bold text-slate-400 mb-1">{date}</p>
      <p className="font-bold text-slate-700 text-sm">{text}</p>
    </div>
  );
}
