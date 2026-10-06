import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FlapText } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, useEnter, usePortrait } from "../components/motion";
import { BEAT, C } from "../theme";

/** 8 · 32–36 s : adresse du site en volets, logo HESTIM, mention du projet ; dernière seconde immobile. */
export const S8End: React.FC = () => {
  const portrait = usePortrait();
  const frame = useEnter(0, 12);
  const logo = useEnter(BEAT * 3, 30);
  const mention = useEnter(BEAT * 4, 24);

  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 40, border: `3px solid ${C.navy}`, borderRadius: 18, opacity: frame }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: portrait ? 64 : 70 }}>
        {portrait ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <FlapText text="PLANNER." start={4} fontSize={84} stagger={2} flip={5} hiddenBefore />
            <FlapText text="FINADMINTECH.FR" start={18} fontSize={84} stagger={2} flip={5} hiddenBefore />
          </div>
        ) : (
          <FlapText text="PLANNER.FINADMINTECH.FR" start={4} fontSize={100} stagger={2} flip={5} hiddenBefore />
        )}
        <div
          style={{
            ...fadeUp(logo, 10),
            background: C.ink,
            borderRadius: 14,
            padding: portrait ? "26px 40px" : "24px 40px",
          }}
        >
          <Img src={staticFile("logos/HESTIM.png")} style={{ height: portrait ? 92 : 84, display: "block" }} />
        </div>
        <Line size={42} color={C.inkSoft} weight={400} style={fadeUp(mention, 10)}>
          Projet PACTE — HESTIM 2026
        </Line>
      </div>
    </AbsoluteFill>
  );
};
