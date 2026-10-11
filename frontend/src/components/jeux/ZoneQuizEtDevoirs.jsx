import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PanneauDevoirs from './PanneauDevoirs';
import PanneauQuizIa from './QuizIa';
import { DEVOIRS_ACTIFS } from '../../../../shared/fonctions.js';

/**
 * Zone « quiz notés » de la page Activités. Devoirs actifs : le panneau des devoirs, qui porte
 * aussi les quiz par l'IA. Devoirs masqués (lot D-1) : les quiz par l'IA seuls, pour l'enseignant,
 * sans le bouton « Le donner en devoir ».
 */
export default function ZoneQuizEtDevoirs({ enseignant }) {
  if (DEVOIRS_ACTIFS) return <PanneauDevoirs enseignant={enseignant} />;
  return enseignant ? <QuizIaSeul /> : null;
}

/** Quiz par l'IA ; depuis « Mes classes », le dialogue de génération s'ouvre sur la classe choisie. */
function QuizIaSeul() {
  const location = useLocation();
  const navigate = useNavigate();
  const [preselection, setPreselection] = useState(null);

  useEffect(() => {
    const classe = location.state?.genererQuiz;
    if (!classe) return;
    setPreselection(classe);
    // L'état est consommé : un rechargement de la page ne rouvre pas le dialogue
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  return <PanneauQuizIa preselection={preselection} ouvrirGeneration={Boolean(preselection)} />;
}
