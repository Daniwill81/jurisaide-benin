'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/common/Logo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-violet-100/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Logo />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex items-center space-x-10"
            >
              <Link href="#features" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">Solutions</Link>
              <Link href="#ai-search" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">IA & Recherche</Link>
              <Link href="#documents" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">Documents</Link>
              <div className="h-6 w-px bg-slate-200"></div>
              <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">Connexion</Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-black rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
              >
                Essai Gratuit
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 mb-8">
                  La Justice Intelligence au Bénin
                </span>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95]">
                  Votre Assistant <br />
                  <span className="text-indigo-600">Juridique IA.</span>
                </h1>
                <p className="max-w-xl mx-auto lg:mx-0 text-xl text-slate-500 mb-12 leading-relaxed font-medium">
                  De la simulation d'indemnités à la recherche de jurisprudence automatisée. JurisAide modernise la gestion de vos dossiers juridiques.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                  <Link
                    href="/auth/register"
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 border border-transparent text-lg font-black rounded-[2rem] text-white bg-slate-900 hover:bg-indigo-600 shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    Démarrer maintenant
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                  <Link
                    href="/calculateur?simulate=true"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 border-2 border-slate-200 text-lg font-black rounded-[2rem] text-slate-700 bg-white hover:bg-slate-50 hover:border-indigo-200 transition-all active:scale-95 shadow-sm"
                  >
                    Simulateur Rapide
                  </Link>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 relative"
            >
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-100 rounded-3xl animate-float opacity-50"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-100 rounded-full animate-float animation-delay-2000 opacity-50"></div>
                
                {/* Visual Representation of IA + Calculation */}
                <div className="relative bg-white p-8 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 z-20 overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
                  <div className="space-y-6 relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <span className="font-black text-slate-900">Analyse IA en cours</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-2/3 animate-pulse"></div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Jurisprudence trouvée</p>
                        <p className="text-xs font-bold text-slate-700 line-clamp-2 italic">"Cour d'Appel de Cotonou, 2023 - Licenciement abusif..."</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <div className="text-2xl font-black text-slate-900">2.450.800 FCFA</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total des indemnités calculées</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <StatItem value="99%" label="Précision Juridique" />
            <StatItem value="500+" label="Cas de Jurisprudence" />
            <StatItem value="< 2s" label="Vitesse de Calcul" />
            <StatItem value="100%" label="Conforme Loi 2017" />
          </div>
        </div>
      </section>

      {/* AI & Jurisprudence Section */}
      <section id="ai-search" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 order-2 lg:order-1"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-600 rounded-[3rem] rotate-3 opacity-5 group-hover:rotate-6 transition-transform"></div>
                <div className="relative bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transform transition-all hover:scale-105 cursor-pointer ${i === 2 ? 'border-indigo-300 shadow-indigo-100' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">ARTICLE {i * 12 + 3}</span>
                          <span className="text-[10px] font-bold text-slate-400 italic">Score: 9{i}%</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">Analyse sémantique de la Loi 98-004 sur les conditions de rupture du contrat...</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-center">
                    <div className="px-6 py-2 bg-indigo-600 text-white text-xs font-black rounded-full animate-pulse">RECHERCHE IA ACTIVÉE</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="flex-1 order-1 lg:order-2">
              <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">Intelligence Artificielle</span>
              <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
                Trouvez des précédents <br /><span className="text-indigo-600 text-6xl">instantanément.</span>
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed mb-10 font-medium">
                Notre moteur RAG analyse des milliers de pages de jurisprudence et de textes de loi béninois pour vous fournir les citations exactes dont vous avez besoin pour vos conclusions.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                  Analyse sémantique des motifs de rupture
                </li>
                <li className="flex items-center gap-3 font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                  Suggestions automatiques d&apos;articles de loi
                </li>
                <li className="flex items-center gap-3 font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                  Base de données jurisprudentielle mise à jour
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Document Generation Section */}
      <section id="documents" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1">
              <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">Génération Automatisée</span>
              <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
                Documents légaux <br /><span className="text-indigo-600 text-6xl">prêts à l&apos;emploi.</span>
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed mb-10 font-medium">
                Générez vos lettres de licenciement, reçus pour solde de tout compte et contrats en un clic. Tous nos documents sont conformes aux standards juridiques du Bénin.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111 2.586V7a1 1 0 001 1h4.414a1 1 0 01.707 1.707l-6 6a1 1 0 01-1.414 0l-6-6A1 1 0 014 7V4z" /></svg>
                  PDF
                </div>
                <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111 2.586V7a1 1 0 001 1h4.414a1 1 0 01.707 1.707l-6 6a1 1 0 01-1.414 0l-6-6A1 1 0 014 7V4z" /></svg>
                  SIGNATURE ÉLEC.
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative"
            >
              <div className="bg-white p-2 rounded-[3rem] shadow-2xl border border-slate-200">
                <div className="bg-slate-900 rounded-[2.8rem] p-10 text-white min-h-[400px] flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 animate-bounce">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h4 className="text-2xl font-black mb-4">Génération Express</h4>
                  <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-8 font-medium">Votre Reçu pour Solde de Tout Compte est prêt à être téléchargé.</p>
                  <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                    Télécharger le PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-24">
            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Tout ce dont vous avez <br /><span className="text-indigo-600">besoin.</span></h2>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">Une suite d'outils complète pour les juristes et professionnels RH.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              title="Calcul Précis"
              description="Indemnités de licenciement, préavis et congés payés selon les lois 98-004 et 2017-05."
              icon={<svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            />
            <FeatureCard
              title="Intelligence Artificielle"
              description="Analyse automatique de vos dossiers et recherche intelligente de jurisprudence."
              icon={<svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
            <FeatureCard
              title="Gestion de Dossiers"
              description="Archivage sécurisé et suivi complet de l'historique de vos affaires juridiques."
              icon={<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>}
            />
          </div>
        </div>
      </section>

      {/* Quick Simulator CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-white/40 backdrop-blur-3xl border border-white/50 p-12 md:p-20 rounded-[4rem] shadow-2xl overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-bl-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">Besoin d&apos;une <br /><span className="text-indigo-600">simulation ?</span></h3>
                <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-md">
                  Calculez vos indemnités en quelques secondes sans créer de compte.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="/calculateur?simulate=true"
                  className="inline-flex items-center justify-center px-12 py-6 bg-indigo-600 text-white text-xl font-black rounded-3xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-12px_rgba(79,70,229,0.4)]"
                >
                  Calculer maintenant
                  <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-24 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black">J</div>
                <span className="text-xl font-black tracking-tight text-slate-900">JurisAide</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">La plateforme intelligente dédiée au droit du travail béninois pour les DRH, Avocats et Particuliers.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-20">
              <FooterColumn title="Produit" links={['Calculateur', 'IA & Recherche', 'Documents']} />
              <FooterColumn title="Légal" links={['Mentions Légales', 'Confidentialité', 'Conditions']} />
              <FooterColumn title="Contact" links={['Support', 'Ventes', 'Partenariats']} />
            </div>
          </div>
          <div className="pt-10 border-t border-slate-200 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">&copy; 2026 JurisAide Bénin. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500"
    >
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div>
      <div className="text-4xl lg:text-6xl font-black text-white mb-2">{value}</div>
      <div className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">{label}</div>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string, links: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">{title}</h4>
      <ul className="space-y-4">
        {links.map(link => (
          <li key={link}>
            <Link href="#" className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">{link}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
