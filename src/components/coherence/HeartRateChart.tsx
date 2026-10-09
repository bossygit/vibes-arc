/**
 * Graphique canvas temps réel — courbe du BPM instantané (fenêtre glissante).
 */

import React, { useEffect, useRef } from 'react';

export interface BpmPoint {
    /** performance.now() au moment de la mesure (ms). */
    t: number;
    bpm: number;
}

interface HeartRateChartProps {
    points: BpmPoint[];
    /** Largeur visible de la fenêtre glissante (ms). */
    windowMs?: number;
}

const HeartRateChart: React.FC<HeartRateChartProps> = ({ points, windowMs = 90_000 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssW = canvas.clientWidth || 400;
        const cssH = canvas.clientHeight || 150;
        if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
            canvas.width = Math.round(cssW * dpr);
            canvas.height = Math.round(cssH * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);

        const now = performance.now();
        const t0 = now - windowMs;
        const visible = points.filter((p) => p.t >= t0);

        if (visible.length < 2) {
            ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
            ctx.font = '12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('En attente du signal cardiaque…', cssW / 2, cssH / 2);
            return;
        }

        // Échelle Y : min/max visibles ± marge, span minimum 25 BPM
        let minBpm = Infinity;
        let maxBpm = -Infinity;
        for (const p of visible) {
            if (p.bpm < minBpm) minBpm = p.bpm;
            if (p.bpm > maxBpm) maxBpm = p.bpm;
        }
        let yMin = Math.floor(minBpm - 8);
        let yMax = Math.ceil(maxBpm + 8);
        if (yMax - yMin < 25) {
            const mid = (yMax + yMin) / 2;
            yMin = Math.floor(mid - 12.5);
            yMax = Math.ceil(mid + 12.5);
        }

        const padTop = 12;
        const padBottom = 6;
        const plotH = cssH - padTop - padBottom;
        const xOf = (t: number) => ((t - t0) / windowMs) * cssW;
        const yOf = (bpm: number) => padTop + (1 - (bpm - yMin) / (yMax - yMin)) * plotH;

        // Grille + labels Y
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
        ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.lineWidth = 1;
        const steps = 3;
        for (let i = 0; i <= steps; i++) {
            const bpm = yMin + ((yMax - yMin) * i) / steps;
            const y = yOf(bpm);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(cssW, y);
            ctx.stroke();
            ctx.fillText(`${Math.round(bpm)}`, 4, y - 3);
        }

        // Aire sous la courbe
        ctx.beginPath();
        ctx.moveTo(xOf(visible[0].t), yOf(visible[0].bpm));
        for (const p of visible) ctx.lineTo(xOf(p.t), yOf(p.bpm));
        const area = ctx.createLinearGradient(0, padTop, 0, cssH);
        area.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
        area.addColorStop(1, 'rgba(34, 211, 238, 0.02)');
        ctx.lineTo(xOf(visible[visible.length - 1].t), cssH);
        ctx.lineTo(xOf(visible[0].t), cssH);
        ctx.closePath();
        ctx.fillStyle = area;
        ctx.fill();

        // Courbe
        ctx.beginPath();
        ctx.moveTo(xOf(visible[0].t), yOf(visible[0].bpm));
        for (const p of visible) ctx.lineTo(xOf(p.t), yOf(p.bpm));
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.save();
        ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        // Dernier point + valeur
        const last = visible[visible.length - 1];
        const lx = xOf(last.t);
        const ly = yOf(last.bpm);
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#67e8f9';
        ctx.fill();

        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#a5f3fc';
        ctx.fillText(`${last.bpm} BPM`, cssW - 6, Math.max(ly - 8, 12));
    }, [points, windowMs]);

    return <canvas ref={canvasRef} className="w-full h-[150px]" />;
};

export default HeartRateChart;
