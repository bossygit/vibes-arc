import React from 'react';
import { DOMAIN_META, SEED_DOMAINS } from '@/data/karmicSeedCatalog';
import { PLOT_STAGE_EMOJI } from '@/data/karmicGardenLevels';
import type { KarmicGardenState } from '@/types/karmicGarden';
import { getPlotStage } from '@/utils/karmicGardenUtils';

interface KarmicGardenPlotProps {
    plotProgress: KarmicGardenState['plotProgress'];
}

const KarmicGardenPlot: React.FC<KarmicGardenPlotProps> = ({ plotProgress }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SEED_DOMAINS.map((domain) => {
                const meta = DOMAIN_META[domain];
                const count = plotProgress[domain];
                const stage = getPlotStage(count);
                const emoji = PLOT_STAGE_EMOJI[stage];

                return (
                    <div
                        key={domain}
                        className={`rounded-xl border-2 p-4 text-center transition-all ${meta.bgClass} ${meta.borderClass}`}
                    >
                        <div className="text-3xl mb-1">{emoji}</div>
                        <p className={`font-semibold text-sm ${meta.colorClass}`}>{meta.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{count} graine{count !== 1 ? 's' : ''}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default KarmicGardenPlot;
