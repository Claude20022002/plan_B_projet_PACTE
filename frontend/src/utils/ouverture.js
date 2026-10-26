import { aujourdhui } from '../../../shared/dates.js';

/**
 * État d'ouverture d'une section ou d'un support de cours (lot EC-1), pour l'enseignant qui prépare
 * ses supports. Les dates sont incluses, comme sur le serveur (backend/services/cours/ouverture.js).
 *  - 'programme' : pas encore ouvert, `date` est le jour d'ouverture ;
 *  - 'ferme'     : déjà fermé, `date` est le dernier jour où il était visible ;
 *  - 'ouvert'    : ouvert avec une fermeture prévue, `date` est son dernier jour ;
 *  - 'libre'     : aucune date, ou dates sans effet aujourd'hui.
 * L'interrupteur « masqué » est à part : il l'emporte, et se lit dans `visible`.
 */
export const etatOuverture = ({ visible_du: du, visible_jusqu_au: jusqu } = {}, jour = aujourdhui()) => {
  if (du && du > jour) return { etat: 'programme', date: du };
  if (jusqu && jusqu < jour) return { etat: 'ferme', date: jusqu };
  if (jusqu) return { etat: 'ouvert', date: jusqu };
  return { etat: 'libre', date: null };
};
