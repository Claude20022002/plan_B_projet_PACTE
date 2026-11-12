// Lecture des voix produites par scripts/voix-promo.py (voix.json) : bouche des avatars,
// moments de parole, sous-titres et baisse de la musique quand quelqu'un parle.
import donnees from "./voix.json";
import { DUREE_TOTALE, FPS } from "./timing";

export type Qui = "narrateur" | "nadia" | "youssef" | "salma";

type SousTitre = { texte: string; de: number; a: number };
type Replique = {
  id: string;
  qui: Qui;
  nom: string;
  debut: number;
  duree: number;
  parleDe: number;
  parleA: number;
  bouche: number[];
  sousTitres: SousTitre[];
};

export const REPLIQUES = donnees.repliques as Replique[];

/** Ouverture de la bouche (0 à 1) d'un personnage à une image de la vidéo. */
export const bouche = (qui: Qui, image: number) => {
  for (const r of REPLIQUES) {
    const i = image - r.debut;
    if (r.qui === qui && i >= 0 && i < r.bouche.length) return r.bouche[i];
  }
  return 0;
};

/** De 0 à 1 : à quel point le personnage est « en train de parler » (montée et descente sur 8 images). */
export const enParole = (qui: Qui, image: number, marge = 8) => {
  let v = 0;
  for (const r of REPLIQUES) {
    if (r.qui !== qui) continue;
    const entree = (image - (r.parleDe - marge)) / marge;
    const sortie = (r.parleA + marge - image) / marge;
    v = Math.max(v, Math.min(1, entree, sortie));
  }
  return Math.max(0, v);
};

/** Le sous-titre à afficher à cette image, s'il y en a un. */
export const sousTitre = (image: number) => {
  for (const r of REPLIQUES) {
    const liste = r.sousTitres;
    for (let i = 0; i < liste.length; i++) {
      const fin = i === liste.length - 1 ? liste[i].a + 10 : liste[i + 1].de;
      if (image >= liste[i].de - 3 && image < fin) return { ...liste[i], fin };
    }
  }
  return null;
};

/** Volume de la musique : 12 % ; 6 % quand une voix parle ; fondu d'entrée 1 s, de sortie 2 s. */
export const volumeMusique = (image: number) => {
  let parole = 0;
  for (const r of REPLIQUES) {
    const entree = (image - (r.parleDe - 10)) / 10;
    const sortie = (r.parleA + 12 - image) / 12;
    parole = Math.max(parole, Math.min(1, entree, sortie));
  }
  parole = Math.max(0, parole);
  const fondus = Math.min(1, image / FPS, (DUREE_TOTALE - image) / (2 * FPS));
  return Math.max(0, (0.12 - 0.06 * parole) * fondus);
};
