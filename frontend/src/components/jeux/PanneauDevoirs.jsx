import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { AttachFile } from '@mui/icons-material';
import { devoirsAPI } from '../../services/api';
import { ACCEPT_DEVOIRS, erreurFichierDevoir } from '../../utils/fichiers';
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

/**
 * Donner un devoir dans un de mes modules, avec une date limite : l'un de mes quiz ClassQuiz
 * (corrigé par Planner) ou un fichier à rendre (consignes, énoncé facultatif, noté par moi).
 */
function DonnerDevoir({ ouvert, modules, fermer, cree }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [choix, setChoix] = useState({ type: 'fichier', titre: '', consignes: '', quiz_id: '', id_cours: '', date_limite: dansUneSemaine(), but: 'verifier', notion: '' });
  const [enonce, setEnonce] = useState(null);
  const [erreurEnonce, setErreurEnonce] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const fichier = choix.type === 'fichier';
  const pret = choix.id_cours && choix.date_limite && (fichier ? choix.titre.trim() : choix.quiz_id);

  const choisirEnonce = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const probleme = erreurFichierDevoir(f);
    setErreurEnonce(probleme ? t(probleme) : '');
    setEnonce(probleme ? null : f);
  };

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
      const commun = { id_cours: Number(choix.id_cours), date_limite: new Date(choix.date_limite).toISOString(), but: choix.but, notion: choix.notion.trim() };
      const r = await devoirsAPI.creer(fichier ? { ...commun, type: 'fichier', titre: choix.titre.trim(), consignes: choix.consignes.trim() } : { ...commun, quiz_id: choix.quiz_id });
      if (fichier && enonce) {
        try {
          await devoirsAPI.deposerEnonce(r.devoir.id, enonce);
        } catch {
          toast.warning(t('jeux.devoirs.enonceNonAjoute'));
        }
      }
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
          <TextField select label={t('jeux.devoirs.typeDevoir')} value={choix.type} onChange={(e) => setChoix((c) => ({ ...c, type: e.target.value }))}>
            <MenuItem value="fichier">{t('jeux.devoirs.types.fichier')}</MenuItem>
            <MenuItem value="quiz">{t('jeux.devoirs.types.quiz')}</MenuItem>
          </TextField>
          {fichier && (
            <>
              <TextField label={t('jeux.devoirs.titreDevoir')} value={choix.titre} onChange={(e) => setChoix((c) => ({ ...c, titre: e.target.value }))} inputProps={{ maxLength: 255 }} required />
              <TextField label={t('jeux.devoirs.consignes')} value={choix.consignes} onChange={(e) => setChoix((c) => ({ ...c, consignes: e.target.value }))} inputProps={{ maxLength: 10000 }} multiline minRows={3} />
              <Box>
                <Button component="label" variant="outlined" startIcon={<AttachFile />}>
                  {enonce ? enonce.name : t('jeux.devoirs.enonce')}
                  <input type="file" hidden accept={ACCEPT_DEVOIRS} onChange={choisirEnonce} />
                </Button>
                {erreurEnonce && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{erreurEnonce}</Typography>}
              </Box>
            </>
          )}
          {!fichier && quiz === null && <Skeleton height={56} />}
          {!fichier && quiz?.length === 0 && <Alert severity="info">{t('jeux.devoirs.aucunQuiz')}</Alert>}
          {!fichier && quiz?.length > 0 && (
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
          <TextField select label={t('jeux.modules.but')} value={choix.but} onChange={(e) => setChoix((c) => ({ ...c, but: e.target.value }))}>
            <MenuItem value="verifier">{t('jeux.buts.verifier')}</MenuItem>
            <MenuItem value="entrainer">{t('jeux.buts.entrainer')}</MenuItem>
          </TextField>
          <TextField label={t('jeux.modules.notion')} value={choix.notion} onChange={(e) => setChoix((c) => ({ ...c, notion: e.target.value }))} inputProps={{ maxLength: 120 }} />
          <TextField type="datetime-local" label={t('jeux.devoirs.dateLimite')} value={choix.date_limite} onChange={(e) => setChoix((c) => ({ ...c, date_limite: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <Typography variant="body2" color="text.secondary">
            {t(fichier ? 'jeux.devoirs.aideFichier' : 'jeux.devoirs.aide')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer}>{t('common.cancel')}</Button>
        <Button variant="contained" disabled={envoi || !pret} onClick={valider}>
          {t('jeux.devoirs.donner')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Corriger une copie : note sur 20 et commentaire, que l'étudiant voit aussitôt. */
function CorrigerCopie({ devoir, etudiant, fermer, corrige }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [note, setNote] = useState(etudiant?.note ?? '');
  const [commentaire, setCommentaire] = useState(etudiant?.commentaire ?? '');
  const [envoi, setEnvoi] = useState(false);
  const valeur = Number(String(note).replace(',', '.'));
  const valide = String(note).trim() !== '' && Number.isFinite(valeur) && valeur >= 0 && valeur <= 20;

  const enregistrer = async () => {
    setEnvoi(true);
    try {
      await devoirsAPI.noter(devoir.id, etudiant.id_user, valeur, commentaire.trim());
      toast.success(t('jeux.devoirs.noteEnregistree'));
      corrige();
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open onClose={envoi ? undefined : fermer} fullWidth maxWidth="xs">
      <DialogTitle>{t('jeux.devoirs.corrigerTitre', { nom: `${etudiant.prenom} ${etudiant.nom}` })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t('jeux.devoirs.noteSur20')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            inputProps={{ inputMode: 'decimal' }}
            error={String(note).trim() !== '' && !valide}
            helperText={String(note).trim() !== '' && !valide ? t('jeux.devoirs.noteInvalide') : ' '}
            autoFocus
          />
          <TextField label={t('jeux.devoirs.commentaire')} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} inputProps={{ maxLength: 2000 }} multiline minRows={3} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={enregistrer} disabled={envoi || !valide}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}

/** Notes d'un devoir : copies rendues (à corriger d'abord pour un devoir fichier), non rendues, moyenne */
function NotesDevoir({ idDevoir, fermer, modifie }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [donnees, setDonnees] = useState(null);
  const [aCorriger, setACorriger] = useState(null);
  const charger = useCallback(() => {
    if (!idDevoir) return () => {};
    let actif = true;
    devoirsAPI.resultats(idDevoir).then((d) => actif && setDonnees(d)).catch(() => actif && setDonnees({ erreur: true }));
    return () => {
      actif = false;
    };
  }, [idDevoir]);
  useEffect(() => {
    setDonnees(null);
    return charger();
  }, [charger]);
  const fichier = donnees?.devoir?.type === 'fichier';
  const note = (n) => (n === null ? null : n.toLocaleString(i18n.language));
  const telechargerCopie = async (e) => {
    try {
      await devoirsAPI.telechargerCopie(idDevoir, e.id_user, e.fichier.nom);
    } catch (err) {
      toast.error(err?.message || t('jeux.erreurAction'));
    }
  };
  return (
    <Dialog open={Boolean(idDevoir)} onClose={fermer} fullWidth maxWidth="sm">
      <DialogTitle>
        {donnees?.devoir?.titre ?? t('jeux.devoirs.notes')}
        {donnees?.devoir && (
          <Typography variant="body2" color="text.secondary">
            {t('jeux.devoirs.bilan', { rendus: donnees.rendus, vises: donnees.devoir.nb_vises })}
            {donnees.a_corriger ? ` · ${t('jeux.devoirs.aCorriger', { count: donnees.a_corriger })}` : ''}
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
                {fichier && <TableCell>{t('jeux.devoirs.copie')}</TableCell>}
                <TableCell align="right">{t('jeux.devoirs.noteSur20')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {donnees.etudiants.map((e) => (
                <TableRow key={e.id_user}>
                  <TableCell>{e.prenom} {e.nom}</TableCell>
                  {fichier && (
                    <TableCell>
                      {e.fichier ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Button size="small" startIcon={<AttachFile />} onClick={() => telechargerCopie(e)} sx={{ textTransform: 'none', maxWidth: 220, justifyContent: 'flex-start' }}>
                            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.fichier.nom}</Box>
                          </Button>
                          {e.en_retard && <Chip size="small" color="warning" label={t('jeux.devoirs.enRetard')} />}
                        </Box>
                      ) : (
                        <Typography component="span" variant="body2" color="text.secondary">{t('jeux.devoirs.nonRendu')}</Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {fichier && e.rendu_le ? (
                      <Button size="small" variant={e.note === null ? 'contained' : 'text'} onClick={() => setACorriger(e)}>
                        {e.note === null ? t('jeux.devoirs.corriger') : note(e.note)}
                      </Button>
                    ) : e.note === null ? (
                      <Typography component="span" variant="body2" color="text.secondary">{t('jeux.devoirs.nonRendu')}</Typography>
                    ) : (
                      note(e.note)
                    )}
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
      {aCorriger && (
        <CorrigerCopie
          devoir={donnees.devoir}
          etudiant={aCorriger}
          fermer={() => setACorriger(null)}
          corrige={() => {
            setACorriger(null);
            charger();
            modifie?.();
          }}
        />
      )}
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
              // Orange réservé aux reports : un devoir à rendre s'allume en blanc
              lampe={aRendre ? ds.board.letter : d.rendu || (enseignant && d.rendus) ? ds.board.live : null}
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
              <Capitales sx={{ display: 'block', mt: 0.5, fontSize: '0.875rem', color: ds.board.letter }}>
                {enseignant
                  ? [t('jeux.devoirs.resumeEnseignant', { count: d.rendus, moyenne: d.moyenne === null ? '-' : d.moyenne.toLocaleString(i18n.language) }), d.a_corriger ? t('jeux.devoirs.aCorriger', { count: d.a_corriger }) : null].filter(Boolean).join(' · ')
                  : d.rendu
                    ? d.rendu.note === null
                      ? t('jeux.devoirs.enCorrection')
                      : t('jeux.devoirs.note', { note: d.rendu.note.toLocaleString(i18n.language) })
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
      <NotesDevoir idDevoir={notes} fermer={() => setNotes(null)} modifie={charger} />
    </>
  );
}
