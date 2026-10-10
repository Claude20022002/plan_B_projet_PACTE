import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, AttachFile, AutoAwesome, DeleteOutline, Refresh } from '@mui/icons-material';
import { quizIaAPI } from '../../services/api';
import { tailleLisible, typeDuFichier } from '../../utils/fichiers';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';
import Panneau, { Capitales, LignePanneau } from './Panneau';
import SelecteurClasse from '../planning/SelecteurClasse';
import { boutonPanneau, boutonPanneauPlein } from './styles';

// Mêmes limites que le serveur (backend/services/ia) : il revalide tout de toute façon
const TYPES_SUPPORTS = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
const TAILLE_MAX_SUPPORT = 20 * 1024 * 1024;
const QUESTION_MAX = 500;
const REPONSE_MAX = 200;
const REPONSES_MIN = 2;
const REPONSES_MAX = 6;
const SUIVI_MS = 2000;
const REGLAGES = { nombre: 10, type: 'ABCD', difficulte: 'decouverte', langue: 'fr', temps: 30 };

/** Première erreur d'un brouillon (clé de traduction et numéro de question), ou null. */
const erreurDuBrouillon = (questions) => {
  if (!questions.length) return { cle: 'jeux.quizIa.erreurs.vide' };
  for (const [i, q] of questions.entries()) {
    const numero = i + 1;
    const textes = q.reponses.map((r) => r.texte.trim());
    const justes = q.reponses.filter((r) => r.juste).length;
    if (!q.question.trim()) return { cle: 'jeux.quizIa.erreurs.enonce', numero };
    if (textes.some((x) => !x)) return { cle: 'jeux.quizIa.erreurs.reponseVide', numero };
    if (new Set(textes.map((x) => x.toLowerCase())).size !== textes.length) return { cle: 'jeux.quizIa.erreurs.doublon', numero };
    if (!justes) return { cle: 'jeux.quizIa.erreurs.aucuneJuste', numero };
    if (justes === q.reponses.length) return { cle: 'jeux.quizIa.erreurs.toutesJustes', numero };
    if (q.type === 'ABCD' && justes !== 1) return { cle: 'jeux.quizIa.erreurs.uneSeule', numero };
  }
  return null;
};

