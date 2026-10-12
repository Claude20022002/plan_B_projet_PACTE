import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Heure, Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { C, FONT_TEXT, FONT_TITLE, RADIUS, SHADOW } from "../theme";
import { phoneGeometry } from "./S3Convergence";

// Les présents affichés sur la capture de l'appel projeté (1920 × 1080) : 3 colonnes, 4 rangées, 11 noms
const PRESENTS = 11;
const COLONNES = [1243, 1463, 1684];
const RANGEES = [182, 245, 307, 370];
const FOND = "#0B0B0D";

/**
 * L'appel projeté (capture réelle : prof-05-appel-projection.png). Les noms des présents sont
 * recouverts puis découverts un à un, comme lorsqu'ils scannent, et le compteur les suit.
 * Les enfants sont posés dans le repère de la capture.
 */
const AppelProjete: React.FC<{ largeur: number; arrives: number }> = ({ largeur, arrives }) => (
  <div style={{ width: largeur, height: (largeur * 9) / 16, borderRadius: RADIUS, overflow: "hidden", boxShadow: `${SHADOW}, 0 0 0 1px ${C.rule}`, position: "relative" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${largeur / 1920})`, transformOrigin: "0 0" }}>
      <Img src={staticFile("captures/prof-05-appel-projection.png")} style={{ width: 1920, height: 1080, display: "block" }} />
      {Array.from({ length: PRESENTS }, (_, i) =>
        i < arrives ? null : <div key={i} style={{ position: "absolute", left: COLONNES[i % 3] - 4, top: RANGEES[Math.floor(i / 3)] - 4, width: 222, height: 64, background: FOND }} />,
      )}
      {/* Compteur : le nombre de la capture (11) est recouvert, celui du moment redessiné à sa place */}
      <div style={{ position: "absolute", left: 1228, top: 116, width: 62, height: 62, background: FOND, display: "flex", alignItems: "center", justifyContent: "flex-end", fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 50, color: C.ink }}>
        {arrives}
      </div>
    </div>
  </div>
);

// Le viseur du scanner sur la capture app-04-scanner.png (1080 × 2400), et le QR de l'appel projeté
// sur prof-05-appel-projection.png (carré blanc de 734 px, à partir de 254 × 153 ; 5 px de marge)
const VISEUR = { x: 226, y: 771, cote: 627 };
const QR = { x: 249, y: 148, cote: 744 };

/**
 * Ce que la caméra voit : la capture du scanner montre la scène factice de l'émulateur, recouverte
 * ici par l'écran projeté (le vrai QR de la capture de l'appel) dans une salle sombre. Le viseur et
 * la consigne de l'application sont redessinés à leur place. Repère de la capture du scanner.
 */
const VueCamera: React.FC = () => {
  const taille = 560; // le QR dans le viseur
  const k = taille / QR.cote;
  return (
    <>
      <Heure texte="13:35" />
      <div style={{ position: "absolute", left: 0, top: 312, width: 1080, height: 2088, background: "radial-gradient(circle at 50% 37%, #3a3d46 0%, #17181c 55%, #0b0b0d 100%)" }} />
      <div style={{ position: "absolute", left: VISEUR.x + (VISEUR.cote - taille) / 2, top: VISEUR.y + (VISEUR.cote - taille) / 2, width: taille, height: taille, overflow: "hidden", transform: "rotate(-1.5deg)", boxShadow: "0 0 90px rgba(255,255,255,0.22)" }}>
        <Img src={staticFile("captures/prof-05-appel-projection.png")} style={{ position: "absolute", left: -QR.x * k, top: -QR.y * k, width: 1920 * k, height: 1080 * k }} />
      </div>
      <div style={{ position: "absolute", left: VISEUR.x, top: VISEUR.y, width: VISEUR.cote, height: VISEUR.cote, border: "6px solid #FFFFFF", borderRadius: 44 }} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 2170, textAlign: "center", fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 42, lineHeight: "50px", color: "#FFFFFF" }}>
        Visez le QR code affiché par votre enseignant : appel ou quiz
      </div>
      <div style={{ position: "absolute", left: 398, top: 2356, width: 284, height: 10, borderRadius: 5, background: "#FFFFFF" }} />
    </>
  );
};

/**
 * 5 · l'appel par QR code : l'écran projeté par le professeur, et le scanner de l'application.
 * `duree` (en images) cale l'arrivée des présents : la scène sert au montage long et au court.
 */
export const M5Appel: React.FC<{ duree: number }> = ({ duree }) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const entree = useEnter(6, 28);
  const l1 = useEnter(4);
  const l2 = useEnter(Math.round(duree * 0.45));
  const arrives = Math.round(PRESENTS * ramp(frame, Math.round(duree * 0.2), Math.round(duree * 0.85)));

  const screenH = portrait ? 720 : 620;
  const { screenW, phoneW, phoneH } = phoneGeometry(screenH);
  const telephone = (
    <Screen src="captures/app-04-scanner.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]}>
      <VueCamera />
    </Screen>
  );
  const phrases = (taille: number, sous: number) => (
    <>
      <Line size={taille} style={fadeUp(l1)}>L'appel en une minute : chacun scanne, son nom apparaît.</Line>
      <Line size={sous} weight={400} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 14 }}>
        Le code change toutes les 30 secondes : impossible de le passer à un absent.
      </Line>
    </>
  );

  if (portrait) {
    const largeur = 980;
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <div style={{ position: "absolute", left: 60, right: 60, top: 170, textAlign: "center" }}>{phrases(58, 40)}</div>
        <div style={{ position: "absolute", left: (1080 - largeur) / 2, top: 500, opacity: entree, transform: `translateY(${(1 - entree) * 60}px)` }}>
          <AppelProjete largeur={largeur} arrives={arrives} />
        </div>
        <PhoneFrame screenHeight={screenH} style={{ left: (1080 - phoneW) / 2, top: 1110, opacity: entree, transform: `translateY(${(1 - entree) * 120}px)` }}>
          {telephone}
        </PhoneFrame>
      </AbsoluteFill>
    );
  }

  const largeur = 1220;
  const hauteur = (largeur * 9) / 16;
  const gauche = (1920 - largeur - 64 - phoneW) / 2;
  const haut = 100;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: gauche, top: haut, opacity: entree, transform: `translateX(${(1 - entree) * -200}px)` }}>
        <AppelProjete largeur={largeur} arrives={arrives} />
      </div>
      <PhoneFrame screenHeight={screenH} style={{ left: gauche + largeur + 64, top: haut + (hauteur - phoneH) / 2, opacity: entree, transform: `translateX(${(1 - entree) * 200}px)` }}>
        {telephone}
      </PhoneFrame>
      <div style={{ position: "absolute", left: 0, right: 0, top: 840, textAlign: "center" }}>{phrases(50, 38)}</div>
    </AbsoluteFill>
  );
};
