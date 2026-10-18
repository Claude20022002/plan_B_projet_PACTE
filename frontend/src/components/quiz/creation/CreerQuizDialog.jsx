import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { AttachFile, AutoAwesome, Edit } from '@mui/icons-material';
import SelecteurClasse from '../../planning/SelecteurClasse';
import { quizIaAPI } from '../../../services/api';
import { tailleLisible, typeDuFichier } from '../../../utils/fichiers';

// Mêmes limites que le serveur (backend/services/ia) : il revalide tout de toute façon
const TYPES_SUPPORTS = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
const TAILLE_MAX_SUPPORT = 20 * 1024 * 1024;
const SUJET_MAX = 200;
// Réglages fixes : l'enseignant ne remplit pas de formulaire, il corrige à la relecture
const REGLAGES = { nombre: 10, type: 'ABCD', difficulte: 'decouverte', temps: 30 };

/**
 * Créer un quiz en un geste (demande du chef de projet, 11 octobre) : la classe, un sujet ou un
 * document, puis « Générer » ou « Le faire moi-même ». Pas de réglages : 10 questions à une bonne
 * réponse, 30 secondes chacune, dans la langue de l'écran ; tout se corrige à la relecture, avant
 * que le quiz soit créé.
 *
 * `generation` : { disponible, restantes, sujet } (GET /api/quiz-ia/disponibilite) ou null si la
 * génération n'est pas installée. Générer à partir d'un sujet seul attend que le serveur l'annonce
 * (`sujet: true`) ; d'ici là, il faut un document. « Le faire moi-même » ouvre la création d'un quiz
 * dans le Studio quiz de Planner (« Mes quiz ») : l'enseignant ne quitte plus Planner.
 */
export default function CreerQuizDialog({ ouvert, fermer, preselection, generation, lancee }) {
  const { t, i18n } = useTranslation();
  const [classe, setClasse] = useState(null);
  const [sujet, setSujet] = useState('');
  const [fichier, setFichier] = useState(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const iaDisponible = Boolean(generation?.disponible);
  const restantes = generation?.restantes ?? 0;
  const surSujet = Boolean(generation?.sujet);
  const peutGenerer = iaDisponible && restantes > 0 && Boolean(classe) && (Boolean(fichier) || (surSujet && sujet.trim().length > 0));

  const choisirFichier = (e) => {
    const choisi = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!choisi) return;
    if (!TYPES_SUPPORTS.includes(typeDuFichier(choisi))) return setErreur(t('quizCreation.typeSupport'));
    if (choisi.size > TAILLE_MAX_SUPPORT) return setErreur(t('quizCreation.tailleSupport'));
    setErreur('');
    setFichier(choisi);
  };

  const generer = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      const reglages = { ...REGLAGES, langue: i18n.language?.startsWith('en') ? 'en' : 'fr', id_cours: classe.id_cours, id_groupe: classe.id_groupe };
      const r = fichier ? await quizIaAPI.generer(fichier, reglages) : await quizIaAPI.genererSurSujet(sujet.trim(), reglages);
      lancee(r.id_generation, sujet.trim());
      setSujet('');
      setFichier(null);
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  // Sans génération, ou avec un sujet seul que le serveur ne sait pas encore traiter : une aide courte
  let aide = null;
  if (!iaDisponible) aide = t('quizCreation.aideSansIa');
  else if (!restantes) aide = t('quizCreation.aideQuota');
  else if (!surSujet && !fichier) aide = t('quizCreation.aideDocument');
  else aide = t('quizCreation.aide', { count: restantes });

  return (
    <Dialog open={ouvert} onClose={envoi ? undefined : fermer} fullWidth maxWidth="sm" aria-labelledby="creer-quiz-titre">
      <DialogTitle id="creer-quiz-titre">{t('quizCreation.titre')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {erreur && <Alert severity="error">{erreur}</Alert>}
          {ouvert && <SelecteurClasse valeur={classe} onChange={setClasse} preselection={preselection} />}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label={t('quizCreation.sujet')}
              placeholder={t('quizCreation.exempleSujet')}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              inputProps={{ maxLength: SUJET_MAX }}
              fullWidth
              autoFocus
            />
            {iaDisponible && (
              <Tooltip title={t('quizCreation.joindre')}>
                <IconButton component="label" aria-label={t('quizCreation.joindre')} sx={{ mt: 1 }}>
                  <AttachFile />
                  <input type="file" hidden accept=".pdf,.docx,.pptx" onChange={choisirFichier} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {fichier && <Chip label={`${fichier.name} · ${tailleLisible(fichier.size)}`} onDelete={() => setFichier(null)} sx={{ alignSelf: 'flex-start', maxWidth: '100%' }} />}
          <Typography variant="body2" color="text.secondary">{aide}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={fermer} disabled={envoi} sx={{ mr: 'auto' }}>{t('common.cancel')}</Button>
        <Button startIcon={<Edit />} component={Link} to="/studio-quiz?nouveau=1" disabled={envoi}>
          {t('quizCreation.moiMeme')}
        </Button>
        {iaDisponible && (
          <Button variant="contained" startIcon={<AutoAwesome />} onClick={generer} disabled={envoi || !peutGenerer}>
            {t(envoi ? 'quizCreation.envoi' : 'quizCreation.generer')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
