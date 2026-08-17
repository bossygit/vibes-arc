import { useEffect, useMemo, useRef, useState, useId } from 'react';
import type { PolyhedronDef } from '@/data/focusPolyhedra';

// ===================================================================
// PolyhedronVisual — solide de Platon en SVG 3D (projection + painter).
// - faces gravées (séances complétées) : panneaux de verre colorés
// - face en cours : remplissage progressif « liquide » (0 → 1)
// - rotation auto lente + rotation à la souris/au doigt
// - zéro dépendance 3D : math de projection maison
// ===================================================================

interface Props {
    shape: PolyhedronDef;
    /** indices des faces gravées (séances de 68s complétées) */
    filledFaces?: number[];
    /** face en cours de remplissage */
    currentFace?: number | null;
    /** progression de la face en cours (0..1) */
    faceProgress?: number;
    /** palier atteint (0..4) — déclenche un pulse visuel à chaque changement */
    milestone?: number;
    size?: number;
    interactive?: boolean;
    autoRotate?: boolean;
    /** true = fond sombre (chambre), false = fond clair (cartes) */
    dark?: boolean;
    celebrating?: boolean;
    className?: string;
}

interface Rot {
    yaw: number;
    pitch: number;
}

const DARK_THEME = {
    edgeFront: 'rgba(199,210,254,0.85)',
    edgeBack: 'rgba(99,102,241,0.30)',
    unfilled: 'rgba(129,140,248,0.07)',
    currentBase: 'rgba(139,92,246,0.12)',
    filledFrom: '#6366F1',
    filledTo: '#A78BFA',
    filledStroke: 'rgba(224,231,255,0.95)',
    glow: 'rgba(99,102,241,0.35)',
};

const LIGHT_THEME = {
    edgeFront: 'rgba(67,56,202,0.70)',
    edgeBack: 'rgba(99,102,241,0.32)',
    unfilled: 'rgba(99,102,241,0.05)',
    currentBase: 'rgba(139,92,246,0.10)',
    filledFrom: '#6366F1',
    filledTo: '#8B5CF6',
    filledStroke: 'rgba(255,255,255,0.9)',
    glow: 'rgba(99,102,241,0.16)',
};

