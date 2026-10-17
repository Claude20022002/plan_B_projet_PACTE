// Éléments de la vidéo Lancement : fond de couleur, mots qui arrivent un à un (typographie animée),
// carte d'interface posée en perspective qui se redresse, nœud et lien d'un schéma, coche.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BORNES, DOUX, POLICE } from "../promo/theme";

/** Les quatre couleurs de l'emblème HESTIM, une par fonctionnalité. */
export const COULEURS = { marine: "#001861", orange: "#F26322", vert: "#137D3F", rouge: "#DB1F26", fond: "#F7F7F5", encre: "#0E0F12" } as const;

/** Plan : fond uni, entrée très courte (coupe franche sur le temps, comme les références). */
export const Fond: React.FC<{ couleur: string; children: React.ReactNode }> = ({ couleur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: couleur, opacity: interpolate(f, [0, 4], [0.6, 1], BORNES), fontFamily: POLICE }}>{children}</AbsoluteFill>;
};

type Mots = {
  texte: string;
  de: number;
  taille: number;
  couleur?: string;
  /** Mots écrits dans la couleur d'accent (leur position dans la phrase). */
  accent?: number[];
  couleurAccent?: string;
  /** Écart entre deux mots, en images. */
  pas?: number;
  style?: React.CSSProperties;
  centre?: boolean;
};

/** Une phrase dont les mots montent un à un, avec un ressort sec. */
export const Mots: React.FC<Mots> = ({ texte, de, taille, couleur = COULEURS.encre, accent = [], couleurAccent = COULEURS.orange, pas = 3, style, centre = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", display: "flex", flexWrap: "wrap", justifyContent: centre ? "center" : "flex-start", columnGap: taille * 0.26, rowGap: taille * 0.02, fontFamily: POLICE, fontWeight: 800, fontSize: taille, lineHeight: 1.05, letterSpacing: "-0.03em", ...style }}>
      {texte.split(" ").map((m, i) => {
        const p = spring({ frame: f - de - i * pas, fps, config: { damping: 16, stiffness: 190, mass: 0.7 } });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: taille * 0.08 }}>
            <span style={{ display: "inline-block", color: accent.includes(i) ? couleurAccent : couleur, transform: `translateY(${(1 - Math.min(p, 1)) * 110}%)`, opacity: Math.min(1, p * 2) }}>{m}</span>
          </span>
        );
      })}
    </div>
  );
};

type Carte3D = { de: number; x: number; y: number; rotY?: number; rotX?: number; rotZ?: number; flotte?: boolean; style?: React.CSSProperties; children: React.ReactNode };

/** Pose son contenu en perspective : il arrive incliné et décalé, puis se redresse et flotte doucement. */
export const Carte3D: React.FC<Carte3D> = ({ de, x, y, rotY = -18, rotX = 10, rotZ = 0, flotte = true, style, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - de, fps, config: { damping: 22, stiffness: 120, mass: 0.9 } });
  const v = flotte ? Math.sin((f - de) / 22) * 6 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, perspective: 1800, opacity: Math.min(1, p * 1.6), ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 160 + v}px) rotateY(${rotY * (1 - p) + rotY * 0.18}deg) rotateX(${rotX * (1 - p)}deg) rotateZ(${rotZ}deg)`, transformStyle: "preserve-3d" }}>{children}</div>
    </div>
  );
};

/** Coche dessinée dans un rond (sans emoji). */
export const Coche: React.FC<{ taille: number; couleur: string; de: number }> = ({ taille, couleur, de }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [de, de + 10], [0, 1], { ...BORNES, easing: DOUX });
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={11} fill={couleur} opacity={t} />
      <path d="M6.5 12.5 L10.5 16.2 L17.5 8.5" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - t)} />
    </svg>
  );
};

/** Pastille blanche d'un schéma (un outil, une fonction). */
export const Noeud: React.FC<{ x: number; y: number; de: number; taille: number; couleur?: string; children: React.ReactNode }> = ({ x, y, de, taille, couleur = COULEURS.encre, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - de, fps, config: { damping: 14, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${p})`, background: "#FFFFFF", color: couleur, fontFamily: POLICE, fontWeight: 800, fontSize: taille, padding: `${taille * 0.5}px ${taille * 0.9}px`, borderRadius: 999, boxShadow: "0 18px 40px rgba(14,15,18,0.14)", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
};
