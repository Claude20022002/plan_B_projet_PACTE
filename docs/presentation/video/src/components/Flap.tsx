import React from "react";
import { random, useCurrentFrame } from "remotion";
import { C, FONT_TITLE } from "../theme";

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const Half: React.FC<{
  char: string;
  part: "top" | "bottom";
  h: number;
  fontSize: number;
  color: string;
  style?: React.CSSProperties;
  shade?: number;
}> = ({ char, part, h, fontSize, color, style, shade = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: part === "top" ? 0 : h / 2,
      height: h / 2,
      overflow: "hidden",
      background: C.tile,
      borderRadius: part === "top" ? "6px 6px 0 0" : "0 0 6px 6px",
      backfaceVisibility: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: (part === "top" ? 0 : -h / 2) - fontSize * 0.035,
        height: h,
        lineHeight: `${h}px`,
        textAlign: "center",
        fontFamily: FONT_TITLE,
        fontWeight: 700,
        fontSize,
        color,
      }}
    >
      {char}
    </div>
    {shade > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${shade})` }} /> : null}
  </div>
);

type TileProps = {
  /** Caractères affichés successivement ; le dernier est la lettre finale. */
  seq: string[];
  /** Image du premier basculement. */
  start: number;
  /** Durée d'un basculement complet, en images. */
  flip?: number;
  fontSize: number;
  width: number;
  height: number;
  color?: string;
  /** true : la tuile apparaît à `start` ; false : tuile vide déjà en place. */
  hiddenBefore?: boolean;
};

/** Tuile de panneau à volets : la moitié haute tombe sur la charnière, la moitié basse se pose avec un léger rebond. */
export const FlapTile: React.FC<TileProps> = ({
  seq,
  start,
  flip = 6,
  fontSize,
  width,
  height,
  color = C.ink,
  hiddenBefore = false,
}) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  const transitions = seq.length - 1;

  let from = seq[0];
  let to = seq[0];
  let t = 1;
  if (local >= 0 && transitions > 0) {
    const idx = Math.floor(local / flip);
    if (idx >= transitions) {
      from = to = seq[transitions];
    } else {
      from = seq[idx];
      to = seq[idx + 1];
      t = (local - idx * flip) / flip;
    }
  }
  const flipping = from !== to;

  const appear = hiddenBefore ? Math.min(1, Math.max(0, (local + 3) / 3)) : 1;
  if (appear <= 0) return <div style={{ width, height, flex: "none" }} />;

  // Première moitié : le volet haut tombe (accélère). Seconde moitié : le volet bas se pose puis rebondit à peine.
  let topAngle = 0;
  let bottomAngle = 90;
  if (flipping) {
    if (t < 0.5) {
      const p = t / 0.5;
      topAngle = -90 * p * p;
    } else {
      topAngle = -90;
      const p = (t - 0.5) / 0.5;
      if (p < 0.6) {
        const q = p / 0.6;
        bottomAngle = 90 * (1 - q * q);
      } else {
        const q = (p - 0.6) / 0.4;
        bottomAngle = 10 * Math.sin(Math.PI * q) * (1 - q);
      }
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        flex: "none",
        perspective: height * 4,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 8}px)`,
        borderRadius: 6,
      }}
    >
      {/* Moitiés fixes : en haut la lettre suivante, en bas la lettre courante (jusqu'à ce que le volet bas la recouvre). */}
      <Half char={flipping ? to : from} part="top" h={height} fontSize={fontSize} color={color} />
      <Half char={from} part="bottom" h={height} fontSize={fontSize} color={color} />
      {flipping && t < 0.5 ? (
        <Half
          char={from}
          part="top"
          h={height}
          fontSize={fontSize}
          color={color}
          shade={0.5 * (-topAngle / 90)}
          style={{ transformOrigin: "50% 100%", transform: `rotateX(${topAngle}deg)` }}
        />
      ) : null}
      {flipping && t >= 0.5 ? (
        <Half
          char={to}
          part="bottom"
          h={height}
          fontSize={fontSize}
          color={color}
          shade={0.45 * (bottomAngle / 90)}
          style={{ transformOrigin: "50% 0%", transform: `rotateX(${bottomAngle}deg)` }}
        />
      ) : null}
      {/* Charnière */}
      <div style={{ position: "absolute", left: 0, right: 0, top: height / 2 - 1.5, height: 3, background: C.hinge }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 6,
          boxShadow: `inset 0 0 0 1px ${C.rule}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export const tileSize = (fontSize: number) => ({
  width: Math.round(fontSize * 0.66),
  height: Math.round(fontSize * 1.16),
});

const defaultGap = (fontSize: number) => Math.max(4, Math.round(fontSize * 0.06));

export const flapWidth = (text: string, fontSize: number, gap?: number) => {
  const { width } = tileSize(fontSize);
  const n = [...text].length;
  return n * width + (n - 1) * (gap ?? defaultGap(fontSize));
};

type FlapTextProps = {
  text: string;
  start: number;
  fontSize: number;
  /** Décalage entre deux tuiles, en images. */
  stagger?: number;
  flip?: number;
  gap?: number;
  seed?: string;
  color?: string;
  /** Les espaces deviennent des tuiles vides (panneau) ou de simples blancs. */
  spaceTiles?: boolean;
  hiddenBefore?: boolean;
  /** Nombre de lettres « fausses » avant la bonne : [min, max]. */
  fakes?: [number, number];
  style?: React.CSSProperties;
};

/** Texte en tuiles à volets, lettre par lettre de gauche à droite. */
export const FlapText: React.FC<FlapTextProps> = ({
  text,
  start,
  fontSize,
  stagger = 2,
  flip = 6,
  gap,
  seed = text,
  color,
  spaceTiles = true,
  hiddenBefore = false,
  fakes = [2, 4],
  style,
}) => {
  const { width, height } = tileSize(fontSize);
  const g = gap ?? defaultGap(fontSize);
  return (
    <div style={{ display: "flex", gap: g, ...style }}>
      {[...text].map((ch, i) => {
        if (ch === " " && !spaceTiles) return <div key={i} style={{ width: width * 0.4, flex: "none" }} />;
        const n = ch === " " ? 0 : fakes[0] + Math.floor(random(`${seed}-${i}`) * (fakes[1] - fakes[0] + 1));
        const seq = [" "];
        for (let k = 0; k < n; k++) seq.push(POOL[Math.floor(random(`${seed}-${i}-${k}`) * POOL.length)]);
        seq.push(ch);
        return (
          <FlapTile
            key={i}
            seq={seq}
            start={start + i * stagger}
            flip={flip}
            fontSize={fontSize}
            width={width}
            height={height}
            color={color}
            hiddenBefore={hiddenBefore}
          />
        );
      })}
    </div>
  );
};

/** Compteur à volets : chaque chiffre défile vers l'avant (0, 1, 2…) jusqu'à sa valeur ; les chiffres de droite font plus de tours. */
export const FlapCounter: React.FC<{
  value: string;
  start: number;
  fontSize: number;
  flip?: number;
  gap?: number;
  color?: string;
}> = ({ value, start, fontSize, flip = 4, gap, color }) => {
  const { width, height } = tileSize(fontSize);
  const g = gap ?? defaultGap(fontSize);
  return (
    <div style={{ display: "flex", gap: g }}>
      {[...value].map((d, i) => {
        const steps = Math.max(0, i - 1) * 10 + Number(d);
        const seq = ["0"];
        for (let k = 1; k <= steps; k++) seq.push(String(k % 10));
        return (
          <FlapTile
            key={i}
            seq={seq}
            start={start + i * 2}
            flip={flip}
            fontSize={fontSize}
            width={width}
            height={height}
            color={color}
            hiddenBefore
          />
        );
      })}
    </div>
  );
};
