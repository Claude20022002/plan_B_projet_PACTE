import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Block, CheckCircleOutline, Undo } from '@mui/icons-material';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { suiviAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

// Teinte de la pastille de chaque état (codes du serveur, services/planning/visaSeances.js)
const TONS = { a_verifier: 'warning', confirmee: 'success', ecartee: 'danger' };
const MOTIF_MAX = 255;

/**
 * Séances du mois sans appel validé, à confirmer ou à écarter avant l'export de la paie des
 * vacataires (remarques-par-profil.md, lot R-11). Un appel validé est un indice que le cours a eu
 * lieu, pas une preuve : les séances qui en ont un n'apparaissent pas ici. La décision de
 * l'administration l'emporte toujours ; elle peut être annulée. Une séance écartée sort des heures
 * du mois et de l'export.
 * `onChange` : appelé après chaque décision, pour recalculer les heures.
 */
export default function SeancesAVerifier({ mois, onChange }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [donnees, setDonnees] = useState(null); // { seances, a_verifier }
  const [enCours, setEnCours] = useState(null); // id de la séance en cours d'enregistrement
  const [aEcarter, setAEcarter] = useState(null);
  const [motif, setMotif] = useState('');

  const charger = useCallback(async () => {
    try {
      setDonnees(await suiviAPI.seancesAVerifier(mois));
    } catch {
      setDonnees({ seances: [], a_verifier: 0 });
      toast.error(t('common.errorLoad'));
    }
  }, [mois, t, toast]);

  useEffect(() => {
    setDonnees(null);
    charger();
  }, [charger]);

  const decider = async (seance, decision, motifSaisi = null) => {
    setEnCours(seance.id_affectation);
    try {
      await suiviAPI.viser(seance.id_affectation, decision, motifSaisi);
      await charger();
      onChange?.();
    } catch (e) {
      toast.error(e?.message || t('tracking.visa.erreur'));
    } finally {
      setEnCours(null);
    }
  };

  const ecarter = () => {
    const seance = aEcarter;
    setAEcarter(null);
    decider(seance, 'ecartee', motif.trim() || null);
    setMotif('');
  };

  const jour = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' });
  const enseignants = (s) => (s.enseignants ?? []).map((e) => `${e.prenom} ${e.nom}${e.statut === 'vacataire' ? ` (${t('ref.staff.statuses.vacataire')})` : ''}`).join(', ');

  return (
    <Box component="section" aria-labelledby="seances-a-verifier" sx={{ mt: 3 }}>
      <Typography id="seances-a-verifier" variant="h6" sx={{ mb: 1 }}>
        {t('tracking.visa.titre', { count: donnees?.a_verifier ?? 0 })}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>{t('tracking.visa.note')}</Alert>
      {donnees === null ? (
        <TableSkeleton rows={3} />
      ) : donnees.seances.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('tracking.visa.aucune')}</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('tracking.visa.cols.seance')}</TableCell>
                <TableCell>{t('tracking.visa.cols.enseignants')}</TableCell>
                <TableCell>{t('tracking.visa.cols.etat')}</TableCell>
                <TableCell align="right">{t('tracking.visa.cols.decision')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {donnees.seances.map((s) => (
                <TableRow key={s.id_affectation} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.module}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[jour(s.date), `${String(s.debut).slice(0, 5)}–${String(s.fin).slice(0, 5)}`, s.groupe, s.salle].filter(Boolean).join(' · ')}
                    </Typography>
                  </TableCell>
                  <TableCell>{enseignants(s)}</TableCell>
                  <TableCell>
                    <StateChip tone={TONS[s.etat] ?? 'neutral'}>{t(`tracking.visa.etats.${s.etat}`)}</StateChip>
                    {s.appel_ouvert && s.etat === 'a_verifier' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{t('tracking.visa.appelOuvert')}</Typography>
                    )}
                    {s.motif && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{s.motif}</Typography>}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {s.etat === 'a_verifier' ? (
                      <>
                        <Button size="small" startIcon={<CheckCircleOutline />} disabled={enCours === s.id_affectation} onClick={() => decider(s, 'confirmee')}>
                          {t('tracking.visa.confirmer')}
                        </Button>
                        <Button size="small" color="error" startIcon={<Block />} disabled={enCours === s.id_affectation} onClick={() => setAEcarter(s)}>
                          {t('tracking.visa.ecarter')}
                        </Button>
                      </>
                    ) : (
                      <Button size="small" startIcon={<Undo />} disabled={enCours === s.id_affectation} onClick={() => decider(s, null)}>
                        {t('tracking.visa.annuler')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(aEcarter)} onClose={() => setAEcarter(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('tracking.visa.ecarterTitre', { module: aEcarter?.module ?? '' })}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('tracking.visa.ecarterAide')}</Typography>
          <TextField label={t('tracking.visa.motif')} value={motif} onChange={(e) => setMotif(e.target.value)} fullWidth multiline minRows={2} inputProps={{ maxLength: MOTIF_MAX }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAEcarter(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={ecarter}>{t('tracking.visa.ecarter')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
