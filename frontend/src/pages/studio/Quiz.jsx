import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography } from '@mui/material';
import { CheckCircleOutline, CancelOutlined, Timer, Repeat, Quiz as IconeQuiz } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PageHeader from '../../design-system/components/PageHeader';
import { passationAPI } from '../../services/studioApi';
import { sessionsJeuAPI } from '../../services/api';

/**
 * « Quiz » de l'étudiant : rejoindre par son code (ou par le lien /quiz/code/XXXXXX que
 * l'enseignant partage) un quiz du Studio ou un jeu lancé en classe, lire les consignes,
 * commencer ; retrouver ses quiz passés. Les deux codes ont le même format : un code inconnu
 * comme quiz est essayé comme jeu (retours du 21 octobre : l'étudiant n'a qu'une porte d'entrée).
 */

function Consignes({ session, onCommencer, envoi }) {
  const { t } = useTranslation();
  const epuise = session.tentatives_restantes === 0 && !session.en_cours;
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
        {session.titre}
      </Typography>
      <Typography variant="overline" color="text.secondary" component="p" sx={{ mt: 2 }}>
        {t('studio.joueur.consignes')}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip icon={<IconeQuiz />} label={`${t('studio.joueur.nbQuestions', { count: session.nb_questions })} · ${t('studio.banque.points', { count: session.points })}`} />
        <Chip icon={<Timer />} label={session.duree_min ? t('studio.joueur.duree', { count: session.duree_min }) : t('studio.joueur.sansLimite')} />
        <Chip icon={<Repeat />} label={session.tentatives_restantes === null ? t('studio.joueur.tentativesIllimitees') : t('studio.joueur.tentatives', { count: session.tentatives_restantes })} />
      </Stack>
      <Stack component="ul" spacing={0.75} sx={{ pl: 2.5, m: 0, mb: 3 }}>
        <Typography component="li" variant="body2">
          {session.navigation === 'lineaire' ? t('studio.joueur.navLineaire') : t('studio.joueur.navLibre')}
        </Typography>
        <Typography component="li" variant="body2">
          {t('studio.joueur.enregistrementAuto')}
        </Typography>
        <Typography component="li" variant="body2">
          {t('studio.joueur.resultatSeuil', { seuil: session.seuil_reussite })}
        </Typography>
      </Stack>
      {!session.ouverte && !session.en_cours && <Alert severity="warning">{t('studio.joueur.ferme')}</Alert>}
      {session.ouverte && epuise && <Alert severity="info">{t('studio.joueur.epuise')}</Alert>}
      {(session.en_cours || (session.ouverte && !epuise)) && (
        <Button variant="contained" size="large" onClick={onCommencer} disabled={envoi} sx={{ minWidth: 200 }}>
          {session.en_cours ? t('studio.joueur.reprendre') : t('studio.joueur.commencer')}
        </Button>
      )}
    </Paper>
  );
}

export default function Quiz() {
  const { code: codeLien } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState(codeLien ?? '');
  const [session, setSession] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [historique, setHistorique] = useState([]);

  useEffect(() => {
    passationAPI.mesTentatives().then(setHistorique).catch(() => setHistorique([]));
  }, []);

  const rejoindre = useCallback(async (valeur) => {
    setEnvoi(true);
    setErreur(null);
    try {
      const s = await passationAPI.rejoindre(valeur);
      // Quiz en direct : on rejoint la partie de la classe
      if (s.mode === 'direct') {
        navigate(`/quiz/direct/${s.id_session}`, { replace: Boolean(codeLien) });
        return;
      }
      setSession(s);
    } catch (err) {
      setSession(null);
      if (err.status !== 404) {
        setErreur(err.message);
      } else {
        // Pas un quiz : peut-être un jeu lancé en classe (au tableau ou chacun sur son téléphone)
        try {
          const jeu = await sessionsJeuAPI.rejoindre(valeur);
          navigate(jeu.mode === 'collectif' ? `/jeux/direct/${jeu.id_session_jeu}` : `/jeux/${jeu.code_jeu}`);
          return;
        } catch (errJeu) {
          setErreur(errJeu.status === 404 ? t('studio.joueur.codeInconnu') : errJeu.message);
        }
      }
    } finally {
      setEnvoi(false);
    }
  }, [navigate, codeLien, t]);

  useEffect(() => {
    if (codeLien) rejoindre(codeLien);
  }, [codeLien, rejoindre]);

  const commencer = async () => {
    setEnvoi(true);
    try {
      const r = await passationAPI.commencer(session.id_session);
      navigate(`/quiz/tentative/${r.id_tentative}`);
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  };

  const date = (d) => new Date(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout>
      <PageHeader title={t('studio.joueur.rejoindreTitre')} subtitle={t('studio.joueur.rejoindreAide')} />
      <Box sx={{ display: 'grid', gap: 3, maxWidth: 720 }}>
        <Paper
          component="form"
          variant="outlined"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (code.trim()) rejoindre(code);
          }}
          sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'flex-start' } }}
        >
          <TextField
            label={t('studio.joueur.code')}
            value={code}
            onChange={(ev) => setCode(ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            autoFocus={!codeLien}
            autoComplete="off"
            inputProps={{ 'aria-describedby': erreur ? 'erreur-code' : undefined, autoCapitalize: 'characters', spellCheck: false, style: { fontSize: 28, letterSpacing: '0.3em', fontWeight: 700, fontVariantNumeric: 'tabular-nums' } }}
            error={Boolean(erreur)}
            helperText={erreur}
            FormHelperTextProps={{ id: 'erreur-code', role: 'alert' }}
            sx={{ flex: 1 }}
          />
          <Button type="submit" variant="contained" size="large" disabled={envoi || code.length < 4} sx={{ minHeight: 56, minWidth: 140 }}>
            {t('studio.joueur.rejoindre')}
          </Button>
        </Paper>

        {session && <Consignes session={session} onCommencer={commencer} envoi={envoi} />}

        <Box>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            {t('studio.joueur.mesResultats')}
          </Typography>
          {historique.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('studio.joueur.aucunResultat')}
            </Typography>
          ) : (
            <Paper variant="outlined" sx={{ borderRadius: 3 }}>
              <List disablePadding>
                {historique.map((h) => (
                  <ListItemButton key={h.id_tentative} divider onClick={() => navigate(`/quiz/tentative/${h.id_tentative}`)} sx={{ gap: 2, minHeight: 56 }}>
                    <ListItemText primary={h.titre} secondary={`${date(h.debut)}${h.numero > 1 ? ` · #${h.numero}` : ''}`} primaryTypographyProps={{ fontWeight: 600 }} />
                    {h.statut === 'en_cours' ? (
                      <Chip size="small" color="primary" label={t('studio.joueur.reprendre')} />
                    ) : h.pourcentage !== undefined ? (
                      <Chip
                        size="small"
                        color={h.reussi === null ? 'default' : h.reussi ? 'success' : 'error'}
                        icon={h.reussi === null ? undefined : h.reussi ? <CheckCircleOutline /> : <CancelOutlined />}
                        label={`${h.pourcentage} %`}
                        variant={h.reussi === null ? 'outlined' : 'filled'}
                      />
                    ) : (
                      <Chip size="small" variant="outlined" label={t('studio.resultats.rendue')} />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
}
