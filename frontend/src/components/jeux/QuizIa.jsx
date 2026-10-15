import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { quizIaAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import Panneau, { Capitales, LignePanneau } from './Panneau';
import CreerQuizDialog from '../quiz/creation/CreerQuizDialog';
import RelireQuiz from '../quiz/creation/RelireQuiz';
import ListeMesQuiz from '../quiz/mesQuiz/ListeMesQuiz';
import { boutonPanneau, boutonPanneauPlein } from './styles';

/**
 * « Mes quiz » de l'enseignant (page Activités) : « Créer un quiz » en un geste (générer, ou le
 * faire soi-même dans l'éditeur du service de quiz), puis les quiz générés, à relire avant leur
 * création, puis tous les quiz du service de quiz, modifiables depuis Planner (IA-5). Le panneau
 * n'apparaît que si l'une des deux façons de créer est installée.
 * @param {{ preselection?: { id_cours, id_groupe }, donnerEnDevoir?: (generation) => void, ouvrirGeneration?: boolean }} props
 *   ouvrirGeneration : « Créer un quiz » s'ouvre d'emblée (arrivée depuis « Mes classes »)
 */
// Nouveau quiz dans le Studio : la page s'ouvre sur la fenêtre de création
const EDITEUR_STUDIO = '/studio-quiz?nouveau=1';

export default function PanneauQuizIa({ preselection = null, donnerEnDevoir, ouvrirGeneration = false }) {
  const { t, i18n } = useTranslation();
  const [dispo, setDispo] = useState(null);
  // « Le faire moi-même » : l'éditeur du Studio quiz, dans Planner (10 types de questions), et non
  // plus celui du service de quiz externe (docs/plans/studio-quiz.md)
  const editeur = EDITEUR_STUDIO;
  const [generations, setGenerations] = useState(null);
  const [creer, setCreer] = useState(false);
  const [ouverte, setOuverte] = useState(null); // { id, titre } de la génération relue
  const monte = useRef(true);

  const charger = useCallback(() => {
    quizIaAPI.disponibilite().then((d) => monte.current && setDispo(d)).catch(() => monte.current && setDispo({ disponible: false }));
    quizIaAPI.lister().then((l) => monte.current && setGenerations(Array.isArray(l) ? l : [])).catch(() => monte.current && setGenerations([]));
  }, []);

  useEffect(() => {
    monte.current = true;
    charger();
    return () => {
      monte.current = false;
    };
  }, [charger]);

  useEffect(() => {
    if (ouvrirGeneration) setCreer(true);
  }, [ouvrirGeneration]);

  if (!dispo?.disponible && !editeur) return null;
  const date = (iso) => new Date(iso).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const lampe = { pret: ds.board.letter, cree: ds.board.live, erreur: ds.brand.orange };

  return (
    <>
      <Panneau
        titre={t('jeux.quizIa.titre')}
        titreId="quiz-ia-titre"
        droite={
          <Button size="small" variant="contained" startIcon={<Add />} sx={boutonPanneauPlein} onClick={() => setCreer(true)}>
            {t('quizCreation.titre')}
          </Button>
        }
      >
        {generations === null && <Skeleton variant="rectangular" height={64} sx={{ bgcolor: ds.board.cell }} />}
        {generations?.length === 0 && (
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
        <ListeMesQuiz />
      </Panneau>
      <CreerQuizDialog
        ouvert={creer}
        fermer={() => setCreer(false)}
        preselection={preselection}
        generation={dispo?.disponible ? dispo : null}
        editeur={editeur}
        lancee={(id, sujet) => {
          setCreer(false);
          setOuverte({ id, titre: sujet });
          charger();
        }}
      />
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
