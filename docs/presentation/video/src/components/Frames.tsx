import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT_TEXT, RADIUS, SHADOW } from "../theme";

export const BROWSER_BAR = 44;

/** Cadre de navigateur sobre : barre sombre et adresse du site. `width` = largeur du contenu (16:9). */
export const BrowserFrame: React.FC<{
  width: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ width, style, children }) => {
  const contentH = Math.round((width * 9) / 16);
  return (
    <div
      style={{
        position: "absolute",
        width,
        height: contentH + BROWSER_BAR,
        borderRadius: RADIUS,
        overflow: "hidden",
        background: C.chrome,
        boxShadow: `${SHADOW}, 0 0 0 1px ${C.rule}`,
        ...style,
      }}
    >
      <div style={{ height: BROWSER_BAR, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: "#3A3A3F" }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            maxWidth: 520,
            height: 28,
            borderRadius: 8,
            background: "#232326",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            fontFamily: FONT_TEXT,
            fontSize: 16,
            color: C.inkSoft,
            letterSpacing: "0.01em",
          }}
        >
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <rect x="1" y="6" width="10" height="7.5" rx="1.5" fill={C.inkSoft} />
            <path d="M3.2 6V4.3a2.8 2.8 0 0 1 5.6 0V6" stroke={C.inkSoft} strokeWidth="1.5" />
          </svg>
          planner.finadmintech.fr
        </div>
      </div>
      <div style={{ position: "relative", width, height: contentH, overflow: "hidden", background: "#fff" }}>
        {children}
      </div>
    </div>
  );
};

/** Cadre de téléphone fin et sombre. `screenHeight` = hauteur de l'écran (captures 1080 × 2400). */
export const PhoneFrame: React.FC<{
  screenHeight: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ screenHeight, style, children }) => {
  const screenW = Math.round((screenHeight * 1080) / 2400);
  const bezel = Math.round(screenHeight * 0.014);
  return (
    <div
      style={{
        position: "absolute",
        width: screenW + bezel * 2,
        height: screenHeight + bezel * 2,
        padding: bezel,
        borderRadius: screenHeight * 0.062,
        background: "#141416",
        boxShadow: `${SHADOW}, 0 0 0 1.5px ${C.rule}`,
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: screenW,
          height: screenHeight,
          borderRadius: screenHeight * 0.052,
          overflow: "hidden",
          background: C.bg,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Capture affichée à la taille du conteneur, sans déformation, avec un zoom lent (Ken Burns).
 * Les enfants sont placés dans le repère de la capture d'origine (pixels de l'image source).
 */
export const Screen: React.FC<{
  src: string;
  /** Taille de l'image source. */
  srcW: number;
  srcH: number;
  /** Largeur du conteneur. */
  width: number;
  /** Zoom de départ et d'arrivée, et point fixe du zoom (en % de l'image). */
  zoom?: [number, number];
  origin?: string;
  /** Durée du zoom, en images (repère local de la séquence). */
  duration?: number;
  opacity?: number;
  children?: React.ReactNode;
}> = ({ src, srcW, srcH, width, zoom = [1, 1.06], origin = "50% 50%", duration = 150, opacity = 1, children }) => {
  const frame = useCurrentFrame();
  const k = width / srcW;
  const z = interpolate(frame, [0, duration], zoom, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: origin }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: srcW, height: srcH, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <Img src={staticFile(src)} style={{ width: srcW, height: srcH, objectFit: "cover", display: "block" }} />
          {children}
        </div>
      </div>
    </div>
  );
};

/** Phrase à l'écran (Barlow), lisible au fond d'une salle. */
export const Line: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: 400 | 600;
  style?: React.CSSProperties;
}> = ({ children, size = 48, color = C.ink, weight = 600, style }) => (
  <div style={{ fontFamily: FONT_TEXT, fontWeight: weight, fontSize: size, lineHeight: 1.18, color, ...style }}>{children}</div>
);
