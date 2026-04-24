'use client';

import { useState, Suspense, useEffect, FormEvent } from 'react';
import Navbar from '@/components/layout/navbar';
import { useCalculateur } from '@/hooks/useCalculateur';
import { useDossier } from '@/hooks/useDossier';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { WorkerCategory, ContractType, TerminationReason } from '@/types/calcul';
import { motion, AnimatePresence } from 'framer-motion';

export default function CalculateurPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
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
  const isSimulate = searchParams.get('simulate') === 'true';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await calculate(formData, isSimulate);
    nextStep();
  };

  const handleSaveDossier = async () => {
    if (!result) return;

    if (dossierId) {
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
    <div className="min-h-screen bg-[#fafbfc] selection:bg-indigo-100 overflow-hidden">
      <Navbar />

      {/* Decorative Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      <main className="max-w-4xl mx-auto pt-32 pb-12 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-14 border border-white/50"
        >
          {/* Enhanced Stepper */}
          <div className="flex items-center justify-center gap-12 mb-16">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all duration-500 transform ${
                  step >= s 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110' 
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  {s === 1 && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  {s === 2 && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  {s === 3 && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-3 transition-colors ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {s === 1 ? 'Profil' : s === 2 ? 'Contrat' : 'Résultat'}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Profil Salarié</h1>
                  <p className="text-slate-500 font-medium">Identifiez l'employé et fixez la période d'activité au Bénin.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputGroup 
                    label="Nom complet" 
                    placeholder="ex: Marc SOSSOU" 
                    value={formData.employee_name} 
                    onChange={v => setFormData({ ...formData, employee_name: v })} 
                  />
                  <InputGroup 
                    label="Email (Optionnel)" 
                    type="email"
                    placeholder="m.sossou@email.bj" 
                    value={formData.employee_email} 
                    onChange={v => setFormData({ ...formData, employee_email: v })} 
                  />
                  <InputGroup 
                    label="Téléphone" 
                    type="tel"
                    placeholder="+229 00 00 00 00" 
                    value={formData.employee_phone} 
                    onChange={v => setFormData({ ...formData, employee_phone: v })} 
                  />
                  <div className="hidden md:block"></div>
                  
                  <InputGroup 
                    label="Date de début" 
                    type="date"
                    value={formData.start_date} 
                    onChange={v => setFormData({ ...formData, start_date: v })} 
                  />
                  <InputGroup 
                    label="Date de fin" 
                    type="date"
                    value={formData.end_date} 
                    onChange={v => setFormData({ ...formData, end_date: v })} 
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={nextStep} 
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Suivant
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Conditions Contractuelles</h1>
                  <p className="text-slate-500 font-medium">Précisez les modalités de rupture et le salaire de référence.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <InputGroup 
                      label="Salaire moyen mensuel (FCFA)" 
                      type="number"
                      placeholder="0" 
                      value={formData.avg_salary} 
                      onChange={v => setFormData({ ...formData, avg_salary: Number(v) })} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                    <select
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as WorkerCategory })}
                    >
                      <option value={WorkerCategory.OUVRIER}>Ouvrier</option>
                      <option value={WorkerCategory.EMPLOYE}>Employé</option>
                      <option value={WorkerCategory.AGENT_MAITRISE}>Agent de Maîtrise</option>
                      <option value={WorkerCategory.CADRE}>Cadre</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Motif de rupture</label>
                    <select
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none"
                      value={formData.termination_reason}
                      onChange={e => setFormData({ ...formData, termination_reason: e.target.value as TerminationReason })}
                    >
                      <option value={TerminationReason.LICENCIEMENT}>Licenciement</option>
                      <option value={TerminationReason.DEMISSION}>Démission</option>
                      <option value={TerminationReason.RUPTURE_NEGOCIEE}>Rupture Négociée</option>
                      <option value={TerminationReason.FIN_CONTRAT}>Fin de Contrat</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <InputGroup 
                      label="Jours de congés restants" 
                      type="number"
                      placeholder="0" 
                      value={formData.remaining_leave_days} 
                      onChange={v => setFormData({ ...formData, remaining_leave_days: Number(v) })} 
                    />
                  </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <button onClick={prevStep} className="flex-1 py-5 bg-slate-100 text-slate-700 rounded-[2rem] font-black hover:bg-slate-200 transition-all">Retour</button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="flex-[2] py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Calcul en cours...
                      </span>
                    ) : 'Générer le résultat'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && result && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10"
              >
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                    className="w-24 h-24 bg-green-50 text-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100 border-4 border-white"
                  >
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </motion.div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Total Indemnités</h1>
                  <p className="text-6xl font-black text-indigo-600 tracking-tighter drop-shadow-sm">
                    {result.total.toLocaleString()} <span className="text-2xl font-bold ml-1">XOF</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ResultCard label="Licenciement" value={result.severance_pay} article={result.articles.severance} icon="⚖️" />
                  <ResultCard label="Préavis" value={result.notice_period_pay} article={result.articles.notice} icon="⌛" />
                  <ResultCard label="Congés" value={result.leave_pay} article={result.articles.leave} icon="🏖️" />
                </div>

                <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  </div>
                  <h3 className="text-lg font-black text-indigo-900 mb-2">Base Légale</h3>
                  <p className="text-indigo-700/80 font-medium leading-relaxed italic">
                    Ces calculs ont été effectués conformément à la <span className="font-black underline decoration-indigo-300">{result.articles.legal_basis}</span>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => { reset(); setStep(1); }} 
                    className="flex-1 py-5 bg-slate-50 text-slate-700 rounded-[2rem] font-black hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    Nouveau calcul
                  </button>
                  {!isSimulate && (
                    <button
                      onClick={handleSaveDossier}
                      disabled={dossierLoading}
                      className="flex-[1.5] py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50"
                    >
                      {dossierLoading ? 'Sauvegarde...' : 'Sauvegarder au dossier'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Modern Dossier Modal */}
      <AnimatePresence>
        {showDossierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setShowDossierModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-lg w-full relative z-10 border border-slate-100"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-2">Prêt à archiver ?</h2>
              <p className="text-slate-500 font-medium mb-10">Donnez un nom à ce dossier pour le retrouver facilement.</p>

              <div className="space-y-6">
                <InputGroup 
                  label="Titre du dossier" 
                  value={clientInfo.title} 
                  onChange={v => setClientInfo({ ...clientInfo, title: v })} 
                />
                <div className="grid grid-cols-2 gap-6">
                  <InputGroup 
                    label="Client" 
                    value={clientInfo.client_name} 
                    onChange={v => setClientInfo({ ...clientInfo, client_name: v })} 
                  />
                  <InputGroup 
                    label="Téléphone" 
                    value={clientInfo.client_phone} 
                    onChange={v => setClientInfo({ ...clientInfo, client_phone: v })} 
                  />
                </div>
                <InputGroup 
                  label="Email de contact" 
                  type="email"
                  value={clientInfo.client_email} 
                  onChange={v => setClientInfo({ ...clientInfo, client_email: v })} 
                />
              </div>

              <div className="flex gap-4 mt-12">
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="flex-1 py-5 bg-slate-50 text-slate-700 rounded-[2rem] font-black hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmCreateDossier}
                  disabled={dossierLoading}
                  className="flex-[2] py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200"
                >
                  {dossierLoading ? 'Création...' : 'Valider & Créer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputGroup({ label, placeholder, value, onChange, type = "text" }: { label: string, placeholder?: string, value: any, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function ResultCard({ label, value, article, icon }: { label: string, value: number, article?: string, icon: string }) {
  return (
    <div className="bg-slate-50/80 p-8 rounded-[2rem] border border-slate-100/50 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
      <span className="text-3xl mb-4 transform group-hover:scale-125 transition-transform">{icon}</span>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-black text-slate-900 mb-4">{value.toLocaleString()} <span className="text-xs font-normal">XOF</span></p>
      {article && (
        <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm">
          {article}
        </span>
      )}
    </div>
  );
}
