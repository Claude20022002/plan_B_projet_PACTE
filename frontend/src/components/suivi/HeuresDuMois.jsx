import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Download, Refresh } from '@mui/icons-material';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import SeancesAVerifier from './SeancesAVerifier';
import { suiviAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { aujourdhui } from '../../../../shared/dates.js';
import { ds } from '../../design-system/tokens';

/**
 * Heures du mois par enseignant (phase P7, page Suivi) et export des vacataires pour la paie.
 * Lot R-11 : la part des heures sans appel validé est signalée « à vérifier », et les séances
 * concernées se confirment ou s'écartent juste en dessous, avant l'export. Sorti de Suivi.jsx.
 */
export default function HeuresDuMois({ nombre }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [mois, setMois] = useState(aujourdhui().slice(0, 7));
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setLignes(await suiviAPI.enseignants(mois));
    } catch {
      toast.error(t('common.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [mois, t, toast]);

  useEffect(() => {
    charger();
  }, [charger]);

  const actualiser = async () => {
    try {
      const { realisees } = await suiviAPI.actualiser();
      toast.success(t('tracking.refreshed', { count: realisees }));
      charger();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const exporter = async () => {
    try {
      await suiviAPI.exportVacataires(mois);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const heures = (h) => `${nombre.format(h ?? 0)} h`;
  // Séances de vacataires sans appel validé ni visa : retenues hors de l'export de la paie (R-11)
  const retenues = lignes.filter((l) => l.statut === 'vacataire').reduce((total, l) => total + (l.seances_a_verifier ?? 0), 0);

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <TextField type="month" size="small" label={t('tracking.month')} value={mois} onChange={(e) => setMois(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Refresh />} onClick={actualiser}>
            {t('tracking.refresh')}
          </Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exporter}>
            {t('tracking.exportVisiting')}
          </Button>
        </Stack>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
        {t('tracking.hoursIntro')}
      </Typography>
      {retenues > 0 && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: 820 }}>
          {t('tracking.visa.retenues', { count: retenues })}
        </Alert>
      )}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : lignes.length === 0 ? (
        <EmptyState title={t('tracking.noHoursTitle')} description={t('tracking.noHoursBody')} />
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('ref.staff.cols.teacher')}</TableCell>
                <TableCell>{t('ref.staff.cols.status')}</TableCell>
                <TableCell align="right">{t('tracking.cols.done')}</TableCell>
                <TableCell>{t('tracking.visa.cols.aVerifier')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lignes.map((l) => (
                <TableRow key={l.id_user} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {l.nom} {l.prenom}
                    </Typography>
                    {l.entreprise && (
                      <Typography variant="caption" color="text.secondary">
                        {l.entreprise}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{t(`ref.staff.statuses.${l.statut}`)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: ds.font.board, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {heures(l.heures_realisees)}
                  </TableCell>
                  <TableCell>
                    {l.seances_a_verifier > 0 ? (
                      <StateChip tone="warning" title={t('tracking.visa.aVerifierTitre', { count: l.seances_a_verifier })}>
                        {t('tracking.visa.aVerifierHeures', { heures: heures(l.heures_a_verifier) })}
                      </StateChip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                    {l.heures_ecartees > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {t('tracking.visa.ecartees', { heures: heures(l.heures_ecartees) })}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <SeancesAVerifier mois={mois} onChange={charger} />
    </>
  );
}
