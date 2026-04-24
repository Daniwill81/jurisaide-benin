'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import Sidebar from './sidebar';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Calculateur', href: '/calculateur' },
        { name: 'Dossiers', href: '/dossiers' },
        { name: 'Jurisprudence', href: '/jurisprudence' },
        { name: 'Documents', href: '/documents' },
    ];

    return (
        <>
            <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">J</span>
                                </div>
                                <span className="text-xl font-extrabold tracking-tight text-slate-900 hidden sm:block">JurisAide</span>
                            </Link>

                            <div className="hidden lg:flex items-center space-x-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${pathname === link.href
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-bold text-slate-900 leading-none">{user.first_name} {user.last_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.role}</p>
                                    </div>
                                    <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        Déconnexion
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/auth/login" className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">Connexion</Link>
                                    <Link href="/auth/register" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">S'inscrire</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
    );
}
