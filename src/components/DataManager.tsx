import React, { useState } from 'react';
import { Download, Upload, Trash2, Database, FileText } from 'lucide-react';
import BrowserDatabaseClient from '@/database/browser-client';
import { useAppStore } from '@/store/useAppStore';
import { generateEngagementReport, toCSV } from '@/utils/engagementReportUtils';

interface DataManagerProps {
    onDataChange?: () => void;
}

const DataManager: React.FC<DataManagerProps> = ({ onDataChange }) => {
    const { identities, habits } = useAppStore();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [isReportExporting, setIsReportExporting] = useState(false);

    const db = BrowserDatabaseClient.getInstance();

    const downloadText = (content: string, filename: string, mime: string) => {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExport = () => {
        setIsExporting(true);
        try {
            const data = db.exportData();
            downloadText(data, `vibes-arc-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportEngagementReport = () => {
        setIsReportExporting(true);
        try {
            const report = generateEngagementReport({ identities, habits });
            const stamp = new Date().toISOString().split('T')[0];

            // JSON complet (pour ChatGPT / coach / analyse externe)
            downloadText(JSON.stringify(report, null, 2), `vibes-arc-engagement-report-T4-2025-${stamp}.json`, 'application/json');

            // CSV (tables)
            downloadText(
                toCSV(report.tables.habits.map(h => ({
                    habitId: h.habitId,
                    name: h.name,
                    type: h.type,
                    activeDays: h.activeDays,
                    completedDays: h.completedDays,
                    completionPct: h.completionPct,
                    longestStreak: h.longestStreak,
                    breaks: h.breaks,
                    avgRecoveryDays: h.avgRecoveryDays ?? '',
                    linkedIdentities: h.linkedIdentities.join(' | '),
                    flags: h.flags.join(' | '),
                }))),
                `vibes-arc-engagement-habits-T4-2025-${stamp}.csv`,
                'text/csv'
            );

            downloadText(
                toCSV(report.tables.identities.map(i => ({
                    identityId: i.identityId,
                    name: i.name,
                    linkedHabits: i.linkedHabits,
                    completionPct: i.completionPct ?? '',
                    status: i.status,
                    evidence: i.evidence.join(' | '),
                }))),
                `vibes-arc-engagement-identities-T4-2025-${stamp}.csv`,
                'text/csv'
            );

            downloadText(
                toCSV(report.tables.daily.map(d => ({
                    dayIndex: d.dayIndex,
                    dateISO: d.dateISO,
                    dateLabel: d.dateLabel,
                    weekday: d.weekday,
                    activeHabits: d.activeHabits,
                    completedHabits: d.completedHabits,
                    engaged: d.engaged ? 1 : 0,
                }))),
                `vibes-arc-engagement-daily-T4-2025-${stamp}.csv`,
                'text/csv'
            );
        } catch (error) {
            console.error('Erreur lors de l\'export du rapport:', error);
            alert('Impossible de générer le rapport. Vérifiez la console pour plus de détails.');
        } finally {
            setIsReportExporting(false);
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportError(null);
        setImportSuccess(false);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const success = db.importData(content);

                if (success) {
                    setImportSuccess(true);
                    onDataChange?.();
                    setTimeout(() => setImportSuccess(false), 3000);
                } else {
                    setImportError('Format de fichier invalide');
                }
            } catch (error) {
                setImportError('Erreur lors de la lecture du fichier');
            } finally {
                setIsImporting(false);
            }
        };

        reader.readAsText(file);
    };

    const handleClearData = () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
            db.clearAllData();
            onDataChange?.();
        }
    };

    const stats = db.getStats();

    return (
        <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Gestion des Données
            </h3>

            <div className="space-y-4">
                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{stats.identities}</div>
                        <div className="text-sm text-slate-600">Identités</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{stats.habits}</div>
                        <div className="text-sm text-slate-600">Habitudes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{stats.totalProgress}</div>
                        <div className="text-sm text-slate-600">Jours complétés</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Export */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Export...' : 'Exporter'}
                    </button>

                    {/* Import */}
                    <label className="btn-secondary flex items-center justify-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {isImporting ? 'Import...' : 'Importer'}
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>

                    {/* Rapport engagement */}
                    <button
                        onClick={handleExportEngagementReport}
                        disabled={isReportExporting || habits.length === 0}
                        className="btn-secondary flex items-center justify-center gap-2"
                        title={habits.length === 0 ? 'Crée au moins une habitude pour générer un rapport' : 'Exporter le rapport d’engagement'}
                    >
                        <FileText className="w-4 h-4" />
                        {isReportExporting ? 'Rapport...' : 'Rapport T4 2025'}
                    </button>
                    
                    {/* Clear */}
                    <button
                        onClick={handleClearData}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Effacer tout
                    </button>
                </div>

                {/* Messages */}
                {importError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        ❌ {importError}
                    </div>
                )}

                {importSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        ✅ Données importées avec succès !
                    </div>
                )}

                {/* Info */}
                <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
                    💡 <strong>Conseil :</strong> Exportez régulièrement vos données pour éviter toute perte.
                    Les données sont stockées localement dans votre navigateur.
                </div>
                <div className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    🧠 <strong>Lucidité comportementale :</strong> le bouton <strong>Rapport T4 2025</strong> exporte un JSON + 3 CSV (habitudes, identités, timeline journalière)
                    directement exploitables par un coach ou ChatGPT.
                </div>
            </div>
        </div>
    );
};

export default DataManager;
