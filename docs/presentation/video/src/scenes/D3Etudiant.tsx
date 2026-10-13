import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { C, RADIUS, SHADOW } from "../theme";
import { HeureTableau } from "./M3Etudiante";
import { phoneGeometry } from "./S3Convergence";

const SCREEN_H = 800;
const PHONE = { x: 250, y: 30 };
// La carte de la séance en cours sur la capture du tableau (app-01-tableau.png, 1080 × 2400)
const CARTE = { x: 40, y: 453, l: 1000, h: 739 };
// Où la carte agrandie se pose, et à quelle échelle
const GRAND = { x: 770, y: 74, k: 0.9 };

/**
 * 3 · l'étudiant sait où aller. Son téléphone à gauche ; la carte de la séance en cours sort de
 * l'écran et vient se poser en grand à droite : l'heure, le cours, la salle. Capture réelle du
 * 11 octobre 2026, remise à l'heure de l'histoire.
 */
export const D3Etudiant: React.FC<{ titre: string; duree: number }> = ({ titre, duree }) => {
  const tel = useEnter(2, 22);
  const sortie = useEnter(16, 30);
  const texte = useEnter(8);
  const { screenW } = phoneGeometry(SCREEN_H);
  const bord = Math.round(SCREEN_H * 0.014);
  const petit = screenW / 1080;

  // De sa place dans le téléphone à sa place en grand
  const k = interpolate(sortie, [0, 1], [petit, GRAND.k]);
  const x = interpolate(sortie, [0, 1], [PHONE.x + bord + CARTE.x * petit, GRAND.x]);
  const y = interpolate(sortie, [0, 1], [PHONE.y + bord + CARTE.y * petit, GRAND.y]);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <PhoneFrame screenHeight={SCREEN_H} style={{ left: PHONE.x, top: PHONE.y, opacity: tel, transform: `translateY(${(1 - tel) * 60}px)` }}>
        <Screen src="captures/app-01-tableau.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]} duration={duree}>
          <HeureTableau />
        </Screen>
      </PhoneFrame>
      <div style={{ position: "absolute", left: x, top: y, width: CARTE.l * k, height: CARTE.h * k, overflow: "hidden", borderRadius: RADIUS, opacity: Math.min(1, sortie * 3), boxShadow: `${SHADOW}, 0 0 0 1px ${C.rule}` }}>
        <Img src={staticFile("captures/app-01-tableau.png")} style={{ position: "absolute", left: -CARTE.x * k, top: -CARTE.y * k, width: 1080 * k, height: 2400 * k }} />
      </div>
      <Line size={104} style={{ ...fadeUp(texte, 26), position: "absolute", left: 60, right: 60, top: 900, textAlign: "center" }}>
        {titre}
      </Line>
    </AbsoluteFill>
  );
};
