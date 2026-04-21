'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/navbar';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function NewDossierPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'ouvert',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch('/dossiers/', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            router.push('/dossiers');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-2xl mx-auto pt-24 pb-12 px-4">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Nouveau dossier</h1>
                    <p className="text-slate-500 mb-8">Commencez un nouveau dossier pour regrouper vos calculs et informations.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Titre du dossier</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                placeholder="ex: Licenciement Jean Dupont"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Notes</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[120px]"
                                placeholder="Détails supplémentaires sur l'affaire..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => router.back()} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">Annuler</button>
                            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                {loading ? 'Création...' : 'Créer le dossier'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
