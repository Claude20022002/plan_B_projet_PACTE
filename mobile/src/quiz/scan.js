import { lireLienPartie } from './partie';

/**
 * Scan d'un QR dans l'application : le même viseur sert à l'appel et aux quiz, comme sur Wooclap
 * (remarques-par-profil.md, § 10). Un code d'appel a la forme « id.fenêtre.signature » ; un QR de
 * quiz est l'adresse de la partie sur le service de quiz (…/play?pin=…). Le QR projeté ne porte
 * que le code de la partie : l'étudiant joue avec son lien personnel donné par Planner (nom et
 * jeton), donc seulement une partie lancée dans l'une de ses séances.
 */

/** Origine https d'une adresse (« https://hôte »), ou null. URL de React Native est incomplète. */
export const origineDe = (url) => /^(https:\/\/[^/?#]+)/.exec(typeof url === 'string' ? url : '')?.[1] ?? null;

/** Code de la partie lu dans un QR de quiz, ou null si le QR n'en est pas un (code d'appel, autre site) */
export const pinScanne = (texte, origine) => lireLienPartie(texte, origine)?.pin ?? null;

/** Ma partie en cours qui porte ce code, ou null si elle n'est pas lancée dans mes séances */
export const partieDuPin = (parties, pin, origine) =>
  (Array.isArray(parties) ? parties : []).find((p) => lireLienPartie(p?.url, origine)?.pin === pin) ?? null;
