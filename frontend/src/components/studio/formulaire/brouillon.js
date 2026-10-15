/**
 * Brouillon d'une question dans l'éditeur en formulaire (sur le modèle de Google Forms) : ce qui
 * part au serveur, la question ajoutée par défaut, et le changement de type sans perdre ce qui a
 * déjà été écrit.
 */
import { questionVide } from '../../../../../shared/quiz/studio/types.js';

const vide = (liste) => (liste ?? []).map((x) => String(x ?? '').trim()).filter(Boolean);

/** Corps envoyé au serveur : les lignes vides des listes éditées une valeur par ligne sont retirées. */
export const nettoyer = (q) => {
  const d = { ...q.donnees };
  if (d.acceptees) d.acceptees = vide(d.acceptees);
  if (d.distracteurs) d.distracteurs = vide(d.distracteurs);
  if (d.trous) d.trous = d.trous.map((tr) => ({ ...tr, acceptees: vide(tr.acceptees), ...(vide(tr.options).length ? { options: vide(tr.options) } : { options: undefined }) }));
  return { type: q.type, enonce: q.enonce, points: q.points, explication: q.explication || null, id_media: q.id_media ?? null, extrait: q.extrait ?? null, donnees: d };
};

/** Question ajoutée d'un geste : un choix unique à quatre options, comme dans Google Forms. */
export const TYPE_PAR_DEFAUT = 'choix_unique';
export const nouvelleQuestion = (type = TYPE_PAR_DEFAUT) => ({ ...questionVide(type), id_question: null });

const CHOIX = ['choix_unique', 'choix_multiple'];

/**
 * Change le type en gardant l'énoncé, les points, l'explication et le média ; entre choix unique et
 * choix multiple, les options et les bonnes réponses restent (la première seule pour un choix unique).
 */
export const changerType = (q, type) => {
  if (type === q.type) return q;
  let { donnees } = questionVide(type);
  if (CHOIX.includes(q.type) && CHOIX.includes(type)) {
    const bonnes = q.type === 'choix_unique' ? (q.donnees.bonne ? [q.donnees.bonne] : []) : q.donnees.bonnes ?? [];
    donnees = type === 'choix_unique' ? { options: q.donnees.options, bonne: bonnes[0] ?? null } : { options: q.donnees.options, bonnes, annoncer_nombre: true };
  }
  return { ...q, type, donnees };
};
