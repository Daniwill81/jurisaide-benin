'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api';

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M13 13H8"/><path d="M13 17H8"/></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
);

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await apiFetch<any[]>('/documents/list');
        setDocuments(response);
      } catch (err) {
        console.error('Failed to fetch documents', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mes Documents</h1>
          <p className="mt-2 text-slate-600">Gérez et téléchargez vos documents légaux générés.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <FileIcon />
                  </div>
                  <a 
                    href={doc.url_s3} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <DownloadIcon />
                  </a>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{doc.titre}</h3>
                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarIcon />
                        <span>{new Date(doc.date_generation).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FolderIcon />
                        <span>Type: {doc.type_document.replace('_', ' ')}</span>
                    </div>
                </div>

                <a 
                  href={doc.url_s3} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full py-3 text-center bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-slate-900 hover:text-white transition-all"
                >
                  Télécharger PDF
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-400 mb-4">
                <FileIcon />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun document généré</h3>
            <p className="text-slate-500">Générez des documents depuis vos dossiers pour les voir apparaître ici.</p>
          </div>
        )}
      </main>
    </div>
  );
}
