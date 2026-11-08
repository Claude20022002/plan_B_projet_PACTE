import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { enseignantAPI, filiereAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';

/** Responsables d'une filière : enseignants qui préparent ses emplois du temps (nommés par l'administration). */
export default function ResponsablesDialog({ filiere, onClose, onChange }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [enseignants, setEnseignants] = useState([]);
    const [choix, setChoix] = useState(null);

    useEffect(() => {
        if (!filiere || enseignants.length) return;
        fetchAll(enseignantAPI.getAll)
            .then((liste) => setEnseignants(liste.filter((e) => e.user?.actif !== false)))
            .catch(() => toast.error(t('common.errorLoad')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filiere]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.message);
    const responsables = filiere?.responsables ?? [];
    const dejaNommes = new Set(responsables.map((r) => r.id_user));

    const nommer = async () => {
        try {
            await filiereAPI.ajouterResponsable(filiere.id_filiere, choix.id_user);
            toast.success(t('ref.programs.headAdded'));
            setChoix(null);
            onChange();
        } catch (error) {
            erreur(error);
        }
    };

    const retirer = async (idUser) => {
        try {
            await filiereAPI.retirerResponsable(filiere.id_filiere, idUser);
            toast.success(t('ref.programs.headRemoved'));
            onChange();
        } catch (error) {
            erreur(error);
        }
    };

    return (
        <Dialog open={Boolean(filiere)} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {t('ref.programs.headsTitle', { name: filiere?.code_filiere })}
                <Typography variant="body2" color="text.secondary">
                    {filiere?.nom_filiere}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('ref.programs.headsIntro')}
                </Typography>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 2 }}>
                    {responsables.length === 0 && (
                        <Typography variant="body2" sx={{ py: 1 }}>
                            {t('ref.programs.headsNone')}
                        </Typography>
                    )}
                    {responsables.map((r) => (
                        <Stack key={r.id_user} direction="row" alignItems="center" sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                                {r.user?.prenom} {r.user?.nom}
                            </Typography>
                            <IconButton size="small" onClick={() => retirer(r.id_user)} aria-label={t('ref.programs.headRemove', { name: `${r.user?.prenom} ${r.user?.nom}` })}>
                                <Close fontSize="small" />
                            </IconButton>
                        </Stack>
                    ))}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Autocomplete
                        sx={{ flex: 1 }}
                        size="small"
                        options={enseignants.filter((e) => !dejaNommes.has(e.id_user)).sort((a, b) => (a.user?.nom || '').localeCompare(b.user?.nom || ''))}
                        value={choix}
                        onChange={(_, v) => setChoix(v)}
                        getOptionLabel={(e) => `${e.user?.nom} ${e.user?.prenom}${e.departement ? ` · ${e.departement}` : ''}`}
                        isOptionEqualToValue={(a, b) => a.id_user === b.id_user}
                        renderInput={(params) => <TextField {...params} label={t('ref.programs.headPick')} />}
                    />
                    <Button variant="contained" onClick={nommer} disabled={!choix}>
                        {t('ref.programs.headAdd')}
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
