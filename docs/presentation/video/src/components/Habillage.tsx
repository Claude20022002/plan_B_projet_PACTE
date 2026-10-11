import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ramp, usePortrait } from "./motion";
import { C, FONT_TITLE } from "../theme";

/**
 * Habillage de « Une matinée à l'école », posé par-dessus les scènes :
 *  - le repère de la scène en haut à gauche (l'heure, puis qui l'on suit) ;
 *  - une barre de progression fine en bas, pour que personne ne se demande quand la vidéo finit.
 */
export const Repere: React.FC<{ texte: string }> = ({ texte }) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const p = ramp(frame, 2, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: portrait ? 60 : 56,
        top: portrait ? 60 : 30,
        padding: portrait ? "10px 22px" : "6px 18px",
        borderRadius: 4,
        background: C.navy,
        color: "#FFFFFF",
        fontFamily: FONT_TITLE,
        fontWeight: 700,
        fontSize: portrait ? 40 : 30,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
      }}
    >
      {texte}
    </div>
  );
};

export const Progression: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: C.rule }}>
        <div style={{ width: `${(100 * (frame + 1)) / durationInFrames}%`, height: "100%", background: C.ink }} />
      </div>
    </AbsoluteFill>
  );
};
