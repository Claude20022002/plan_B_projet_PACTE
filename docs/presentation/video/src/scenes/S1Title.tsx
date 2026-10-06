import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FlapText, flapWidth } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { C } from "../theme";

/** 1 · 0–3 s : rangée de tuiles vides qui basculent jusqu'à HESTIM PLANNER, puis « L'école, à l'heure. » */
export const S1Title: React.FC = () => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const rowIn = ramp(frame, 0, 8);
  const sub = useEnter(66); // 2,2 s

  const title = portrait ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
      <FlapText text="HESTIM" start={8} fontSize={168} stagger={3} />
      <FlapText text="PLANNER" start={20} fontSize={168} stagger={3} />
    </div>
  ) : (
    <FlapText text="HESTIM PLANNER" start={8} fontSize={150} stagger={2} />
  );

  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: portrait ? 64 : 52 }}>
        <div style={{ opacity: rowIn, minWidth: portrait ? undefined : flapWidth("HESTIM PLANNER", 150) }}>{title}</div>
        <Line size={portrait ? 64 : 60} color={C.ink} style={{ ...fadeUp(sub), letterSpacing: "0.01em" }}>
          L'école, à l'heure.
        </Line>
      </div>
    </AbsoluteFill>
  );
};
