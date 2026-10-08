import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import { FileDownloadOutlined, UploadFile } from '@mui/icons-material';
import { parseFile } from '../../utils/fileImport';

const telecharger = (nomFichier, contenu) => {
    const blob = new Blob([String.fromCharCode(0xfeff) + contenu], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const lien = Object.assign(document.createElement('a'), { href: url, download: nomFichier });
    lien.click();
    URL.revokeObjectURL(url);
};

/**
 * Import d'un fichier CSV ou Excel, ligne à ligne. `onImport(lignes)` reçoit les lignes lues
 * et renvoie { reussies, erreurs: [{ ligne, libelle, message }] } ; les erreurs sont listées
 * par numéro de ligne du fichier (en-têtes = ligne 1).
 */
export default function ImportCsvDialog({ open, onClose, titre, intro, modele, nomModele, onImport }) {
    const { t } = useTranslation();
    const [enCours, setEnCours] = useState(false);
    const [erreurs, setErreurs] = useState([]);
    const [bilan, setBilan] = useState(null);

    const fermer = () => {
        setErreurs([]);
        setBilan(null);
        onClose();
    };

    const importer = async (fichier) => {
        setEnCours(true);
        setErreurs([]);
        setBilan(null);
        try {
            const lignes = await parseFile(fichier);
            const resultat = await onImport(lignes);
            setErreurs(resultat.erreurs || []);
            setBilan(resultat);
        } catch (error) {
            setErreurs([{ ligne: '-', libelle: '', message: error.message }]);
        } finally {
            setEnCours(false);
        }
    };

    return (
        <Dialog open={open} onClose={fermer} maxWidth="md" fullWidth>
            <DialogTitle>{titre}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="body2">{intro}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        {modele && (
                            <Button variant="outlined" startIcon={<FileDownloadOutlined />} onClick={() => telecharger(nomModele, modele)}>
                                {t('ref.import.template')}
                            </Button>
                        )}
                        <Button variant="contained" component="label" startIcon={<UploadFile />} disabled={enCours}>
                            {enCours ? t('ref.import.importing') : t('ref.import.chooseFile')}
                            <input
                                hidden
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => {
                                    const fichier = e.target.files?.[0];
                                    e.target.value = '';
                                    if (fichier) importer(fichier);
                                }}
                            />
                        </Button>
                    </Stack>
                    {bilan && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t('ref.import.summary', { ok: bilan.reussies, ko: erreurs.length })}
                        </Typography>
                    )}
                    {erreurs.length > 0 && (
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 280, overflow: 'auto' }}>
                            <Table size="small">
                                <TableBody>
                                    {erreurs.map((erreur, index) => (
                                        <TableRow key={`${erreur.ligne}-${index}`}>
                                            <TableCell sx={{ whiteSpace: 'nowrap', width: 100 }}>{t('ref.import.line', { n: erreur.ligne })}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{erreur.libelle || '-'}</TableCell>
                                            <TableCell>{erreur.message}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={fermer}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
