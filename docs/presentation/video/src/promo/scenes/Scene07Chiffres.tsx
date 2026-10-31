// Scène 7 (48 – 55 s) : trois preuves vérifiées (AUDIT.md), une par ligne, sur fond uni.
// 2 620 vient de la génération sur le jeu de démonstration : la mention l'écrit sous les chiffres.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Compteur, Plan } from "../components/Elements";
import { selon, useFormat } from "../format";
import { BORNES, DOUX, P, POLICE } from "../theme";

const LIGNES = [
  { valeur: 2620, compte: true, texte: "séances placées" },
  { valeur: 0, compte: false, texte: "salle prise deux fois" },
  { valeur: 1, compte: false, texte: "seul compte pour tout" },
];

export const Scene07Chiffres: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fmt = useFormat();
  const empile = !fmt.paysage;
  const nombre = selon(fmt, 150, 170, 120);
  const texte = selon(fmt, 52, 54, 42);
  const note = interpolate(f, [80, 100], [0, 1], { ...BORNES, easing: DOUX });

  return (
    <Plan duree={duree}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: selon(fmt, 26, 70, 22), paddingBottom: selon(fmt, 60, 160, 50) }}>
        {LIGNES.map((l, i) => {
          const de = 8 + i * 22;
          const p = spring({ frame: f - de, fps, config: { damping: 200, stiffness: 110 } });
          return (
            <div key={l.texte} style={{ display: "flex", flexDirection: empile ? "column" : "row", alignItems: empile ? "center" : "baseline", gap: empile ? 0 : 34, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, fontFamily: POLICE }}>
              <div style={{ fontWeight: 800, fontSize: nombre, color: P.accent, lineHeight: 1, minWidth: empile ? undefined : 420, textAlign: empile ? "center" : "right", letterSpacing: "-0.03em" }}>
                {l.compte ? <Compteur valeur={l.valeur} de={de} duree={44} /> : l.valeur}
              </div>
              <div style={{ fontWeight: 500, fontSize: texte, color: P.encre, minWidth: empile ? undefined : 620 }}>{l.texte}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 18, fontFamily: POLICE, fontWeight: 500, fontSize: selon(fmt, 28, 32, 26), color: P.encreDouce, opacity: note }}>
          Semestre de démonstration HESTIM, deux campus
        </div>
      </div>
    </Plan>
  );
};
