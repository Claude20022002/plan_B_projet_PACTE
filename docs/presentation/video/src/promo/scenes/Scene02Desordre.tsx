// Scène 2 (4 – 12 s) : le désordre d'aujourd'hui. Courriels, PDF, messages et feuilles d'appel
// s'empilent entre Nadia et Youssef, qui disent ce que cela leur coûte ; à 11 s tout se fige,
// puis fondu vers le blanc (une seconde de silence dans la musique).
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ObjetDessine, type Objet } from "../components/Objets";
import { Personnage } from "../components/Personnage";
import { Plan, Titre } from "../components/Elements";
import { selon, useFormat } from "../format";
import { BORNES, P } from "../theme";

const OBJETS: { type: Objet; x: number; y: number; r: number; l: number }[] = [
  { type: "courriel", x: -0.22, y: -0.2, r: -8, l: 210 },
  { type: "pdf", x: 0.18, y: -0.24, r: 7, l: 190 },
  { type: "message", x: -0.05, y: 0.02, r: -4, l: 220 },
  { type: "appel", x: 0.3, y: 0.08, r: 11, l: 200 },
  { type: "edt", x: -0.3, y: 0.14, r: -12, l: 240 },
  { type: "courriel", x: 0.06, y: -0.36, r: 13, l: 180 },
  { type: "message", x: 0.24, y: 0.34, r: 6, l: 200 },
  { type: "pdf", x: -0.18, y: 0.4, r: -15, l: 170 },
  { type: "appel", x: 0.0, y: 0.28, r: 9, l: 190 },
  { type: "message", x: -0.34, y: -0.36, r: -10, l: 180 },
  { type: "edt", x: 0.36, y: -0.4, r: 8, l: 210 },
  { type: "courriel", x: 0.12, y: 0.12, r: -6, l: 200 },
];

/** Image (locale) où tout se fige : 11 s dans la vidéo. */
const FIGE = 210;

export const Scene02Desordre: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fmt = useFormat();
  const zone = selon(fmt, { cx: 960, cy: 520, w: 820, h: 620, k: 1 }, { cx: 540, cy: 760, w: 840, h: 720, k: 1 }, { cx: 560, cy: 470, w: 640, h: 520, k: 0.8 });
  const nadia = selon(fmt, { x: 260, sol: 975, h: 700 }, { x: 250, sol: 1700, h: 640 }, { x: 170, sol: 1010, h: 560 });
  const youssef = selon(fmt, { x: 1660, sol: 975, h: 720 }, { x: 830, sol: 1700, h: 660 }, { x: 930, sol: 1010, h: 580 });
  const t = Math.min(f, FIGE);
  const blanc = interpolate(f, [FIGE + 2, duree], [0, 1], BORNES);

  return (
    <Plan duree={duree}>
      <Titre de={150} taille={selon(fmt, 92, 88, 72)} style={{ left: 0, right: 0, top: selon(fmt, 70, 170, 50), textAlign: "center", zIndex: 5 }}>
        Trop de temps perdu.
      </Titre>
      {OBJETS.map((o, i) => {
        const a = spring({ frame: t - 6 - i * 13, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } });
        const tremble = f < FIGE ? Math.sin((t + i * 13) / 4) * (2 + i * 0.25) : 0;
        return (
          <ObjetDessine
            key={i}
            type={o.type}
            largeur={o.l * zone.k}
            style={{
              left: zone.cx + o.x * zone.w - (o.l * zone.k) / 2,
              top: zone.cy + o.y * zone.h - (o.l * zone.k) / 2,
              opacity: Math.min(1, a * 1.4),
              transform: `scale(${0.4 + 0.6 * a}) rotate(${o.r * a + tremble}deg)`,
            }}
          />
        );
      })}
      <Personnage qui="nadia" x={nadia.x} sol={nadia.sol} hauteur={nadia.h} pose="tablette" imageLocale={f} />
      <Personnage qui="youssef" x={youssef.x} sol={youssef.sol} hauteur={youssef.h} pose="repos" sens={-1} imageLocale={f} />
      <AbsoluteFill style={{ background: P.fond, opacity: blanc }} />
    </Plan>
  );
};
