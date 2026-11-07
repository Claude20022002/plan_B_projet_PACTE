// Petits éléments communs aux scènes : le plan (entrée et sortie en fondu), le titre, le curseur,
// les pastilles de bénéfice et le compteur.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BORNES, DOUX, OMBRE, P, POLICE } from "../theme";

/** Enveloppe d'une scène : entre et sort par un fondu et une translation de 32 px, jamais de coupe sèche. */
export const Plan: React.FC<{ duree: number; entree?: boolean; children: React.ReactNode }> = ({ duree, entree = true, children }) => {
  const f = useCurrentFrame();
  const e = entree ? interpolate(f, [0, 14], [0, 1], { ...BORNES, easing: DOUX }) : 1;
  const s = interpolate(f, [duree - 14, duree], [1, 0], { ...BORNES, easing: DOUX });
  return <AbsoluteFill style={{ opacity: Math.min(e, s), transform: `translateY(${(1 - e) * 32 - (1 - s) * 24}px)`, fontFamily: POLICE }}>{children}</AbsoluteFill>;
};

type Titre = { de: number; taille: number; style?: React.CSSProperties; couleur?: string; children: React.ReactNode };

/** Un titre de sept mots au plus, qui monte en fondu. */
export const Titre: React.FC<Titre> = ({ de, taille, style, couleur = P.encre, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [de, de + 18], [0, 1], { ...BORNES, easing: DOUX });
  return (
    <div style={{ position: "absolute", fontFamily: POLICE, fontWeight: 800, fontSize: taille, lineHeight: 1.08, letterSpacing: "-0.02em", color: couleur, opacity: t, transform: `translateY(${(1 - t) * 28}px)`, ...style }}>
      {children}
    </div>
  );
};

type Curseur = { de: [number, number]; vers: [number, number]; depart: number; arrivee: number; clic: number; taille?: number };

/** Curseur qui se déplace d'un point à l'autre, puis clique (onde). En pixels du repère parent. */
export const Curseur: React.FC<Curseur> = ({ de, vers, depart, arrivee, clic, taille = 44 }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [depart, arrivee], [0, 1], { ...BORNES, easing: DOUX });
  const x = de[0] + (vers[0] - de[0]) * t;
  const y = de[1] + (vers[1] - de[1]) * t;
  const appui = interpolate(f, [clic, clic + 4, clic + 10], [1, 0.82, 1], BORNES);
  const onde = interpolate(f, [clic, clic + 22], [0, 1], BORNES);
  const visible = interpolate(f, [depart - 8, depart], [0, 1], BORNES);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: visible }}>
      {f >= clic && onde < 1 && (
        <div style={{ position: "absolute", left: -taille, top: -taille, width: taille * 2, height: taille * 2, borderRadius: 999, border: `4px solid ${P.accent}`, opacity: 1 - onde, transform: `scale(${0.3 + onde})` }} />
      )}
      <svg width={taille} height={taille} viewBox="0 0 24 24" style={{ transform: `scale(${appui})`, transformOrigin: "0 0", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.3))" }}>
        <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.4 L18 13.4 Z" fill={P.encre} stroke="#FFFFFF" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

type Pastille = { de: number; taille: number; style?: React.CSSProperties; children: React.ReactNode };

/** Une pastille de bénéfice qui arrive par un ressort. */
export const Pastille: React.FC<Pastille> = ({ de, taille, style, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - de, fps, config: { damping: 200, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: taille * 0.45, background: "#FFFFFF", borderRadius: 999, padding: `${taille * 0.45}px ${taille * 0.8}px`, boxShadow: OMBRE, fontFamily: POLICE, fontWeight: 800, fontSize: taille, color: P.encre, opacity: p, transform: `translateX(${(1 - p) * 36}px)`, whiteSpace: "nowrap", ...style }}>
      <div style={{ width: taille * 0.5, height: taille * 0.5, borderRadius: 99, background: P.accent, flexShrink: 0 }} />
      {children}
    </div>
  );
};

/** Nombre qui monte de 0 à sa valeur, écrit à la française (2 620). */
export const Compteur: React.FC<{ valeur: number; de: number; duree: number }> = ({ valeur, de, duree }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [de, de + duree], [0, 1], { ...BORNES, easing: DOUX });
  const n = Math.round(valeur * t);
  return <>{n.toLocaleString("fr-FR").replace(/\s/g, " ")}</>;
};
