import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Skeleton,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PageHeader from '../../design-system/components/PageHeader';
import DevoirFichier from '../../components/jeux/DevoirFichier';
import { devoirsAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';

/** Réponse de départ selon le type de question */
const reponseInitiale = (q) => {
  if (q.type === 'CHECK') return [];
  if (q.type === 'TEXT') return '';
  if (q.type === 'RANGE') return q.min ?? 0;
  if (q.type === 'ORDER') return [...(q.choix ?? [])];
  return null;
};

const repondue = (q, r) => {
  if (q.type === 'SLIDE' || q.type === 'VOTING') return true;
  if (q.type === 'CHECK') return r.length > 0;
  if (q.type === 'TEXT') return r.trim().length > 0;
  return r !== null && r !== undefined;
};

/** Réponse attendue lisible (après la date limite) */
const texteAttendu = (q) => {
  if (q.attendue === null || q.attendue === undefined) return null;
  if (q.type === 'ABCD' || q.type === 'CHECK') return q.attendue.map((i) => q.choix?.[i]).join(' · ');
  if (q.type === 'RANGE') return q.attendue.min === q.attendue.max ? String(q.attendue.min) : `${q.attendue.min} – ${q.attendue.max}`;
  if (q.type === 'ORDER') return q.attendue.join(' → ');
  return q.attendue.join(' / ');
};

/** Saisie d'une réponse selon le type de question (désactivée une fois la copie rendue) */
function Saisie({ question: q, valeur, changer, fige }) {
  const { t } = useTranslation();
  if (q.type === 'ABCD' || q.type === 'VOTING') {
    return (
      <RadioGroup value={valeur ?? ''} onChange={(e) => changer(Number(e.target.value))}>
        {q.choix.map((c, i) => (
          <FormControlLabel key={i} value={i} control={<Radio />} label={c} disabled={fige} />
        ))}
      </RadioGroup>
    );
  }
  if (q.type === 'CHECK') {
    return (
      <Stack>
        {q.choix.map((c, i) => (
          <FormControlLabel
            key={i}
            label={c}
            disabled={fige}
            control={<Checkbox checked={valeur.includes(i)} onChange={(e) => changer(e.target.checked ? [...valeur, i] : valeur.filter((x) => x !== i))} />}
          />
        ))}
      </Stack>
    );
  }
  if (q.type === 'TEXT') {
    return <TextField fullWidth value={valeur} onChange={(e) => changer(e.target.value)} disabled={fige} inputProps={{ maxLength: 200, 'aria-label': t('jeux.devoirs.votreReponse') }} placeholder={t('jeux.devoirs.votreReponse')} />;
  }
  if (q.type === 'RANGE') {
    return (
      <Stack direction="row" spacing={3} alignItems="center" sx={{ px: 1 }}>
        <Slider value={Number(valeur)} min={q.min} max={q.max} step={1} onChange={(_, v) => changer(v)} disabled={fige} valueLabelDisplay="auto" aria-label={q.question} sx={{ flex: 1 }} />
        <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: '1.5rem', minWidth: 48, textAlign: 'right' }}>{valeur}</Typography>
      </Stack>
    );
  }
  if (q.type === 'ORDER') {
    const deplacer = (i, sens) => {
      const liste = [...valeur];
      [liste[i], liste[i + sens]] = [liste[i + sens], liste[i]];
      changer(liste);
    };
    return (
      <Stack component="ol" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {valeur.map((c, i) => (
          <Stack component="li" key={c} direction="row" alignItems="center" spacing={1} sx={{ border: `1px solid ${ds.colors.border.default}`, borderRadius: `${ds.radius.md}px`, px: 1.5, py: 0.5 }}>
            <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, width: 24 }}>{i + 1}</Typography>
            <Typography sx={{ flex: 1 }}>{c}</Typography>
            <IconButton size="small" disabled={fige || i === 0} onClick={() => deplacer(i, -1)} aria-label={t('jeux.devoirs.monter', { choix: c })}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={fige || i === valeur.length - 1} onClick={() => deplacer(i, 1)} aria-label={t('jeux.devoirs.descendre', { choix: c })}>
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    );
  }
  return null;
}

/**
 * Devoir noté, côté étudiant : les questions du quiz (sans les réponses), une copie à rendre
 * avant la date limite, la note sur 20 aussitôt ; la correction après la date limite.
 */
