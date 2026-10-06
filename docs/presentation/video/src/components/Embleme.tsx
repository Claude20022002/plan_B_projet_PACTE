import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Emblème HESTIM en 12 triangles (grille 3 × 3, case centrale vide), comme l'animation de
 * lancement de l'application (mobile/src/intro/IntroLogo.jsx). Chaque triangle arrive de
 * l'extérieur, dans la direction de son centre, en tournant, puis se pose avec un ressort amorti.
 */
const MARINE = "#001861";
const ROUGE = "#DB1F26";
const ORANGE = "#F26322";
const VERT = "#137D3F";

const BRUT: { c: string; p: [number, number][] }[] = [
  { c: MARINE, p: [[0, 0], [1, 0], [1, 1]] },
  { c: ROUGE, p: [[0, 0], [0, 1], [1, 1]] },
  { c: MARINE, p: [[1, 0], [1, 1], [2, 1]] },
  { c: ORANGE, p: [[2, 0], [3, 0], [2, 1]] },
  { c: MARINE, p: [[3, 0], [3, 1], [2, 1]] },
  { c: MARINE, p: [[2, 1], [3, 1], [2, 2]] },
  { c: VERT, p: [[2, 2], [3, 2], [3, 3]] },
  { c: ORANGE, p: [[2, 2], [2, 3], [3, 3]] },
  { c: ROUGE, p: [[1, 2], [2, 2], [2, 3]] },
  { c: VERT, p: [[1, 2], [1, 3], [0, 3]] },
  { c: MARINE, p: [[0, 2], [1, 2], [0, 3]] },
  { c: MARINE, p: [[1, 1], [1, 2], [0, 2]] },
];

const PIECES = BRUT.map((t, i) => {
  const cx = (t.p[0][0] + t.p[1][0] + t.p[2][0]) / 3;
  const cy = (t.p[0][1] + t.p[1][1] + t.p[2][1]) / 3;
  const dx = cx - 1.5;
  const dy = cy - 1.5;
  const n = Math.hypot(dx, dy) || 1;
  return { ...t, cx, cy, ux: dx / n, uy: dy / n, rot: (i % 2 ? 1 : -1) * (120 + (i % 3) * 40) };
});

type Props = {
  /** Image (repère local) où les triangles commencent à arriver. */
  start: number;
  /** Taille du logo (sans la tuile), en pixels. */
  size: number;
  /** Écart entre deux triangles, en images (1,5 ≈ 50 ms). */
  stagger?: number;
  /** Raideur du ressort : plus haut = plus rapide (réassemblage accéléré). */
  stiffness?: number;
  /** Tuile blanche arrondie sous l'emblème (indispensable sur fond sombre). */
  tile?: boolean;
  /** Image où la tuile apparaît. */
  tileStart?: number;
  style?: React.CSSProperties;
};

export const Embleme: React.FC<Props> = ({ start, size, stagger = 1.5, stiffness = 150, tile = true, tileStart = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pad = size * 0.14;
  const tuile = interpolate(frame, [tileStart, tileStart + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ease = 1 - Math.pow(1 - tuile, 3);
  const distance = size * 2.4;

  return (
    <div
      style={{
        position: "relative",
        width: size + pad * 2,
        height: size + pad * 2,
        borderRadius: size * 0.2,
        background: tile ? "#FFFFFF" : "transparent",
        opacity: tile ? ease : 1,
        transform: tile ? `scale(${0.82 + 0.18 * ease})` : undefined,
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 3 3" style={{ position: "absolute", left: pad, top: pad, overflow: "visible" }}>
        {PIECES.map((t, i) => {
          const p = spring({ frame: frame - start - i * stagger, fps, config: { damping: 15, stiffness, mass: 0.9 } });
          const d = ((1 - p) * distance) / (size / 3); // en unités de case
          const opacity = interpolate(p, [0, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const scale = interpolate(p, [0, 1], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <g
              key={i}
              opacity={opacity}
              transform={`translate(${t.ux * d} ${t.uy * d}) rotate(${(1 - p) * t.rot} ${t.cx} ${t.cy}) translate(${t.cx} ${t.cy}) scale(${scale}) translate(${-t.cx} ${-t.cy})`}
            >
              <polygon points={t.p.map((q) => q.join(",")).join(" ")} fill={t.c} stroke={t.c} strokeWidth={0.015} strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
