import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { aujourdhui } from '../../../../shared/dates.js';
import { userAPI } from '../../services/api';
import ChampsDesactivation from './ChampsDesactivation';

/**
 * Désactivation de plusieurs comptes à la fois (lot ME-17), sans aperçu détaillé : l'aperçu se fait
 * compte par compte. Le serveur traite chaque compte seul ; un refus (séances à traiter chez un
 * enseignant, dernier administrateur, son propre compte) ne bloque pas les autres, et le bilan dit
 * pour chacun ce qui s'est passé. `comptes` est la sélection ; `onFini()` recharge la liste.
 */
export default function DesactivationLotDialog({ comptes, onClose, onFini }) {
    const { t } = useTranslation();
    const [valeurs, setValeurs] = useState({ motif: '', date: aujourdhui(), preavis: true });
    const [bilan, setBilan] = useState(null);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    useEffect(() => {
        if (comptes) { setValeurs({ motif: '', date: aujourdhui(), preavis: true }); setBilan(null); setErreur(''); }
    }, [comptes]);

    if (!comptes) return null;
    const nomDe = (id) => { const c = comptes.find((x) => x.id_user === id); return c ? `${c.prenom} ${c.nom}` : `#${id}`; };

    const envoyer = async () => {
        setEnvoi(true);
        setErreur('');
        try {
            const programmee = valeurs.date > aujourdhui();
            setBilan(await userAPI.desactiverEnLot({
                ids: comptes.map((c) => c.id_user),
                motif: valeurs.motif,
                date: valeurs.date,
                ...(programmee ? { preavis: valeurs.preavis } : {}),
            }));
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    };

    const fermer = () => { if (bilan) onFini(); onClose(); };

    return (
        <Dialog open onClose={fermer} maxWidth="sm" fullWidth>
            <DialogTitle>{t('comptes.lotTitre', { count: comptes.length })}</DialogTitle>
            <DialogContent>
                {!bilan ? (
                    <>
                        <Typography variant="body2" color="text.secondary">{comptes.map((c) => `${c.prenom} ${c.nom}`).join(', ')}</Typography>
                        <ChampsDesactivation valeurs={valeurs} onChange={(partie) => setValeurs((v) => ({ ...v, ...partie }))} />
                    </>
                ) : (
                    <Box>
                        <Alert severity={bilan.refuses ? 'warning' : 'success'} sx={{ mb: 2 }}>
                            {t('comptes.lotBilan', { desactives: bilan.desactives, programmes: bilan.programmes, refuses: bilan.refuses })}
                        </Alert>
                        {bilan.bilan.filter((b) => b.statut === 'refuse').map((b) => (
                            <Typography key={b.id_user} variant="body2">{nomDe(b.id_user)} : {b.message}</Typography>
                        ))}
                    </Box>
                )}
                {erreur && <Alert severity="error" sx={{ mt: 2 }}>{erreur}</Alert>}
            </DialogContent>
            <DialogActions>
                {bilan ? (
                    <Button variant="contained" onClick={fermer}>{t('common.close')}</Button>
                ) : (
                    <>
                        <Button onClick={onClose}>{t('common.cancel')}</Button>
                        <Button variant="contained" color="error" disabled={!valeurs.motif || envoi} onClick={envoyer}>
                            {t(valeurs.date > aujourdhui() ? 'comptes.programmer' : 'comptes.desactiver')}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