export default function DevoirJouer() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(
    () =>
      devoirsAPI
        .sujet(id)
        .then((d) => {
          setDonnees(d);
          setReponses((d.questions ?? []).map((q) => (d.rendu ? q.ma_reponse : reponseInitiale(q))));
        })
        .catch((e) => setErreur(e?.message || t('jeux.devoirs.erreur'))),
    [id, t]
  );

  useEffect(() => {
    charger();
  }, [charger]);

  const rendre = async () => {
    setEnvoi(true);
    try {
      await devoirsAPI.rendre(id, reponses);
      setConfirmer(false);
      await charger();
    } catch (e) {
      setErreur(e?.message || t('jeux.devoirs.erreur'));
      setConfirmer(false);
    } finally {
      setEnvoi(false);
    }
  };

  const d = donnees?.devoir;
  const fige = Boolean(donnees?.rendu) || (d && !d.ouvert);
  const nonRepondues = donnees ? donnees.questions.filter((q, i) => !repondue(q, reponses[i] ?? reponseInitiale(q))).length : 0;
  const limite = d ? new Date(d.date_limite).toLocaleString(i18n.language, { dateStyle: 'full', timeStyle: 'short' }) : '';

  return (
    <DashboardLayout>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/jeux')} sx={{ mb: 1 }}>
        {t('jeux.tous')}
      </Button>
      <PageHeader title={d?.titre ?? t('jeux.devoirs.titre')} subtitle={d ? `${d.module?.nom ?? ''} · ${t(d.ouvert ? 'jeux.devoirs.aRendreAvant' : 'jeux.devoirs.clos', { date: limite })}` : ''} />
      {erreur && <Alert severity="warning" sx={{ mb: 2 }}>{erreur}</Alert>}
      {!donnees && !erreur && <Skeleton variant="rectangular" height={240} />}

      {d?.type === 'fichier' && <DevoirFichier donnees={donnees} recharger={charger} />}

      {d?.type !== 'fichier' && donnees?.rendu && (
        <Alert severity="success" icon={false} sx={{ mb: 3, alignItems: 'center' }}>
          <Stack direction="row" spacing={3} alignItems="baseline" flexWrap="wrap">
            <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: '2rem' }}>{t('jeux.devoirs.note', { note: donnees.rendu.note.toLocaleString(i18n.language) })}</Typography>
            <Typography>{t('jeux.devoirs.bonnes', { bonnes: donnees.rendu.bonnes, total: donnees.rendu.notees })}</Typography>
            {d.ouvert && <Typography color="text.secondary">{t('jeux.devoirs.correctionApres', { date: limite })}</Typography>}
          </Stack>
        </Alert>
      )}

      {donnees && d?.type !== 'fichier' && (
        <Stack spacing={2}>
          {donnees.questions.map((q, i) => (
            <Card key={q.index} variant="outlined" component="section" aria-labelledby={`question-${i}`}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, color: ds.colors.text.muted }}>{i + 1}</Typography>
                  <Typography id={`question-${i}`} variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                    {q.question}
                  </Typography>
                  {q.juste === true && <CheckCircleIcon color="success" aria-label={t('jeux.devoirs.juste')} />}
                  {q.juste === false && q.attendue !== null && <CancelIcon color="error" aria-label={t('jeux.devoirs.faux')} />}
                  {(q.type === 'VOTING' || q.type === 'SLIDE') && <Typography variant="caption" color="text.secondary">{t('jeux.devoirs.nonNotee')}</Typography>}
                </Stack>
                {q.image && <Box component="img" src={q.image} alt="" sx={{ maxWidth: '100%', maxHeight: 240, mb: 1.5, borderRadius: 1 }} />}
                <Saisie question={q} valeur={reponses[i] ?? reponseInitiale(q)} fige={fige} changer={(v) => setReponses((r) => r.map((x, j) => (j === i ? v : x)))} />
                {q.attendue !== undefined && texteAttendu(q) && (
                  <Typography variant="body2" sx={{ mt: 1.5, color: ds.colors.success.text }}>
                    {t('jeux.devoirs.attendue', { reponse: texteAttendu(q) })}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {donnees && d?.type !== 'fichier' && !fige && (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end" sx={{ mt: 3 }}>
          {nonRepondues > 0 && <Typography color="text.secondary">{t('jeux.devoirs.sansReponse', { count: nonRepondues })}</Typography>}
          <Button variant="contained" size="large" onClick={() => setConfirmer(true)}>
            {t('jeux.devoirs.rendre')}
          </Button>
        </Stack>
      )}

      <Dialog open={confirmer} onClose={() => !envoi && setConfirmer(false)}>
        <DialogTitle>{t('jeux.devoirs.rendre')}</DialogTitle>
        <DialogContent>
          <Typography>{t('jeux.devoirs.confirmation')}</Typography>
          {nonRepondues > 0 && <Typography sx={{ mt: 1 }} color="warning.main">{t('jeux.devoirs.sansReponse', { count: nonRepondues })}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmer(false)} disabled={envoi}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={rendre} disabled={envoi}>{t('jeux.devoirs.rendreDefinitif')}</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
