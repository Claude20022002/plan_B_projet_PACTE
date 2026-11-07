// Fin de la vidéo Lancement : tout est relié autour de l'emblème (le contraire des outils éparpillés
// de l'ouverture), les deux chiffres vérifiés, puis le nom, la promesse et l'action.
import React from "react";
import { interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Embleme } from "../../components/Embleme";
import { Compteur } from "../../promo/components/Elements";
import { Personnage, type QuiPersonnage } from "../../promo/components/Personnage";
import { BORNES, DOUX, POLICE } from "../../promo/theme";
import { COULEURS as K, Fond, Mots, Noeud } from "../elements";
import { repere } from "../voix";

const BRANCHES = [
  { nom: "Supports de cours", part: 0.02, angle: -150 },
  { nom: "Quiz", part: 0.16, angle: -90 },
  { nom: "Heures faites", part: 0.3, angle: -30 },
  { nom: "Emploi du temps", part: 0.5, angle: 30 },
  { nom: "Appel", part: 0.6, angle: 150 },
  { nom: "Alertes", part: 0.68, angle: 90 },
];

export const Relie: React.FC<{ duree: number }> = () => {
  const f = useCurrentFrame();
  const cx = 960, cy = 560, rx = 560, ry = 300;
  const compte = repere("l11", 0.82);
  return (
    <Fond couleur={K.fond}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {BRANCHES.map((b) => {
          const a = (b.angle * Math.PI) / 180;
          const t = interpolate(f, [repere("l11", b.part), repere("l11", b.part) + 12], [0, 1], { ...BORNES, easing: DOUX });
          return <line key={b.nom} x1={cx} y1={cy} x2={cx + Math.cos(a) * rx * t} y2={cy + Math.sin(a) * ry * t} stroke={K.marine} strokeWidth={5} strokeLinecap="round" />;
        })}
      </svg>
      <div style={{ position: "absolute", left: cx - 110, top: cy - 110 }}>
        <Embleme start={0} size={190} tile stagger={1} stiffness={190} />
      </div>
      {BRANCHES.map((b) => {
        const a = (b.angle * Math.PI) / 180;
        return (
          <Noeud key={b.nom} x={cx + Math.cos(a) * rx} y={cy + Math.sin(a) * ry} de={repere("l11", b.part) + 8} taille={42} couleur={K.marine}>
            {b.nom}
          </Noeud>
        );
      })}
      <Mots texte="Un seul compte." de={compte} taille={70} accent={[1]} couleurAccent={K.marine} style={{ left: 0, right: 0, top: 60 }} />
    </Fond>
  );
};

export const Chiffres: React.FC<{ duree: number }> = ({ duree }) => {
  const b = repere("l12", 0.66);
  const note: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: 840, textAlign: "center", fontFamily: POLICE, fontWeight: 500, fontSize: 30, color: "rgba(255,255,255,0.7)" };
  return (
    <Fond couleur={K.marine}>
      <Sequence durationInFrames={b}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: POLICE, fontWeight: 800, fontSize: 300, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1 }}>
          <Compteur valeur={2620} de={repere("l12", 0.42)} duree={36} />
        </div>
        <Mots texte="séances placées" de={repere("l12", 0.5)} taille={80} couleur="#FFFFFF" style={{ left: 0, right: 0, top: 570 }} />
        <div style={note}>Semestre de démonstration HESTIM</div>
      </Sequence>
      <Sequence from={b} durationInFrames={duree - b}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: POLICE, fontWeight: 800, fontSize: 300, color: K.orange, lineHeight: 1 }}>0</div>
        <Mots texte="salle réservée deux fois" de={2} taille={80} couleur="#FFFFFF" style={{ left: 0, right: 0, top: 570 }} />
        <div style={note}>Semestre de démonstration HESTIM</div>
      </Sequence>
    </Fond>
  );
};

const FIGURANTS: { qui: QuiPersonnage; x: number; h: number; sens: 1 | -1 }[] = [
  { qui: "nadia", x: 170, h: 470, sens: 1 },
  { qui: "amine", x: 360, h: 500, sens: 1 },
  { qui: "salma", x: 1560, h: 460, sens: -1 },
  { qui: "youssef", x: 1750, h: 500, sens: -1 },
];

export const Fin: React.FC<{ duree: number }> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bouton = spring({ frame: f - 46, fps, config: { damping: 14, stiffness: 150 } });
  const pulse = interpolate(f, [70, 80, 92], [1, 1.06, 1], BORNES);
  return (
    <Fond couleur={K.fond}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Embleme start={0} size={170} tile={false} stagger={0.9} stiffness={200} />
        <div style={{ position: "relative", width: "100%", height: 140 }}>
          <Mots texte="HESTIM Planner" de={8} taille={104} accent={[1]} couleurAccent={K.marine} pas={4} style={{ left: 0, right: 0, top: 30 }} />
        </div>
        <div style={{ position: "relative", width: "100%", height: 90 }}>
          <Mots texte="Toute l'école à l'heure." de={24} taille={64} accent={[3]} pas={4} style={{ left: 0, right: 0, top: 14 }} />
        </div>
        <div style={{ marginTop: 50, transform: `scale(${bouton * pulse})`, background: K.marine, color: "#FFFFFF", fontFamily: POLICE, fontWeight: 800, fontSize: 44, padding: "24px 56px", borderRadius: 999, boxShadow: "0 18px 40px rgba(0,24,97,0.28)" }}>
          Demandez votre démo
        </div>
      </div>
      {FIGURANTS.map((p, i) => (
        <Personnage key={p.qui} qui={p.qui} muet x={p.x} sol={1000} hauteur={p.h} pose="salut" sens={p.sens} etiquette={false} entree={6 + i * 5} imageLocale={f} />
      ))}
    </Fond>
  );
};