export default function PolyhedronVisual({
    shape,
    filledFaces = [],
    currentFace = null,
    faceProgress = 0,
    milestone = 0,
    size = 200,
    interactive = false,
    autoRotate = false,
    dark = false,
    celebrating = false,
    className,
}: Props) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const theme = dark ? DARK_THEME : LIGHT_THEME;

    const [rot, setRot] = useState<Rot>({ yaw: -28, pitch: -12 });
    const rotRef = useRef(rot);
    rotRef.current = rot;
    const draggingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);
    const dragStartRef = useRef<Rot>({ yaw: -28, pitch: -12 });

    // Pulse de palier : n'altère pas la rotation, anime un <g> interne
    const [pulsing, setPulsing] = useState(false);
    const prevMilestoneRef = useRef(0);
    useEffect(() => {
        if (milestone !== prevMilestoneRef.current) {
            prevMilestoneRef.current = milestone;
            if (milestone > 0) {
                setPulsing(false);
                const t = setTimeout(() => setPulsing(true), 30);
                return () => clearTimeout(t);
            }
        }
    }, [milestone]);

    const prefersReduced = useMemo(
        () =>
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        []
    );

    // Rotation automatique lente (pause pendant le drag)
    useEffect(() => {
        if (!autoRotate || prefersReduced) return;
        let raf = 0;
        let last = performance.now();
        const step = (t: number) => {
            const dt = Math.min(50, t - last);
            last = t;
            if (!draggingRef.current) {
                setRot((r) => ({ ...r, yaw: r.yaw + dt * 0.018 }));
            }
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [autoRotate, prefersReduced]);

    // ── Projection ──
    const R = size * 0.34;
    const cx = size / 2;
    const cy = size / 2 + size * 0.03;
    const yaw = (rot.yaw * Math.PI) / 180;
    const pitch = (rot.pitch * Math.PI) / 180;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const f = size * 2.1;

    const projFaces = useMemo(() => {
        const list = shape.faces.map((face, idx) => {
            const pts = face.map((vi) => {
                const [x, y, z] = shape.vertices[vi];
                const x1 = x * cosY + z * sinY;
                const z1 = -x * sinY + z * cosY;
                const y2 = y * cosP - z1 * sinP;
                const z2 = y * sinP + z1 * cosP;
                const p = f / (f - z2 * R);
                return { x: cx + x1 * R * p, y: cy - y2 * R * p, z: z2 };
            });
            const depth = pts.reduce((s, pt) => s + pt.z, 0) / pts.length;
            return { idx, pts, depth };
        });
        list.sort((a, b) => b.depth - a.depth); // loin → près
        return list;
    }, [shape, cosY, sinY, cosP, sinP, f, R, cx, cy]);

    const filledSet = useMemo(() => new Set(filledFaces), [filledFaces]);

    // Étincelles de célébration (positions déterministes)
    const sparkles = useMemo(() => {
        const arr: { x: number; y: number; r: number; delay: number }[] = [];
        const n = 12;
        for (let i = 0; i < n; i++) {
            const ang = (i / n) * Math.PI * 2 + 0.4;
            const dist = size * (0.36 + ((i * 37) % 13) / 100);
            arr.push({
                x: cx + Math.cos(ang) * dist,
                y: cy + Math.sin(ang) * dist * 0.8,
                r: 1.6 + ((i * 53) % 20) / 10,
                delay: ((i * 71) % 12) / 10,
            });
        }
        return arr;
    }, [size, cx, cy]);

    // ── Interactions ──
    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!interactive) return;
        draggingRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        dragStartRef.current = rotRef.current;
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!draggingRef.current || !lastPosRef.current) return;
        const dx = e.clientX - lastPosRef.current.x;
        const dy = e.clientY - lastPosRef.current.y;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        setRot({
            yaw: dragStartRef.current.yaw + dx * 0.4,
            pitch: Math.max(
                -75,
                Math.min(75, dragStartRef.current.pitch + dy * 0.35)
            ),
        });
    };
    const onPointerUp = () => {
        draggingRef.current = false;
        lastPosRef.current = null;
    };

    const clampedProgress = Math.max(0, Math.min(1, faceProgress));

    return (
        <div className={className}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                    touchAction: interactive ? 'none' : undefined,
                    cursor: interactive
                        ? draggingRef.current
                            ? 'grabbing'
                            : 'grab'
                        : undefined,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                <defs>
                    <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={theme.filledFrom} />
                        <stop offset="100%" stopColor={theme.filledTo} />
                    </linearGradient>
                    <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={theme.glow} />
                        <stop offset="70%" stopColor={theme.glow} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={theme.glow} stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Halo */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={size * 0.46}
                    fill={`url(#${uid}-glow)`}
                    className={celebrating ? 'pv-glow-pulse' : undefined}
                />

                {/* Faces, de la plus lointaine à la plus proche */}
                <g className={pulsing ? 'pv-milestone-pulse' : undefined}>
                    {projFaces.map((pf) => {
                    const isFilled = filledSet.has(pf.idx);
                    const isCurrent = currentFace === pf.idx && !isFilled;
                    const front = pf.depth > 0.12;
                    const d = `M ${pf.pts
                        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                        .join(' L ')} Z`;

                    // bbox pour le remplissage de la face en cours
                    const xs = pf.pts.map((p) => p.x);
                    const ys = pf.pts.map((p) => p.y);
                    const bx = Math.min(...xs);
                    const by = Math.min(...ys);
                    const bw = Math.max(...xs) - bx;
                    const bh = Math.max(...ys) - by;
                    const fillH = clampedProgress * bh;

                    const stroke = isFilled
                        ? theme.filledStroke
                        : front
                          ? theme.edgeFront
                          : theme.edgeBack;

                    return (
                        <g key={pf.idx}>
                            {isCurrent && (
                                <defs>
                                    <clipPath id={`${uid}-clip-${pf.idx}`}>
                                        <rect
                                            x={bx - 1}
                                            y={by + bh - fillH}
                                            width={bw + 2}
                                            height={fillH + 2}
                                        />
                                    </clipPath>
                                </defs>
                            )}
                            <path
                                d={d}
                                fill={
                                    isFilled
                                        ? `url(#${uid}-fill)`
                                        : isCurrent
                                          ? theme.currentBase
                                          : theme.unfilled
                                }
                                fillOpacity={isFilled ? 0.92 : 1}
                                stroke={stroke}
                                strokeWidth={isFilled ? 1.6 : front ? 1.3 : 0.9}
                                strokeLinejoin="round"
                                className={
                                    isCurrent ? 'pv-face-current' : undefined
                                }
                            />
                            {isCurrent && (
                                <path
                                    d={d}
                                    fill={`url(#${uid}-fill)`}
                                    fillOpacity="0.88"
                                    clipPath={`url(#${uid}-clip-${pf.idx})`}
                                />
                            )}
                            {isFilled && (
                                <path
                                    d={d}
                                    fill="rgba(255,255,255,0.14)"
                                    style={{ mixBlendMode: 'screen' }}
                                />
                            )}
                        </g>
                    );
                })}
                </g>

                {/* Étincelles de célébration */}
                {celebrating &&
                    sparkles.map((s, i) => (
                        <circle
                            key={i}
                            cx={s.x}
                            cy={s.y}
                            r={s.r}
                            fill="#E9D5FF"
                            className="pv-sparkle"
                            style={{ animationDelay: `${s.delay}s` }}
                        />
                    ))}
            </svg>

            <style>{`
                @keyframes pvMilestonePulse {
                    0% { transform: scale(1); }
                    40% { transform: scale(1.055); }
                    100% { transform: scale(1); }
                }
                .pv-milestone-pulse {
                    transform-box: view-box;
                    transform-origin: center;
                    animation: pvMilestonePulse 0.5s ease-out;
                }
                @keyframes pvFacePulse {
                    0%, 100% { stroke-opacity: 0.55; }
                    50% { stroke-opacity: 1; }
                }
                .pv-face-current {
                    animation: pvFacePulse 1.6s ease-in-out infinite;
                }
                @keyframes pvGlowPulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
                .pv-glow-pulse {
                    animation: pvGlowPulse 1.2s ease-in-out infinite;
                }
                @keyframes pvSparkle {
                    0% { opacity: 0; transform: scale(0.3); }
                    30% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.2); }
                }
                .pv-sparkle {
                    opacity: 0;
                    transform-box: fill-box;
                    transform-origin: center;
                    animation: pvSparkle 1.8s ease-in-out infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .pv-face-current, .pv-glow-pulse, .pv-sparkle,
                    .pv-milestone-pulse {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
