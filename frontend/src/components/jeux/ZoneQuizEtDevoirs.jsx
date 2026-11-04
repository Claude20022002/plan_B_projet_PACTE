import PanneauDevoirs from './PanneauDevoirs';
import PanneauQuizIa from './QuizIa';
import useClassQuiz from '../../hooks/useClassQuiz';
import { DEVOIRS_ACTIFS } from '../../../../shared/fonctions.js';

/**
 * Zone « quiz notés » de la page Activités : le panneau des devoirs, tant qu'ils sont actifs.
 * Devoirs masqués (lot D-1) : rien. Les quiz de l'enseignant (création, diffusion, modification,
 * suppression) se gèrent dans « Mes quiz » du menu : les répéter ici faisait un doublon.
 * Un devoir est aujourd'hui un quiz ClassQuiz (lot ME-0c, règle C-8) : sans ClassQuiz pour l'école,
 * pas de panneau des devoirs ; l'enseignant garde ses quiz du Studio.
 */
export default function ZoneQuizEtDevoirs({ enseignant }) {
  const { actif } = useClassQuiz();
  if (!DEVOIRS_ACTIFS) return null;
  if (!actif) return enseignant ? <PanneauQuizIa /> : null;
  return <PanneauDevoirs enseignant={enseignant} />;
}
