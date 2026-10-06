import React from "react";
import { AbsoluteFill } from "remotion";
import { FlapCounter, FlapText } from "../components/Flap";
import { BrowserFrame, Line, Screen } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const BW = 1180;

/** 3 · 7–12 s : génération automatique (Timefold) ; compteur 0 → 2620 séances en volets, « 90 S ». */
export const S3Generation: React.FC = () => {
  const enter = useEnter(0);
  const sentence = useEnter(BEAT * 6);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <BrowserFrame
        width={BW}
        style={{ left: 80, top: 186, opacity: enter, transform: `translateX(${(1 - enter) * -40}px)` }}
      >
        {/* Zoom lent vers les chiffres du bas (2620 séances, 261 enseignements). */}
        <Screen src="captures/web-08-generation.png" srcW={1920} srcH={1080} width={BW} origin="22% 68%" />
      </BrowserFrame>

      <div style={{ position: "absolute", left: 1330, top: 250, width: 520, display: "flex", flexDirection: "column", gap: 26 }}>
        <FlapCounter value="2620" start={BEAT} fontSize={168} />
        <FlapText text="SÉANCES" start={BEAT + 8} fontSize={68} stagger={2} flip={5} hiddenBefore />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <FlapText text="90 S" start={BEAT * 2} fontSize={68} stagger={2} flip={5} hiddenBefore />
        </div>
        <Line size={46} style={{ ...fadeUp(sentence), marginTop: 26, maxWidth: 500 }}>
          Le semestre se construit tout seul.
        </Line>
      </div>
    </AbsoluteFill>
  );
};
