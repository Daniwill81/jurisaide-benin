'use client';

import Navbar from '@/components/layout/navbar';
import { useState, useEffect, useCallback, ReactElement } from 'react';
import { apiFetch } from '@/lib/api';

type Document = {
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  recu_indemnites: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await apiFetch<Document[]>('/documents/');
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.id);
    try {
      const res = await apiFetch<{ url: string }>(`/documents/${doc.id}/download/`);
      window.open(res.url, '_blank');
    } catch (err) {
      // Fallback to stored URL
      window.open(doc.download_url, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Documents Générés</h1>
            <p className="text-slate-500 mt-2 font-medium">
              Téléchargez vos documents juridiques générés automatiquement.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white h-48 rounded-3xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-700 font-bold text-xl mb-2">Aucun document généré</p>
            <p className="text-slate-400 text-sm">
              Ouvrez un dossier et cliquez sur &quot;Générer le document&quot; pour créer votre premier PDF.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isDownloading={downloading === doc.id}
                onDownload={() => handleDownload(doc)}
              />
            ))}
          </div>
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
  doc: Document;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  const label = TYPE_LABELS[doc.document_type] || doc.document_type;
  const icon = TYPE_ICONS[doc.document_type];
  const isPink = doc.document_type === 'recu_indemnites';

  return (
    <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:border-indigo-100 transition-all overflow-hidden">
      {/* Color band */}
      <div className={`h-1.5 w-full ${isPink ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} />

      <div className="p-6">
        {/* Icon + type badge */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isPink ? 'bg-violet-50 text-violet-600' : 'bg-indigo-50 text-indigo-600'
          }`}>
            {icon}
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isPink ? 'text-violet-500' : 'text-indigo-500'}`}>
              {label}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {doc.dossier_id.slice(-8)}</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-4 min-h-[2.5rem]">
          {doc.title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(doc.generated_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </div>

        {/* Download button */}
        <button
          id={`download-${doc.id}`}
          onClick={onDownload}
          disabled={isDownloading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            isPink
              ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-100'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isDownloading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Chargement…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
