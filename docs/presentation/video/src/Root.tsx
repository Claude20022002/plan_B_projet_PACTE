import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { S1Intro } from "./scenes/S1Intro";
import { S2Outils } from "./scenes/S2Outils";
import { S3Convergence } from "./scenes/S3Convergence";
import { S4Agenda } from "./scenes/S4Agenda";
import { S5Alerte } from "./scenes/S5Alerte";
import { S6Supports } from "./scenes/S6Supports";
import { S7Resultats } from "./scenes/S7Resultats";
import { S8Chiffres } from "./scenes/S8Chiffres";
import { S9Fin } from "./scenes/S9Fin";
import { BEAT, C, FPS } from "./theme";

// ─── Timings (en temps à 120 BPM ; 1 temps = 15 images = 0,5 s) ─────────────────────────
// Chaque coupe tombe sur un temps. Modifier une durée décale les scènes suivantes.
export const TIMINGS = {
  title: 8 * BEAT, //        0,0 –  4,0 s  logo qui s'assemble, nom
  outils: 10 * BEAT, //      4,0 –  9,0 s  six outils éparpillés, barrés
  convergence: 6 * BEAT, //  9,0 – 12,0 s  une seule application
  agenda: 10 * BEAT, //     12,0 – 17,0 s  le mois, le détail d'une séance
  alerte: 10 * BEAT, //     17,0 – 22,0 s  alerte de report
  supports: 10 * BEAT, //   22,0 – 27,0 s  supports de cours, PDF officiel
  resultats: 12 * BEAT, //  27,0 – 33,0 s  quiz, défis, devoirs notés
  chiffres: 10 * BEAT, //   33,0 – 38,0 s  90 s · 1 compte · 0 publicité
  fin: 8 * BEAT, //         38,0 – 42,0 s  emblème, nom, adresse
} as const;

const SCENES: { id: keyof typeof TIMINGS; C: React.FC }[] = [
  { id: "title", C: S1Intro },
  { id: "outils", C: S2Outils },
  { id: "convergence", C: S3Convergence },
  { id: "agenda", C: S4Agenda },
  { id: "alerte", C: S5Alerte },
  { id: "supports", C: S6Supports },
  { id: "resultats", C: S7Resultats },
  { id: "chiffres", C: S8Chiffres },
  { id: "fin", C: S9Fin },
];

/** Version réseaux sociaux (9:16) : scènes 1, 4 et 9 enchaînées (13 s). */
const VERTICAL: (keyof typeof TIMINGS)[] = ["title", "agenda", "fin"];

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

export const HestimPlanner: React.FC = () => <Timeline ids={ALL} />;
export const HestimPlannerVertical: React.FC = () => <Timeline ids={VERTICAL} />;

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
  </>
);
