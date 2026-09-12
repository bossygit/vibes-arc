import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
    JournalEntry,
    getJournalMoment,
    JOURNAL_PROMPTS,
    EMOTIONAL_LABELS,
    getAlignmentZone,
} from '@/types';
import { todayLocalISO } from '@/utils/dateUtils';
import { motion } from 'framer-motion';
import {
    PenLine,
    Trash2,
    Pencil,
    Check,
    X,
    Sparkles,
    Radio,
    ArrowRight,
    Loader2,
} from 'lucide-react';

// ============================================================
// Journal de ressenti quotidien
// Entrées libres (plusieurs par jour), regroupées par date.
// Complémentaire au check-in Fréquence — le score du jour
// s'affiche en contexte dans la relecture.
// ============================================================

const MOMENT_LABELS: Record<string, { badge: string; emoji: string }> = {
    'matin': { badge: 'Ce matin', emoji: '🌅' },
    'après-midi': { badge: 'Cet après-midi', emoji: '☀️' },
    'soir': { badge: 'Ce soir', emoji: '🌙' },
};

const ZONE_STYLES: Record<string, { chip: string; label: string }> = {
    'alignement': { chip: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'aligné' },
    'neutre': { chip: 'bg-amber-50 border-amber-200 text-amber-700', label: 'neutre' },
    'résistance': { chip: 'bg-red-50 border-red-200 text-red-700', label: 'résistance' },
};

function formatHeure(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string, todayISO: string): string {
    if (iso === todayISO) return "Aujourd'hui";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (iso === todayLocalISO(yesterday)) return 'Hier';
    const d = new Date(iso + 'T12:00:00');
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const currentYear = new Date().getFullYear();
    return d.getFullYear() === currentYear ? label : `${label} ${d.getFullYear()}`;
}

