// Scène 8 (55 – 60 s) : l'emblème revient, le nom, le bouton « Demandez votre démo » qui pulse une
// seule fois ; les trois avatars saluent ; fondu au blanc. Aucune adresse : aucune n'est encore décidée.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Embleme } from "../../components/Embleme";
import { Plan, Titre } from "../components/Elements";
import { Personnage } from "../components/Personnage";
import { selon, useFormat } from "../format";
import { BORNES, DOUX, P, POLICE } from "../theme";

export const Scene08Fin: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const fmt = useFormat();
  const bouton = interpolate(f, [30, 46], [0, 1], { ...BORNES, easing: DOUX });
  const pulse = interpolate(f, [56, 66, 78], [1, 1.07, 1], BORNES);
  const haut = selon(fmt, 170, 330, 120);
  const persos = selon(
    fmt,
    [{ x: 230, h: 640 }, { x: 1520, h: 660 }, { x: 1730, h: 620 }],
    [{ x: 190, h: 560 }, { x: 540, h: 580 }, { x: 890, h: 540 }],
    [{ x: 150, h: 470 }, { x: 800, h: 480 }, { x: 950, h: 450 }],
  );
  const sol = selon(fmt, 975, 1700, 1010);

  return (
    <Plan duree={duree} >
      <div style={{ position: "absolute", left: 0, right: 0, top: haut, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Embleme start={0} size={selon(fmt, 150, 170, 120)} tile={false} stagger={0.8} stiffness={220} />
        <div style={{ position: "relative", height: selon(fmt, 130, 130, 110), width: "100%" }}>
          <Titre de={10} taille={selon(fmt, 92, 92, 76)} style={{ left: 0, right: 0, top: 24, textAlign: "center" }}>
            HESTIM <span style={{ color: P.accent }}>Planner</span>
          </Titre>
        </div>
        <div style={{ marginTop: selon(fmt, 40, 50, 30), opacity: bouton, transform: `translateY(${(1 - bouton) * 24}px) scale(${pulse})`, background: P.accent, color: "#FFFFFF", fontFamily: POLICE, fontWeight: 800, fontSize: selon(fmt, 46, 50, 40), padding: "26px 56px", borderRadius: 999, boxShadow: "0 18px 40px rgba(0,24,97,0.28)" }}>
          Demandez votre démo
        </div>
      </div>
      <Personnage qui="nadia" x={persos[0].x} sol={sol} hauteur={persos[0].h} pose="salut" entree={4} etiquette={false} imageLocale={f} />
      <Personnage qui="youssef" x={persos[1].x} sol={sol} hauteur={persos[1].h} pose="salut" sens={-1} entree={10} etiquette={false} imageLocale={f} />
      <Personnage qui="salma" x={persos[2].x} sol={sol} hauteur={persos[2].h} pose="salut" sens={-1} entree={16} etiquette={false} imageLocale={f} />
    </Plan>
  );
};