/** Dépôt du support et réglages : la génération part, puis se suit dans la relecture. */
function GenererQuiz({ ouvert, fermer, lancee, restantes, preselection }) {
  const { t } = useTranslation();
  const [classe, setClasse] = useState(null);
  const [fichier, setFichier] = useState(null);
  const [plage, setPlage] = useState('');
  const [reglages, setReglages] = useState(REGLAGES);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const regler = (champ) => (e) => setReglages((r) => ({ ...r, [champ]: e.target.value }));

  const choisirFichier = (e) => {
    const choisi = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!choisi) return;
    if (!TYPES_SUPPORTS.includes(typeDuFichier(choisi))) return setErreur(t('jeux.quizIa.typeSupport'));
    if (choisi.size > TAILLE_MAX_SUPPORT) return setErreur(t('jeux.quizIa.tailleSupport'));
    setErreur('');
    setFichier(choisi);
  };

  const lancer = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      const r = await quizIaAPI.generer(fichier, { id_cours: classe.id_cours, id_groupe: classe.id_groupe, plage: plage.trim(), ...reglages });
      setFichier(null);
      setPlage('');
      lancee(r.id_generation);
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={envoi ? undefined : fermer} fullWidth maxWidth="sm" aria-labelledby="generer-quiz-titre">
      <DialogTitle id="generer-quiz-titre">{t('jeux.quizIa.generer')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {erreur && <Alert severity="error">{erreur}</Alert>}
          {ouvert && <SelecteurClasse valeur={classe} onChange={setClasse} preselection={preselection} />}
          <Box>
            <Button component="label" variant="outlined" startIcon={<AttachFile />}>
              {fichier ? `${fichier.name} · ${tailleLisible(fichier.size)}` : t('jeux.quizIa.support')}
              <input type="file" hidden accept=".pdf,.docx,.pptx" onChange={choisirFichier} />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('jeux.quizIa.aideSupport')}</Typography>
          </Box>
          <TextField label={t('jeux.quizIa.plage')} value={plage} onChange={(e) => setPlage(e.target.value)} placeholder="3-10, 12" helperText={t('jeux.quizIa.aidePlage')} inputProps={{ maxLength: 100 }} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField select label={t('jeux.quizIa.nombre')} value={reglages.nombre} onChange={regler('nombre')}>
              {[5, 10, 15, 20].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
            <TextField select label={t('jeux.quizIa.type')} value={reglages.type} onChange={regler('type')}>
              {['ABCD', 'CHECK', 'mixte'].map((x) => (
                <MenuItem key={x} value={x}>{t(`jeux.quizIa.types.${x}`)}</MenuItem>
              ))}
            </TextField>
            <TextField select label={t('jeux.quizIa.difficulte')} value={reglages.difficulte} onChange={regler('difficulte')}>
              {['decouverte', 'application', 'approfondissement'].map((x) => (
                <MenuItem key={x} value={x}>{t(`jeux.quizIa.difficultes.${x}`)}</MenuItem>
              ))}
            </TextField>
            <TextField select label={t('jeux.quizIa.temps')} value={reglages.temps} onChange={regler('temps')}>
              {[20, 30, 45, 60, 90].map((s) => (
                <MenuItem key={s} value={s}>{t('jeux.quizIa.secondes', { count: s })}</MenuItem>
              ))}
            </TextField>
            <TextField select label={t('jeux.quizIa.langue')} value={reglages.langue} onChange={regler('langue')}>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </TextField>
          </Box>
          <Typography variant="body2" color="text.secondary">{t('jeux.quizIa.aideGeneration', { count: restantes })}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
        <Button variant="contained" startIcon={<AutoAwesome />} disabled={envoi || !classe || !fichier || !restantes} onClick={lancer}>
          {t(envoi ? 'jeux.quizIa.envoi' : 'jeux.quizIa.lancer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Une question du brouillon : énoncé, réponses (une ou plusieurs justes), explication de l'IA. */
function QuestionBrouillon({ numero, question, changer, supprimer, regenerer, occupe, peutRegenerer }) {
  const { t } = useTranslation();
  const plusieurs = question.type === 'CHECK';
  const majReponse = (i, champs) => changer({ ...question, reponses: question.reponses.map((r, j) => (j === i ? { ...r, ...champs } : r)) });
  // Une seule bonne réponse : en cocher une décoche les autres
  const cocher = (i, juste) => changer({ ...question, reponses: question.reponses.map((r, j) => (plusieurs ? (j === i ? { ...r, juste } : r) : { ...r, juste: j === i })) });
  const basculerType = (e) => {
    if (e.target.checked) return changer({ ...question, type: 'CHECK' });
    const premiere = question.reponses.findIndex((r) => r.juste);
    return changer({ ...question, type: 'ABCD', reponses: question.reponses.map((r, j) => ({ ...r, juste: j === Math.max(0, premiere) })) });
  };

  return (
    <Paper variant="outlined" component="fieldset" disabled={occupe} sx={{ p: 2, m: 0, minWidth: 0, opacity: occupe ? 0.6 : 1 }}>
      <Box component="legend" sx={{ px: 1, fontWeight: 700 }}>{t('jeux.quizIa.question', { numero })}</Box>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label={t('jeux.quizIa.enonce')}
            value={question.question}
            onChange={(e) => changer({ ...question, question: e.target.value })}
            inputProps={{ maxLength: QUESTION_MAX }}
            multiline
            fullWidth
            required
          />
          {peutRegenerer && (
            <Tooltip title={t('jeux.quizIa.regenerer')}>
              <span>
                <IconButton onClick={regenerer} disabled={occupe} aria-label={t('jeux.quizIa.regenererQuestion', { numero })}>
                  {occupe ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title={t('jeux.quizIa.supprimer')}>
            <IconButton onClick={supprimer} aria-label={t('jeux.quizIa.supprimerQuestion', { numero })}>
              <DeleteOutline />
            </IconButton>
          </Tooltip>
        </Box>
        {question.reponses.map((r, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {plusieurs ? (
              <Checkbox checked={r.juste} onChange={(e) => cocher(i, e.target.checked)} inputProps={{ 'aria-label': t('jeux.quizIa.bonneReponse', { numero: i + 1 }) }} />
            ) : (
              <Radio checked={r.juste} onChange={() => cocher(i, true)} inputProps={{ 'aria-label': t('jeux.quizIa.bonneReponse', { numero: i + 1 }) }} />
            )}
            <TextField
              size="small"
              label={t('jeux.quizIa.reponse', { numero: i + 1 })}
              value={r.texte}
              onChange={(e) => majReponse(i, { texte: e.target.value })}
              inputProps={{ maxLength: REPONSE_MAX }}
              fullWidth
            />
            <IconButton
              size="small"
              disabled={question.reponses.length <= REPONSES_MIN}
              onClick={() => changer({ ...question, reponses: question.reponses.filter((_, j) => j !== i) })}
              aria-label={t('jeux.quizIa.retirerReponse', { numero: i + 1 })}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Button size="small" startIcon={<Add />} disabled={question.reponses.length >= REPONSES_MAX} onClick={() => changer({ ...question, reponses: [...question.reponses, { texte: '', juste: false }] })}>
            {t('jeux.quizIa.ajouterReponse')}
          </Button>
          <FormControlLabel control={<Checkbox checked={plusieurs} onChange={basculerType} />} label={t('jeux.quizIa.plusieursJustes')} />
        </Box>
        {(question.explication || question.source) && (
          <Typography variant="body2" color="text.secondary">
            {[question.source && t('jeux.quizIa.source', { source: question.source }), question.explication].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Suivi d'une génération puis relecture du brouillon : l'enseignant corrige, supprime ou fait
 * régénérer une question, puis crée le quiz dans ClassQuiz (rien n'y part sans cette validation).
 */
function RelireQuiz({ id, fermer, modifie, donnerEnDevoir }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [etat, setEtat] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [modifiees, setModifiees] = useState(false);
  const [titre, setTitre] = useState('');
  const [occupee, setOccupee] = useState(null); // index de la question en régénération
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const recevoir = useCallback((e) => {
    setEtat(e);
    setQuestions(e.questions ?? []);
    setModifiees(false);
  }, []);

  // Tant que la génération tourne, son état est redemandé ; ensuite le brouillon appartient à l'écran
  useEffect(() => {
    if (!id) return undefined;
    let actif = true;
    let minuterie = null;
    setEtat(null);
    setErreur('');
    setTitre('');
    const lire = async () => {
      try {
        const e = await quizIaAPI.etat(id);
        if (!actif) return;
        recevoir(e);
        if (e.statut === 'en_cours' || e.statut === 'creation') minuterie = setTimeout(lire, SUIVI_MS);
        else modifie();
      } catch (e) {
        if (actif) setErreur(e?.message || t('jeux.erreurAction'));
      }
    };
    lire();
    return () => {
      actif = false;
      clearTimeout(minuterie);
    };
  }, [id, recevoir, modifie, t]);

  const changer = (i, q) => {
    setQuestions((liste) => liste.map((x, j) => (j === i ? q : x)));
    setModifiees(true);
  };
  const supprimer = (i) => {
    setQuestions((liste) => liste.filter((_, j) => j !== i));
    setModifiees(true);
  };

  const probleme = etat?.statut === 'pret' ? erreurDuBrouillon(questions) : null;

  /** Brouillon enregistré s'il a changé ; false si le serveur le refuse. */
  const enregistrer = async () => {
    if (!modifiees) return true;
    try {
      recevoir(await quizIaAPI.enregistrer(id, questions));
      return true;
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
      return false;
    }
  };

  const sauver = async () => {
    setEnvoi(true);
    setErreur('');
    if (await enregistrer()) toast.success(t('jeux.quizIa.enregistre'));
    setEnvoi(false);
  };

  const regenerer = async (i) => {
    setErreur('');
    setOccupee(i);
    try {
      // Les corrections en cours sont d'abord enregistrées : la régénération part du brouillon du serveur
      if (await enregistrer()) recevoir(await quizIaAPI.regenerer(id, i));
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
    } finally {
      setOccupee(null);
    }
  };

  const creer = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      if (await enregistrer()) {
        const cree = await quizIaAPI.creer(id, titre.trim());
        recevoir(cree);
        toast.success(t('jeux.quizIa.cree', { titre: cree.titre_quiz }));
        modifie();
      }
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  const enCours = etat?.statut === 'en_cours' || etat?.statut === 'creation';
  const pret = etat?.statut === 'pret';
  const cree = etat?.statut === 'cree';

  return (
    <Dialog open={Boolean(id)} onClose={envoi ? undefined : fermer} fullWidth maxWidth="md" aria-labelledby="relire-quiz-titre">
      <DialogTitle id="relire-quiz-titre">{t(pret ? 'jeux.quizIa.relire' : 'jeux.quizIa.titre')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erreur && <Alert severity="error" role="alert">{erreur}</Alert>}
          {!etat && !erreur && <Skeleton variant="rectangular" height={160} />}
          {enCours && (
            <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
              <CircularProgress size={28} />
              <Typography>{t(etat.statut === 'creation' ? 'jeux.quizIa.creationEnCours' : 'jeux.quizIa.generationEnCours')}</Typography>
            </Box>
          )}
          {etat?.statut === 'erreur' && <Alert severity="error">{etat.erreur || t('jeux.quizIa.echec')}</Alert>}
          {cree && (
            <Alert severity="success" action={donnerEnDevoir ? <Button color="inherit" size="small" onClick={() => donnerEnDevoir(etat)}>{t('jeux.quizIa.donnerEnDevoir')}</Button> : null}>
              {t('jeux.quizIa.dejaCree')}
            </Alert>
          )}
          {pret && (
            <>
              <Alert severity="info">{t('jeux.quizIa.aideRelecture')}</Alert>
              <TextField label={t('jeux.quizIa.titreQuiz')} value={titre} onChange={(e) => setTitre(e.target.value)} inputProps={{ maxLength: 200 }} helperText={t('jeux.quizIa.aideTitre')} />
            </>
          )}
          {(pret || cree) &&
            questions.map((q, i) =>
              pret ? (
                <QuestionBrouillon
                  key={i}
                  numero={i + 1}
                  question={q}
                  changer={(x) => changer(i, x)}
                  supprimer={() => supprimer(i)}
                  regenerer={() => regenerer(i)}
                  occupe={occupee === i}
                  peutRegenerer={occupee === null && !envoi}
                />
              ) : (
                <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{i + 1}. {q.question}</Typography>
                  {q.reponses.map((r, j) => (
                    <Typography key={j} variant="body2" sx={{ mt: 0.5, fontWeight: r.juste ? 700 : 400 }}>
                      {r.juste ? '✓' : '–'} {r.texte}
                    </Typography>
                  ))}
                </Paper>
              )
            )}
          {probleme && <Alert severity="warning">{t(probleme.cle, { numero: probleme.numero })}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer} disabled={envoi}>{t('common.close')}</Button>
        {pret && (
          <>
            <Button onClick={sauver} disabled={envoi || !modifiees || Boolean(probleme) || occupee !== null}>{t('jeux.quizIa.enregistrer')}</Button>
            <Button variant="contained" onClick={creer} disabled={envoi || Boolean(probleme) || occupee !== null}>
              {t(envoi ? 'jeux.quizIa.creation' : 'jeux.quizIa.creer')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

/**
 * Quiz générés par l'IA (plan quiz-ia, lot IA-5) : l'enseignant dépose le support de son cours,
 * relit les questions proposées, puis crée le quiz dans ClassQuiz sans quitter Planner. Le panneau
 * n'apparaît que si le service est configuré sur le serveur.
 * @param {{ preselection?: { id_cours, id_groupe }, donnerEnDevoir?: (generation) => void }} props
 */
export default function PanneauQuizIa({ preselection = null, donnerEnDevoir }) {
  const { t, i18n } = useTranslation();
  const [dispo, setDispo] = useState(null);
  const [generations, setGenerations] = useState(null);
  const [generer, setGenerer] = useState(false);
  const [ouverte, setOuverte] = useState(null);
  const monte = useRef(true);

  const charger = useCallback(() => {
    quizIaAPI.disponibilite().then((d) => monte.current && setDispo(d)).catch(() => monte.current && setDispo({ disponible: false }));
    quizIaAPI.lister().then((l) => monte.current && setGenerations(Array.isArray(l) ? l : [])).catch(() => monte.current && setGenerations([]));
  }, []);

  useEffect(() => {
    monte.current = true;
    charger();
    return () => {
      monte.current = false;
    };
  }, [charger]);

  if (!dispo?.disponible) return null;
  const date = (iso) => new Date(iso).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const lampe = { pret: ds.board.letter, cree: ds.board.live, erreur: ds.brand.orange };

  return (
    <>
      <Panneau
        titre={t('jeux.quizIa.titre')}
        titreId="quiz-ia-titre"
        droite={
          <Button size="small" variant="contained" startIcon={<AutoAwesome />} sx={boutonPanneauPlein} onClick={() => setGenerer(true)}>
            {t('jeux.quizIa.generer')}
          </Button>
        }
      >
        {generations === null && <Skeleton variant="rectangular" height={64} sx={{ bgcolor: ds.board.cell }} />}
        {generations?.length === 0 && (
          <LignePanneau premier>
            <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t('jeux.quizIa.aucune')}</Typography>
          </LignePanneau>
        )}
        {(generations ?? []).map((g, i) => (
          <LignePanneau
            key={g.id_generation}
            premier={i === 0}
            lampe={lampe[g.statut] ?? null}
            action={
              g.statut === 'erreur' ? null : (
                <Button size="small" variant={g.statut === 'pret' ? 'contained' : 'outlined'} sx={g.statut === 'pret' ? boutonPanneauPlein : boutonPanneau} onClick={() => setOuverte(g.id_generation)}>
                  {t(g.statut === 'pret' ? 'jeux.quizIa.relireCourt' : g.statut === 'cree' ? 'jeux.quizIa.voir' : 'jeux.quizIa.suivre')}
                </Button>
              )
            }
          >
            <Box sx={{ fontWeight: 600 }}>{g.nom_source || t('jeux.quizIa.sansNom')}</Box>
            <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>{date(g.creee_le)}</Box>
            <Capitales sx={{ display: 'block', mt: 0.5, fontSize: '0.875rem', color: ds.board.letter }}>
              {g.statut === 'erreur' ? g.erreur || t('jeux.quizIa.echec') : t(`jeux.quizIa.statuts.${g.statut}`, { count: g.questions?.length ?? 0 })}
            </Capitales>
          </LignePanneau>
        ))}
      </Panneau>
      <GenererQuiz
        ouvert={generer}
        fermer={() => setGenerer(false)}
        restantes={dispo.restantes ?? 0}
        preselection={preselection}
        lancee={(id) => {
          setGenerer(false);
          setOuverte(id);
          charger();
        }}
      />
      <RelireQuiz
        id={ouverte}
        fermer={() => setOuverte(null)}
        modifie={charger}
        donnerEnDevoir={
          donnerEnDevoir
            ? (g) => {
                setOuverte(null);
                donnerEnDevoir(g);
              }
            : null
        }
      />
    </>
  );
}
