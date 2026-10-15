import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Chip, List, ListItem, ListItemButton, ListItemText, Paper, Skeleton } from '@mui/material';
import EmptyState from '../../design-system/components/EmptyState';
import { espaceCoursAPI } from '../../services/espaceCours';

const COULEUR = { a_faire: 'default', ouvert: 'info', ferme: 'success' };
const aujourdhui = () => new Date().toLocaleDateString('en-CA');

/**
 * Onglet « Appel » d'une classe (lot E-7) : ses séances, la plus récente d'abord, avec l'état de
 * l'appel et son bilan. Une séance s'ouvre si son appel existe (pour le revoir ou le corriger) ou
 * si elle a lieu aujourd'hui (pour le faire) ; un appel non fait un autre jour reste en lecture.
 */
export default function OngletAppel({ idCours, idGroupe }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [seances, setSeances] = useState(null);
  const [erreur, setErreur] = useState(false);
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';

  useEffect(() => {
    espaceCoursAPI.appels(idCours, idGroupe).then(setSeances).catch(() => setErreur(true));
  }, [idCours, idGroupe]);

  if (erreur) return <Alert severity="warning">{t('common.errorLoad')}</Alert>;
  if (!seances) return <Skeleton variant="rounded" height={160} />;
  if (!seances.length) return <EmptyState title={t('espaceCours.appel.aucune')} description={t('espaceCours.appel.aucuneAide')} />;

  const date = (s) => new Date(`${s.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const bilan = (s) =>
    s.appel === 'a_faire'
      ? t(s.date === aujourdhui() ? 'espaceCours.appel.aFaireAujourdhui' : 'espaceCours.appel.nonFait')
      : t('espaceCours.appel.bilan', { presents: s.presents, retards: s.retards, absents: s.absents ?? 0 });

  return (
    <Paper variant="outlined">
      <List disablePadding>
        {seances.map((s, i) => {
          const ouvrable = s.appel !== 'a_faire' || s.date === aujourdhui();
          return (
            <ListItem key={s.id_affectation} disablePadding divider={i < seances.length - 1}>
              <ListItemButton disabled={!ouvrable} onClick={() => navigate(`/appel/${s.id_affectation}`)} sx={{ gap: 2, '&.Mui-disabled': { opacity: 1 } }}>
                <ListItemText
                  // Majuscule à la première lettre seulement (« Jeudi 15 octobre »)
                  primary={<Box component="span" sx={{ display: 'inline-block', '&::first-letter': { textTransform: 'uppercase' } }}>{date(s)}</Box>}
                  secondary={[`${s.heure_debut}–${s.heure_fin}`, s.salle, bilan(s)].filter(Boolean).join(' · ')}
                />
                <Chip size="small" color={COULEUR[s.appel]} variant={s.appel === 'ferme' ? 'filled' : 'outlined'} label={t(`espaceCours.appel.etats.${s.appel}`)} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
