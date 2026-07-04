import React from 'react';
import { QUALITY_LABELS } from '@/data/karmicSeedCatalog';
import type { InnerQualities } from '@/types/karmicGarden';

interface InnerQualitiesPanelProps {
    qualities: InnerQualities;
}

const InnerQualitiesPanel: React.FC<InnerQualitiesPanelProps> = ({ qualities }) => {
    const entries = Object.entries(qualities) as [keyof InnerQualities, number][];

    return (
        <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Qualités intérieures</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entries.map(([key, value]) => (
                    <div key={key}>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>{QUALITY_LABELS[key]}</span>
                            <span>{value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500"
                                style={{ width: `${value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InnerQualitiesPanel;
