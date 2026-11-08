import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, IconButton, ListSubheader, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Close, PlayArrow, Replay } from '@mui/icons-material';
import Panneau, { Capitales, LignePanneau } from '../Panneau';
import EcranTerminal from './EcranTerminal';
import { boutonPanneauPlein } from '../styles';
import { useToast } from '../../../contexts/ToastContext';
import { sessionsJeuAPI } from '../../../services/api';
import { ds } from '../../../design-system/tokens';
import { defisLinux, niveauxLinux } from '../../../../../shared/terminal/jeu.js';
import { ecranDuTableau } from '../../../../../shared/terminal/tableau.js';

/**
 * Session collective, côté enseignant (projeté) : le défi en cours, le terminal de la classe, et
 * les réponses envoyées par les étudiants depuis leur téléphone. L'enseignant choisit celle qui
 * est jouée (ou tape lui-même une commande) ; le serveur rejoue la partie et dit si l'objectif
 * est atteint. `session` vient de GET /api/sessions-jeu/:id ; `onMaj` relit la session.
 */
export default function TableauCollectif({ session, onMaj }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const langue = i18n.language;
  const defis = useMemo(() => defisLinux(langue), [langue]);
  const niveaux = useMemo(() => niveauxLinux(langue), [langue]);
  const [envoi, setEnvoi] = useState(false);
  const defi = defis.find((d) => d.id === session.id_defi) ?? defis[0];
  const ecran = useMemo(() => ecranDuTableau(defi.id, session.commandes, { langue }), [defi.id, session.commandes, langue]);
  const ouverte = session.statut === 'ouverte';

  const agir = async (action) => {
    setEnvoi(true);
    try {
      await action();
      await onMaj();
      return true;
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
      return false;
    } finally {
      setEnvoi(false);
    }
  };

  const jouer = (corps) => agir(() => sessionsJeuAPI.jouer(session.id_session_jeu, corps));
  const changerDefi = (idDefi) => agir(() => sessionsJeuAPI.changerDefi(session.id_session_jeu, idDefi));
  const suivant = defis[defis.findIndex((d) => d.id === defi.id) + 1];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' }, gap: 2, alignItems: 'start' }}>
      <Box sx={{ minWidth: 0, display: 'grid', gap: 2 }}>
        <Box component="article" sx={{ border: `1px solid ${ds.colors.border.default}`, borderRadius: `${ds.radius.md}px`, bgcolor: 'background.paper', px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Capitales sx={{ fontSize: '0.75rem', letterSpacing: '0.14em', color: 'text.secondary' }}>
                {t('jeux.terminal.niveau', { n: defi.niveau })} · {defi.niveauNom}
              </Capitales>
              <Typography variant="h1" component="h2" sx={{ mt: 0.5, mb: 1 }}>{defi.titre}</Typography>
              <Typography sx={{ fontSize: '1.125rem' }}>{defi.objectif}</Typography>
            </Box>
            <TextField select size="small" label={t('sessionsJeu.collectif.defi')} value={defi.id} onChange={(e) => changerDefi(e.target.value)} disabled={!ouverte || envoi} sx={{ minWidth: 240 }}>
              {niveaux.flatMap((n) => [
                <ListSubheader key={`n${n.niveau}`}>{t('jeux.terminal.niveau', { n: n.niveau })} · {n.nom}</ListSubheader>,
                ...n.defis.map((id) => (
                  <MenuItem key={id} value={id}>{defis.find((d) => d.id === id)?.titre}</MenuItem>
                )),
              ])}
            </TextField>
          </Stack>
          {session.reussi && (
            <Alert severity="success" sx={{ mt: 2 }} action={suivant && ouverte ? <Button color="inherit" onClick={() => changerDefi(suivant.id)}>{t('sessionsJeu.collectif.suivant')}</Button> : null}>
              {t('sessionsJeu.collectif.reussi')}
            </Alert>
          )}
        </Box>
        <EcranTerminal
          ecran={ecran}
          titre={t('sessionsJeu.collectif.terminal')}
          etat={
            <Tooltip title={t('sessionsJeu.collectif.recommencer')}>
              <span>
                <IconButton size="small" onClick={() => changerDefi(defi.id)} disabled={!ouverte || envoi} aria-label={t('sessionsJeu.collectif.recommencer')} sx={{ color: ds.board.titre }}>
                  <Replay fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          }
          onEnvoyer={ouverte ? (texte) => jouer({ texte }) : undefined}
          envoi={envoi}
        />
      </Box>

      <Panneau titre={t('sessionsJeu.collectif.propositions')} droite={session.propositions.length || null} titreId="propositions-titre">
        {session.propositions.length === 0 && (
          <LignePanneau premier>
            <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t(ouverte ? 'sessionsJeu.collectif.attente' : 'sessionsJeu.terminee')}</Typography>
          </LignePanneau>
        )}
        {session.propositions.map((p, i) => (
          <LignePanneau
            key={p.id_proposition}
            premier={i === 0}
            action={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button size="small" variant="contained" startIcon={<PlayArrow />} sx={boutonPanneauPlein} disabled={envoi || !ouverte} onClick={() => jouer({ id_proposition: p.id_proposition })}>
                  {t('sessionsJeu.collectif.jouer')}
                </Button>
                <IconButton size="small" disabled={envoi} onClick={() => agir(() => sessionsJeuAPI.ecarter(session.id_session_jeu, p.id_proposition))} aria-label={t('sessionsJeu.collectif.ecarter', { texte: p.texte })} sx={{ color: ds.board.letterDim }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <Box component="code" sx={{ fontFamily: ds.font.mono, fontSize: '0.9375rem', wordBreak: 'break-all' }}>{p.texte}</Box>
            <Box sx={{ fontSize: '0.8125rem', color: ds.board.letterDim }}>{p.prenom} {p.nom}</Box>
          </LignePanneau>
        ))}
      </Panneau>
    </Box>
  );
}
