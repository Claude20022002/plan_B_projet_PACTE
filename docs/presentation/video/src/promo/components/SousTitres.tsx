// Sous-titres français incrustés, calés sur les voix (voix.json) : bas centré, 44 px, fond semi-transparent.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useFormat, selon } from "../format";
import { BORNES, POLICE } from "../theme";
import { sousTitre as sousTitrePromo } from "../voix";

type Trouve = { texte: string; de: number; fin: number } | null;

/** Le sous-titre de l'image courante (à placer à la racine de la composition) ; `sousTitre` lit les
 * voix d'une autre vidéo que PactePromo. */
export const SousTitres: React.FC<{ sousTitre?: (image: number) => Trouve }> = ({ sousTitre = sousTitrePromo }) => {
  const f = useCurrentFrame();
  const fmt = useFormat();
  const st = sousTitre(f);
  if (!st) return null;
  const o = Math.min(interpolate(f, [st.de - 3, st.de + 2], [0, 1], BORNES), interpolate(f, [st.fin - 4, st.fin], [1, 0], BORNES));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: selon(fmt, 34, 230, 30), display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: selon(fmt, 1500, 900, 940),
          textAlign: "center",
          fontFamily: POLICE,
          fontWeight: 500,
          fontSize: selon(fmt, 44, 46, 40),
          lineHeight: 1.3,
          color: "#FFFFFF",
          background: "rgba(14,15,18,0.72)",
          borderRadius: 14,
          padding: "10px 26px",
          opacity: o,
        }}
      >
        {st.texte}
      </div>
    </div>
  );
};
