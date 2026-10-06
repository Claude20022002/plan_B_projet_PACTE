import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { BrowserFrame, Line } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C, FONT_TITLE } from "../theme";

const BW = 1180;

/**
 * Passage utile de web-tableau-etudiant.webm : le tableau se remplit (volets) vers 3,3 s
 * et reste affiché jusqu'à ~7 s. Ralenti à 0,75 pour couvrir les 5 s de la scène.
 */
const TRIM_BEFORE = 87; // 2,9 s à 30 i/s : les volets basculent ~0,5 s après le début de la scène
const RATE = 0.75;

/** 4 · 12–17 s : le tableau de l'étudiant façon panneau des départs, en temps réel. */
export const S4Board: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(0);
  const sentence = useEnter(BEAT * 2);
  const pill = useEnter(BEAT * 3);
  // Une seule pulsation de la pastille « EN COURS ».
  const pulse = ramp(frame, BEAT * 4, BEAT * 4 + 24);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 96, top: 330, width: 520, display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ ...fadeUp(pill), display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 22, height: 22 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 11,
                background: C.onTime,
                transform: `scale(${1 + pulse * 1.6})`,
                opacity: 0.5 * (1 - pulse),
              }}
            />
            <div style={{ position: "absolute", inset: 0, borderRadius: 11, background: C.onTime }} />
          </div>
          <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 64, letterSpacing: "0.12em", color: C.onTime }}>
            EN COURS
          </div>
        </div>
        <Line size={54} style={fadeUp(sentence)}>
          Chaque étudiant voit sa journée, en temps réel.
        </Line>
      </div>

      <BrowserFrame
        width={BW}
        style={{ left: 1920 - 80 - BW, top: 186, opacity: enter, transform: `translateX(${(1 - enter) * 40}px)` }}
      >
        {/* Cadrage sur le panneau (x 354–1294, y 81–570 dans la capture 1920 × 1080). */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transformOrigin: "0 0",
            transform: `scale(${BW / 1920})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "560px 0px",
              transform: `scale(${1.55 + 0.07 * ramp(frame, 0, 150)})`,
            }}
          >
            <OffthreadVideo
              src={staticFile("captures/video/web-tableau-etudiant.webm")}
              trimBefore={TRIM_BEFORE}
              playbackRate={RATE}
              muted
              style={{ width: 1920, height: 1080, display: "block" }}
            />
          </div>
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};
