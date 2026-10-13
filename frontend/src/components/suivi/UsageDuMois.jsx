import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Skeleton, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { Download } from '@mui/icons-material';
import { statistiquesAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { aujourdhui } from '../../../../shared/dates.js';

/**
 * Usage du mois (lot R-12, page Suivi, administration) : comptes actifs par rôle, appels validés,
 * quiz joués et devoirs rendus, et l'export CSV qui sert au relevé de la facturation par compte
 * actif.
 */
export default function UsageDuMois({ nombre }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [mois, setMois] = useState(aujourdhui().slice(0, 7));
  const [usage, setUsage] = useState(null);

  const charger = useCallback(async () => {
    setUsage(null);
    try {
      setUsage(await statistiquesAPI.usage(mois));
    } catch {
      toast.error(t('common.errorLoad'));
    }
  }, [mois, t, toast]);

  useEffect(() => {
    charger();
  }, [charger]);

  const exporter = async () => {
    try {
      await statistiquesAPI.exportUsage(mois);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const lignes = usage
    ? [
        [t('tracking.usage.actifs'), usage.comptes_actifs.total, true],
        [t('tracking.usage.etudiants'), usage.comptes_actifs.etudiant],
        [t('tracking.usage.enseignants'), usage.comptes_actifs.enseignant],
        [t('tracking.usage.administration'), usage.comptes_actifs.admin],
        [t('tracking.usage.appels'), usage.appels_valides],
        [t('tracking.usage.quiz'), t('tracking.usage.quizDetail', { parties: nombre.format(usage.quiz.parties), joueurs: nombre.format(usage.quiz.joueurs) })],
        [t('tracking.usage.devoirs'), usage.devoirs_rendus],
      ]
    : [];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <TextField type="month" size="small" label={t('tracking.month')} value={mois} onChange={(e) => setMois(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" startIcon={<Download />} onClick={exporter}>
          {t('tracking.usage.exporter')}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
        {t('tracking.usage.intro')}
      </Typography>
      {!usage ? (
        <Skeleton variant="rectangular" height={240} />
      ) : (
        <TableContainer sx={{ maxWidth: 560 }}>
          <Table size="small" aria-label={t('tracking.tabs.usage')}>
            <TableBody>
              {lignes.map(([libelle, valeur, fort]) => (
                <TableRow key={libelle}>
                  <TableCell component="th" scope="row" sx={fort ? { fontWeight: 700 } : { pl: 4 }}>
                    {libelle}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: fort ? 700 : 400 }}>
                    {typeof valeur === 'number' ? nombre.format(valeur) : valeur}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
