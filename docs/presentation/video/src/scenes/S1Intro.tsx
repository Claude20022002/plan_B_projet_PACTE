import React from "react";
import { AbsoluteFill } from "remotion";
import { Embleme } from "../components/Embleme";
import { FlapText } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, useEnter, usePortrait } from "../components/motion";
import { C } from "../theme";

/**
 * 1 · 0–4 s : la tuile blanche apparaît, les 12 triangles s'assemblent dessus (0,3–1,6 s),
 * `HESTIM PLANNER` bascule en volets (1,6–2,8 s), la phrase apparaît à 3,0 s.
 */
export const S1Intro: React.FC = () => {
  const portrait = usePortrait();
  const phrase = useEnter(90);

  if (portrait) {
    return (
      <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 70 }}>
          <Embleme start={9} size={300} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <FlapText text="HESTIM" start={48} fontSize={130} stagger={2} flip={5} hiddenBefore />
            <FlapText text="PLANNER" start={60} fontSize={130} stagger={2} flip={5} hiddenBefore />
          </div>
          <Line size={58} weight={400} style={{ ...fadeUp(phrase), width: 900, textAlign: "center" }}>
            Toute la vie de l'école, dans une seule application.
          </Line>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 64 }}>
          <Embleme start={9} size={240} />
          <FlapText text="HESTIM PLANNER" start={48} fontSize={118} stagger={2} flip={5} hiddenBefore />
        </div>
        <Line size={56} weight={400} style={fadeUp(phrase)}>
          Toute la vie de l'école, dans une seule application.
        </Line>
      </div>
    </AbsoluteFill>
  );
};
