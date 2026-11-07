// Minutage de la vidéo Lancement, tiré de la voix (voix.json, produit par scripts/voix-promo.py) :
// chaque scène commence avec sa première phrase, la vidéo dure ce que dure la voix plus la fin.
import donnees from "./voix.json";

type SousTitre = { texte: string; de: number; a: number };
type Replique = { id: string; scene: string; debut: number; parleDe: number; parleA: number; sousTitres: SousTitre[] };

const REPLIQUES = donnees.repliques as Replique[];

export const FPS = 30;

/** Durée totale, en images. */
export const DUREE_LANCEMENT: number = donnees.dureeImages;

export const ORDRE = ["accroche", "eparpille", "revelation", "planification", "changement", "etudiant", "appel", "relie", "chiffres", "fin"] as const;
export type IdScene = (typeof ORDRE)[number];

const premier = (id: IdScene) => Math.min(...REPLIQUES.filter((r) => r.scene === id).map((r) => r.debut));

/** Début et durée de chaque scène, en images. La première commence à 0. */
export const SCENES = ORDRE.map((id, i) => {
  const de = i === 0 ? 0 : premier(id);
  const a = i === ORDRE.length - 1 ? DUREE_LANCEMENT : premier(ORDRE[i + 1]);
  return { id, de, duree: a - de };
});

const debutScene = (id: string) => SCENES.find((s) => s.id === id)!.de;

/** Image (locale à sa scène) où une phrase commence à être dite ; `part` avance dans la phrase (0 à 1). */
export const repere = (idReplique: string, part = 0) => {
  const r = REPLIQUES.find((x) => x.id === idReplique)!;
  return Math.round(r.parleDe + (r.parleA - r.parleDe) * part) - debutScene(r.scene);
};

/** Le sous-titre de l'image courante (vidéo entière). */
export const sousTitreLancement = (image: number) => {
  for (const r of REPLIQUES) {
    const l = r.sousTitres;
    for (let i = 0; i < l.length; i++) {
      const fin = i === l.length - 1 ? l[i].a + 8 : l[i + 1].de;
      if (image >= l[i].de - 3 && image < fin) return { texte: l[i].texte, de: l[i].de, fin };
    }
  }
  return null;
};

/** Volume de la musique : 30 % seule, 16 % sous la voix ; fondu d'entrée 0,5 s, de sortie 2 s. */
export const volumeMusiqueLancement = (image: number) => {
  let parole = 0;
  for (const r of REPLIQUES) parole = Math.max(parole, Math.min(1, (image - (r.parleDe - 8)) / 8, (r.parleA + 10 - image) / 10));
  const fondus = Math.min(1, image / (FPS / 2), (DUREE_LANCEMENT - image) / (2 * FPS));
  return Math.max(0, (0.3 - 0.14 * Math.max(0, parole)) * fondus);
};
