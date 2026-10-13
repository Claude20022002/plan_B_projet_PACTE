import { useTranslation } from 'react-i18next';
import { Box, Button, LinearProgress, Link, Skeleton, Typography } from '@mui/material';
import Panneau, { Intitule, LignePanneau } from './Panneau';
import { libelle } from '../../../../shared/jeux/catalogue.js';

/**
 * Carte « Tous les jeux » de la page Activités : chaque jeu de la plateforme, son résumé, ma
 * progression et sa source ; « Jouer » ou « Continuer ». Sortie de pages/jeux/Jeux.jsx, trop long.
 */
export default function CatalogueJeux({ jeux, chargement, onJouer }) {
  const { t, i18n } = useTranslation();
  return (
    <Panneau titre={t('jeux.catalogue')} titreId="catalogue-titre">
      {chargement && <Skeleton variant="rounded" height={96} sx={{ m: 1.5 }} />}
      {(jeux ?? []).map((jeu, i) => {
        const p = jeu.progression;
        const pourcentage = p.total ? Math.round((100 * p.reussis) / p.total) : 0;
        return (
          <LignePanneau
            key={jeu.code}
            premier={i === 0}
            lampe={p.reussis > 0 ? 'success.main' : null}
            action={
              <Button variant="contained" onClick={() => onJouer(jeu.code)}>
                {p.reussis > 0 ? t('jeux.continuer') : t('jeux.jouer')}
              </Button>
            }
          >
            <Intitule sx={{ display: 'block', fontSize: '1.125rem' }}>{libelle(jeu.titre, i18n.language)}</Intitule>
            <Box sx={{ fontSize: '0.9375rem', color: 'text.secondary', maxWidth: '72ch', mt: 0.25 }}>{libelle(jeu.resume, i18n.language)}</Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, maxWidth: 420 }}>
              <LinearProgress
                variant="determinate"
                value={pourcentage}
                aria-label={t('jeux.progression', { count: p.reussis, total: p.total, points: p.points })}
                sx={{ flex: 1, height: 6, borderRadius: 999 }}
              />
              <Box component="span" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {p.reussis}/{p.total} · {t('jeux.points', { count: p.points })}
              </Box>
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.75 }}>
              {t('jeux.source', { nom: jeu.source.nom, auteur: jeu.source.auteur, licence: jeu.source.licence })}{' '}
              <Link href={jeu.source.url} target="_blank" rel="noopener noreferrer">
                {t('jeux.voirSource')}
              </Link>
            </Box>
          </LignePanneau>
        );
      })}
      <LignePanneau>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('jeux.bientot')}</Typography>
      </LignePanneau>
    </Panneau>
  );
}
