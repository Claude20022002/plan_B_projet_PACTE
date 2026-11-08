import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useEnter } from "./motion";

/**
 * Mise en scène « keynote » (vidéo Keynote) : de la profondeur et de la lumière autour d'images
 * à plat. Rien ici ne change une capture ; on ne fait que la poser dans l'espace.
 */

/**
 * La scène arrive inclinée vers l'arrière, se redresse en se posant (ressort amorti), puis la
 * caméra avance lentement jusqu'à la fin : l'image n'est jamais immobile.
 */
export const Camera: React.FC<{ duree: number; inclinaison?: number; avance?: number; children: React.ReactNode }> = ({
  duree,
  inclinaison = 9,
  avance = 0.035,
  children,
}) => {
  const frame = useCurrentFrame();
  const pose = useEnter(0, 26);
  const dolly = interpolate(frame, [0, duree], [0, avance], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "50% 40%" }}>
      <AbsoluteFill
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${(1 - pose) * inclinaison}deg) scale(${1.06 - 0.06 * pose + dolly})`,
          transformOrigin: "50% 60%",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Reflet de lumière qui balaie une surface (écran, emblème), comme sur un verre : une bande claire
 * en diagonale qui traverse de gauche à droite entre `debut` et `debut + duree` (images locales).
 * À poser en dernier enfant d'un bloc `position: relative; overflow: hidden`.
 */
export const Reflet: React.FC<{ debut: number; duree?: number; intensite?: number }> = ({ debut, duree = 22, intensite = 0.32 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [debut, debut + duree], [-0.6, 1.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < debut || frame > debut + duree) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        background: `linear-gradient(105deg, transparent ${(p - 0.18) * 100}%, rgba(255,255,255,${intensite}) ${p * 100}%, transparent ${(p + 0.18) * 100}%)`,
      }}
    />
  );
};

/** Halo derrière un objet qui apparaît : un rond de lumière bleutée qui s'ouvre puis respire. */
export const Halo: React.FC<{ debut: number; taille: number; couleur?: string }> = ({ debut, taille, couleur = "rgba(64,110,255,0.28)" }) => {
  const frame = useCurrentFrame();
  const ouverture = interpolate(frame, [debut, debut + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const souffle = 1 + 0.04 * Math.sin((frame - debut) / 14);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: taille,
        height: taille,
        marginLeft: -taille / 2,
        marginTop: -taille / 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${couleur} 0%, transparent 65%)`,
        opacity: ouverture,
        transform: `scale(${(0.6 + 0.4 * ouverture) * souffle})`,
        pointerEvents: "none",
      }}
    />
  );
};
