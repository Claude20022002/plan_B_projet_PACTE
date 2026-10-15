import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, LinearProgress, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import { espaceCoursAPI } from '../../services/espaceCours';
import { useToast } from '../../contexts/ToastContext';

// En dessous de ce taux, la ligne est signalée : l'enseignant voit d'abord qui décroche
const SEUIL_ALERTE = 75;

/**
 * Onglet « Élèves » d'une classe (lot E-7) : chaque étudiant avec ses présences, retards et
 * absences sur les appels fermés, les plus absents d'abord, et l'export CSV pour la scolarité.
 */
export default function OngletEleves({ idCours, idGroupe, nomFichier }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [bilan, setBilan] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    espaceCoursAPI.eleves(idCours, idGroupe).then(setBilan).catch(() => setErreur(true));
  }, [idCours, idGroupe]);

  const exporter = () => espaceCoursAPI.exporterPresences(idCours, idGroupe, nomFichier).catch((e) => toast.error(e.message));

  if (erreur) return <Alert severity="warning">{t('common.errorLoad')}</Alert>;
  if (!bilan) return <Skeleton variant="rounded" height={160} />;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {t('espaceCours.eleves.aide', { count: bilan.seances_comptees })}
        </Typography>
        <Button variant="outlined" startIcon={<FileDownload />} onClick={exporter} disabled={!bilan.etudiants.length} sx={{ textTransform: 'none' }}>
          {t('espaceCours.eleves.exporter')}
        </Button>
      </Box>
      {bilan.etudiants.length === 0 ? (
        <Alert severity="info">{t('espaceCours.eleves.aucun')}</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('espaceCours.eleves.etudiant')}</TableCell>
                <TableCell sx={{ width: { xs: 120, sm: 220 } }}>{t('espaceCours.eleves.taux')}</TableCell>
                <TableCell align="right">{t('appel.statuts.present')}</TableCell>
                <TableCell align="right">{t('appel.statuts.retard')}</TableCell>
                <TableCell align="right">{t('appel.statuts.absent')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bilan.etudiants.map((e) => {
                const alerte = e.taux !== null && e.taux < SEUIL_ALERTE;
                return (
                  <TableRow key={e.id_user} hover>
                    <TableCell sx={{ fontWeight: alerte ? 600 : 400 }}>{`${e.nom} ${e.prenom}`}</TableCell>
                    <TableCell>
                      {e.taux === null ? (
                        '—'
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={e.taux} color={alerte ? 'error' : 'success'} sx={{ flex: 1, height: 6, borderRadius: 3 }} aria-hidden />
                          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{`${e.taux} %`}</Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">{e.presents}</TableCell>
                    <TableCell align="right">{e.retards}</TableCell>
                    <TableCell align="right" sx={{ color: alerte ? 'error.main' : undefined }}>{e.absences}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
