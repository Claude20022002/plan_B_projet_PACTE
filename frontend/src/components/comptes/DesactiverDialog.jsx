import React, { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { aujourdhui } from '../../../../shared/dates.js';
import { userAPI } from '../../services/api';
import { localeEcran } from '../../utils/dates';
import ApercuDesactivation from './ApercuDesactivation';
import ChampsDesactivation from './ChampsDesactivation';

const VIDE = () => ({ motif: '', date: aujourdhui(), preavis: true });

/**
 * Désactivation d'un compte (lot ME-17) : l'aperçu de ce qu'elle touche, puis le motif, la date
 * d'effet (aujourd'hui ou plus tard) et le préavis. Un enseignant qui a des séances à venir ne se
 * désactive qu'après un choix explicite : les annuler ici, ou les confier d'abord à un remplaçant
 * (page Imprévus). `onFait(reponse)` reçoit la réponse du serveur ({ statut, effet_le, … }).
 */
export default function DesactiverDialog({ compte, onClose, onFait }) {
    const { t, i18n } = useTranslation();
    const [valeurs, setValeurs] = useState(VIDE);
    const [apercu, setApercu] = useState(null);
    const [annulerSeances, setAnnulerSeances] = useState(false);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    // À chaque ouverture : formulaire vierge ; à chaque date : l'aperçu est relu (les séances à venir en dépendent)
    useEffect(() => {
        if (compte) { setValeurs(VIDE()); setAnnulerSeances(false); setErreur(''); }
    }, [compte]);
    useEffect(() => {
        if (!compte) return undefined;
        let ignore = false;
        setApercu(null);
        userAPI.apercuDesactivation(compte.id_user, valeurs.date)
            .then((a) => { if (!ignore) setApercu(a); })
            .catch((e) => { if (!ignore) setErreur(e.message); });
        return () => { ignore = true; };
    }, [compte, valeurs.date]);

    if (!compte) return null;
    const bloque = (apercu?.a_traiter ?? 0) > 0;
    const pret = Boolean(valeurs.motif) && apercu && (!bloque || annulerSeances);

    const envoyer = async () => {
        setEnvoi(true);
        setErreur('');
        try {
            const programmee = valeurs.date > aujourdhui();
            onFait(await userAPI.desactiver(compte.id_user, {
                motif: valeurs.motif,
                date: valeurs.date,
                ...(programmee ? { preavis: valeurs.preavis } : {}),
                ...(bloque ? { seances: 'annuler' } : {}),
            }));
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    };

    const annulerProgrammation = async () => {
        try {
            await userAPI.annulerDesactivation(compte.id_user);
            onFait({ statut: 'annulee' });
        } catch (e) {
            setErreur(e.message);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('comptes.desactiverTitre', { nom: `${compte.prenom} ${compte.nom}` })}</DialogTitle>
            <DialogContent>
                {compte.desactivation_prevue_le && (
                    <Alert severity="info" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={annulerProgrammation}>{t('comptes.annulerProgrammation')}</Button>}>
                        {t('comptes.dejaProgramme', { date: new Date(`${compte.desactivation_prevue_le}T00:00:00`).toLocaleDateString(localeEcran(i18n.language), { dateStyle: 'medium' }) })}
                    </Alert>
                )}
                <ChampsDesactivation valeurs={valeurs} onChange={(partie) => setValeurs((v) => ({ ...v, ...partie }))} />
                <Divider sx={{ my: 2 }} />
                {apercu ? <ApercuDesactivation apercu={apercu} /> : !erreur && <CircularProgress size={20} aria-label={t('common.loading')} />}
                {bloque && (
                    <>
                        <FormControlLabel
                            control={<Checkbox checked={annulerSeances} onChange={(e) => setAnnulerSeances(e.target.checked)} />}
                            label={t('comptes.annulerSeances', { count: apercu.a_traiter })}
                        />
                        <Alert severity="info" sx={{ mt: 1 }}>
                            {t('comptes.ouRemplacant')} <Link component={RouterLink} to="/gestion/imprevus">{t('comptes.pageImprevus')}</Link>.
                        </Alert>
                    </>
                )}
                {erreur && <Alert severity="error" sx={{ mt: 2 }}>{erreur}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.cancel')}</Button>
                <Button variant="contained" color="error" disabled={!pret || envoi} onClick={envoyer}>
                    {t(valeurs.date > aujourdhui() ? 'comptes.programmer' : 'comptes.desactiver')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
