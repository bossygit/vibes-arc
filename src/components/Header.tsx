import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { Trophy, User, ChevronDown, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
    const { view, setView, gamification } = useAppStore();

    const navItems = [
        { key: 'dashboard', label: 'Tableau de bord' },
        { key: 'priming', label: 'Priming' },
        { key: 'environment', label: 'Environnement' },
        { key: 'identities', label: 'Identites' },
        { key: 'addHabit', label: 'Ajouter Habitude' },
        { key: 'templates', label: 'Templates' },
        { key: 'rewards', label: 'Recompenses' },
        { key: 'magicGratitude', label: 'Gratitude' },
        { key: 'moneyMindset', label: 'Abondance' },
        { key: 'focusWheel', label: 'Focus Wheel' },
    ] as const;

    const [open, setOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const supabase = SupabaseDatabaseClient.getInstance();
                const user = await supabase.getCurrentUser();
                setUserEmail(user?.email ?? null);
            } catch {
                setUserEmail(null);
            }
        })();
    }, []);

    // Fermer le menu mobile quand on navigue
    const handleMobileNav = (key: typeof navItems[number]['key']) => {
        setView(key);
        setMobileMenuOpen(false);
    };

    return (
        <>
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gradient">
                                Vibes Arc
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Deviens qui tu veux etre</p>
                        </div>

                        {/* Desktop nav -- masquee sur mobile */}
                        <div className="hidden lg:flex items-center gap-3">
                            <nav className="flex gap-1 xl:gap-2 flex-wrap">
                                {navItems.map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setView(item.key)}
                                        className={`px-3 py-1.5 xl:px-4 xl:py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${view === item.key
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-white'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </nav>

                            {/* User menu desktop */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setOpen((v) => !v)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                    aria-haspopup="menu"
                                    aria-expanded={open}
                                >
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                                </button>
                                {open && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-40">
                                        <div className="px-3 py-2 text-sm text-slate-500">Mon compte</div>
                                        {userEmail && (
                                            <div className="px-3 pb-2 text-xs text-slate-500 break-all">{userEmail}</div>
                                        )}
                                        <div className="px-3 py-2 flex items-center gap-2 rounded hover:bg-slate-50">
                                            <div className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold flex items-center gap-2">
                                                <Trophy className="w-4 h-4" />
                                                <span>{gamification.points} pts</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const supabase = SupabaseDatabaseClient.getInstance();
                                                    await supabase.signOut();
                                                } finally {
                                                    window.location.reload();
                                                }
                                            }}
                                            className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-slate-700"
                                        >
                                            Se deconnecter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile : boutons hamburger + user */}
                        <div className="flex items-center gap-2 lg:hidden">
                            {/* Points (compact) */}
                            <div className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5" />
                                <span>{gamification.points}</span>
                            </div>

                            {/* Bouton hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen((v) => !v)}
                                className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                aria-label="Menu"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Overlay mobile menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-20 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute top-0 right-0 w-full max-w-xs h-full bg-white shadow-xl overflow-y-auto">
                        {/* Header du panneau */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-gradient">Menu</h2>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-100"
                                aria-label="Fermer"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex flex-col p-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => handleMobileNav(item.key)}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition text-sm ${view === item.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* User info + deconnexion */}
                        <div className="border-t border-slate-200 p-4 mt-2">
                            {userEmail && (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs text-slate-500 break-all">{userEmail}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-sm flex items-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    <span>{gamification.points} pts</span>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const supabase = SupabaseDatabaseClient.getInstance();
                                        await supabase.signOut();
                                    } finally {
                                        window.location.reload();
                                    }
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium transition"
                            >
                                Se deconnecter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
