// Scène 1 (0 – 4 s) : Salma, perdue, cherche sa salle ; à côté d'elle, une pile d'emplois du temps
// qui déborde, feuille après feuille.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ObjetDessine } from "../components/Objets";
import { Personnage } from "../components/Personnage";
import { Plan, Titre } from "../components/Elements";
import { selon, useFormat } from "../format";
import { BORNES, P, POLICE } from "../theme";

const FEUILLES = [
  { x: 0, y: 0, r: -4 },
  { x: 40, y: -26, r: 5 },
  { x: -34, y: 30, r: -9 },
  { x: 70, y: 40, r: 10 },
  { x: -10, y: -60, r: -14 },
  { x: 96, y: -40, r: 15 },
];

export const Scene01Accroche: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fmt = useFormat();
  const perso = selon(fmt, { x: 620, sol: 960, h: 700 }, { x: 540, sol: 1640, h: 900 }, { x: 330, sol: 1000, h: 660 });
  const pile = selon(fmt, { x: 1290, y: 520, l: 380 }, { x: 540, y: 560, l: 360 }, { x: 760, y: 560, l: 300 });

  return (
    <Plan duree={duree} entree={false}>
      <Titre de={8} taille={selon(fmt, 96, 92, 76)} style={{ left: 0, right: 0, top: selon(fmt, 90, 170, 70), textAlign: "center" }}>
        Où est mon cours ?
      </Titre>
      <div style={{ position: "absolute", left: pile.x, top: pile.y }}>
        {FEUILLES.map((p, i) => {
          const a = spring({ frame: f - 6 - i * 12, fps, config: { damping: 200, stiffness: 140 } });
          return (
            <ObjetDessine
              key={i}
              type="edt"
              largeur={pile.l}
              style={{ left: -pile.l / 2 + p.x, top: -pile.l * 0.37 + p.y, opacity: a, transform: `translateY(${(1 - a) * 40}px) rotate(${p.r * a}deg)` }}
            />
          );
        })}
      </div>
      {[0, 1, 2].map((i) => {
        const a = spring({ frame: f - 14 - i * 10, fps, config: { damping: 200, stiffness: 160 } });
        const flotte = Math.sin((f + i * 20) / 12) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: perso.x + perso.h * (0.2 + i * 0.09),
              top: perso.sol - perso.h * (0.9 + i * 0.07) + flotte,
              fontFamily: POLICE,
              fontWeight: 800,
              fontSize: perso.h * (0.1 + i * 0.02),
              color: P.accent,
              opacity: a * interpolate(f, [0, 4], [0, 1], BORNES),
              transform: `scale(${0.6 + 0.4 * a}) rotate(${(i - 1) * 12}deg)`,
            }}
          >
            ?
          </div>
        );
      })}
      <Personnage qui="salma" x={perso.x} sol={perso.sol} hauteur={perso.h} pose="perplexe" poseParole="perplexe" imageLocale={f} />
    </Plan>
  );
};
