import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { devoirsAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';
import Panneau, { Capitales, LignePanneau } from './Panneau';
import { boutonPanneau, boutonPanneauPlein } from './styles';

/** Date limite par défaut : dans une semaine, à 23 h 59 (champ datetime-local) */
const dansUneSemaine = () => {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  d.setHours(23, 59, 0, 0);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Donner un devoir : l'un de mes quiz ClassQuiz, un de mes modules, une date limite */
function DonnerDevoir({ ouvert, modules, fermer, cree }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [choix, setChoix] = useState({ quiz_id: '', id_cours: '', date_limite: dansUneSemaine() });
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!ouvert) return undefined;
    let actif = true;
    devoirsAPI
      .quizDisponibles()
      .then((r) => actif && setQuiz(r?.data ?? []))
      .catch(() => actif && setQuiz([]));
    return () => {
      actif = false;
    };
  }, [ouvert]);

  const valider = async () => {
    setEnvoi(true);
    try {
      const r = await devoirsAPI.creer({ ...choix, id_cours: Number(choix.id_cours), date_limite: new Date(choix.date_limite).toISOString() });
      toast.success(t('jeux.devoirs.donne', { count: r.notifies }));
      cree();
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={fermer} fullWidth maxWidth="sm">
      <DialogTitle>{t('jeux.devoirs.donner')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {quiz === null && <Skeleton height={56} />}
          {quiz?.length === 0 && <Alert severity="info">{t('jeux.devoirs.aucunQuiz')}</Alert>}
          {quiz?.length > 0 && (
            <TextField select label={t('jeux.devoirs.quiz')} value={choix.quiz_id} onChange={(e) => setChoix((c) => ({ ...c, quiz_id: e.target.value }))}>
              {quiz.map((q) => (
                <MenuItem key={q.id} value={q.id}>
                  {q.titre} · {t('jeux.resultats.questions', { count: q.nb_questions })}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField select label={t('jeux.devoirs.module')} value={choix.id_cours} onChange={(e) => setChoix((c) => ({ ...c, id_cours: e.target.value }))}>
            {modules.map((m) => (
              <MenuItem key={m.id_cours} value={m.id_cours}>
                {m.code} · {m.nom}
              </MenuItem>
            ))}
          </TextField>
          <TextField type="datetime-local" label={t('jeux.devoirs.dateLimite')} value={choix.date_limite} onChange={(e) => setChoix((c) => ({ ...c, date_limite: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <Typography variant="body2" color="text.secondary">
            {t('jeux.devoirs.aide')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer}>{t('common.cancel')}</Button>
        <Button variant="contained" disabled={envoi || !choix.quiz_id || !choix.id_cours || !choix.date_limite} onClick={valider}>
          {t('jeux.devoirs.donner')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Notes d'un devoir : copies rendues, non rendues, moyenne */
function NotesDevoir({ idDevoir, fermer }) {
  const { t, i18n } = useTranslation();
  const [donnees, setDonnees] = useState(null);
  useEffect(() => {
    if (!idDevoir) return undefined;
    let actif = true;
    setDonnees(null);
    devoirsAPI.resultats(idDevoir).then((d) => actif && setDonnees(d)).catch(() => actif && setDonnees({ erreur: true }));
    return () => {
      actif = false;
    };
  }, [idDevoir]);
  const note = (n) => (n === null ? null : n.toLocaleString(i18n.language));
  return (
    <Dialog open={Boolean(idDevoir)} onClose={fermer} fullWidth maxWidth="sm">
      <DialogTitle>
        {donnees?.devoir?.titre ?? t('jeux.devoirs.notes')}
        {donnees?.devoir && (
          <Typography variant="body2" color="text.secondary">
            {t('jeux.devoirs.bilan', { rendus: donnees.rendus, vises: donnees.devoir.nb_vises })}
            {donnees.moyenne !== null ? ` · ${t('jeux.devoirs.moyenne', { moyenne: note(donnees.moyenne) })}` : ''}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {!donnees && <Skeleton variant="rectangular" height={120} />}
        {donnees?.erreur && <Alert severity="warning">{t('jeux.devoirs.erreur')}</Alert>}
        {donnees?.etudiants && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('jeux.modules.etudiant')}</TableCell>
                <TableCell align="right">{t('jeux.devoirs.noteSur20')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {donnees.etudiants.map((e) => (
                <TableRow key={e.id_user}>
                  <TableCell>{e.prenom} {e.nom}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {e.note === null ? <Typography component="span" variant="body2" color="text.secondary">{t('jeux.devoirs.nonRendu')}</Typography> : note(e.note)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Devoirs notés de l'espace Jeux. L'étudiant voit ses devoirs à rendre et ses notes ; l'enseignant
 * donne un de ses quiz en devoir dans un module et consulte les notes.
 */
export default function PanneauDevoirs({ enseignant, modules }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [devoirs, setDevoirs] = useState(null);
  const [donner, setDonner] = useState(false);
  const [notes, setNotes] = useState(null);

  const charger = useCallback(() => devoirsAPI.lister().then((r) => setDevoirs(r?.data ?? [])).catch(() => setDevoirs([])), []);
  useEffect(() => {
    charger();
  }, [charger]);

  const supprimer = async (d) => {
    if (!window.confirm(t('jeux.devoirs.confirmerSuppression', { titre: d.titre }))) return;
    try {
      await devoirsAPI.supprimer(d.id);
      charger();
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
    }
  };

  // Rien à montrer à un étudiant sans devoir
  if (!enseignant && devoirs?.length === 0) return null;
  const date = (iso) => new Date(iso).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Panneau
        titre={t('jeux.devoirs.titre')}
        titreId="devoirs-titre"
        droite={
          enseignant ? (
            <Button size="small" variant="contained" sx={boutonPanneauPlein} onClick={() => setDonner(true)}>
              {t('jeux.devoirs.donner')}
            </Button>
          ) : null
        }
      >
        {devoirs === null && <Skeleton variant="rectangular" height={64} sx={{ bgcolor: ds.board.cell }} />}
        {devoirs?.length === 0 && (
          <LignePanneau premier>
            <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t('jeux.devoirs.aucunEnseignant')}</Typography>
          </LignePanneau>
        )}
        {(devoirs ?? []).map((d, i) => {
          const aRendre = !enseignant && d.ouvert && !d.rendu;
          return (
            <LignePanneau
              key={d.id}
              premier={i === 0}
              lampe={aRendre ? ds.board.delayed : d.rendu || (enseignant && d.rendus) ? ds.board.live : null}
              action={
                enseignant ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => setNotes(d.id)}>{t('jeux.devoirs.notes')}</Button>
                    <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => supprimer(d)}>{t('jeux.devoirs.supprimer')}</Button>
                  </Box>
                ) : (
                  <Button size="small" variant={aRendre ? 'contained' : 'outlined'} sx={aRendre ? boutonPanneauPlein : boutonPanneau} onClick={() => navigate(`/jeux/devoirs/${d.id}`)}>
                    {aRendre ? t('jeux.devoirs.faire') : t('jeux.devoirs.voir')}
                  </Button>
                )
              }
            >
              <Box sx={{ fontWeight: 600 }}>{d.titre}</Box>
              <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>
                {[d.module?.nom, d.ouvert ? t('jeux.devoirs.avant', { date: date(d.date_limite) }) : t('jeux.devoirs.closLe', { date: date(d.date_limite) })].filter(Boolean).join(' · ')}
              </Box>
              <Capitales sx={{ display: 'block', mt: 0.5, fontSize: '0.875rem', color: aRendre ? ds.board.delayed : ds.board.letter }}>
                {enseignant
                  ? t('jeux.devoirs.resumeEnseignant', { count: d.rendus, moyenne: d.moyenne === null ? '—' : d.moyenne.toLocaleString(i18n.language) })
                  : d.rendu
                    ? t('jeux.devoirs.note', { note: d.rendu.note.toLocaleString(i18n.language) })
                    : d.ouvert
                      ? t('jeux.devoirs.aRendre')
                      : t('jeux.devoirs.nonRendu')}
              </Capitales>
            </LignePanneau>
          );
        })}
      </Panneau>
      {enseignant && (
        <DonnerDevoir
          ouvert={donner}
          modules={modules}
          fermer={() => setDonner(false)}
          cree={() => {
            setDonner(false);
            charger();
          }}
        />
      )}
      <NotesDevoir idDevoir={notes} fermer={() => setNotes(null)} />
    </>
  );
}
