import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import Panneau, { Intitule, LignePanneau, Libelle } from '../jeux/Panneau';
import LancerQuizDialog from './LancerQuizDialog';
import { adresseEspace } from '../../../../shared/espaces.js';

/**
 * Panneau « Quiz en direct » de la page Activités : les parties en cours dans mes séances.
 * Enseignant : « Lancer un quiz » ouvre le lancement dans Planner (lot CQ-3 : plus aucun lien vers
 * le site du quiz) ; la partie s'anime depuis l'écran projeté, pas depuis cette liste.
 * Étudiant : rejoindre une partie en cours, ou saisir le code sur le site du quiz.
 * Sorti de pages/jeux/Jeux.jsx, trop long.
 */
export default function PanneauQuizDirect({ enseignant, role, config, parties }) {
  const { t } = useTranslation();
  const [lancer, setLancer] = useState(false);
  const urlQuiz = typeof config?.url === 'string' && /^https?:\/\//.test(config.url) ? config.url : null;
  if (!urlQuiz) return null;
  const rejoindre = !config?.peutLancer ? adresseEspace('quiz', { role, urlQuiz }) : null;

  return (
    <>
      <Panneau
        titre={t('jeux.quiz.titre')}
        titreId="quiz-titre"
        droite={
          config?.peutLancer ? (
            <Button size="small" variant="contained" onClick={() => setLancer(true)}>
              {t('board.launchQuiz')}
            </Button>
          ) : null
        }
      >
        {parties.length === 0 ? (
          <LignePanneau
            premier
            action={
              rejoindre ? (
                <Button size="small" variant="outlined" href={rejoindre}>
                  {t('jeux.quiz.saisirCode')}
                </Button>
              ) : null
            }
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t(enseignant ? 'jeux.quiz.aucuneEnseignant' : 'jeux.quiz.aucune')}
            </Typography>
          </LignePanneau>
        ) : (
          parties.map((p, i) => (
            <LignePanneau
              key={p.id}
              premier={i === 0}
              lampe="success.main"
              action={
                enseignant ? null : (
                  <Button size="small" variant="contained" href={p.url}>
                    {t('jeux.quiz.rejoindre')}
                  </Button>
                )
              }
            >
              <Libelle sx={{ display: 'block', fontSize: '0.75rem', color: 'success.main', letterSpacing: '0.12em' }}>{t('jeux.quiz.enCours')}</Libelle>
              <Box sx={{ fontWeight: 600 }}>{p.titre}</Box>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                {[p.module?.nom, t('jeux.quiz.code', { pin: p.pin })].filter(Boolean).join(' · ')}
              </Box>
            </LignePanneau>
          ))
        )}
      </Panneau>
      {/* Sans séance désignée : le serveur prend celle que l'enseignant donne en ce moment, s'il y en a une */}
      {enseignant && <LancerQuizDialog ouvert={lancer} onClose={() => setLancer(false)} />}
    </>
  );
}
