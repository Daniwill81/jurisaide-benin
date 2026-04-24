'use client';

import Navbar from '@/components/layout/navbar';
import { useState, useEffect, useCallback, ReactElement } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

type GeneratedDoc = {
  id: string;
  title: string;
  document_type: string;
  dossier_id: string;
  download_url: string;
  generated_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  lettre_licenciement: 'Lettre de Licenciement',
  recu_indemnites: "Reçu d'Indemnités",
};

const TYPE_ICONS: Record<string, ReactElement> = {
  lettre_licenciement: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  recu_indemnites: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<GeneratedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await apiFetch<GeneratedDoc[]>('/documents/');
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDownload = async (doc: GeneratedDoc) => {
    setDownloading(doc.id);
    try {
      const res = await apiFetch<{ url: string }>(`/documents/${doc.id}/download/`);
      window.open(res.url, '_blank');
    } catch (err) {
      window.open(doc.download_url, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] selection:bg-indigo-100 overflow-x-hidden">
      <Navbar />

      {/* Decorative Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[35%] h-[35%] bg-indigo-100/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] bg-violet-100/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <main className="max-w-7xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
        >
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Actes <span className="text-indigo-600">Juridiques</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl">Retrouvez l&apos;ensemble de vos documents générés et téléchargez vos originaux PDF certifiés.</p>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50">
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
            <span className="font-black text-slate-900">{documents.length} Documents</span>
          </div>
        </motion.header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white/50 backdrop-blur-sm h-64 rounded-[3rem] animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-slate-100"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Aucun document généré</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10">Ouvrez un dossier client pour générer vos premiers documents légaux.</p>
            <Link href="/dossiers" className="inline-flex items-center justify-center px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
              Aller aux dossiers
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isDownloading={downloading === doc.id}
                onDownload={() => handleDownload(doc)}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function DocumentCard({
  doc,
  isDownloading,
  onDownload,
}: {
  doc: GeneratedDoc;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  const label = TYPE_LABELS[doc.document_type] || doc.document_type;
  const icon = TYPE_ICONS[doc.document_type];
  const isPink = doc.document_type === 'recu_indemnites';

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100/40 hover:border-indigo-100 transition-all overflow-hidden"
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isPink ? 'bg-violet-600 text-white shadow-violet-100' : 'bg-indigo-600 text-white shadow-indigo-100'
            }`}>
            {icon}
          </div>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${isPink ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
            {label}
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-4 line-clamp-2 min-h-[3.5rem] leading-tight">
          {doc.title}
        </h3>

        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
            Généré le {new Date(doc.generated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <button
          onClick={onDownload}
          disabled={isDownloading}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl ${isPink
              ? 'bg-violet-600 text-white shadow-violet-100'
              : 'bg-slate-900 text-white shadow-slate-200 hover:bg-indigo-600'
            } disabled:opacity-50`}
        >
          {isDownloading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Chargement...
            </div>
          ) : (
            <>
              Télécharger PDF
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
