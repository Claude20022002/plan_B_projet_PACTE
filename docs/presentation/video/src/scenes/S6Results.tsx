import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const BW = 1120;
const SCREEN_H = 740;
const GAP = 64;

/**
 * Barres du « défi par équipes » relevées au pixel sur les captures : on recouvre la partie
 * non encore remplie avec la couleur du rail, ce qui anime la vraie interface sans la redessiner.
 */
type Bar = { x0: number; x1: number; y0: number; y1: number; track: string };
const WEB_BARS: Bar[] = [
  { x0: 734, x1: 1189, y0: 414, y1: 426, track: "#EEF0F5" }, // CPI-1B, gagnante
  { x0: 734, x1: 1127, y0: 453, y1: 465, track: "#EEF0F5" }, // CPI-1A
];
const MOBILE_BARS: Bar[] = [
  { x0: 131, x1: 1038, y0: 1078, y1: 1103, track: "#2C2C30" },
  { x0: 131, x1: 929, y0: 1215, y1: 1240, track: "#2C2C30" },
];

const BarMask: React.FC<{ bar: Bar; p: number; radius: number }> = ({ bar, p, radius }) => {
  const x = bar.x0 + (bar.x1 - bar.x0) * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: bar.y0,
        width: Math.max(0, bar.x1 - x + 1),
        height: bar.y1 - bar.y0,
        background: bar.track,
        borderRadius: `0 ${radius}px ${radius}px 0`,
      }}
    />
  );
};

/** 6 · 22–27 s : résultats du quiz sur le web et sur mobile ; les barres des équipes se remplissent. */
export const S6Results: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(0, 30);
  const caption = useEnter(BEAT * 2);
  // La gagnante finit en dernier : elle a le plus long chemin.
  const fill = (i: number) => {
    const p = ramp(frame, BEAT * 2 + i * 4, BEAT * 2 + 40 + i * 4);
    return 1 - Math.pow(1 - p, 3);
  };

  const screenW = (SCREEN_H * 1080) / 2400;
  const phoneW = screenW + Math.round(SCREEN_H * 0.014) * 2;
  const total = BW + GAP + phoneW;
  const left = (1920 - total) / 2;
  const browserH = (BW * 9) / 16 + BROWSER_BAR;
  const top = 92;

  const fromLeft = interpolate(enter, [0, 1], [-260, 0]);
  const fromRight = interpolate(enter, [0, 1], [260, 0]);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <BrowserFrame
        width={BW}
        style={{ left, top: top + (SCREEN_H * 1.028 - browserH) / 2, transform: `translateX(${fromLeft}px)`, opacity: enter }}
      >
        <Screen src="captures/web-17-resultats-etudiant.png" srcW={1920} srcH={1080} width={BW} origin="50% 38%">
          {WEB_BARS.map((b, i) => (
            <BarMask key={i} bar={b} p={fill(i === 0 ? 1 : 0)} radius={6} />
          ))}
        </Screen>
      </BrowserFrame>

      <PhoneFrame
        screenHeight={SCREEN_H}
        style={{ left: left + BW + GAP, top, transform: `translateX(${fromRight}px)`, opacity: enter }}
      >
        <Screen src="captures/mobile-23-resultats-planner-sombre.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]}>
          {MOBILE_BARS.map((b, i) => (
            <BarMask key={i} bar={b} p={fill(i === 0 ? 1 : 0)} radius={12} />
          ))}
        </Screen>
      </PhoneFrame>

      <Line size={50} style={{ ...fadeUp(caption), position: "absolute", left: 0, right: 0, top: 902, textAlign: "center" }}>
        Quiz, équipes, devoirs : une seule connexion.
      </Line>
    </AbsoluteFill>
  );
};
