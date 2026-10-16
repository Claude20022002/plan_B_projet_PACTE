/** Existing catalog rows, with separate attribution for original curriculum-aligned activities. */
import { Box, Button, LinearProgress, Link, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Panneau, { Capitales, LignePanneau } from './Panneau';
import { boutonPanneauPlein } from './styles';
import { ds } from '../../design-system/tokens';
import { libelle } from '../../../../shared/jeux/catalogue.js';

/** Preserves catalog layout and completion indicators for both terminal and simulation games. */
export default function CatalogueJeux({ accueil, erreur, jouer }) {
    const { t, i18n } = useTranslation();
    return <Panneau titre={t('jeux.catalogue')} titreId="catalogue-titre">
        {!accueil && !erreur && <Skeleton variant="rectangular" height={96} sx={{ bgcolor: ds.board.cell }} />}
        {(accueil?.jeux ?? []).map((jeu, i) => {
            const p = jeu.progression;
            const pourcentage = p.total ? Math.round((100 * p.reussis) / p.total) : 0;
            return <LignePanneau key={jeu.code} premier={i === 0} lampe={p.reussis > 0 ? ds.board.live : null}
                action={<Button variant="contained" sx={boutonPanneauPlein} onClick={() => jouer(jeu.code)}>{p.reussis > 0 ? t('jeux.continuer') : t('jeux.jouer')}</Button>}>
                <Capitales sx={{ display: 'block', fontSize: '1.125rem' }}>{libelle(jeu.titre, i18n.language)}</Capitales>
                <Box sx={{ fontSize: '0.9375rem', color: ds.board.letterDim, maxWidth: '72ch', mt: 0.25 }}>{libelle(jeu.resume, i18n.language)}</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, maxWidth: 420 }}>
                    <LinearProgress variant="determinate" value={pourcentage} aria-label={t('jeux.progression', { count: p.reussis, total: p.total, points: p.points })}
                        sx={{ flex: 1, height: 4, borderRadius: '2px', bgcolor: ds.board.seam, '& .MuiLinearProgress-bar': { bgcolor: ds.board.letter } }} />
                    <Capitales sx={{ fontSize: '0.8125rem', color: ds.board.letterDim, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {p.reussis}/{p.total} · {t('jeux.points', { count: p.points })}
                    </Capitales>
                </Box>
                <Box sx={{ fontSize: '0.75rem', color: ds.board.letterDim, mt: 0.75 }}>
                    {jeu.source ? <>
                        {t('jeux.source', { nom: jeu.source.nom, auteur: jeu.source.auteur, licence: jeu.source.licence })}{' '}
                        <Link href={jeu.source.url} target="_blank" rel="noopener noreferrer" sx={{ color: ds.board.letter }}>{t('jeux.voirSource')}</Link>
                    </> : <>
                        {t('simulations.original')}{jeu.curriculum && <> · <Link href={jeu.curriculum.url} target="_blank" rel="noopener noreferrer" sx={{ color: ds.board.letter }}>{t('simulations.source')}</Link></>}
                    </>}
                </Box>
            </LignePanneau>;
        })}
        <LignePanneau><Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t('jeux.bientot')}</Typography></LignePanneau>
    </Panneau>;
}
