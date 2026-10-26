import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { aujourdhui } from '../../../../shared/dates.js';
import { userAPI } from '../../services/api';
import ApercuLot from './ApercuLot';
import ChampsDesactivation from './ChampsDesactivation';

const VIDE = () => ({ motif: '', date: aujourdhui(), preavis: true });

/**
 * Désactivation de plusieurs comptes à la fois (lot ME-17). Deux portées : `comptes` (une
 * sélection) ou `groupe` (tous les étudiants du groupe et de ses sous-groupes, « désactiver la
 * promotion »). « Aperçu puis appliquer » : le nombre de comptes touchés et les refus prévus sont
 * relus à chaque changement de date, avant le bouton. Le serveur traite ensuite chaque compte seul :
 * un refus (séances à traiter chez un enseignant, dernier administrateur, compte déjà désactivé) ne
 * bloque pas les autres, et le bilan dit ce qui s'est passé ; « Défaire » rétablit tout le lot.
 * `onFini()` est appelé à la fermeture d'un lot appliqué (recharger la liste).
 */
export default function DesactivationLotDialog({ comptes, groupe, onClose, onFini }) {
    const { t } = useTranslation();
    const [valeurs, setValeurs] = useState(VIDE);
    const [apercu, setApercu] = useState(null);
    const [bilan, setBilan] = useState(null);
    const [defait, setDefait] = useState(null);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const ouvert = comptes ?? groupe;
    const portee = groupe ? { id_groupe: groupe.id_groupe } : { ids: comptes?.map((c) => c.id_user) };

    useEffect(() => {
        if (ouvert) { setValeurs(VIDE()); setBilan(null); setDefait(null); setErreur(''); }
    }, [ouvert]);

    useEffect(() => {
        if (!ouvert || bilan) return undefined;
        let annule = false;
        setApercu(null);
        userAPI.apercuLot(portee, valeurs.date)
            .then((r) => { if (!annule) { setApercu(r); setErreur(''); } })
            .catch((e) => { if (!annule) setErreur(e.message); });
        return () => { annule = true; };
        // portee découle de ouvert
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ouvert, valeurs.date, bilan]);

    if (!ouvert) return null;
    const nomDe = (id) => { const c = comptes?.find((x) => x.id_user === id); return c ? `${c.prenom} ${c.nom}` : null; };

    const agir = async (appel, fini) => {
        setEnvoi(true);
        setErreur('');
        try {
            fini(await appel());
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    };

    const envoyer = () => agir(
        () => userAPI.desactiverEnLot({
            ...portee,
            motif: valeurs.motif,
            date: valeurs.date,
            ...(valeurs.date > aujourdhui() ? { preavis: valeurs.preavis } : {}),
        }),
        setBilan,
    );
    const annulerLot = () => agir(() => userAPI.retablirEnLot(portee), setDefait);

    const fermer = () => { if (bilan) onFini?.(); onClose(); };

    // Les refus, avec le nom du compte pour une sélection, regroupés par message pour un groupe
    const refus = (bilan?.bilan ?? []).filter((b) => b.statut === 'refuse');
    const lignesRefus = groupe
        ? Object.entries(refus.reduce((acc, b) => ({ ...acc, [b.message]: (acc[b.message] ?? 0) + 1 }), {})).map(([message, n]) => `${message} (${n})`)
        : refus.map((b) => `${nomDe(b.id_user) ?? `#${b.id_user}`} : ${b.message}`);
    const aDefaire = bilan && !defait && bilan.desactives + bilan.programmes > 0;

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
                        <ApercuLot apercu={apercu} erreur={erreur && !apercu ? erreur : ''} comptes={comptes} />
                    </>
                ) : (
                    <Box>
                        <Alert severity={bilan.refuses ? 'warning' : 'success'} sx={{ mb: 2 }}>
                            {t('comptes.lotBilan', { desactives: bilan.desactives, programmes: bilan.programmes, refuses: bilan.refuses })}
                        </Alert>
                        {lignesRefus.map((ligne) => (
                            <Typography key={ligne} variant="body2">{ligne}</Typography>
                        ))}
                        {defait && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                {t('comptes.defait', { reactives: defait.reactives, annulees: defait.programmations_annulees })}
                            </Alert>
                        )}
                    </Box>
                )}
                {erreur && (bilan || apercu) && <Alert severity="error" sx={{ mt: 2 }}>{erreur}</Alert>}
            </DialogContent>
            <DialogActions>
                {bilan ? (
                    <>
                        {aDefaire && <Button color="error" disabled={envoi} onClick={annulerLot}>{t('comptes.defaire')}</Button>}
                        <Button variant="contained" onClick={fermer}>{t('common.close')}</Button>
                    </>
                ) : (
                    <>
                        <Button onClick={onClose}>{t('common.cancel')}</Button>
                        <Button variant="contained" color="error" disabled={!valeurs.motif || envoi || !apercu?.a_desactiver} onClick={envoyer}>
                            {t(valeurs.date > aujourdhui() ? 'comptes.programmer' : 'comptes.desactiver')}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
