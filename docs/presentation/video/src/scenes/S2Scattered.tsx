import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FlapText, flapWidth, tileSize } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const WORDS = ["EXCEL", "PDF", "WHATSAPP", "KAHOOT"];
// Décalages horizontaux : les outils sont « éparpillés ».
const OFFSETS = [0, 300, 90, 360];
const FS = 108;
const STRIKE_START = 75; // 5,5 s du film = 2,5 s dans la scène

/** 2 · 3–7 s : les outils éparpillés arrivent un par temps, puis sont barrés en orange (statut « reporté »). */
export const S2Scattered: React.FC = () => {
  const frame = useCurrentFrame();
  const { height: th } = tileSize(FS);
  const sentence = useEnter(BEAT * 4);
  const blockW = Math.max(...WORDS.map((w, i) => OFFSETS[i] + flapWidth(w, FS)));

  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 72 }}>
        <div style={{ position: "relative", width: blockW, height: WORDS.length * (th + 26) - 26 }}>
          {WORDS.map((w, i) => {
            const strikeAt = STRIKE_START + i * 6;
            const s = ramp(frame, strikeAt, strikeAt + 7);
            const eased = 1 - Math.pow(1 - s, 3);
            const dim = 1 - 0.45 * ramp(frame, strikeAt + 4, strikeAt + 12);
            return (
              <div key={w} style={{ position: "absolute", left: OFFSETS[i], top: i * (th + 26) }}>
                <div style={{ opacity: dim }}>
                  <FlapText text={w} start={i * BEAT} fontSize={FS} stagger={2} flip={5} fakes={[2, 3]} hiddenBefore />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: -14,
                    right: -14,
                    top: th / 2 - 4,
                    height: 8,
                    borderRadius: 4,
                    background: C.delayed,
                    transform: `scaleX(${eased})`,
                    transformOrigin: "0 50%",
                  }}
                />
              </div>
            );
          })}
        </div>
        <Line size={64} style={fadeUp(sentence)}>Tout est éparpillé.</Line>
      </div>
    </AbsoluteFill>
  );
};
