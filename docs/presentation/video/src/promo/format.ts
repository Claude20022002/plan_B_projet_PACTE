// Format de la composition (16:9, 9:16 ou 1:1) : chaque scène y adapte sa mise en page.
import { useVideoConfig } from "remotion";

export type Format = { W: number; H: number; paysage: boolean; portrait: boolean; carre: boolean };

/** Rend la taille de l'image et son orientation. */
export const useFormat = (): Format => {
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W * 1.2;
  const carre = !portrait && H > W * 0.8;
  return { W, H, portrait, carre, paysage: !portrait && !carre };
};

/** Choisit une valeur selon le format : paysage, portrait, carré. */
export const selon = <T,>(f: Format, paysage: T, portrait: T, carre: T): T => (f.portrait ? portrait : f.carre ? carre : paysage);
