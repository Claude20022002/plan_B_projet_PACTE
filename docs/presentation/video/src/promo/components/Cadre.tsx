// Cadres des captures : une fenêtre de navigateur ou un téléphone, arrondis, posés sur une ombre douce.
// Le contenu (capture, halo, curseur) se place dans le repère de la capture, puis suit le zoom lent.
import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { BORNES, OMBRE } from "../theme";

type Navigateur = {
  src: string;
  x: number;
  y: number;
  largeur: number;
  /** Zoom de la capture, de 1 à 1,06 au fil de la scène. */
  zoom?: number;
  /** Point fixe du zoom, en pixels de la capture (1920 × 1080). */
  origine?: [number, number];
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const BARRE = 34;

/** Une capture du site (1920 × 1080) dans une fenêtre de navigateur. */
export const Navigateur: React.FC<Navigateur> = ({ src, x, y, largeur, zoom = 1, origine = [960, 540], style, children }) => {
  const k = largeur / 1920;
  const hauteur = 1080 * k;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: largeur, height: hauteur + BARRE, borderRadius: 18, overflow: "hidden", background: "#FFFFFF", boxShadow: OMBRE, ...style }}>
      <div style={{ height: BARRE, background: "#ECECEA", display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 99, background: "#CFCFCC" }} />
        ))}
      </div>
      <div style={{ position: "relative", width: largeur, height: hauteur, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${k})` }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: `${origine[0]}px ${origine[1]}px`, transform: `scale(${zoom})` }}>
            <Img src={staticFile(src)} style={{ width: 1920, height: 1080, display: "block" }} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

type Telephone = { src: string; x: number; y: number; hauteur: number; style?: React.CSSProperties; children?: React.ReactNode };

/** Une capture de l'application (1080 × 2400) dans un téléphone ; le contenu est en pixels de la capture. */
export const Telephone: React.FC<Telephone> = ({ src, x, y, hauteur, style, children }) => {
  const bord = hauteur * 0.016;
  const ecranH = hauteur - bord * 2;
  const k = ecranH / 2400;
  const largeur = 1080 * k + bord * 2;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: largeur, height: hauteur, borderRadius: hauteur * 0.06, background: "#0E0F12", padding: bord, boxShadow: OMBRE, ...style }}>
      <div style={{ position: "relative", width: 1080 * k, height: ecranH, borderRadius: hauteur * 0.048, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 2400, transformOrigin: "0 0", transform: `scale(${k})` }}>
          <Img src={staticFile(src)} style={{ width: 1080, height: 2400, display: "block" }} />
          {children}
        </div>
      </div>
    </div>
  );
};

/** Largeur d'un téléphone de hauteur donnée (pour le placer). */
export const largeurTelephone = (hauteur: number) => {
  const bord = hauteur * 0.016;
  return ((hauteur - bord * 2) / 2400) * 1080 + bord * 2;
};

type Halo = { x: number; y: number; l: number; h: number; image: number; de: number; a: number };

/** Met une zone de la capture en valeur : le reste s'assombrit, un reflet glisse sur la zone. */
export const Halo: React.FC<Halo> = ({ x, y, l, h, image, de, a }) => {
  const o = Math.min(
    interpolate(image, [de, de + 12], [0, 1], BORNES),
    interpolate(image, [a - 12, a], [1, 0], BORNES),
  );
  const reflet = interpolate(image, [de + 8, de + 40], [-0.3, 1.3], BORNES);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: l, height: h, borderRadius: 14, opacity: o, boxShadow: "0 0 0 4000px rgba(14,15,18,0.32), 0 0 0 5px #001861, 0 0 40px 12px rgba(0,24,97,0.35)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, width: "30%", left: `${reflet * 100}%`, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)" }} />
    </div>
  );
};
