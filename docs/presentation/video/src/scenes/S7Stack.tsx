import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { FlapText } from "../components/Flap";
import { ramp } from "../components/motion";
import { BEAT, C, RADIUS, SHADOW } from "../theme";

const SHOTS = [
  "captures/web-09-edt-mensuel.png",
  "captures/web-07-preparation.png",
  "captures/web-22-nuage-de-mots.png",
  "captures/web-26-devoir-notes.png",
];
const CHIPS = ["TIMEFOLD", "LARAVEL", "EXPO", "OPENID CONNECT", "DOCKER"];
/** Nombre de tests automatiques affiché (à mettre à jour si besoin). */
export const TESTS_LABEL = "561 TESTS";

const CELL_W = 528;
const CELL_H = 297;
const GAP = 24;

/** 7 · 27–32 s : mosaïque (une capture par temps), puis les technologies en rafale et le nombre de tests. */
export const S7Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const mosaicTop = (1080 - (CELL_H * 2 + GAP)) / 2;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SHOTS.map((s, i) => {
        const at = i * BEAT;
        if (frame < at) return null;
        // Coupe franche sur le temps, puis zoom lent dans la vignette.
        const z = 1 + 0.06 * ramp(frame, at, at + 120);
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: 80 + (i % 2) * (CELL_W + GAP),
              top: mosaicTop + Math.floor(i / 2) * (CELL_H + GAP),
              width: CELL_W,
              height: CELL_H,
              borderRadius: RADIUS,
              overflow: "hidden",
              boxShadow: `${SHADOW}, 0 0 0 1px ${C.rule}`,
              background: "#fff",
            }}
          >
            <Img
              src={staticFile(s)}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, transformOrigin: "50% 30%" }}
            />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 1236, top: 276, display: "flex", flexDirection: "column", gap: 14 }}>
        {CHIPS.map((c, i) => (
          <FlapText
            key={c}
            text={c}
            start={BEAT * 4 + i * 5}
            fontSize={58}
            stagger={1}
            flip={4}
            fakes={[1, 3]}
            spaceTiles={false}
            hiddenBefore
          />
        ))}
        <FlapText
          text={TESTS_LABEL}
          start={BEAT * 7}
          fontSize={88}
          stagger={2}
          flip={5}
          spaceTiles={false}
          hiddenBefore
          style={{ marginTop: 28 }}
        />
      </div>
    </AbsoluteFill>
  );
};
