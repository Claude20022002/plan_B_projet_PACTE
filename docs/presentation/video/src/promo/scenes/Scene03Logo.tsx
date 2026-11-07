// Scène 3 (12 – 18 s) : fond clair, l'emblème HESTIM s'assemble, le nom et la promesse dessous ;
// léger zoom arrière sur toute la scène.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Embleme } from "../../components/Embleme";
import { Plan, Titre } from "../components/Elements";
import { selon, useFormat } from "../format";
import { BORNES, DOUX, P, POLICE } from "../theme";

export const Scene03Logo: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const fmt = useFormat();
  const zoom = interpolate(f, [0, duree], [1.07, 1], { ...BORNES, easing: DOUX });
  const taille = selon(fmt, 200, 230, 180);
  const promesse = interpolate(f, [56, 76], [0, 1], { ...BORNES, easing: DOUX });

  return (
    <Plan duree={duree}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${zoom})` }}>
        <Embleme start={4} size={taille} tile={false} stagger={2} stiffness={110} />
        <div style={{ position: "relative", height: selon(fmt, 140, 150, 120), width: "100%" }}>
          <Titre de={34} taille={selon(fmt, 104, 100, 86)} style={{ left: 0, right: 0, top: 30, textAlign: "center" }}>
            HESTIM <span style={{ color: P.accent }}>Planner</span>
          </Titre>
        </div>
        <div style={{ marginTop: 18, fontFamily: POLICE, fontWeight: 500, fontSize: selon(fmt, 50, 52, 44), color: P.encreDouce, opacity: promesse, transform: `translateY(${(1 - promesse) * 24}px)`, textAlign: "center", padding: "0 60px" }}>
          Toute l'école à l'heure.
        </div>
      </div>
    </Plan>
  );
};
