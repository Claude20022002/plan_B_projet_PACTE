import React from "react";
import { AbsoluteFill, Audio, Composition, Sequence, staticFile } from "remotion";
import { S1Intro } from "./scenes/S1Intro";
import { S2Outils } from "./scenes/S2Outils";
import { S3Convergence } from "./scenes/S3Convergence";
import { S4Agenda } from "./scenes/S4Agenda";
import { S5Alerte } from "./scenes/S5Alerte";
import { S6Supports } from "./scenes/S6Supports";
import { S7Resultats } from "./scenes/S7Resultats";
import { S8Appel } from "./scenes/S8Appel";
import { S8Chiffres } from "./scenes/S8Chiffres";
import { S9Fin } from "./scenes/S9Fin";
import { BEAT, C, FPS } from "./theme";
import { Carrousel, HAUTEUR, LARGEUR, NB_PAGES } from "./carrousel/Carrousel";
import { Direction, TEMPS_DIRECTION } from "./Direction";
import { Keynote, TEMPS_KEYNOTE } from "./Keynote";
import { Keynote80, TEMPS_KEYNOTE_80 } from "./Keynote80";
import { Matinee, MatineeReseaux, TEMPS_RESEAUX, TEMPS_SALLE, dureeTotale } from "./Matinee";
import { PactePromo } from "./promo/PactePromo";
import { Lancement } from "./lancement/Lancement";
import { DUREE_LANCEMENT } from "./lancement/voix";
import { DUREE_TOTALE as DUREE_PROMO, FPS as FPS_PROMO } from "./promo/timing";

// ─── Timings (en temps à 120 BPM ; 1 temps = 15 images = 0,5 s) ─────────────────────────
// Chaque coupe tombe sur un temps. Modifier une durée décale les scènes suivantes.
export const TIMINGS = {
  title: 10 * BEAT, //       0 –  5 s  logo qui s'assemble, nom, phrase
  outils: 14 * BEAT, //      5 – 12 s  « Aujourd'hui, à l'école : » six outils, barrés
  convergence: 8 * BEAT, // 12 – 16 s  une seule application, pour toute l'école
  agenda: 14 * BEAT, //     16 – 23 s  le mois, puis le détail d'une séance
  alerte: 12 * BEAT, //     23 – 29 s  alerte de report (3 s à l'écran)
  supports: 14 * BEAT, //   29 – 36 s  supports de cours, PDF officiel
  resultats: 16 * BEAT, //  36 – 44 s  quiz, défis, devoirs notés
  appel: 12 * BEAT, //      44 – 50 s  l'appel par QR code : ce que l'école y gagne
  chiffres: 14 * BEAT, //   50 – 57 s  90 s · 1 compte · 0 publicité
  fin: 10 * BEAT, //        57 – 62 s  emblème, nom, web · iPhone · Android
} as const;

const SCENES: { id: keyof typeof TIMINGS; C: React.FC }[] = [
  { id: "title", C: S1Intro },
  { id: "outils", C: S2Outils },
  { id: "convergence", C: S3Convergence },
  { id: "agenda", C: S4Agenda },
  { id: "alerte", C: S5Alerte },
  { id: "supports", C: S6Supports },
  { id: "resultats", C: S7Resultats },
  { id: "appel", C: S8Appel },
  { id: "chiffres", C: S8Chiffres },
  { id: "fin", C: S9Fin },
];

/** Teaser réseaux sociaux (9:16, 34 s) : toute l'histoire, du problème à la fin, sans supports, résultats ni chiffres. */
export const VERTICAL: (keyof typeof TIMINGS)[] = ["title", "outils", "convergence", "agenda", "alerte", "fin"];

/**
 * Teaser B (9:16, 29 s), à comparer au premier : l'accroche d'abord. La vidéo s'ouvre sur l'alerte
 * « cours reporté » (ce que vit chaque étudiant), puis le problème, la réponse, l'agenda et la fin.
 */
export const VERTICAL_ACCROCHE: (keyof typeof TIMINGS)[] = ["alerte", "outils", "convergence", "agenda", "fin"];

