import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FlapText, flapWidth, tileSize } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { BEAT, C } from "../theme";

type Outil = { mot: string; x: number; y: number; r: number };

/** Les six outils de l'école aujourd'hui, éparpillés : en 16:9 (1920 × 1080) et en 9:16 (1080 × 1920). */
export const OUTILS: Outil[] = [
  { mot: "GMAIL", x: 180, y: 170, r: -4 },
  { mot: "PDF", x: 1180, y: 140, r: 3 },
  { mot: "WHATSAPP", x: 760, y: 340, r: -2 },
  { mot: "CLASSROOM", x: 140, y: 480, r: 2 },
  { mot: "MOODLE", x: 1260, y: 530, r: -3 },
  { mot: "JEUX EXTERNES", x: 560, y: 690, r: 1.5 },
];
export const OUTILS_PORTRAIT: Outil[] = [
  { mot: "GMAIL", x: 110, y: 380, r: -4 },
  { mot: "PDF", x: 720, y: 340, r: 3 },
  { mot: "WHATSAPP", x: 300, y: 590, r: -2 },
  { mot: "CLASSROOM", x: 120, y: 820, r: 2 },
  { mot: "MOODLE", x: 590, y: 1050, r: -3 },
  { mot: "JEUX EXTERNES", x: 170, y: 1280, r: 1.5 },
];
export const FS_OUTILS = 84;
export const FS_OUTILS_PORTRAIT = 76;
/** Centre vers lequel les outils convergent (scène 3) */
export const CENTRE = { x: 960, y: 470 };
export const CENTRE_PORTRAIT = { x: 540, y: 820 };

const BARRE = 4 * 30; // barrés à partir de 4 s dans la scène

/** Étiquette d'outil : tuiles à volets, barrée en orange (statut « reporté ») à partir de `barreA`. */
export const Etiquette: React.FC<{ mot: string; start: number; barreA: number; frame: number; fs?: number }> = ({ mot, start, barreA, frame, fs = FS_OUTILS }) => {
  const { height: th } = tileSize(fs);
  const s = ramp(frame, barreA, barreA + 7);
  const eased = 1 - Math.pow(1 - s, 3);
  const dim = 1 - 0.45 * ramp(frame, barreA + 4, barreA + 12);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ opacity: dim }}>
        <FlapText text={mot} start={start} fontSize={fs} stagger={2} flip={5} fakes={[2, 3]} hiddenBefore />
      </div>
      <div
        style={{
          position: "absolute",
          left: -12,
          width: flapWidth(mot, fs) + 24,
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

/**
 * 2 · « Aujourd'hui, à l'école… » : un outil par temps (0–3 s), barrés l'un après l'autre à
 * 4 s pendant qu'ils s'écartent ; la phrase reste à l'écran jusqu'à la fin de la scène.
 */
export const S2Outils: React.FC = () => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const entete = useEnter(0, 14);
  const phrase = useEnter(BARRE + 15);
  const ecart = ramp(frame, BARRE, BARRE + 30);
  const outils = portrait ? OUTILS_PORTRAIT : OUTILS;
  const fs = portrait ? FS_OUTILS_PORTRAIT : FS_OUTILS;
  const centre = portrait ? CENTRE_PORTRAIT : CENTRE;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Line
        size={portrait ? 60 : 48}
        weight={400}
        color={C.inkSoft}
        style={{ ...fadeUp(entete), position: "absolute", left: 0, right: 0, top: portrait ? 170 : 50, textAlign: "center" }}
      >
        Aujourd'hui, à l'école :
      </Line>
      {outils.map((o, i) => {
        const cx = o.x + flapWidth(o.mot, fs) / 2 - centre.x;
        const cy = o.y - centre.y;
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
            <Etiquette mot={o.mot} start={i * BEAT} barreA={BARRE + i * 6} frame={frame} fs={fs} />
          </div>
        );
      })}
      <Line
        size={portrait ? 72 : 62}
        style={{ ...fadeUp(phrase), position: "absolute", left: portrait ? 80 : 0, right: portrait ? 80 : 0, top: portrait ? 1560 : 900, textAlign: "center" }}
      >
        6 outils qui ne se parlent pas.
      </Line>
    </AbsoluteFill>
  );
};
