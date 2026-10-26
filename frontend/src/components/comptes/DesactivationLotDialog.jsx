import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { aujourdhui } from '../../../../shared/dates.js';
import { userAPI } from '../../services/api';
import ChampsDesactivation from './ChampsDesactivation';

const VIDE = () => ({ motif: '', date: aujourdhui(), preavis: true });

/**
 * Désactivation de plusieurs comptes à la fois (lot ME-17), sans aperçu détaillé : l'aperçu se fait
 * compte par compte. Deux portées : `comptes` (une sélection) ou `groupe` (tous les étudiants du
 * groupe et de ses sous-groupes, « désactiver la promotion »). Le serveur traite chaque compte seul :
 * un refus (séances à traiter chez un enseignant, dernier administrateur, compte déjà désactivé) ne
 * bloque pas les autres, et le bilan dit ce qui s'est passé. `onFini()` est appelé à la fermeture
 * d'un lot appliqué (recharger la liste).
 */
export default function DesactivationLotDialog({ comptes, groupe, onClose, onFini }) {
    const { t } = useTranslation();
    const [valeurs, setValeurs] = useState(VIDE);
    const [bilan, setBilan] = useState(null);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const ouvert = comptes ?? groupe;

    useEffect(() => {
        if (ouvert) { setValeurs(VIDE()); setBilan(null); setErreur(''); }
    }, [ouvert]);

    if (!ouvert) return null;
    const nomDe = (id) => { const c = comptes?.find((x) => x.id_user === id); return c ? `${c.prenom} ${c.nom}` : null; };

    const envoyer = async () => {
        setEnvoi(true);
        setErreur('');
        try {
            const programmee = valeurs.date > aujourdhui();
            setBilan(await userAPI.desactiverEnLot({
                ...(groupe ? { id_groupe: groupe.id_groupe } : { ids: comptes.map((c) => c.id_user) }),
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

    const fermer = () => { if (bilan) onFini?.(); onClose(); };

    // Les refus, avec le nom du compte pour une sélection, regroupés par message pour un groupe
    const refus = (bilan?.bilan ?? []).filter((b) => b.statut === 'refuse');
    const lignesRefus = groupe
        ? Object.entries(refus.reduce((acc, b) => ({ ...acc, [b.message]: (acc[b.message] ?? 0) + 1 }), {})).map(([message, n]) => `${message} (${n})`)
        : refus.map((b) => `${nomDe(b.id_user) ?? `#${b.id_user}`} : ${b.message}`);

    return (
        <Dialog open onClose={fermer} maxWidth="sm" fullWidth>
            <DialogTitle>{groupe ? t('comptes.groupeTitre', { nom: groupe.nom_groupe }) : t('comptes.lotTitre', { count: comptes.length })}</DialogTitle>
            <DialogContent>
                {!bilan ? (
                    <>
                        <Typography variant="body2" color="text.secondary">
                            {groupe ? t('comptes.groupeAide') : comptes.map((c) => `${c.prenom} ${c.nom}`).join(', ')}
                        </Typography>
                        <ChampsDesactivation valeurs={valeurs} onChange={(partie) => setValeurs((v) => ({ ...v, ...partie }))} />
                    </>
                ) : (
                    <Box>
                        <Alert severity={bilan.refuses ? 'warning' : 'success'} sx={{ mb: 2 }}>
                            {t('comptes.lotBilan', { desactives: bilan.desactives, programmes: bilan.programmes, refuses: bilan.refuses })}
                        </Alert>
                        {lignesRefus.map((ligne) => (
                            <Typography key={ligne} variant="body2">{ligne}</Typography>
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
