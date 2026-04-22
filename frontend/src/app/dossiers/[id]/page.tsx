'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api';

export default function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const response = await apiFetch<any>(`/dossiers/${id}/`);
        setDossier(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><div className="pt-32 text-center">Chargement...</div></div>;
  if (!dossier) return <div className="min-h-screen bg-slate-50"><Navbar /><div className="pt-32 text-center text-red-500 font-bold">Dossier introuvable</div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            {dossier.status}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{dossier.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
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
                    <div key={calc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={() => router.push(`/calculateur/${calc.id}`)}>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{calc.employee_name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Calculé le {new Date(calc.created_at).toLocaleDateString()}</p>
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
                <TimelineItem date={new Date(dossier.created_at).toLocaleDateString()} text="Ouverture du dossier" active />
              </div>
            </section>
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
