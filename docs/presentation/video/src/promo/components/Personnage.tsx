// Les trois avatars de PactePromo, dessinés en aplats dans l'esprit des vidéos d'Asana (silhouettes
// élancées, petite tête, couleurs franches). Ils parlent : la bouche suit l'enveloppe de leur voix
// (voix.json), le bras fait un geste pendant la réplique, les yeux clignent, le corps respire.
import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { useImageGlobale } from "../timing";
import { BORNES, DOUX, P, POLICE } from "../theme";
import { bouche, enParole, type Qui } from "../voix";

type Style = "hijab" | "court" | "queue";
type Look = {
  nom: string;
  peau: string;
  cheveux: string;
  haut: string;
  bas: string;
  coiffure: Style;
  voile?: string;
  jupe?: boolean;
  barbe?: boolean;
  lunettes?: boolean;
  col?: string;
  graine: number;
};

const LOOKS: Record<Exclude<Qui, "narrateur">, Look> = {
  nadia: { nom: "Nadia · Scolarité", peau: "#B07A55", cheveux: "#2B1B17", haut: P.accent, bas: "#2A2F45", coiffure: "hijab", voile: "#8EA3DE", jupe: true, col: "#FFFFFF", graine: 1 },
  youssef: { nom: "Youssef · Enseignant", peau: "#9C6544", cheveux: "#1E1512", haut: "#D9E1F5", bas: P.accent, coiffure: "court", barbe: true, lunettes: true, graine: 2 },
  salma: { nom: "Salma · Étudiante", peau: "#D4A07A", cheveux: "#2B1B17", haut: "#F26322", bas: "#3B4A7A", coiffure: "queue", graine: 3 },
};

type Pt = [number, number];
/** Coude et main de chaque bras, en coordonnées du dessin (tête vers 120, 70 ; pieds vers 570). */
type Bras = { gC: Pt; gM: Pt; dC: Pt; dM: Pt };
export type Pose = "repos" | "geste" | "telephone" | "tablette" | "salut" | "perplexe" | "tablettePresente";

const POSES: Record<Pose, Bras> = {
  repos: { gC: [66, 215], gM: [60, 298], dC: [174, 215], dM: [180, 298] },
  geste: { gC: [66, 215], gM: [60, 298], dC: [222, 182], dM: [252, 116] },
  telephone: { gC: [66, 215], gM: [60, 298], dC: [182, 214], dM: [140, 172] },
  tablette: { gC: [58, 214], gM: [102, 182], dC: [174, 215], dM: [180, 298] },
  tablettePresente: { gC: [58, 214], gM: [102, 182], dC: [222, 182], dM: [252, 116] },
  salut: { gC: [66, 215], gM: [60, 298], dC: [212, 84], dM: [236, 18] },
  perplexe: { gC: [44, 96], gM: [90, 44], dC: [182, 214], dM: [140, 172] },
};

const melange = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

type Props = {
  qui: Exclude<Qui, "narrateur">;
  /** Abscisse du centre du personnage, en pixels. */
  x: number;
  /** Ordonnée des pieds, en pixels. */
  sol: number;
  hauteur: number;
  pose?: Pose;
  /** Pose prise pendant ses répliques (par défaut : geste de la main droite). */
  poseParole?: Pose;
  /** Image (locale à la scène) où il entre ; avant, il est invisible. */
  entree?: number;
  /** Regarde vers la droite (1) ou la gauche (-1) : retourne le dessin. */
  sens?: 1 | -1;
  etiquette?: boolean;
  /** Image locale de la scène (pour l'entrée). */
  imageLocale: number;
};

