import PanneauDevoirs from './PanneauDevoirs';
import { DEVOIRS_ACTIFS } from '../../../../shared/fonctions.js';

/**
 * Zone « quiz notés » de la page Activités : le panneau des devoirs, tant qu'ils sont actifs.
 * Devoirs masqués (lot D-1) : rien. Les quiz de l'enseignant (création, diffusion, modification,
 * suppression) se gèrent dans « Mes quiz » du menu : les répéter ici faisait un doublon.
 */
export default function ZoneQuizEtDevoirs({ enseignant }) {
  return DEVOIRS_ACTIFS ? <PanneauDevoirs enseignant={enseignant} /> : null;
}
