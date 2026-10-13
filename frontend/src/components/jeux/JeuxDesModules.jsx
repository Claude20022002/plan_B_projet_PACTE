import { useTranslation } from 'react-i18next';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import Panneau, { Intitule, LignePanneau } from './Panneau';
import { libelle } from '../../../../shared/jeux/catalogue.js';

// But et notion déjà choisis pour le jeu `code` dans le module `module`, s'il y est proposé
const detailDe = (module, code) => (module.details ?? []).find((d) => d.code === code);

/**
 * Carte « Jeux de mes modules » de la page Activités. Enseignant : chaque jeu de chaque module,
 * proposé ou non, avec suivi, modification et proposer / retirer. Étudiant : les jeux proposés dans
 * ses modules, à jouer. Sortie de pages/jeux/Jeux.jsx, trop long.
 */
export default function JeuxDesModules({ enseignant, jeux, modules, chargement, titreJeu, onJouer, onSuivi, onModifier, onBasculer }) {
  const { t, i18n } = useTranslation();
  const detail = (m, jeu) => {
    const d = detailDe(m, jeu.code);
    return [libelle(jeu.titre, i18n.language), t(`jeux.buts.${d?.but ?? 'entrainer'}`), d?.notion].filter(Boolean).join(' · ');
  };

  return (
    <Panneau titre={t(enseignant ? 'jeux.modules.titreEnseignant' : 'jeux.modules.titre')} titreId="modules-titre">
      {chargement && <Skeleton variant="rounded" height={64} sx={{ m: 1.5 }} />}
      {!chargement && modules.length === 0 && (
        <LignePanneau premier>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('jeux.modules.aucun')}</Typography>
        </LignePanneau>
      )}
      {modules.map((m, i) =>
        enseignant
          ? (jeux ?? []).map((jeu, j) => {
              const propose = m.jeux.includes(jeu.code);
              return (
                <LignePanneau
                  key={`${m.id_cours}-${jeu.code}`}
                  premier={i === 0 && j === 0}
                  lampe={propose ? 'success.main' : null}
                  action={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {propose && (
                        <Button size="small" variant="outlined" onClick={() => onSuivi(m, jeu.code)}>
                          {t('jeux.modules.suivi')}
                        </Button>
                      )}
                      {propose && (
                        <Button size="small" variant="outlined" onClick={() => onModifier(m, jeu, detailDe(m, jeu.code))}>
                          {t('jeux.modules.modifier')}
                        </Button>
                      )}
                      <Button size="small" variant={propose ? 'outlined' : 'contained'} onClick={() => onBasculer(m, jeu)}>
                        {propose ? t('jeux.modules.retirer') : t('jeux.modules.proposer')}
                      </Button>
                    </Box>
                  }
                >
                  <Intitule sx={{ display: 'block', fontSize: '1rem' }}>
                    {m.code} · {m.nom}
                  </Intitule>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {propose ? detail(m, jeu) : `${libelle(jeu.titre, i18n.language)} (${t('jeux.modules.nonPropose')})`}
                  </Box>
                </LignePanneau>
              );
            })
          : m.jeux.map((code, j) => (
              <LignePanneau
                key={`${m.id_cours}-${code}`}
                premier={i === 0 && j === 0}
                lampe="success.main"
                action={
                  <Button size="small" variant="contained" onClick={() => onJouer(code)}>
                    {t('jeux.jouer')}
                  </Button>
                }
              >
                <Intitule sx={{ display: 'block', fontSize: '1rem' }}>{titreJeu(code)}</Intitule>
                <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{t('jeux.modules.proposePar', { module: `${m.code} · ${m.nom}` })}</Box>
              </LignePanneau>
            ))
      )}
    </Panneau>
  );
}
