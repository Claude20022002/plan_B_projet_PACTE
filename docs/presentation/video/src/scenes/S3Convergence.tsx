import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Embleme } from "../components/Embleme";
import { flapWidth } from "../components/Flap";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { C } from "../theme";
import { CENTRE, CENTRE_PORTRAIT, Etiquette, FS_OUTILS, FS_OUTILS_PORTRAIT, OUTILS, OUTILS_PORTRAIT } from "./S2Outils";

export const PHONE_SCREEN_H = 900;
export const phoneGeometry = (screenH = PHONE_SCREEN_H) => {
  const screenW = (screenH * 1080) / 2400;
  const bezel = Math.round(screenH * 0.014);
  return { screenW, phoneW: screenW + bezel * 2, phoneH: screenH + bezel * 2 };
};
/** Position du téléphone à droite (16:9), commune aux scènes 3 à 5. */
export const PHONE_LEFT = 1150;
export const PHONE_TOP = (1080 - phoneGeometry().phoneH) / 2;
/** En 9:16 : téléphone centré sous la phrase, commun aux scènes 3 à 5. */
export const PORTRAIT_SCREEN_H = 1240;
export const PORTRAIT_TOP = 560;
export const portraitLeft = () => (1080 - phoneGeometry(PORTRAIT_SCREEN_H).phoneW) / 2;

/**
 * 3 · « Une seule application, pour toute l'école. » Les six étiquettes convergent vers le centre
 * et se fondent dans l'emblème (0–1 s) ; l'emblème rejoint l'écran du téléphone qui monte avec
 * l'accueil de l'application ; la phrase reste jusqu'à la fin.
 */
export const S3Convergence: React.FC = () => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const converge = ramp(frame, 0, 26);
  const c = converge * converge; // accélère vers le centre
  const vers = ramp(frame, 45, 70);
  const v = 1 - Math.pow(1 - vers, 3);
  const monte = useEnter(42, 32);
  const l1 = useEnter(52);
  const l2 = useEnter(72);

  const outils = portrait ? OUTILS_PORTRAIT : OUTILS;
  const fs = portrait ? FS_OUTILS_PORTRAIT : FS_OUTILS;
  const centre = portrait ? CENTRE_PORTRAIT : CENTRE;
  const screenH = portrait ? PORTRAIT_SCREEN_H : PHONE_SCREEN_H;
  const { screenW, phoneW } = phoneGeometry(screenH);
  const phoneLeft = portrait ? portraitLeft() : PHONE_LEFT;
  const phoneTop = portrait ? PORTRAIT_TOP : PHONE_TOP;
  const embleme = portrait ? 260 : 220;
  const tuile = embleme * 1.28;
  const embCx = interpolate(v, [0, 1], [centre.x, phoneLeft + phoneW / 2]);
  const embCy = interpolate(v, [0, 1], [centre.y, portrait ? phoneTop + screenH / 2 : centre.y]);
  const hauteurEcran = portrait ? 1920 : 1080;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {outils.map((o) => {
        const w = flapWidth(o.mot, fs);
        const dx = (centre.x - (o.x + w / 2)) * c;
        const dy = (centre.y - o.y) * c;
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
            <Etiquette mot={o.mot} start={-200} barreA={-200} frame={frame} fs={fs} />
          </div>
        );
      })}

      <PhoneFrame screenHeight={screenH} style={{ left: phoneLeft, top: phoneTop, transform: `translateY(${(1 - monte) * (hauteurEcran - phoneTop + 40)}px)` }}>
        <Screen src="captures/mobile-38-tableau.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]} />
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
        <Embleme start={14} size={embleme} stagger={1} stiffness={230} tileStart={12} />
      </div>

      {portrait ? (
        <div style={{ position: "absolute", left: 80, right: 80, top: 150, textAlign: "center" }}>
          <Line size={80} style={fadeUp(l1)}>Une seule application,</Line>
          <Line size={80} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 10 }}>
            pour toute l'école.
          </Line>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 140, top: 380, width: 900 }}>
          <Line size={88} style={fadeUp(l1)}>Une seule application,</Line>
          <Line size={88} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 12 }}>
            pour toute l'école.
          </Line>
        </div>
      )}
    </AbsoluteFill>
  );
};
