import { useMemo } from 'react';

// ─── AttentionVessel3D ─────────────────────────────────────────────
// Vaisseau de concentration en CSS 3D — remplit progressivement pendant
// la session, avec paliers 17/34/51/68 comme lignes de niveau.
// Inspiration : attentiongrid.com — reproduit en pur CSS (zéro deps 3D).
// ===================================================================

const VESSEL_HEIGHT = 220;       // px
const VESSEL_WIDTH = 160;        // px
const MAX_DURATION = 68;         // secondes (palier 4)
const PALIERS = [17, 34, 51, 68];

interface Props {
  elapsedSec: number;
  intention?: string;
}

export default function AttentionVessel3D({ elapsedSec, intention }: Props) {
  // Progression 0..1 basée sur les 68 secondes max
  const progress = Math.min(1, elapsedSec / MAX_DURATION);
  const fillPercent = progress * 100;

  // Phase actuelle (1-4) basée sur les paliers atteints
  const currentTier = useMemo(() => {
    let tier = 0;
    for (let i = 0; i < PALIERS.length; i++) {
      if (elapsedSec >= PALIERS[i]) tier = i + 1;
    }
    return tier;
  }, [elapsedSec]);

  // Couleur vibratoire qui évolue avec la progression
  // Indigo → Violet → Améthyste au fil du remplissage
  const hue = 240 + progress * 40; // 240 → 280

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* ── Vaisseau 3D CSS ── */}
      <div
        className="relative"
        style={{
          perspective: '700px',
          perspectiveOrigin: '50% 40%',
        }}
      >
        {/* Conteneur 3D */}
        <div
          className="relative"
          style={{
            width: VESSEL_WIDTH,
            height: VESSEL_HEIGHT,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(-8deg) rotateY(-12deg)',
          }}
        >
          {/* Face arrière du vaisseau (hexagone) */}
          <div
            className="absolute inset-0 rounded-[40%_40%_45%_45%/30%_30%_50%_50%]"
            style={{
              background: `linear-gradient(180deg,
                hsl(${hue}, 60%, 18%) 0%,
                hsl(${hue}, 50%, 12%) 100%)`,
              border: '2px solid rgba(255,255,255,0.08)',
              boxShadow: `
                inset 0 0 40px rgba(0,0,0,0.4),
                0 20px 50px rgba(0,0,0,0.3),
                0 0 30px hsla(${hue}, 70%, 40%, 0.15)
              `,
            }}
          />

          {/* Liquide (remplissage animé) */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-[0_0_45%_45%/0_0_50%_50%] overflow-hidden"
            style={{
              height: `${fillPercent}%`,
              transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Surface du liquide (onde animée) */}
            <div
              className="absolute top-0 left-0 right-0 h-3"
              style={{
                background: `linear-gradient(90deg,
                  transparent 0%,
                  hsla(${hue}, 80%, 60%, 0.6) 20%,
                  hsla(${hue}, 90%, 70%, 0.8) 50%,
                  hsla(${hue}, 80%, 60%, 0.6) 80%,
                  transparent 100%)`,
                animation: 'wave 3s ease-in-out infinite',
              }}
            />
            {/* Corps du liquide */}
            <div
              className="absolute inset-0 top-2"
              style={{
                background: `linear-gradient(180deg,
                  hsl(${hue}, 70%, 35%) 0%,
                  hsl(${hue}, 60%, 25%) 50%,
                  hsl(${hue}, 50%, 15%) 100%)`,
                boxShadow: `inset 0 -10px 30px hsla(${hue}, 80%, 50%, 0.2)`,
              }}
            />
            {/* Reflet lumineux */}
            <div
              className="absolute top-3 left-3 w-8 h-16 rounded-full opacity-30"
              style={{
                background: `linear-gradient(180deg,
                  rgba(255,255,255,0.4) 0%,
                  transparent 100%)`,
              }}
            />
          </div>

          {/* Lignes de palier (17/34/51/68) */}
          {PALIERS.map((palier) => {
            const yPos = (palier / MAX_DURATION) * 100;
            const reached = elapsedSec >= palier;
            return (
              <div
                key={palier}
                className="absolute left-0 right-0 flex items-center"
                style={{ bottom: `${yPos}%`, transform: 'translateY(50%)' }}
              >
                <div
                  className="flex-1 h-px"
                  style={{
                    background: reached
                      ? `hsla(${hue}, 80%, 60%, 0.8)`
                      : 'rgba(255,255,255,0.12)',
                    boxShadow: reached
                      ? `0 0 6px hsla(${hue}, 80%, 60%, 0.5)`
                      : 'none',
                    transition: 'all 0.5s ease',
                  }}
                />
                <span
                  className="text-[9px] font-mono px-1"
                  style={{
                    color: reached
                      ? `hsla(${hue}, 80%, 75%, 0.9)`
                      : 'rgba(255,255,255,0.25)',
                    transition: 'color 0.5s ease',
                  }}
                >
                  {palier}s
                </span>
              </div>
            );
          })}

          {/* Effet de profondeur (face avant semi-transparente) */}
          <div
            className="absolute inset-0 rounded-[40%_40%_45%_45%/30%_30%_50%_50%]"
            style={{
              background: `linear-gradient(90deg,
                rgba(0,0,0,0.15) 0%,
                transparent 20%,
                transparent 80%,
                rgba(0,0,0,0.1) 100%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Indicateur de phase ── */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {PALIERS.map((_, i) => {
            const lit = i < currentTier;
            return (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-transform duration-500"
                style={{
                  background: lit
                    ? `hsl(${hue}, 70%, 55%)`
                    : 'rgba(255,255,255,0.1)',
                  boxShadow: lit
                    ? `0 0 8px hsla(${hue}, 70%, 50%, 0.5)`
                    : 'none',
                  transform: lit ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            );
          })}
        </div>
        <span className="text-xs font-mono text-white/50">
          {currentTier > 0 ? `Palier ${currentTier}/4` : 'Activation…'}
        </span>
      </div>

      {/* Intention flottante */}
      {intention && (
        <p className="text-sm text-white/40 italic text-center max-w-[200px]">
          « {intention} »
        </p>
      )}

      {/* CSS pour l'animation d'onde */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateX(-5%) scaleY(1); }
          50% { transform: translateX(5%) scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}
