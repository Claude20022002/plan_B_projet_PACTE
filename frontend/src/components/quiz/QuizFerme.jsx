import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Quiz } from '@mui/icons-material';
import EmptyState from '../../design-system/components/EmptyState';

/**
 * Écran ouvert directement (favori, ancienne notification) alors que les quiz en direct ne sont pas
 * ouverts pour l'école (lot ME-0c, règle C-5) : un message clair et le chemin des activités, jamais
 * une erreur du serveur.
 */
export default function QuizFerme() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <EmptyState
      title={t('jeux.quizFerme.titre')}
      description={t('jeux.quizFerme.aide')}
      actionLabel={t('jeux.quizFerme.retour')}
      onAction={() => navigate('/jeux')}
      icon={<Quiz />}
    />
  );
}
