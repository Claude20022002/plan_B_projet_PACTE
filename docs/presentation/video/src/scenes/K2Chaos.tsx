import React from "react";
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { C, FONT_TEXT, FONT_TITLE, SHADOW } from "../theme";

// Ce qui arrive sur le téléphone de l'étudiante pendant qu'elle cherche sa salle (messages inventés,
// sans nom de personne). Les outils sont ceux du constat : Gmail, PDF, WhatsApp, Classroom, Moodle, jeux.
const MESSAGES: [string, string][] = [
  ["GMAIL", "Changement de salle : voir le PDF joint"],
  ["WHATSAPP", "Groupe 3A · 128 nouveaux messages"],
  ["PDF", "EDT_octobre_v3_FINAL(2).pdf"],
  ["CLASSROOM", "Nouveau devoir publié"],
  ["MOODLE", "Support du cours mis à jour"],
  ["GMAIL", "RE: RE: Salle de lundi ?"],
  ["WHATSAPP", "Quelqu'un sait où on a cours ?"],
  ["JEUX EXTERNES", "Créez un compte pour continuer"],
  ["PDF", "EDT_octobre_v4.pdf"],
  ["WHATSAPP", "G-S05 ou ST-S02 ??"],
  ["GMAIL", "Annulation : voir message précédent"],
  ["MOODLE", "Nouvelle annonce"],
];

// Les messages arrivent de plus en plus vite (images locales), puis tout disparaît d'un coup
const ARRIVEES = [4, 16, 26, 35, 43, 50, 56, 62, 67, 72, 77, 82];
export const COUPURE = 114; // le noir et le silence : 1,2 s avant la révélation

/**
 * Keynote · 2 · le chaos : les notifications des six outils s'empilent, la phrase dit le problème,
 * puis coupure franche au noir. Aucune capture : ce sont des cartes dessinées.
 */
export const K2Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titre = useEnter(30);
  if (frame >= COUPURE) return <AbsoluteFill style={{ background: "#000000" }} />;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {MESSAGES.map(([outil, texte], i) => {
        const p = spring({ frame: frame - ARRIVEES[i], fps, config: { damping: 18, stiffness: 220, mass: 0.7 } });
        if (frame < ARRIVEES[i]) return null;
        const x = 110 + random(`cx-${i}`) * 1120;
        const y = 70 + random(`cy-${i}`) * 760;
        const angle = (random(`ca-${i}`) - 0.5) * 12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 640,
              padding: "20px 26px",
              borderRadius: 22,
              background: "#212124",
              boxShadow: `${SHADOW}, 0 0 0 1px ${C.rule}`,
              opacity: Math.min(1, p * 2),
              transform: `rotate(${angle}deg) scale(${0.7 + 0.3 * p}) translateY(${(1 - p) * -40}px)`,
            }}
          >
            <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 28, letterSpacing: "0.08em", color: C.inkSoft }}>{outil} · MAINTENANT</div>
            <div style={{ fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 36, color: C.ink, marginTop: 6 }}>{texte}</div>
          </div>
        );
      })}
      {/* La phrase, sur un bandeau sombre pour rester lisible par-dessus les cartes */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", ...fadeUp(titre, 30) }}>
        <div style={{ background: "rgba(11,11,13,0.92)", padding: "26px 60px", borderRadius: 18 }}>
          <Line size={104}>Six outils. Aucun ne lui dit où aller.</Line>
        </div>
      </div>
    </AbsoluteFill>
  );
};
