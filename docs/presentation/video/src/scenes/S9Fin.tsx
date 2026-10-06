import React from "react";
import { AbsoluteFill } from "remotion";
import { Embleme } from "../components/Embleme";
import { FlapText } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, useEnter, usePortrait } from "../components/motion";
import { C } from "../theme";

/**
 * 9 · 38–42 s : l'emblème se réassemble en accéléré, le nom et les supports (web, iPhone, Android)
 * basculent en volets ;
 * dernière seconde immobile pour enchaîner sur la première slide.
 */
export const S9Fin: React.FC = () => {
  const portrait = usePortrait();
  const cadre = useEnter(0, 12);
  const phrase = useEnter(46);

  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 40, border: `3px solid ${C.navy}`, borderRadius: 18, opacity: cadre }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: portrait ? 56 : 44 }}>
        <Embleme start={2} size={portrait ? 260 : 190} stagger={1} stiffness={300} />
        {portrait ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <FlapText text="HESTIM" start={22} fontSize={120} stagger={2} flip={4} hiddenBefore />
            <FlapText text="PLANNER" start={30} fontSize={120} stagger={2} flip={4} hiddenBefore />
          </div>
        ) : (
          <FlapText text="HESTIM PLANNER" start={22} fontSize={96} stagger={2} flip={4} hiddenBefore />
        )}
        <Line size={portrait ? 60 : 54} style={fadeUp(phrase)}>
          L'école, à l'heure.
        </Line>
        {portrait ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <FlapText text="WEB · IPHONE" start={54} fontSize={62} stagger={1} flip={4} hiddenBefore />
            <FlapText text="ANDROID" start={62} fontSize={62} stagger={1} flip={4} hiddenBefore />
          </div>
        ) : (
          <FlapText text="WEB · IPHONE · ANDROID" start={54} fontSize={50} stagger={1} flip={4} hiddenBefore />
        )}
      </div>
    </AbsoluteFill>
  );
};
