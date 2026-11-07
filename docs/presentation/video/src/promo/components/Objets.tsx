// Objets dessinés du désordre d'aujourd'hui (formes simples, sans logo de marque) : feuille d'emploi
// du temps, courriel, PDF, message, feuille d'appel.
import React from "react";
import { P, POLICE } from "../theme";

export type Objet = "edt" | "courriel" | "pdf" | "message" | "appel";

const carte: React.CSSProperties = { position: "absolute", background: "#FFFFFF", borderRadius: 14, boxShadow: "0 14px 36px rgba(14,15,18,0.12), 0 2px 6px rgba(14,15,18,0.06)" };
const trait = (l: number, o = 0.14): React.CSSProperties => ({ height: 8, width: `${l}%`, borderRadius: 4, background: `rgba(14,15,18,${o})` });

/** Un objet du quotidien d'une école, de largeur donnée. */
export const ObjetDessine: React.FC<{ type: Objet; largeur: number; style?: React.CSSProperties }> = ({ type, largeur, style }) => {
  const k = largeur / 200;
  if (type === "edt") {
    return (
      <div style={{ ...carte, width: largeur, height: largeur * 0.74, padding: 12 * k, ...style }}>
        <div style={{ ...trait(56, 0.5), height: 9 * k, marginBottom: 9 * k }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 * k }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{ height: 22 * k, borderRadius: 3 * k, background: [3, 6, 8, 11, 14, 17, 19].includes(i) ? "rgba(0,24,97,0.55)" : "rgba(14,15,18,0.07)" }} />
          ))}
        </div>
      </div>
    );
  }
  if (type === "message") {
    return (
      <div style={{ ...carte, width: largeur, height: largeur * 0.46, borderRadius: 22 * k, padding: 16 * k, display: "flex", alignItems: "center", gap: 10 * k, ...style }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 16 * k, height: 16 * k, borderRadius: 99, background: P.encre, opacity: 0.35 + i * 0.2 }} />
        ))}
        <div style={{ position: "absolute", left: 24 * k, bottom: -12 * k, width: 24 * k, height: 24 * k, background: "#FFFFFF", transform: "rotate(45deg)" }} />
      </div>
    );
  }
  if (type === "courriel") {
    return (
      <div style={{ ...carte, width: largeur, height: largeur * 0.64, overflow: "hidden", ...style }}>
        <svg viewBox="0 0 200 128" width={largeur} height={largeur * 0.64}>
          <path d="M8 10 L100 74 L192 10" stroke={P.encre} strokeOpacity={0.3} strokeWidth={6} fill="none" strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", right: 10 * k, top: 8 * k, minWidth: 34 * k, height: 34 * k, borderRadius: 99, background: P.accent, color: "#FFFFFF", fontFamily: POLICE, fontWeight: 800, fontSize: 18 * k, display: "flex", alignItems: "center", justifyContent: "center" }}>12</div>
      </div>
    );
  }
  // PDF et feuille d'appel : une page avec des lignes
  return (
    <div style={{ ...carte, width: largeur * 0.76, height: largeur, padding: 16 * k, display: "flex", flexDirection: "column", gap: 10 * k, ...style }}>
      {type === "pdf" ? (
        <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 26 * k, color: P.accent }}>PDF</div>
      ) : (
        <div style={{ ...trait(70, 0.5), height: 10 * k }} />
      )}
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
          {type === "appel" && <div style={{ width: 13 * k, height: 13 * k, borderRadius: 3 * k, border: `${2.4 * k}px solid rgba(14,15,18,0.35)` }} />}
          <div style={trait(55 + ((i * 17) % 40))} />
        </div>
      ))}
    </div>
  );
};
