import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Autocomplete, Box, Button, ButtonBase, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { AutoAwesome, EditNote, FileUpload } from '@mui/icons-material';
import { studioAPI } from '../../../services/studioApi';
import { enseignantAPI } from '../../../services/api';

/**
 * Nouveau quiz : trois départs possibles, présentés comme trois choix d'égale importance
 * (partir de zéro, générer avec l'IA, importer), puis le titre et les étiquettes.
 */

function Choix({ icone, titre, aide, onClick, desactive }) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={desactive}
      sx={{ width: '100%', p: 2, gap: 2, justifyContent: 'flex-start', textAlign: 'left', border: 1, borderColor: 'divider', borderRadius: 2, opacity: desactive ? 0.5 : 1, '&:hover, &.Mui-focusVisible': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
    >
      <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.selected', color: 'primary.main', flex: '0 0 44px' }}>{icone}</Box>
      <Box>
        <Typography sx={{ fontWeight: 700 }}>{titre}</Typography>
        <Typography variant="body2" color="text.secondary">
          {aide}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

// Une étiquette fait 40 caractères au plus (serveur) : un nom de module plus long est raccourci
const ETIQUETTE_MAX = 40;
const etiquetteDuModule = (nom) => (nom.length <= ETIQUETTE_MAX ? nom : `${nom.slice(0, ETIQUETTE_MAX - 1).trimEnd()}…`);

// Modules de l'enseignant (ses services et son emploi du temps, comme « Mes classes »), lus une fois par page
let mesModules = null;
const chargerMesModules = () => {
  mesModules ??= enseignantAPI
    .mesClasses()
    .then((classes) => {
      const parId = new Map((Array.isArray(classes) ? classes : []).map((c) => [c.id_cours, { etiquette: etiquetteDuModule(c.nom_cours), code: c.code_cours, nom: c.nom_cours }]));
      return [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    })
    .catch(() => {
      mesModules = null;
      return [];
    });
  return mesModules;
};

/**
 * Étiquettes d'un quiz : on choisit l'un de ses modules (en tête de la liste), une étiquette déjà
 * utilisée sur un autre quiz, ou on en tape une nouvelle (chapitre, thème…).
 */
export function ChampEtiquettes({ valeur, onChange, suggestions = [] }) {
  const { t } = useTranslation();
  const [modules, setModules] = useState([]);
  useEffect(() => {
    let actif = true;
    chargerMesModules().then((m) => actif && setModules(m));
    return () => {
      actif = false;
    };
  }, []);

  const parEtiquette = new Map(modules.map((m) => [m.etiquette, m]));
  const autres = suggestions.filter((e) => !parEtiquette.has(e));
  return (
    <Autocomplete
      multiple
      freeSolo
      options={[...modules.map((m) => m.etiquette), ...autres]}
      groupBy={(e) => t(parEtiquette.has(e) ? 'studio.nouveau.mesModules' : 'studio.nouveau.dejaUtilisees')}
      renderOption={({ key, ...props }, e) => (
        <li key={key} {...props}>
          <Box>
            <Typography variant="body2">{parEtiquette.get(e)?.nom ?? e}</Typography>
            {parEtiquette.has(e) && <Typography variant="caption" color="text.secondary">{parEtiquette.get(e).code}</Typography>}
          </Box>
        </li>
      )}
      value={valeur}
      onChange={(_, v) => onChange([...new Set(v.map((x) => String(x).trim()).filter(Boolean))].slice(0, 8))}
      renderTags={(liste, props) => liste.map((e, i) => <Chip size="small" label={e} {...props({ index: i })} key={e} />)}
      renderInput={(params) => <TextField {...params} label={t('studio.nouveau.etiquettes')} helperText={t('studio.nouveau.etiquettesAide')} inputProps={{ ...params.inputProps, maxLength: ETIQUETTE_MAX }} />}
    />
  );
}

export default function NouveauQuizDialog({ ouvert, onFermer, onCree, onGenerer, iaDisponible, suggestions }) {
  const { t } = useTranslation();
  const [etape, setEtape] = useState('choix');
  const [titre, setTitre] = useState('');
  const [etiquettes, setEtiquettes] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const champ = useRef(null);

  const fermer = () => {
    setEtape('choix');
    setTitre('');
    setEtiquettes([]);
    setErreur(null);
    onFermer();
  };

  const creer = async () => {
    setEnvoi(true);
    try {
      const quiz = await studioAPI.creer({ titre, etiquettes });
      fermer();
      onCree(quiz.id_questionnaire);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  const importer = async (fichier) => {
    if (!fichier) return;
    setErreur(null);
    try {
      const donnees = JSON.parse(await fichier.text());
      const quiz = await studioAPI.importer(donnees);
      fermer();
      onCree(quiz.id_questionnaire, 'importe');
    } catch (e) {
      setErreur(e instanceof SyntaxError ? t('studio.nouveau.importIllisible') : e.message);
    }
  };

  return (
    <Dialog open={ouvert} onClose={fermer} maxWidth="sm" fullWidth>
      <DialogTitle>{t('studio.nouveau.titre')}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {erreur && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erreur}
          </Alert>
        )}
        {etape === 'choix' ? (
          <Stack spacing={1.5}>
            <Choix icone={<EditNote />} titre={t('studio.nouveau.zero')} aide={t('studio.nouveau.zeroAide')} onClick={() => setEtape('titre')} />
            <Choix icone={<AutoAwesome />} titre={t('studio.nouveau.ia')} aide={iaDisponible ? t('studio.nouveau.iaAide') : t('studio.nouveau.iaIndisponible')} onClick={() => { fermer(); onGenerer(); }} desactive={!iaDisponible} />
            <Choix icone={<FileUpload />} titre={t('studio.nouveau.importer')} aide={t('studio.nouveau.importerAide')} onClick={() => champ.current?.click()} />
            <input ref={champ} type="file" hidden accept="application/json,.json" onChange={(e) => importer(e.target.files?.[0])} />
          </Stack>
        ) : (
          <Stack spacing={2} component="form" id="form-nouveau-quiz" onSubmit={(e) => { e.preventDefault(); creer(); }}>
            <TextField label={t('studio.nouveau.titreQuiz')} value={titre} onChange={(e) => setTitre(e.target.value)} autoFocus required inputProps={{ maxLength: 200 }} />
            <ChampEtiquettes valeur={etiquettes} onChange={setEtiquettes} suggestions={suggestions} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={etape === 'choix' ? fermer : () => setEtape('choix')}>{etape === 'choix' ? t('common.cancel') : t('common.back')}</Button>
        {etape === 'titre' && (
          <Button type="submit" form="form-nouveau-quiz" variant="contained" disabled={!titre.trim() || envoi}>
            {t('studio.nouveau.creer')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
