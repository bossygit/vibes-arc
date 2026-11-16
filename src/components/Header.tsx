import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { ChevronDown, Menu, Orbit, Trophy, User, X } from 'lucide-react';
import { ARC_STAGES, ArcStage, getStageForView, getStageGroups } from '@/config/arc';
import type { ViewType } from '@/types';

/**
 * Navigation organisée autour de l'arc : Mon Arc + les 4 étapes.
 * Les modules ne sont plus une liste à plat : chacun vit dans le menu de son étape.
 */

const StageMenu: React.FC<{ stage: ArcStage; view: ViewType; onNavigate: (v: ViewType) => void }> = ({ stage, view, onNavigate }) => (
    <div className={`absolute ${stage.step >= 3 ? 'right-0' : 'left-0'} top-full mt-2 w-72 max-h-[75vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-medium p-2 z-50`}>
        <button
            onClick={() => onNavigate(stage.hub)}
            className={`w-full text-left px-3 py-2 rounded-lg ${stage.theme.hover}`}
        >
            <span className={`block text-xs font-bold uppercase tracking-wider ${stage.theme.text}`}>Étape {stage.step} · {stage.label}</span>
            <span className="block text-sm text-slate-700">{stage.question}</span>
        </button>
        {getStageGroups(stage.key).map(({ group, modules }) => (
            <div key={group} className="mt-1 pt-1 border-t border-slate-100">
                <p className="px-3 pt-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group}</p>
                {modules.map((m) => (
                    <button
                        key={m.view}
                        onClick={() => onNavigate(m.view)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${view === m.view ? `${stage.theme.soft} ${stage.theme.text} font-medium` : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                        <span aria-hidden>{m.emoji}</span>
                        {m.label}
                        {m.isNew && <span className={`ml-auto text-[10px] font-bold uppercase ${stage.theme.text}`}>Nouveau</span>}
                    </button>
                ))}
            </div>
        ))}
    </div>
);

const Header: React.FC = () => {
    const { view, setView, gamification } = useAppStore();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [openStage, setOpenStage] = useState<ArcStage['key'] | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<ArcStage['key'] | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);

    const currentStage = getStageForView(view);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenStage(null);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpenStage(null);
                setUserMenuOpen(false);
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('click', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onKey);
        };
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

    // À l'ouverture du menu mobile, l'étape courante est dépliée
    useEffect(() => {
        if (mobileMenuOpen) setMobileExpanded(currentStage?.key ?? null);
    }, [mobileMenuOpen, currentStage?.key]);

    const handleNav = (key: ViewType) => {
        setView(key);
        setOpenStage(null);
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
        window.scrollTo({ top: 0 });
    };

    const signOut = async () => {
        try {
            await SupabaseDatabaseClient.getInstance().signOut();
        } finally {
            window.location.reload();
        }
    };

    return (
        <>
            <header className="bg-white/85 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <button onClick={() => handleNav('arc')} className="flex-shrink-0 text-left" aria-label="Mon Arc — accueil">
                            <span className="block text-xl sm:text-2xl font-bold text-gradient leading-tight">Vibes Arc</span>
                            <span className="block text-[11px] sm:text-xs text-slate-500 tracking-wide">Vision · Identité · Action · Évolution</span>
                        </button>

                        {/* Desktop */}
                        <div className="hidden lg:flex items-center gap-2">
                            <nav ref={navRef} aria-label="Étapes de l'arc" className="flex items-center gap-1">
                                <button
                                    onClick={() => handleNav('arc')}
                                    aria-current={view === 'arc' ? 'page' : undefined}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${view === 'arc' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <Orbit className="w-4 h-4" aria-hidden />
                                    Mon Arc
                                </button>
                                {ARC_STAGES.map((stage) => {
                                    const isCurrent = currentStage?.key === stage.key;
                                    return (
                                        <div key={stage.key} className="relative flex items-center">
                                            <button
                                                onClick={() => handleNav(stage.hub)}
                                                aria-current={view === stage.hub ? 'page' : undefined}
                                                className={`pl-3 pr-1.5 py-2 rounded-l-lg text-sm font-medium flex items-center gap-1.5 transition ${isCurrent ? `${stage.theme.strong} text-white` : 'text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                <span className={`w-5 h-5 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${isCurrent ? 'bg-white/25 text-white' : `${stage.theme.soft} ${stage.theme.text}`}`}>
                                                    {stage.step}
                                                </span>
                                                {stage.label}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenStage((s) => (s === stage.key ? null : stage.key));
                                                }}
                                                aria-label={`Outils de l’étape ${stage.label}`}
                                                aria-expanded={openStage === stage.key}
                                                className={`px-1 py-2 rounded-r-lg transition ${isCurrent ? `${stage.theme.strong} text-white/90` : 'text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <ChevronDown className={`w-4 h-4 transition-transform ${openStage === stage.key ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openStage === stage.key && <StageMenu stage={stage} view={view} onNavigate={handleNav} />}
                                        </div>
                                    );
                                })}
                            </nav>

                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen((v) => !v)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                    aria-haspopup="menu"
                                    aria-expanded={userMenuOpen}
                                    aria-label="Mon compte"
                                >
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-40" role="menu">
                                        <div className="px-3 py-2 text-sm text-slate-500">Mon compte</div>
                                        {userEmail && <div className="px-3 pb-2 text-xs text-slate-500 break-all">{userEmail}</div>}
                                        <div className="px-3 py-2">
                                            <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold inline-flex items-center gap-2">
                                                <Trophy className="w-4 h-4" />
                                                {gamification.points} pts
                                            </span>
                                        </div>
                                        <button onClick={() => handleNav('accountSettings')} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-slate-700" role="menuitem">
                                            Paramètres
                                        </button>
                                        <button onClick={signOut} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-slate-700" role="menuitem">
                                            Se déconnecter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5" />
                                {gamification.points}
                            </span>
                            <button
                                onClick={() => setMobileMenuOpen((v) => !v)}
                                className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                aria-label="Tous les outils"
                                aria-expanded={mobileMenuOpen}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tiroir mobile : les 4 étapes et leurs outils */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-gradient">L’arc</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Fermer">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        <nav className="p-3 space-y-2" aria-label="Étapes et outils">
                            <button
                                onClick={() => handleNav('arc')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 ${view === 'arc' ? 'bg-indigo-600 text-white' : 'text-slate-700 bg-slate-50'}`}
                            >
                                <Orbit className="w-4 h-4" aria-hidden />
                                Mon Arc
                            </button>
                            {ARC_STAGES.map((stage) => {
                                const expanded = mobileExpanded === stage.key;
                                return (
                                    <div key={stage.key} className={`rounded-xl border ${currentStage?.key === stage.key ? stage.theme.border : 'border-slate-200'}`}>
                                        <div className="flex items-stretch">
                                            <button onClick={() => handleNav(stage.hub)} className="flex-1 text-left px-4 py-3">
                                                <span className={`block text-xs font-bold uppercase tracking-wider ${stage.theme.text}`}>
                                                    {stage.step} · {stage.label}
                                                </span>
                                                <span className="block text-sm text-slate-700 leading-snug">{stage.question}</span>
                                            </button>
                                            <button
                                                onClick={() => setMobileExpanded(expanded ? null : stage.key)}
                                                className="px-3 text-slate-400"
                                                aria-label={`${expanded ? 'Replier' : 'Déplier'} les outils de ${stage.label}`}
                                                aria-expanded={expanded}
                                            >
                                                <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                        {expanded && (
                                            <div className="px-2 pb-2">
                                                {getStageGroups(stage.key).map(({ group, modules }) => (
                                                    <div key={group}>
                                                        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group}</p>
                                                        {modules.map((m) => (
                                                            <button
                                                                key={m.view}
                                                                onClick={() => handleNav(m.view)}
                                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${view === m.view ? `${stage.theme.soft} ${stage.theme.text} font-medium` : 'text-slate-600 active:bg-slate-100'}`}
                                                            >
                                                                <span aria-hidden>{m.emoji}</span>
                                                                {m.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="border-t border-slate-200 p-4 mt-2">
                            {userEmail && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4" />
                                    </span>
                                    <span className="text-xs text-slate-500 break-all">{userEmail}</span>
                                </div>
                            )}
                            <button onClick={() => handleNav('accountSettings')} className="w-full text-left px-4 py-3 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium transition">
                                Paramètres
                            </button>
                            <button onClick={signOut} className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium transition">
                                Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Barre d'étapes mobile : l'arc toujours visible */}
            <nav
                aria-label="Navigation par étapes"
                className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
            >
                <div className="grid grid-cols-5 max-w-lg mx-auto">
                    <button
                        onClick={() => handleNav('arc')}
                        aria-current={view === 'arc' ? 'page' : undefined}
                        className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${view === 'arc' ? 'text-indigo-700' : 'text-slate-500'}`}
                    >
                        <Orbit className="w-5 h-5" aria-hidden />
                        Arc
                    </button>
                    {ARC_STAGES.map((stage) => {
                        const Icon = stage.icon;
                        const isCurrent = currentStage?.key === stage.key;
                        return (
                            <button
                                key={stage.key}
                                onClick={() => handleNav(stage.hub)}
                                aria-current={view === stage.hub ? 'page' : undefined}
                                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isCurrent ? stage.theme.text : 'text-slate-500'}`}
                            >
                                {isCurrent && <span className={`absolute top-0 inset-x-4 h-0.5 rounded-full ${stage.theme.strong}`} aria-hidden />}
                                <Icon className="w-5 h-5" aria-hidden />
                                {stage.step}·{stage.label}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};

export default Header;