const JournalView: React.FC = () => {
    const {
        journalEntries,
        loadJournalEntries,
        addJournalEntry,
        editJournalEntry,
        removeJournalEntry,
        todayMood,
        setView,
    } = useAppStore();

    // ─── Composer ─────────────────────────────────────────────────────────
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);
    const [promptOffset, setPromptOffset] = useState(0);
    const [promptVisible, setPromptVisible] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ─── Édition / suppression ────────────────────────────────────────────
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    useEffect(() => {
        loadJournalEntries();
    }, [loadJournalEntries]);

    // Reset de la confirmation de suppression après 3s
    useEffect(() => {
        if (confirmDeleteId === null) return;
        const t = window.setTimeout(() => setConfirmDeleteId(null), 3000);
        return () => window.clearTimeout(t);
    }, [confirmDeleteId]);

    const moment = getJournalMoment();
    const momentInfo = MOMENT_LABELS[moment] ?? { badge: 'Maintenant', emoji: '✨' };
    const prompts = JOURNAL_PROMPTS[moment];
    const currentPrompt = prompts[(new Date().getHours() + promptOffset) % prompts.length];

    // ─── Historique groupé par date ───────────────────────────────────────
    const todayISO = todayLocalISO();
    const groups = useMemo(() => {
        const byDate = new Map<string, JournalEntry[]>();
        for (const e of journalEntries) {
            const list = byDate.get(e.date);
            if (list) list.push(e);
            else byDate.set(e.date, [e]);
        }
        return Array.from(byDate.keys())
            .sort((a, b) => b.localeCompare(a))
            .map((date) => ({
                date,
                entries: [...(byDate.get(date) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
            }));
    }, [journalEntries]);

    const totalEntries = journalEntries.length;

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 260) + 'px';
    };

    const handleSubmit = async () => {
        const text = content.trim();
        if (!text || saving) return;
        setSaving(true);
        try {
            await addJournalEntry(text, promptVisible ? currentPrompt : undefined);
            setContent('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2200);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const startEdit = (entry: JournalEntry) => {
        setEditingId(entry.id);
        setEditContent(entry.content);
        setConfirmDeleteId(null);
    };

    const handleSaveEdit = async () => {
        const text = editContent.trim();
        if (!text || editingId === null) return;
        await editJournalEntry(editingId, text);
        setEditingId(null);
        setEditContent('');
    };

    const handleDelete = async (id: number) => {
        await removeJournalEntry(id);
        setConfirmDeleteId(null);
        if (editingId === id) setEditingId(null);
    };

    const zone = todayMood ? getAlignmentZone(todayMood.score) : null;
    const zoneStyle = zone ? ZONE_STYLES[zone] : null;

    // ─── Rendu ────────────────────────────────────────────────────────────
    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <PenLine className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Journal</h2>
                        <p className="text-sm text-slate-500">
                            Ton territoire émotionnel — écris ce que tu ressens, quand tu le ressens.
                        </p>
                    </div>
                </div>
            </div>

            {/* Composer */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-soft p-4 sm:p-5 mb-4"
            >
                {/* Prompt d'amorçage */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{momentInfo.emoji}</span>
                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
                                {momentInfo.badge}
                            </p>
                            {promptVisible ? (
                                <p className="text-sm text-indigo-700/90 italic mt-0.5">
                                    {currentPrompt}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 italic mt-0.5">
                                    Écriture libre — pas de prompt.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {promptVisible ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setPromptOffset((v) => v + 1)}
                                    className="px-2 py-1 rounded-lg text-[11px] text-slate-500 hover:bg-slate-100 transition"
                                    title="Autre prompt"
                                >
                                    Autre
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPromptVisible(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                                    title="Masquer le prompt"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setPromptVisible(true)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-indigo-600 hover:bg-indigo-50 transition"
                                title="Afficher un prompt d'amorçage"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Un prompt ?
                            </button>
                        )}
                    </div>
                </div>

                {/* Zone d'écriture */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    placeholder="Écris ton ressenti, librement..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none transition"
                    style={{ maxHeight: '260px' }}
                />

                <div className="flex items-center justify-between mt-3">
                    <p className="text-[11px] text-slate-400">
                        {savedFlash ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <Check className="w-3.5 h-3.5" /> Déposé dans ton journal
                            </span>
                        ) : (
                            <>⌘+Entrée pour déposer · nourrit ton coach IA</>
                        )}
                    </p>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!content.trim() || saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                        Déposer
                    </button>
                </div>
            </motion.div>

            {/* Contexte : Fréquence du jour */}
            <div className="mb-6">
                {todayMood && zoneStyle ? (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${zoneStyle.chip}`}>
                        <Radio className="w-3.5 h-3.5" />
                        <span>
                            Fréquence du jour : {todayMood.score}/22 · {EMOTIONAL_LABELS[todayMood.score]}
                        </span>
                        <span className="opacity-70">({zoneStyle.label})</span>
                        {todayMood.dominantEmotion && (
                            <span className="opacity-70">· {todayMood.dominantEmotion}</span>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setView('moodCheckin')}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                        <Radio className="w-3.5 h-3.5" />
                        Pas de check-in Fréquence aujourd'hui — le faire
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Historique */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Historique</h3>
                <span className="text-xs text-slate-400">
                    {totalEntries} entrée{totalEntries > 1 ? 's' : ''}
                </span>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-4xl block mb-3">📖</span>
                    <p className="text-slate-500 text-sm">
                        Ton journal est vierge. Dépose ton premier ressenti ci-dessus —
                        <br className="hidden sm:block" />
                        même une phrase compte.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <div key={group.date}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-slate-500">
                                    {formatDateLabel(group.date, todayISO)}
                                </span>
                                <div className="flex-1 h-px bg-slate-200/70" />
                            </div>
                            <div className="space-y-2">
                                {group.entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="group bg-white rounded-xl border border-slate-200/70 p-4 hover:border-indigo-200 transition"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {formatHeure(entry.createdAt)}
                                                {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                                                    <span className="ml-1 opacity-70">(modifié)</span>
                                                )}
                                            </span>
                                            {editingId !== entry.id && (
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(entry)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            confirmDeleteId === entry.id
                                                                ? handleDelete(entry.id)
                                                                : setConfirmDeleteId(entry.id)
                                                        }
                                                        className={`px-1.5 py-1.5 rounded-lg transition ${
                                                            confirmDeleteId === entry.id
                                                                ? 'text-red-600 bg-red-50 text-[10px] font-semibold'
                                                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                                        }`}
                                                        title="Supprimer"
                                                    >
                                                        {confirmDeleteId === entry.id ? (
                                                            'Sûr ?'
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {entry.prompt && editingId !== entry.id && (
                                            <p className="text-[11px] text-indigo-400/80 italic mb-1">
                                                ✍️ {entry.prompt}
                                            </p>
                                        )}

                                        {editingId === entry.id ? (
                                            <div>
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                                                />
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveEdit}
                                                        disabled={!editContent.trim()}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-40"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Enregistrer
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditContent('');
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg text-slate-500 text-xs hover:bg-slate-100 transition"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                {entry.content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JournalView;
