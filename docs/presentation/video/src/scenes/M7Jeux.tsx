import React from "react";
import { AbsoluteFill } from "remotion";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, useEnter, usePortrait } from "../components/motion";
import { BEAT, C } from "../theme";
import { PHONE_LEFT, PHONE_SCREEN_H, PHONE_TOP, PORTRAIT_SCREEN_H, PORTRAIT_TOP, phoneGeometry, portraitLeft } from "./S3Convergence";

/**
 * 8 · la bibliothèque de jeux pédagogiques. Le téléphone montre le seul jeu qui existe aujourd'hui,
 * Terminal Linux (capture réelle, mobile-25) ; la bibliothèque elle-même est une décision du
 * 12 octobre 2026, pas encore un écran. Les phrases annoncent donc le projet sans compter de jeux.
 */
export const M7Jeux: React.FC<{ duree: number }> = ({ duree }) => {
  const portrait = usePortrait();
  const titre = useEnter(4);
  const l1 = useEnter(3 * BEAT);
  const l2 = useEnter(6 * BEAT);
  const tel = useEnter(6, 26);
  const screenH = portrait ? PORTRAIT_SCREEN_H : PHONE_SCREEN_H;
  const { screenW } = phoneGeometry(screenH);
  const ecran = <Screen src="captures/mobile-25-terminal-commandes.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1.03]} origin="50% 30%" duration={duree} />;

  if (portrait) {
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <div style={{ position: "absolute", left: 70, right: 70, top: 170, textAlign: "center" }}>
          <Line size={70} style={fadeUp(titre)}>Une bibliothèque de jeux pédagogiques.</Line>
          <Line size={44} weight={400} color={C.inkSoft} style={{ ...fadeUp(l1), marginTop: 18 }}>
            Par module, inspirés de ceux qui existent déjà.
          </Line>
        </div>
        <PhoneFrame screenHeight={screenH} style={{ left: portraitLeft(), top: PORTRAIT_TOP, opacity: tel, transform: `translateY(${(1 - tel) * 120}px)` }}>
          {ecran}
        </PhoneFrame>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 140, top: 330, width: 900 }}>
        <Line size={72} style={fadeUp(titre)}>Une bibliothèque</Line>
        <Line size={72} color={C.inkSoft} style={{ ...fadeUp(titre), marginTop: 12 }}>
          de jeux pédagogiques.
        </Line>
        <Line size={46} weight={400} color={C.inkSoft} style={{ ...fadeUp(l1), marginTop: 40 }}>
          Par module, inspirés de ceux qui existent déjà.
        </Line>
        <Line size={46} weight={400} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 20 }}>
          Le premier : Terminal Linux, de vraies commandes.
        </Line>
      </div>
      <PhoneFrame screenHeight={PHONE_SCREEN_H} style={{ left: PHONE_LEFT, top: PHONE_TOP, opacity: tel, transform: `translateX(${(1 - tel) * 200}px)` }}>
        {ecran}
      </PhoneFrame>
    </AbsoluteFill>
  );
};
