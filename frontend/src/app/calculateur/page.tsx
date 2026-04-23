'use client';

import { useState, Suspense, useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import { useCalculateur } from '@/hooks/useCalculateur';
import { useDossier } from '@/hooks/useDossier';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { WorkerCategory, ContractType, TerminationReason } from '@/types/calcul';

export default function CalculateurPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CalculateurContent />
    </Suspense>
  );
}

function CalculateurContent() {
  const [step, setStep] = useState(1);
  const { calculate, result, loading, reset } = useCalculateur();
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_email: '',
    employee_phone: '',
    start_date: '',
    end_date: '',
    avg_salary: 0,
    category: WorkerCategory.OUVRIER,
    contract_type: ContractType.CDI,
    termination_reason: TerminationReason.LICENCIEMENT,
    remaining_leave_days: 0,
  });

  const { createDossier, loading: dossierLoading } = useDossier();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierId = searchParams.get('dossierId');

  const [showDossierModal, setShowDossierModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    title: '',
    description: '',
    client_name: '',
    client_email: '',
    client_phone: '',
  });

  useEffect(() => {
    if (dossierId) {
      const fetchDossier = async () => {
        try {
          const d = await apiFetch<any>(`/dossiers/${dossierId}/`);
          setFormData(prev => ({ 
            ...prev, 
            employee_name: d.client_name || '',
            employee_email: d.client_email || '',
            employee_phone: d.client_phone || ''
          }));
          setClientInfo({
            title: d.title,
            description: d.description,
            client_name: d.client_name,
            client_email: d.client_email,
            client_phone: d.client_phone,
          });
        } catch (err) {
          console.error('Failed to fetch dossier for auto-fill', err);
        }
      };
      fetchDossier();
    }
  }, [dossierId]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await calculate(formData);
    nextStep();
  };

  const handleSaveDossier = async () => {
    if (!result) return;

    if (dossierId) {
      // Link to existing dossier directly
      try {
        const currentDossier = await apiFetch<any>(`/dossiers/${dossierId}/`);
        const existingIds = currentDossier.calculation_requests?.map((c: any) => c.id) || [];

        await apiFetch(`/dossiers/${dossierId}/`, {
          method: 'PUT',
          body: JSON.stringify({
            title: clientInfo.title,
            description: clientInfo.description,
            client_name: formData.employee_name || clientInfo.client_name,
            client_email: formData.employee_email || clientInfo.client_email,
            client_phone: formData.employee_phone || clientInfo.client_phone,
            status: currentDossier.status,
            calculation_requests: [...existingIds, result.id]
          }),
        });
        router.push(`/dossiers/${dossierId}`);
      } catch (err) {
        console.error('Failed to link calculation to dossier', err);
      }
    } else {
      // Open modal to create new dossier
      setClientInfo({
        title: `Dossier - ${formData.employee_name}`,
        description: `Calcul d'indemnités effectué le ${new Date().toLocaleDateString('fr-FR')}`,
        client_name: formData.employee_name,
        client_email: formData.employee_email,
        client_phone: formData.employee_phone,
      });
      setShowDossierModal(true);
    }
  };

  const confirmCreateDossier = async () => {
    if (!result) return;
    try {
      const dossier = await createDossier({
        ...clientInfo,
        calculation_requests: [result.id]
      });
      router.push(`/dossiers/${dossier.id}`);
    } catch (err) {
      console.error('Failed to create dossier', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-24 pb-12 px-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-4 rounded ${step > s ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Informations de base</h1>
              <p className="text-slate-500 mb-8">Commençons par identifier l'employé et la période de travail.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nom de l'employé</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="ex: Jean Dupont"
                    value={formData.employee_name}
                    onChange={e => setFormData({ ...formData, employee_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email de l'employé</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="ex: jean.dupont@email.com"
                    value={formData.employee_email}
                    onChange={e => setFormData({ ...formData, employee_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone de l'employé</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="ex: +229 00 00 00 00"
                    value={formData.employee_phone}
                    onChange={e => setFormData({ ...formData, employee_phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date de début</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date de fin</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <button onClick={nextStep} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  Continuer
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Détails du contrat</h1>
              <p className="text-slate-500 mb-8">Précisez les conditions financières et le statut de l'employé.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Salaire mensuel moyen (XOF)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    value={formData.avg_salary}
                    onChange={e => setFormData({ ...formData, avg_salary: Number(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Catégorie</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as WorkerCategory })}
                    >
                      <option value={WorkerCategory.OUVRIER}>Ouvrier</option>
                      <option value={WorkerCategory.EMPLOYE}>Employé</option>
                      <option value={WorkerCategory.AGENT_MAITRISE}>Agent de Maîtrise</option>
                      <option value={WorkerCategory.CADRE}>Cadre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Jours de congés restants</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.remaining_leave_days}
                      onChange={e => setFormData({ ...formData, remaining_leave_days: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">Retour</button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    {loading ? 'Calcul en cours...' : 'Générer le résultat'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-green-100 text-green-600 border-4 border-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900">Total à payer</h1>
                <p className="text-5xl font-black text-indigo-600 mt-2">{result.total.toLocaleString()} <span className="text-2xl">XOF</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <ResultItem label="Indemnité Licenciement" value={result.severance_pay} article={result.articles.severance} />
                <ResultItem label="Indemnité Préavis" value={result.notice_period_pay} article={result.articles.notice} />
                <ResultItem label="Congés Payés" value={result.leave_pay} article={result.articles.leave} />
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Références légales
                </h3>
                <p className="text-sm text-indigo-700 italic">Ces calculs sont basés sur la {result.articles.legal_basis}.</p>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { reset(); setStep(1); }} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">Nouveau calcul</button>
                <button
                  onClick={handleSaveDossier}
                  disabled={dossierLoading}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {dossierLoading ? 'Enregistrement...' : 'Sauvegarder le dossier'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dossier Creation Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Finaliser le dossier</h2>
            <p className="text-slate-500 mb-6">Complétez les informations pour créer le dossier juridique.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Titre du dossier</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={clientInfo.title}
                  onChange={e => setClientInfo({ ...clientInfo, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nom du Client</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={clientInfo.client_name}
                    onChange={e => setClientInfo({ ...clientInfo, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Téléphone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={clientInfo.client_phone}
                    onChange={e => setClientInfo({ ...clientInfo, client_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email du Client</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={clientInfo.client_email}
                  onChange={e => setClientInfo({ ...clientInfo, client_email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowDossierModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmCreateDossier}
                disabled={dossierLoading}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {dossierLoading ? 'Création...' : 'Créer le dossier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultItem({ label, value, article }: { label: string, value: number, article?: string }) {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-extrabold text-slate-900">{value.toLocaleString()} <span className="text-sm font-normal text-slate-500">XOF</span></p>
      {article && <p className="mt-2 text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded inline-block font-mono tracking-tighter">{article}</p>}
    </div>
  );
}
