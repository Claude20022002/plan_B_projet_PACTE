import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { C } from "../theme";
import { PHONE_LEFT, PHONE_SCREEN_H, PHONE_TOP, phoneGeometry } from "./S3Convergence";

const TOUCHER = 75; // 14,5 s du film
const FICHE = 86;
// Jour sélectionné (6 octobre) sur mobile-37-mois.png, en pixels de la capture
const JOUR = { x: 239, y: 990 };

/** Rond de toucher : s'agrandit et s'efface. */
const Toucher: React.FC<{ frame: number }> = ({ frame }) => {
  const p = ramp(frame, TOUCHER, TOUCHER + 14);
  if (frame < TOUCHER || p >= 1) return null;
  const r = 60 + 90 * p;
  return (
    <div
      style={{
        position: "absolute",
        left: JOUR.x - r,
        top: JOUR.y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        background: "rgba(242,241,236,0.28)",
        border: "6px solid rgba(242,241,236,0.85)",
        opacity: 1 - p,
      }}
    />
  );
};

/** 4 · 12–17 s : le mois, chaque jour avec ses cours ; un toucher ouvre le détail de la séance. */
export const S4Agenda: React.FC = () => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const phrase = useEnter(6);
  const fiche = ramp(frame, FICHE, FICHE + 8);
  const screenH = portrait ? 1240 : PHONE_SCREEN_H;
  const { screenW, phoneW } = phoneGeometry(screenH);

  const ecran = (
    <>
      <Screen src="captures/mobile-37-mois.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1.05]} origin="25% 42%" duration={FICHE}>
        <Toucher frame={frame} />
      </Screen>
      <div style={{ position: "absolute", inset: 0, opacity: fiche, transform: `translateY(${(1 - fiche) * 60}px)` }}>
        <Screen src="captures/mobile-36-fiche-verre.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]} />
      </div>
    </>
  );

  if (portrait) {
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <Line size={80} style={{ ...fadeUp(phrase), position: "absolute", left: 80, right: 80, top: 150, textAlign: "center" }}>
          Un emploi du temps toujours à jour.
        </Line>
        <PhoneFrame screenHeight={screenH} style={{ left: (1080 - phoneW) / 2, top: 560 }}>
          {ecran}
        </PhoneFrame>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 140, top: 380, width: 860 }}>
        <Line size={88} style={fadeUp(phrase)}>Un emploi du temps</Line>
        <Line size={88} color={C.inkSoft} style={{ ...fadeUp(phrase), marginTop: 12 }}>
          toujours à jour.
        </Line>
      </div>
      <PhoneFrame screenHeight={PHONE_SCREEN_H} style={{ left: PHONE_LEFT, top: PHONE_TOP }}>
        {ecran}
      </PhoneFrame>
    </AbsoluteFill>
  );
};
