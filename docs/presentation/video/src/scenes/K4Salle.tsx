import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Reflet } from "../components/Camera";
import { Destination } from "../components/Destination";
import { FlapText } from "../components/Flap";
import { Heure, Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { C, FONT_TEXT } from "../theme";
import { phoneGeometry } from "./S3Convergence";

const SCREEN_H = 860;
const PHONE = { x: 1180, y: 98 };
// « G-S05 » sur la capture du tableau (app-01-tableau.png, 1080 × 2400) : le point fixe du zoom
const SALLE = { x: 250, y: 990 };
const TROUVE = 70; // la case du panneau se fixe sur la salle

/**
 * Keynote · 4 · le rappel de l'ouverture : à gauche, le panneau cherche encore la salle ; à droite,
 * le téléphone de l'étudiante arrive en perspective, la caméra avance sur « G-S05 », et la case du
 * panneau se fixe au même instant sur G-S05. Capture réelle du 11 octobre 2026, remise à 13:30.
 */
export const K4Salle: React.FC = () => {
  const frame = useCurrentFrame();
  const arrivee = useEnter(0, 30);
  const avance = ramp(frame, 52, 96);
  const doux = avance * avance * (3 - 2 * avance);
  const phrase = useEnter(TROUVE + 18);
  const { screenW } = phoneGeometry(SCREEN_H);
  const bord = Math.round(SCREEN_H * 0.014);
  const k = screenW / 1080;
  const origine = `${bord + SALLE.x * k}px ${bord + SALLE.y * k}px`;
  const rotation = interpolate(arrivee, [0, 1], [-42, -14]) * (1 - doux);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 140, top: 330, display: "flex", flexDirection: "column", gap: 40 }}>
        <FlapText text="SALLE" start={-100} fontSize={120} stagger={2} flip={4} />
        <Destination texte="G-S05" debut={-60} trouve={TROUVE} fontSize={120} seed="salle" />
        <Line size={96} style={{ ...fadeUp(phrase, 26), marginTop: 40 }}>
          Elle sait où aller.
        </Line>
      </div>
      <div style={{ position: "absolute", left: PHONE.x, top: PHONE.y, perspective: 2000 }}>
        <div
          style={{
            transformOrigin: origine,
            transform: `translateX(${(1 - arrivee) * 260}px) rotateY(${rotation}deg) rotateX(${(1 - arrivee) * 8}deg) scale(${1 + 0.55 * doux})`,
            opacity: Math.min(1, arrivee * 1.6),
          }}
        >
          <PhoneFrame screenHeight={SCREEN_H} style={{ position: "relative" }}>
            <Screen src="captures/app-01-tableau.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]}>
              <Heure texte="13:30" />
              <div style={{ position: "absolute", left: 40, top: 340, width: 300, height: 56, background: "#f3f4f7", display: "flex", alignItems: "center", paddingLeft: 4, fontFamily: FONT_TEXT, fontSize: 30, color: "#5f6778" }}>
                Mis à jour à 13:30
              </div>
            </Screen>
            <Reflet debut={14} duree={24} intensite={0.28} />
          </PhoneFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};
