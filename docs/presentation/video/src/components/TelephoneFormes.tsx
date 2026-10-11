import React from "react";
import { Img, staticFile } from "remotion";
import { C, FONT_TITLE } from "../theme";

// Couleurs des quatre réponses : COULEURS_REPONSES de mobile/src/app/quiz.jsx
const COULEURS = ["#3B63E0", "#0F8A7E", "#7048C9", "#B03A8C"];

/**
 * Le téléphone d'un joueur pendant une question projetée : quatre formes, rien à lire. C'est ce
 * que l'application affiche aujourd'hui (mobile/src/app/quiz.jsx, mode « kahoot »), redessiné ici
 * parce que l'application bloque les captures d'écran pendant une partie.
 * Dessiné dans un repère de 390 points de large, puis mis à l'échelle de l'écran.
 * @param choisie tuile touchée par l'étudiant (0 à 3), ou null
 * @param touche progression du toucher, de 0 à 1
 */
export const TelephoneFormes: React.FC<{ largeur: number; chrono: number; choisie: number | null; touche: number }> = ({ largeur, chrono, choisie, touche }) => {
  const k = largeur / 390;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 390, height: 868, transform: `scale(${k})`, transformOrigin: "0 0", background: C.bg, fontFamily: FONT_TITLE }}>
      <div style={{ background: C.navy, padding: "57px 16px 12px", color: "#FFFFFF", fontWeight: 700, fontSize: 22, letterSpacing: 1.2, textTransform: "uppercase" }}>Résistance des matériaux</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
        <div style={{ flex: "none", width: 56, height: 56, borderRadius: 28, border: `3px solid ${C.cancelled}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink, fontWeight: 700, fontSize: 24 }}>
          {chrono}
        </div>
        <div style={{ color: C.ink, fontWeight: 700, fontSize: 22, lineHeight: "26px" }}>Regardez l'écran</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px" }}>
        {COULEURS.map((couleur, i) => {
          const active = choisie === i;
          return (
            <div
              key={couleur}
              style={{
                height: 300,
                borderRadius: 3,
                background: couleur,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: choisie !== null && !active ? 1 - 0.55 * touche : 1,
                outline: active ? `${4 * touche}px solid ${C.ink}` : "none",
                outlineOffset: -4,
                transform: active ? `scale(${1 - 0.04 * Math.sin(touche * Math.PI)})` : undefined,
              }}
            >
              <Img src={staticFile(`formes/${i}.svg`)} style={{ width: 96, height: 96 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
