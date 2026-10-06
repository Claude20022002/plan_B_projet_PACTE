import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { C } from "../theme";
import { phoneGeometry } from "./S3Convergence";

const NAVIGATEUR = 105; // 3,5 s dans la scène
const SCREEN_H = 780;
const BW = 1040;
const GAP = 70;

/**
 * 6 · les supports d'un cours sur le téléphone, centré ; à 3,5 s le téléphone se
 * décale à gauche et le PDF officiel du mois entre par la droite dans le navigateur.
 */
export const S6Supports: React.FC = () => {
  const frame = useCurrentFrame();
  const l1 = useEnter(6);
  const nav = useEnter(NAVIGATEUR, 26);
  const l2 = useEnter(NAVIGATEUR + 6);
  const { screenW, phoneW, phoneH } = phoneGeometry(SCREEN_H);

  const total = phoneW + GAP + BW;
  const gauche = (1920 - total) / 2;
  const phoneLeft = interpolate(nav, [0, 1], [(1920 - phoneW) / 2, gauche]);
  const top = 70;
  const browserH = (BW * 9) / 16 + BROWSER_BAR;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <PhoneFrame screenHeight={SCREEN_H} style={{ left: phoneLeft, top }}>
        <Screen src="captures/mobile-39-supports-module.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1.04]} origin="50% 20%" />
      </PhoneFrame>
      <BrowserFrame
        width={BW}
        style={{ left: gauche + phoneW + GAP, top: top + (phoneH - browserH) / 2, opacity: nav, transform: `translateX(${(1 - nav) * 420}px)` }}
      >
        <Screen src="captures/web-09-edt-mensuel.png" srcW={1920} srcH={1080} width={BW} origin="55% 40%" duration={105} />
      </BrowserFrame>
      <div style={{ position: "absolute", left: 0, right: 0, top: 920, textAlign: "center" }}>
        <Line size={52} style={{ ...fadeUp(l1), opacity: l1 * (1 - ramp(frame, NAVIGATEUR, NAVIGATEUR + 6)), position: "absolute", left: 0, right: 0 }}>
          Les supports de chaque cours, à un geste.
        </Line>
        <Line size={52} style={{ ...fadeUp(l2), position: "absolute", left: 0, right: 0 }}>
          Le PDF officiel, toujours disponible.
        </Line>
      </div>
    </AbsoluteFill>
  );
};
