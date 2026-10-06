import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FlapText, flapWidth, tileSize } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

/** Les six outils de l'école aujourd'hui, éparpillés (repère 1920 × 1080). */
export const OUTILS = [
  { mot: "GMAIL", x: 180, y: 150, r: -4 },
  { mot: "PDF", x: 1180, y: 120, r: 3 },
  { mot: "WHATSAPP", x: 760, y: 330, r: -2 },
  { mot: "CLASSROOM", x: 140, y: 470, r: 2 },
  { mot: "MOODLE", x: 1260, y: 520, r: -3 },
  { mot: "JEUX EXTERNES", x: 560, y: 690, r: 1.5 },
];
export const FS_OUTILS = 84;
const BARRE = 90; // 7,0 s du film = 3,0 s dans la scène

/** Étiquette d'outil : tuiles à volets, barrée en orange (statut « reporté ») à partir de `barreA`. */
export const Etiquette: React.FC<{ mot: string; start: number; barreA: number; frame: number }> = ({ mot, start, barreA, frame }) => {
  const { height: th } = tileSize(FS_OUTILS);
  const s = ramp(frame, barreA, barreA + 7);
  const eased = 1 - Math.pow(1 - s, 3);
  const dim = 1 - 0.45 * ramp(frame, barreA + 4, barreA + 12);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ opacity: dim }}>
        <FlapText text={mot} start={start} fontSize={FS_OUTILS} stagger={2} flip={5} fakes={[2, 3]} hiddenBefore />
      </div>
      <div
        style={{
          position: "absolute",
          left: -12,
          width: flapWidth(mot, FS_OUTILS) + 24,
          top: th / 2 - 4,
          height: 8,
          borderRadius: 4,
          background: C.delayed,
          transform: `scaleX(${eased})`,
          transformOrigin: "0 50%",
        }}
      />
    </div>
  );
};

/** 2 · 4–9 s : un outil par temps, puis ils s'écartent et sont barrés l'un après l'autre. */
export const S2Outils: React.FC = () => {
  const frame = useCurrentFrame();
  const phrase = useEnter(105);
  const ecart = ramp(frame, BARRE, BARRE + 30);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {OUTILS.map((o, i) => {
        const cx = o.x + flapWidth(o.mot, FS_OUTILS) / 2 - 960;
        const cy = o.y - 450;
        const n = Math.hypot(cx, cy) || 1;
        return (
          <div
            key={o.mot}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              transform: `translate(${(cx / n) * 24 * ecart}px, ${(cy / n) * 24 * ecart}px) rotate(${o.r}deg)`,
            }}
          >
            <Etiquette mot={o.mot} start={i * BEAT} barreA={BARRE + i * 6} frame={frame} />
          </div>
        );
      })}
      <Line size={62} style={{ ...fadeUp(phrase), position: "absolute", left: 0, right: 0, top: 900, textAlign: "center" }}>
        6 outils qui ne se parlent pas.
      </Line>
    </AbsoluteFill>
  );
};
