import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Line, PhoneFrame } from "../components/Frames";
import { TelephoneFormes } from "../components/TelephoneFormes";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { C, FONT_TITLE, RADIUS, SHADOW } from "../theme";
import { phoneGeometry } from "./S3Convergence";

const REPONSES = 23; // réponses reçues, sur 29 étudiants
const BONNE = 1; // 30 kN·m : la deuxième tuile
// Les quatre tuiles de réponse sur la maquette du projecteur (1920 × 1080), en pixels de l'image
const TUILES = [
  { x: 56, y: 780 },
  { x: 969, y: 780 },
  { x: 56, y: 917 },
  { x: 969, y: 917 },
].map((t) => ({ ...t, w: 895, h: 119 }));

/**
 * L'écran de la salle : la maquette du projecteur (captures/maquette-quiz-projecteur-illustration.png)
 * dont le chrono et le compteur de réponses sont recouverts pour être animés, puis la bonne
 * réponse qui s'allume. Les enfants sont posés dans le repère de l'image (1920 × 1080).
 */
const EcranDeSalle: React.FC<{ largeur: number; chrono: number; recues: number; revelation: number }> = ({ largeur, chrono, recues, revelation }) => (
  <div style={{ width: largeur, height: (largeur * 9) / 16, borderRadius: RADIUS, overflow: "hidden", boxShadow: `${SHADOW}, 0 0 0 1px ${C.rule}`, position: "relative" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${largeur / 1920})`, transformOrigin: "0 0", fontFamily: FONT_TITLE, fontWeight: 700, color: C.ink }}>
      <Img src={staticFile("captures/maquette-quiz-projecteur-illustration.png")} style={{ width: 1920, height: 1080, display: "block" }} />
      {/* Le « CODE 482 913 » de la maquette est recouvert : le quiz se rejoint depuis la séance, sans code */}
      <div style={{ position: "absolute", left: 1580, top: 10, width: 320, height: 76, background: "#001861" }} />
      {/* Chrono : l'intérieur du cercle est recouvert, le chiffre redessiné à la même place */}
      <div style={{ position: "absolute", left: 64, top: 523, width: 104, height: 104, borderRadius: 52, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>{chrono}</div>
      {/* Compteur de réponses */}
      <div style={{ position: "absolute", left: 188, top: 546, width: 68, height: 64, background: C.bg, display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: 48 }}>{recues}</div>
      {TUILES.map((t, i) =>
        i === BONNE ? (
          <div key={i} style={{ position: "absolute", left: t.x, top: t.y, width: t.w, height: t.h, borderRadius: 4, boxShadow: `inset 0 0 0 ${8 * revelation}px ${C.ink}` }} />
        ) : (
          <div key={i} style={{ position: "absolute", left: t.x, top: t.y, width: t.w, height: t.h, background: C.bg, opacity: 0.72 * revelation }} />
        ),
      )}
    </div>
  </div>
);

/**
 * 6 · le quiz en direct. La question et son schéma sont à l'écran de la salle ; sur le téléphone,
 * quatre formes. Les réponses arrivent, l'étudiante touche la sienne, puis la bonne réponse
 * s'allume. `duree` (en images) cale les étapes : la scène sert au montage long et au court.
 */
export const M6Quiz: React.FC<{ duree: number; titre?: string }> = ({ duree, titre }) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const entree = useEnter(8, 28);
  const l1 = useEnter(4);
  const l2 = useEnter(Math.round(duree * 0.3));
  const debutReponses = Math.round(duree * 0.22);
  const finReponses = Math.round(duree * 0.72);
  const toucher = Math.round(duree * 0.5);
  const debutRevelation = Math.round(duree * 0.78);

  const recues = Math.round(REPONSES * ramp(frame, debutReponses, finReponses));
  // 20 secondes pour répondre : le chrono descend de 20 à 6 pendant que les réponses arrivent
  const chrono = Math.round(interpolate(frame, [0, debutRevelation], [20, 6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const touche = ramp(frame, toucher, toucher + 12);
  const revelation = ramp(frame, debutRevelation, debutRevelation + 10);
  const l3 = useEnter(debutRevelation + 4);

  const screenH = portrait ? 780 : 660;
  const { screenW, phoneW, phoneH } = phoneGeometry(screenH);
  const telephone = <TelephoneFormes largeur={screenW} chrono={chrono} choisie={frame >= toucher ? BONNE : null} touche={touche} />;
  const phrases = (taille: number, sous: number) => (
    <>
      <Line size={taille} style={fadeUp(l1)}>{titre ?? "La question est à l'écran de la salle."}</Line>
      <div style={{ position: "relative", marginTop: 14, height: sous * 1.3 }}>
        <Line size={sous} weight={400} color={C.inkSoft} style={{ ...fadeUp(l2), opacity: l2 * (1 - revelation), position: "absolute", left: 0, right: 0 }}>
          Sur le téléphone : quatre formes, sans code à saisir.
        </Line>
        <Line size={sous} weight={400} color={C.inkSoft} style={{ ...fadeUp(l3), position: "absolute", left: 0, right: 0 }}>
          La bonne réponse s'allume : 30 kN·m.
        </Line>
      </div>
    </>
  );

  if (portrait) {
    const largeur = 980;
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <div style={{ position: "absolute", left: 60, right: 60, top: 170, textAlign: "center" }}>{phrases(62, 42)}</div>
        <div style={{ position: "absolute", left: (1080 - largeur) / 2, top: 430, opacity: entree, transform: `translateY(${(1 - entree) * 60}px)` }}>
          <EcranDeSalle largeur={largeur} chrono={chrono} recues={recues} revelation={revelation} />
        </div>
        <PhoneFrame screenHeight={screenH} style={{ left: (1080 - phoneW) / 2, top: 1040, opacity: entree, transform: `translateY(${(1 - entree) * 120}px)` }}>
          {telephone}
        </PhoneFrame>
      </AbsoluteFill>
    );
  }

  const largeur = 1200;
  const hauteur = (largeur * 9) / 16;
  const gauche = (1920 - largeur - 64 - phoneW) / 2;
  const haut = 104;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: gauche, top: haut + (phoneH - hauteur) / 2, opacity: entree, transform: `translateX(${(1 - entree) * -200}px)` }}>
        <EcranDeSalle largeur={largeur} chrono={chrono} recues={recues} revelation={revelation} />
      </div>
      <PhoneFrame screenHeight={screenH} style={{ left: gauche + largeur + 64, top: haut, opacity: entree, transform: `translateX(${(1 - entree) * 200}px)` }}>
        {telephone}
      </PhoneFrame>
      <div style={{ position: "absolute", left: 0, right: 0, top: 838, textAlign: "center" }}>{titre ? phrases(96, 48) : phrases(52, 40)}</div>
    </AbsoluteFill>
  );
};
