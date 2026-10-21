import { lineColor } from '../../design-system/tokens';

/**
 * Couleur d'une séance dans l'emploi du temps : celle de son module, pas de sa filière. Dans la
 * semaine d'une classe, toutes les séances sont de la même filière et auraient toutes la même
 * couleur. Orange, rouge et vert restent aux statuts (lineColor ne les donne jamais).
 */
export const couleurDuModule = (session) => lineColor(session.courseCode || session.lineKey);
