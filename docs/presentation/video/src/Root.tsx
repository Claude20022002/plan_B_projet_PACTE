import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { S1Title } from "./scenes/S1Title";
import { S2Scattered } from "./scenes/S2Scattered";
import { S3Generation } from "./scenes/S3Generation";
import { S4Board } from "./scenes/S4Board";
import { S5Mobile } from "./scenes/S5Mobile";
import { S6Results } from "./scenes/S6Results";
import { S7Stack } from "./scenes/S7Stack";
import { S8End } from "./scenes/S8End";
import { BEAT, C, FPS } from "./theme";

// ─── Timings (en temps à 120 BPM ; 1 temps = 15 images = 0,5 s) ─────────────────────────
// Chaque coupe tombe sur un temps. Modifier une durée décale les scènes suivantes.
export const TIMINGS = {
  title: 6 * BEAT, //      0,0 –  3,0 s
  scattered: 8 * BEAT, //  3,0 –  7,0 s
  generation: 10 * BEAT, // 7,0 – 12,0 s
  board: 10 * BEAT, //    12,0 – 17,0 s
  mobile: 10 * BEAT, //   17,0 – 22,0 s
  results: 10 * BEAT, //  22,0 – 27,0 s
  stack: 10 * BEAT, //    27,0 – 32,0 s
  end: 8 * BEAT, //       32,0 – 36,0 s
} as const;

const SCENES: { id: keyof typeof TIMINGS; C: React.FC }[] = [
  { id: "title", C: S1Title },
  { id: "scattered", C: S2Scattered },
  { id: "generation", C: S3Generation },
  { id: "board", C: S4Board },
  { id: "mobile", C: S5Mobile },
  { id: "results", C: S6Results },
  { id: "stack", C: S7Stack },
  { id: "end", C: S8End },
];

/** Version réseaux sociaux (9:16) : scènes 1, 5 et 8 enchaînées. */
const VERTICAL: (keyof typeof TIMINGS)[] = ["title", "mobile", "end"];

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
