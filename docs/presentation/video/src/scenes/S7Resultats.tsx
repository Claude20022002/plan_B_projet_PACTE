import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const BW = 1120;
const SCREEN_H = 740;
const GAP = 64;
const DEVOIR = 105; // 30,5 s du film
const BW_DEVOIR = 1380;

/**
 * Barres du « défi par équipes » relevées au pixel sur les captures : on recouvre la partie
 * non encore remplie avec la couleur du rail, ce qui anime la vraie interface sans la redessiner.
 */
type Bar = { x0: number; x1: number; y0: number; y1: number; track: string };
const WEB_BARS: Bar[] = [
  { x0: 735, x1: 1186, y0: 340, y1: 350, track: "#EEF0F5" }, // équipe gagnante
  { x0: 735, x1: 1125, y0: 379, y1: 389, track: "#EEF0F5" },
];
const MOBILE_BARS: Bar[] = [
  { x0: 131, x1: 1037, y0: 1080, y1: 1101, track: "#DADDE5" }, // CPI-1B, gagnante
  { x0: 132, x1: 927, y0: 1218, y1: 1239, track: "#DADDE5" },
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

/**
 * 7 · 27–33 s : résultats d'un quiz côté enseignant (web) et étudiant (téléphone), les barres
 * des équipes se remplissent ; à 30,5 s, coupe sur le devoir noté.
 */
export const S7Resultats: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(0, 30);
  const l1 = useEnter(BEAT * 2);
  const l2 = useEnter(DEVOIR + 6);
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

  if (frame >= DEVOIR) {
    const hDevoir = (BW_DEVOIR * 9) / 16 + BROWSER_BAR;
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <BrowserFrame width={BW_DEVOIR} style={{ left: (1920 - BW_DEVOIR) / 2, top: (900 - hDevoir) / 2 + 10 }}>
          <Screen src="captures/web-26-devoir-notes.png" srcW={1920} srcH={1080} width={BW_DEVOIR} origin="50% 35%" duration={75} />
        </BrowserFrame>
        <Line size={52} style={{ ...fadeUp(l2), position: "absolute", left: 0, right: 0, top: 930, textAlign: "center" }}>
          Les résultats restent à l'école.
        </Line>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <BrowserFrame
        width={BW}
        style={{ left, top: top + (SCREEN_H * 1.028 - browserH) / 2, transform: `translateX(${fromLeft}px)`, opacity: enter }}
      >
        <Screen src="captures/web-21-resultats-enseignant.png" srcW={1920} srcH={1080} width={BW} origin="50% 38%">
          {WEB_BARS.map((b, i) => (
            <BarMask key={i} bar={b} p={fill(i === 0 ? 1 : 0)} radius={5} />
          ))}
        </Screen>
      </BrowserFrame>
      <PhoneFrame screenHeight={SCREEN_H} style={{ left: left + BW + GAP, top, transform: `translateX(${fromRight}px)`, opacity: enter }}>
        <Screen src="captures/mobile-13-resultats.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]}>
          {MOBILE_BARS.map((b, i) => (
            <BarMask key={i} bar={b} p={fill(i === 0 ? 1 : 0)} radius={10} />
          ))}
        </Screen>
      </PhoneFrame>
      <Line size={52} style={{ ...fadeUp(l1), position: "absolute", left: 0, right: 0, top: 902, textAlign: "center" }}>
        Quiz, défis, devoirs notés.
      </Line>
    </AbsoluteFill>
  );
};
