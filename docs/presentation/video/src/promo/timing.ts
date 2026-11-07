// Durée de chaque scène de PactePromo, en secondes (storyboard de STORYBOARD.md), convertie en images.
// Les débuts des répliques sont dans script.json : changer une scène ici peut demander de les décaler.
import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";

export const FPS = 30;

/** Secondes → images. */
export const s = (secondes: number) => Math.round(secondes * FPS);

export const SCENES = [
  { id: "accroche", de: 0, a: 4 },
  { id: "desordre", de: 4, a: 12 },
  { id: "logo", de: 12, a: 18 },
  { id: "emploiDuTemps", de: 18, a: 30 },
  { id: "changement", de: 30, a: 40 },
  { id: "appel", de: 40, a: 48 },
  { id: "chiffres", de: 48, a: 55 },
  { id: "fin", de: 55, a: 60 },
] as const;

export type IdScene = (typeof SCENES)[number]["id"];

/** Durée totale de la composition, en images (60 s). */
export const DUREE_TOTALE = s(60);

/** Début d'une scène dans la vidéo, en images ; les composants des scènes en ont besoin pour lire les voix. */
export const Decalage = createContext(0);

/** L'image courante de la vidéo entière, même à l'intérieur d'une <Sequence>. */
export const useImageGlobale = () => useCurrentFrame() + useContext(Decalage);
