import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, TextField } from '@mui/material';
import { espaceCoursAPI } from '../../services/espaceCours';

const ATTENTE_MS = 350;

/**
 * Épingler un document de la Bibliothèque dans une section (lot E-9) : l'enseignant cherche parmi
 * les documents publiés de toute l'école, et un clic l'ajoute à la section sans le copier.
 * `section` : la section visée (null = fermé). `onEpingle` : recharger l'espace.
 */
export default function BibliothequeDialog({ idCours, idGroupe, section, onFermer, onEpingle }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [resultats, setResultats] = useState(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(null);

  // Nouvelle ouverture : champ vide
  useEffect(() => {
    if (section) {
      setQ('');
      setResultats(null);
      setErreur(null);
    }
  }, [section]);

  // Recherche après une courte pause de frappe ; une réponse dépassée est ignorée
  useEffect(() => {
    const texte = q.trim();
    if (texte.length < 2) {
      setResultats(null);
      return undefined;
    }
    let actif = true;
    const minuteur = setTimeout(() => {
      setCharge(true);
      espaceCoursAPI
        .chercherBibliotheque(idCours, idGroupe, texte)
        .then((liste) => actif && (setResultats(Array.isArray(liste) ? liste : []), setErreur(null)))
        .catch((e) => actif && setErreur(e.message))
        .finally(() => actif && setCharge(false));
    }, ATTENTE_MS);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [q, idCours, idGroupe]);

  const epingler = async (document) => {
    setEnCours(document.id);
    try {
      await espaceCoursAPI.epingler(section.id_section, document.id);
      await onEpingle();
      onFermer();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(null);
    }
  };

  return (
    <Dialog open={Boolean(section)} onClose={onFermer} fullWidth maxWidth="sm">
      <DialogTitle>{t('espaceCours.epinglerTitre', { section: section?.titre ?? '' })}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={t('espaceCours.rechercheBibliotheque')}
          helperText={t('espaceCours.rechercheBibliothequeAide')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{ endAdornment: charge ? <CircularProgress size={18} /> : null }}
        />
        {erreur && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {erreur}
          </Alert>
        )}
        {resultats?.length === 0 && !charge && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {t('espaceCours.aucunDocumentBibliotheque')}
          </Alert>
        )}
        {resultats?.length > 0 && (
          <List dense aria-label={t('espaceCours.resultatsBibliotheque')}>
            {resultats.map((d) => (
              <ListItem
                key={d.id}
                divider
                secondaryAction={
                  <Button size="small" variant="outlined" disabled={Boolean(enCours)} onClick={() => epingler(d)} aria-label={t('espaceCours.epinglerDocument', { titre: d.titre })}>
                    {t('espaceCours.epingler')}
                  </Button>
                }
                sx={{ pr: 14 }}
              >
                <ListItemText primary={d.titre} secondary={d.module ? `${d.module.code}${d.module.name ? ` · ${d.module.name}` : ''}` : null} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