const total = (ids: (keyof typeof TIMINGS)[]) => ids.reduce((s, id) => s + TIMINGS[id], 0);

const Timeline: React.FC<{ ids: (keyof typeof TIMINGS)[] }> = ({ ids }) => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {ids.map((id) => {
        const Scene = SCENES.find((s) => s.id === id)!.C;
        const seq = (
          <Sequence key={id} from={from} durationInFrames={TIMINGS[id]} name={id}>
            <Scene />
          </Sequence>
        );
        from += TIMINGS[id];
        return seq;
      })}
    </AbsoluteFill>
  );
};

const ALL = SCENES.map((s) => s.id);

// Bande-son originale (scripts/composer-musique.py), calée sur les scènes
export const HestimPlanner: React.FC = () => (
  <>
    <Timeline ids={ALL} />
    <Audio src={staticFile("audio/hestim-planner.wav")} />
  </>
);
export const HestimPlannerVertical: React.FC = () => (
  <>
    <Timeline ids={VERTICAL} />
    <Audio src={staticFile("audio/hestim-planner-9x16.wav")} />
  </>
);
export const HestimPlannerAccroche: React.FC = () => (
  <>
    <Timeline ids={VERTICAL_ACCROCHE} />
    <Audio src={staticFile("audio/hestim-planner-9x16-accroche.wav")} />
  </>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HestimPlanner"
      component={HestimPlanner}
      durationInFrames={total(ALL)}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="HestimPlannerVertical"
      component={HestimPlannerVertical}
      durationInFrames={total(VERTICAL)}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="HestimPlannerAccroche"
      component={HestimPlannerAccroche}
      durationInFrames={total(VERTICAL_ACCROCHE)}
      fps={FPS}
      width={1080}
      height={1920}
    />
    {/* « Une matinée à l'école » (lot V-1) : montage pour la salle, puis pour les réseaux */}
    <Composition id="Matinee" component={Matinee} durationInFrames={dureeTotale(TEMPS_SALLE)} fps={FPS} width={1920} height={1080} />
    <Composition id="Direction" component={Direction} durationInFrames={dureeTotale(TEMPS_DIRECTION)} fps={FPS} width={1920} height={1080} />
    {/* La vidéo de la présentation de 3 minutes, entre deux moments du discours (../discours-keynote.md) */}
    <Composition id="Keynote" component={Keynote} durationInFrames={dureeTotale(TEMPS_KEYNOTE)} fps={FPS} width={1920} height={1080} />
    <Composition id="Keynote80" component={Keynote80} durationInFrames={dureeTotale(TEMPS_KEYNOTE_80)} fps={FPS} width={1920} height={1080} />
    <Composition id="MatineeReseaux" component={MatineeReseaux} durationInFrames={dureeTotale(TEMPS_RESEAUX)} fps={FPS} width={1080} height={1920} />
    {/* Carrousel LinkedIn : une image par page (npm run carrousel) */}
    {/* Film de lancement (voix off continue, plans courts) : src/lancement/, durée tirée de la voix */}
    <Composition id="Lancement" component={Lancement} durationInFrames={DUREE_LANCEMENT} fps={30} width={1920} height={1080} />
    {/* Vidéo publicitaire de 60 s avec avatars (src/promo/, STORYBOARD.md), en 16:9, 9:16 et 1:1 */}
    <Composition id="PactePromo" component={PactePromo} durationInFrames={DUREE_PROMO} fps={FPS_PROMO} width={1920} height={1080} />
    <Composition id="PactePromoVertical" component={PactePromo} durationInFrames={DUREE_PROMO} fps={FPS_PROMO} width={1080} height={1920} />
    <Composition id="PactePromoCarre" component={PactePromo} durationInFrames={DUREE_PROMO} fps={FPS_PROMO} width={1080} height={1080} />
    <Composition id="Carrousel" component={Carrousel} durationInFrames={NB_PAGES} fps={FPS} width={LARGEUR} height={HAUTEUR} />
  </>
);