/** Un avatar en pied, qui parle quand sa voix joue. */
export const Personnage: React.FC<Props> = ({ qui, x, sol, hauteur, pose = "repos", poseParole, entree = 0, sens = 1, etiquette = true, imageLocale }) => {
  const g = useImageGlobale();
  const { fps } = useVideoConfig();
  const l = LOOKS[qui];
  const largeur = (hauteur * 300) / 640;

  const parle = enParole(qui, g);
  const ouv = bouche(qui, g);
  const arrivee = spring({ frame: imageLocale - entree, fps, config: { damping: 200, stiffness: 110 } });
  const respire = Math.sin(g / 19 + l.graine) * 2.2;
  const cycle = (g + l.graine * 41) % 110;
  const cligne = cycle < 3 ? 0.12 : 1;

  const b0 = POSES[pose];
  const b1 = POSES[poseParole ?? (pose === "tablette" ? "tablettePresente" : pose === "telephone" || pose === "perplexe" ? pose : "geste")];
  const vague = parle * Math.sin(g / 5.5) * 7;
  const salut = pose === "salut" ? Math.sin(g / 4) * 14 : 0;
  const bras: Bras = {
    gC: melange(b0.gC, b1.gC, parle),
    gM: melange(b0.gM, b1.gM, parle),
    dC: melange(b0.dC, b1.dC, parle),
    dM: [melange(b0.dM, b1.dM, parle)[0] + salut, melange(b0.dM, b1.dM, parle)[1] + vague],
  };
  const queue = Math.sin(g / 14) * 7;
  const tete = parle * Math.sin(g / 9) * 2.5;
  const fondu = interpolate(imageLocale - entree, [0, 14], [0, 1], { ...BORNES, easing: DOUX });

  return (
    <div
      style={{
        position: "absolute",
        left: x - largeur / 2,
        top: sol - hauteur * (605 / 640),
        width: largeur,
        height: hauteur,
        opacity: fondu,
        transform: `translateY(${(1 - arrivee) * 40}px)`,
      }}
    >
      <svg viewBox="-30 -30 300 640" width={largeur} height={hauteur} style={{ overflow: "visible", transform: `scaleX(${sens})` }}>
        <ellipse cx={120} cy={574} rx={62} ry={9} fill="rgba(14,15,18,0.08)" />
        <g transform={`translate(0 ${respire * 0.4})`}>
          {/* Jambes et chaussures */}
          {l.jupe ? (
            <>
              <path d="M84 292 L156 292 L176 540 L64 540 Z" fill={l.bas} />
              <rect x={96} y={530} width={16} height={34} rx={8} fill={l.peau} />
              <rect x={128} y={530} width={16} height={34} rx={8} fill={l.peau} />
            </>
          ) : (
            <>
              <line x1={104} y1={300} x2={98} y2={556} stroke={l.bas} strokeWidth={30} strokeLinecap="round" />
              <line x1={136} y1={300} x2={142} y2={556} stroke={l.bas} strokeWidth={30} strokeLinecap="round" />
            </>
          )}
          <ellipse cx={92} cy={567} rx={22} ry={10} fill={P.encre} />
          <ellipse cx={148} cy={567} rx={22} ry={10} fill={P.encre} />
        </g>
        <g transform={`translate(0 ${respire})`}>
          {/* Tronc */}
          <path d="M72 146 Q72 118 98 118 L142 118 Q168 118 168 146 L160 304 L80 304 Z" fill={l.haut} />
          {l.col && <path d="M106 118 L120 150 L134 118 Z" fill={l.col} />}
          {l.coiffure === "queue" && <path d="M98 238 L142 238 L140 272 L100 272 Z" fill="rgba(0,0,0,0.08)" />}
          {/* Tête */}
          <g transform={`rotate(${tete} 120 100)`}>
            {l.coiffure === "hijab" ? (
              <path d="M74 72 Q74 20 120 20 Q166 20 166 72 L172 142 Q120 162 68 142 Z" fill={l.voile} />
            ) : (
              <>
                <rect x={110} y={92} width={20} height={32} rx={6} fill={l.peau} />
                {l.coiffure === "queue" && (
                  <>
                    <ellipse cx={120} cy={66} rx={36} ry={38} fill={l.cheveux} />
                    <path d="M146 44 Q192 66 170 132 Q160 96 140 66 Z" fill={l.cheveux} transform={`rotate(${queue} 146 46)`} />
                  </>
                )}
                <circle cx={87} cy={72} r={7} fill={l.peau} />
                <circle cx={153} cy={72} r={7} fill={l.peau} />
              </>
            )}
            {l.coiffure === "hijab" ? (
              <ellipse cx={120} cy={70} rx={25} ry={29} fill={l.peau} />
            ) : (
              <circle cx={120} cy={68} r={32} fill={l.peau} />
            )}
            {l.coiffure === "hijab" && <ellipse cx={120} cy={70} rx={26.5} ry={30.5} fill="none" stroke="rgba(0,24,97,0.18)" strokeWidth={3} />}
            {l.coiffure === "court" && <path d="M87 64 Q84 28 120 28 Q157 28 153 64 Q146 44 120 45 Q96 45 87 64 Z" fill={l.cheveux} />}
            {l.coiffure === "queue" && <path d="M88 64 Q90 32 122 32 Q151 33 153 60 Q137 44 113 49 Q98 53 88 64 Z" fill={l.cheveux} />}
            {l.barbe && <path d="M90 70 Q92 104 120 106 Q148 104 150 70 Q142 96 120 97 Q98 96 90 70 Z" fill={l.cheveux} />}
            {/* Visage */}
            <ellipse cx={108} cy={68} rx={3.4} ry={3.6 * cligne} fill="#1B1B22" />
            <ellipse cx={132} cy={68} rx={3.4} ry={3.6 * cligne} fill="#1B1B22" />
            <path d="M102 59 L113 57.5 M127 57.5 L138 59" stroke="#1B1B22" strokeWidth={2.4} strokeLinecap="round" opacity={0.75} />
            {l.lunettes && (
              <g fill="none" stroke={P.encre} strokeWidth={2.4}>
                <circle cx={108} cy={68} r={9} />
                <circle cx={132} cy={68} r={9} />
                <path d="M117 67 L123 67" />
              </g>
            )}
            <circle cx={99} cy={80} r={5} fill="rgba(220,110,90,0.22)" />
            <circle cx={141} cy={80} r={5} fill="rgba(220,110,90,0.22)" />
            {ouv > 0.06 ? (
              <ellipse cx={120} cy={86} rx={5 + 2.6 * ouv} ry={1.4 + 5.8 * ouv} fill="#5A1F22" />
            ) : (
              <path d="M113 84.5 Q120 90 127 84.5" stroke="#5A1F22" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            )}
          </g>
          {/* Bras, mains et objets */}
          <path d={`M82 134 L${bras.gC[0]} ${bras.gC[1]} L${bras.gM[0]} ${bras.gM[1]}`} stroke={l.haut} strokeWidth={24} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M158 134 L${bras.dC[0]} ${bras.dC[1]} L${bras.dM[0]} ${bras.dM[1]}`} stroke={l.haut} strokeWidth={24} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {(pose === "tablette") && (
            <g transform={`rotate(-10 ${bras.gM[0]} ${bras.gM[1]})`}>
              <rect x={bras.gM[0] - 30} y={bras.gM[1] - 40} width={64} height={48} rx={6} fill={P.encre} />
              <rect x={bras.gM[0] - 25} y={bras.gM[1] - 35} width={54} height={38} rx={3} fill="#E3E8F6" />
            </g>
          )}
          <circle cx={bras.gM[0]} cy={bras.gM[1]} r={12} fill={l.peau} />
          {(pose === "telephone" || pose === "perplexe") && (
            <g transform={`rotate(-8 ${bras.dM[0]} ${bras.dM[1]})`}>
              <rect x={bras.dM[0] - 14} y={bras.dM[1] - 30} width={28} height={50} rx={6} fill={P.encre} />
              <rect x={bras.dM[0] - 10} y={bras.dM[1] - 25} width={20} height={38} rx={3} fill="#DCE3F7" />
            </g>
          )}
          <circle cx={bras.dM[0]} cy={bras.dM[1]} r={12} fill={l.peau} />
        </g>
      </svg>
      {etiquette && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -hauteur * 0.06,
            transform: `translate(-50%, ${(1 - parle) * 10}px)`,
            opacity: parle,
            background: P.accent,
            color: "#FFFFFF",
            fontFamily: POLICE,
            fontWeight: 800,
            fontSize: Math.max(22, hauteur * 0.04),
            padding: `${hauteur * 0.012}px ${hauteur * 0.026}px`,
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {l.nom}
        </div>
      )}
    </div>
  );
};
