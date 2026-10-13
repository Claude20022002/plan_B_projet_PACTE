import { useTranslation } from 'react-i18next';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import Panneau, { LignePanneau, Libelle } from './Panneau';
import { libelle } from '../../../../shared/jeux/catalogue.js';
import { CONTEXTE_DEVOIRS } from '../../../../shared/fonctions.js';

/**
 * Historiques de la page Activités (sortis de pages/jeux/Jeux.jsx, trop long) : les quiz terminés
 * de l'étudiant, et le petit historique de l'enseignant (quiz, devoirs, défis réussis dans ses modules).
 */

/** Quiz terminés de l'étudiant (les huit derniers) : titre, module, date, score et rang ; « Voir » ouvre les résultats. */
export function HistoriqueEtudiant({ historique, onVoir }) {
  const { t, i18n } = useTranslation();
  return (
    <Panneau titre={t('jeux.resultats.historique')} titreId="historique-titre">
      {historique.slice(0, 8).map((h, i) => (
        <LignePanneau
          key={h.id}
          premier={i === 0}
          action={
            <Button size="small" variant="outlined" onClick={() => onVoir(h.id)}>
              {t('jeux.resultats.voir')}
            </Button>
          }
        >
          <Box sx={{ fontWeight: 600 }}>{h.titre}</Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {[
              h.module?.nom,
              h.terminee_le ? new Date(h.terminee_le).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }) : null,
              t('jeux.resultats.resumeEtudiant', { score: h.score, count: h.rang, ordinal: true, total: h.nb_joueurs }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Box>
        </LignePanneau>
      ))}
    </Panneau>
  );
}

/** Historique de l'enseignant (`null` : en chargement) ; « Voir » ouvre les résultats d'un quiz. */
export function HistoriqueEnseignant({ historique, onVoir }) {
  const { t, i18n } = useTranslation();
  const detail = (e) => {
    if (e.type === 'quiz') return t('jeux.historiqueProf.quiz', { count: e.nb_joueurs ?? 0, moyenne: e.moyenne ?? 0 });
    if (e.type === 'devoir') {
      const rendus = t('jeux.historiqueProf.devoir', { count: e.rendus ?? 0 });
      return e.moyenne == null ? rendus : `${rendus} · ${t('jeux.historiqueProf.devoirMoyenne', { moyenne: e.moyenne })}`;
    }
    return `${t('jeux.historiqueProf.defis', { count: e.nb_defis })} ${t('jeux.historiqueProf.etudiants', { count: e.nb_etudiants })}`;
  };

  return (
    <Panneau titre={t('jeux.historiqueProf.titre')} titreId="historique-titre">
      {historique === null && <Skeleton variant="rounded" height={64} sx={{ m: 1.5 }} />}
      {historique?.length === 0 && (
        <LignePanneau premier>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('jeux.historiqueProf.vide', { context: CONTEXTE_DEVOIRS })}</Typography>
        </LignePanneau>
      )}
      {(historique ?? []).map((e, i) => (
        <LignePanneau
          key={e.id}
          premier={i === 0}
          action={
            e.type === 'quiz' ? (
              <Button size="small" variant="outlined" onClick={() => onVoir(e.id_partie)}>
                {t('jeux.resultats.voir')}
              </Button>
            ) : null
          }
        >
          <Libelle sx={{ display: 'block' }}>
            {t(`jeux.historiqueProf.types.${e.type}`)} · {new Date(e.date).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}
          </Libelle>
          <Box sx={{ fontWeight: 600 }}>{e.type === 'defis' ? libelle(e.titre, i18n.language) : e.titre}</Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{[e.module ? `${e.module.code} · ${e.module.nom}` : null, detail(e)].filter(Boolean).join(' · ')}</Box>
        </LignePanneau>
      ))}
    </Panneau>
  );
}
