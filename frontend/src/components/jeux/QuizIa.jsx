import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { quizIaAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import Panneau, { Capitales, LignePanneau } from './Panneau';
import RelireQuiz from '../quiz/creation/RelireQuiz';
import ListeMesQuiz from '../quiz/mesQuiz/ListeMesQuiz';
import ListeQuizStudio from '../quiz/mesQuiz/ListeQuizStudio';
import { boutonPanneau, boutonPanneauPlein } from './styles';
import { localeEcran } from '../../utils/dates';

/**
 * « Mes quiz » de l'enseignant (page Activités, avec les devoirs) : « Créer un quiz » ouvre la
 * création du Studio quiz, où un sujet ou un document suffit, sans classe ni module (R-9). Puis les
 * quiz générés pour l'ancien service, à relire avant leur création, les quiz du Studio (à diffuser
 * d'ici, code et QR code), puis tous les quiz du service de quiz, modifiables depuis Planner (IA-5).
 * @param {{ donnerEnDevoir?: (generation) => void }} props
 */
export default function PanneauQuizIa({ donnerEnDevoir }) {
  const { t, i18n } = useTranslation();
  const [generations, setGenerations] = useState(null);
  const [ouverte, setOuverte] = useState(null); // { id, titre } de la génération relue
  const [nbStudio, setNbStudio] = useState(null); // quiz du Studio (null : pas encore chargés)
  const monte = useRef(true);

  const charger = useCallback(() => {
    quizIaAPI.lister().then((l) => monte.current && setGenerations(Array.isArray(l) ? l : [])).catch(() => monte.current && setGenerations([]));
  }, []);

  useEffect(() => {
    monte.current = true;
    charger();
    return () => {
      monte.current = false;
    };
  }, [charger]);

  const date = (iso) => new Date(iso).toLocaleString(localeEcran(i18n.language), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const lampe = { pret: ds.board.letter, cree: ds.board.live, erreur: ds.brand.orange };

  return (
    <>
      <Panneau
        titre={t('jeux.quizIa.titre')}
        titreId="quiz-ia-titre"
        droite={
          <Button size="small" variant="contained" startIcon={<Add />} sx={boutonPanneauPlein} component={Link} to="/studio-quiz?nouveau=1">
            {t('studio.banque.creer')}
          </Button>
        }
      >
        {generations === null && <Skeleton variant="rectangular" height={64} sx={{ bgcolor: ds.board.cell }} />}
        {generations?.length === 0 && nbStudio === 0 && (
          <LignePanneau premier>
            <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t('jeux.quizIa.aucune')}</Typography>
          </LignePanneau>
        )}
        {(generations ?? []).map((g, i) => (
          <LignePanneau
            key={g.id_generation}
            premier={i === 0}
            lampe={lampe[g.statut] ?? null}
            action={
              g.statut === 'erreur' ? null : (
                <Button size="small" variant={g.statut === 'pret' ? 'contained' : 'outlined'} sx={g.statut === 'pret' ? boutonPanneauPlein : boutonPanneau} onClick={() => setOuverte({ id: g.id_generation, titre: '' })}>
                  {t(g.statut === 'pret' ? 'jeux.quizIa.relireCourt' : g.statut === 'cree' ? 'jeux.quizIa.voir' : 'jeux.quizIa.suivre')}
                </Button>
              )
            }
          >
            <Box sx={{ fontWeight: 600 }}>{g.titre_quiz || g.nom_source || t('jeux.quizIa.sansNom')}</Box>
            <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>{date(g.creee_le)}</Box>
            <Capitales sx={{ display: 'block', mt: 0.5, fontSize: '0.875rem', color: ds.board.letter }}>
              {g.statut === 'erreur' ? g.erreur || t('jeux.quizIa.echec') : t(`jeux.quizIa.statuts.${g.statut}`, { count: g.questions?.length ?? 0 })}
            </Capitales>
          </LignePanneau>
        ))}
        <ListeQuizStudio onNombre={setNbStudio} />
        <ListeMesQuiz />
      </Panneau>
      <RelireQuiz
        id={ouverte?.id ?? null}
        titreInitial={ouverte?.titre ?? ''}
        fermer={() => setOuverte(null)}
        modifie={charger}
        donnerEnDevoir={
          donnerEnDevoir
            ? (g) => {
                setOuverte(null);
                donnerEnDevoir(g);
              }
            : null
        }
      />
    </>
  );
}
