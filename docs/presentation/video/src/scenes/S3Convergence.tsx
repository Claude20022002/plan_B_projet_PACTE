import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Embleme } from "../components/Embleme";
import { flapWidth } from "../components/Flap";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { C } from "../theme";
import { Etiquette, FS_OUTILS, OUTILS } from "./S2Outils";

export const PHONE_SCREEN_H = 900;
export const phoneGeometry = (screenH = PHONE_SCREEN_H) => {
  const screenW = (screenH * 1080) / 2400;
  const bezel = Math.round(screenH * 0.014);
  return { screenW, phoneW: screenW + bezel * 2, phoneH: screenH + bezel * 2 };
};
/** Position du téléphone à droite, commune aux scènes 3 à 5. */
export const PHONE_LEFT = 1150;
export const PHONE_TOP = (1080 - phoneGeometry().phoneH) / 2;

const EMBLEME = 220;

/**
 * 3 · 9–12 s : les six étiquettes convergent vers le centre et se fondent dans l'emblème
 * (0–1 s) ; l'emblème rétrécit vers l'écran du téléphone qui monte avec l'accueil de l'app.
 */
export const S3Convergence: React.FC = () => {
  const frame = useCurrentFrame();
  const converge = ramp(frame, 0, 26);
  const c = converge * converge; // accélère vers le centre
  const vers = ramp(frame, 45, 70);
  const v = 1 - Math.pow(1 - vers, 3);
  const monte = useEnter(42, 32);
  const phrase = useEnter(52);
  const { phoneW } = phoneGeometry();

  const embCx = interpolate(v, [0, 1], [960, PHONE_LEFT + phoneW / 2]);
  const embCy = 470;
  const tuile = EMBLEME * 1.28;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {OUTILS.map((o) => {
        const w = flapWidth(o.mot, FS_OUTILS);
        const dx = (960 - (o.x + w / 2)) * c;
        const dy = (470 - o.y) * c;
        return (
          <div
            key={o.mot}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              opacity: 1 - ramp(frame, 14, 26),
              transform: `translate(${dx}px, ${dy}px) rotate(${o.r * (1 - c)}deg) scale(${1 - 0.7 * c})`,
            }}
          >
            <Etiquette mot={o.mot} start={-200} barreA={-200} frame={frame} />
          </div>
        );
      })}

      <PhoneFrame screenHeight={PHONE_SCREEN_H} style={{ left: PHONE_LEFT, top: PHONE_TOP, transform: `translateY(${(1 - monte) * (1080 - PHONE_TOP + 40)}px)` }}>
        <Screen src="captures/mobile-38-tableau.png" srcW={1080} srcH={2400} width={phoneGeometry().screenW} zoom={[1, 1]} />
      </PhoneFrame>

      <div
        style={{
          position: "absolute",
          left: embCx - tuile / 2,
          top: embCy - tuile / 2,
          transform: `scale(${1 - 0.72 * v})`,
          opacity: 1 - ramp(frame, 62, 72),
        }}
      >
        <Embleme start={14} size={EMBLEME} stagger={1} stiffness={230} tileStart={12} />
      </div>

      <div style={{ position: "absolute", left: 140, top: 430, width: 860 }}>
        <Line size={92} style={fadeUp(phrase)}>Une seule application.</Line>
      </div>
    </AbsoluteFill>
  );
};
