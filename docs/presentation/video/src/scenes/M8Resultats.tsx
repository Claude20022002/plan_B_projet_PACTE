import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";
import { phoneGeometry } from "./S3Convergence";

const BW = 1080;
const SCREEN_H = 780;
const GAP = 70;
const TELEPHONE = 6 * BEAT; // le résultat de l'étudiante arrive à 3 s

/**
 * 8 · les résultats du quiz : le classement de la classe chez le professeur, puis le résultat de
 * l'étudiante sur son téléphone. Deux captures réelles (web-21, mobile-13). Celle du site est
 * cadrée sur la fenêtre du classement : le reste de la page porte encore l'ancien nom « Jeux ».
 */
export const M8Resultats: React.FC<{ duree: number }> = ({ duree }) => {
  const frame = useCurrentFrame();
  const cadre = useEnter(4, 26);
  const tel = useEnter(TELEPHONE, 26);
  const l1 = useEnter(6);
  const l2 = useEnter(TELEPHONE + 6);
  const { screenW, phoneW, phoneH } = phoneGeometry(SCREEN_H);

  const gauche = (1920 - (BW + GAP + phoneW)) / 2;
  const top = 80;
  const browserH = (BW * 9) / 16 + BROWSER_BAR;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <BrowserFrame width={BW} style={{ left: gauche, top: top + (phoneH - browserH) / 2, opacity: cadre, transform: `translateX(${(1 - cadre) * -300}px)` }}>
        <Screen src="captures/web-21-resultats-enseignant.png" srcW={1920} srcH={1080} width={BW} origin="50% 47%" zoom={[1.66, 1.74]} duration={duree} />
      </BrowserFrame>
      <PhoneFrame screenHeight={SCREEN_H} style={{ left: gauche + BW + GAP, top, opacity: tel, transform: `translateX(${(1 - tel) * 300}px)` }}>
        <Screen src="captures/mobile-13-resultats.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1.04]} origin="50% 25%" duration={duree} />
      </PhoneFrame>
      <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center" }}>
        <Line size={52} style={{ ...fadeUp(l1), opacity: l1 * (1 - ramp(frame, TELEPHONE, TELEPHONE + 6)), position: "absolute", left: 0, right: 0 }}>
          Le classement de la classe, dès la fin du quiz.
        </Line>
        <Line size={52} style={{ ...fadeUp(l2), position: "absolute", left: 0, right: 0 }}>
          Chacun voit où il en est.
        </Line>
      </div>
    </AbsoluteFill>
  );
};
