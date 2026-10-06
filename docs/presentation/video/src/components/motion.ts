import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_SOFT } from "../theme";

/** Progression 0 → 1 d'un ressort amorti qui démarre à `delay` (images, repère local). */
export const useEnter = (delay = 0, durationInFrames?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: SPRING_SOFT, durationInFrames });
};

/** Fondu + légère montée, pour les phrases. */
export const fadeUp = (p: number, distance = 18) => ({
  opacity: p,
  transform: `translateY(${(1 - p) * distance}px)`,
});

export const ramp = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const usePortrait = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};
