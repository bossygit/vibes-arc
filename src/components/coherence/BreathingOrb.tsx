/**
 * Orbe respiratoire — guide d'inspiration/expiration sur canvas.
 *
 * L'orbe s'agrandit sur une demi-période (Inspiration) et rétrécit sur la
 * suivante (Expiration). À 6 cpm : 5 s / 5 s. La période vient du parent
 * (cycleSeconds = 60 / cpm) pour rester synchronisée avec le sélecteur.
 */

import React, { useEffect, useRef, useState } from 'react';

interface BreathingOrbProps {
    /** Durée d'un cycle complet (inspire + expire), en secondes. */
    cycleSeconds: number;
    /** Session en cours (anime l'orbe) ou au repos. */
    running: boolean;
}

const BreathingOrb: React.FC<BreathingOrbProps> = ({ cycleSeconds, running }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [label, setLabel] = useState('Prêt');
    const [sub, setSub] = useState('appuie sur Démarrer');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf = 0;
        let lastStamp = '';
        const start = performance.now();

        const draw = (now: number) => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const cssW = canvas.clientWidth || 260;
            const cssH = canvas.clientHeight || 260;
            if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
                canvas.width = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cssW, cssH);

            const cx = cssW / 2;
            const cy = cssH / 2;
            const maxR = Math.min(cssW, cssH) * 0.4;
            const minR = maxR * 0.45;
            const T = Math.max(cycleSeconds, 1) * 1000;
            const t = now - start;

            let expansion = 0;
            let phaseLabel = 'Prêt';
            let phaseSub = 'appuie sur Démarrer';

            if (running) {
                const phase = (t % T) / T;
                // Montée douce sur la 1ère moitié du cycle, descente sur la 2e
                expansion = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
                const half = T / 2;
                const inFirstHalf = (t % T) < half;
                const remaining = Math.ceil((half - ((t % T) % half)) / 1000);
                phaseLabel = inFirstHalf ? 'Inspire' : 'Expire';
                phaseSub = `${remaining} s`;
            }

            const r = minR + (maxR - minR) * expansion;

            // Halo doux (néon discret)
            const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, maxR * 1.75);
            glow.addColorStop(0, `rgba(56, 189, 248, ${0.16 * (0.4 + 0.6 * expansion)})`);
            glow.addColorStop(0.6, `rgba(99, 102, 241, ${0.07 * (0.3 + 0.7 * expansion)})`);
            glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, maxR * 1.75, 0, Math.PI * 2);
            ctx.fill();

            // Anneau de progression du cycle (très discret)
            if (running) {
                const progress = (t % T) / T;
                ctx.beginPath();
                ctx.arc(cx, cy, maxR + 12, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
                ctx.strokeStyle = 'rgba(103, 232, 249, 0.35)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(cx, cy, maxR + 12, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Orbe
            const fill = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
            fill.addColorStop(0, running ? 'rgba(125, 211, 252, 0.55)' : 'rgba(100, 116, 139, 0.35)');
            fill.addColorStop(1, running ? 'rgba(79, 70, 229, 0.22)' : 'rgba(51, 65, 85, 0.25)');
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();

            ctx.save();
            ctx.shadowColor = running ? 'rgba(34, 211, 238, 0.7)' : 'rgba(71, 85, 105, 0.4)';
            ctx.shadowBlur = running ? 26 : 8;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = running ? 'rgba(103, 232, 249, 0.9)' : 'rgba(100, 116, 139, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            const stamp = `${phaseLabel}|${phaseSub}`;
            if (stamp !== lastStamp) {
                lastStamp = stamp;
                setLabel(phaseLabel);
                setSub(phaseSub);
            }

            raf = requestAnimationFrame(draw);
        };

        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [cycleSeconds, running]);

    return (
        <div className="relative w-full max-w-[280px] aspect-square">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-semibold text-cyan-200 tracking-wide">{label}</span>
                <span className="text-xs text-slate-400 mt-0.5">{sub}</span>
            </div>
        </div>
    );
};

export default BreathingOrb;
