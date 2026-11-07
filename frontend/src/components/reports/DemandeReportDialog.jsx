import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography } from '@mui/material';
import { EventRepeat } from '@mui/icons-material';
import RechercheCreneaux from '../planning/RechercheCreneaux';
import { cleProposition } from '../planning/cleProposition';
import { demandeReportAPI, imprevuAPI } from '../../services/api';
import { dansJours } from '../../../../shared/dates.js';
import { dateLongue, heureCourte, libelleSeance } from './format';

/**
 * Demande de report d'une séance (enseignant), depuis « Demandes de report » ou « Mes séances ».
 * L'enseignant ne tape pas de date : il choisit parmi les créneaux où la classe, lui et la salle
 * sont libres (assistant de créneaux, salle gardée, car la demande ne change pas de salle).
 * Le créneau choisi part avec la demande (id_creneau_nouveau) : l'approbation le reprend tel quel.
 * `seanceFixe` : la séance est déjà choisie ; sinon `seances` alimente la liste, avec
 * `idSeanceInitiale` présélectionnée. `onEnvoyee()` est appelé après l'envoi.
 */
export default function DemandeReportDialog({ open, onClose, onEnvoyee, seances = [], seanceFixe = null, idSeanceInitiale = '' }) {
    const { t, i18n } = useTranslation();
    const [idSeance, setIdSeance] = useState('');
    const [proposition, setProposition] = useState(null);
    const [motif, setMotif] = useState('');
    const [erreurs, setErreurs] = useState({});
    const [erreurEnvoi, setErreurEnvoi] = useState('');
    const [envoi, setEnvoi] = useState(false);

    // Chaque ouverture repart d'un formulaire vide (ou de la séance présélectionnée)
    useEffect(() => {
        if (!open) return;
        setIdSeance(String(seanceFixe?.id_affectation ?? idSeanceInitiale ?? ''));
        setProposition(null);
        setMotif('');
        setErreurs({});
        setErreurEnvoi('');
    }, [open, seanceFixe, idSeanceInitiale]);

    const seance = seanceFixe ?? seances.find((s) => String(s.id_affectation) === idSeance) ?? null;

    const changerSeance = (valeur) => {
        setIdSeance(valeur);
        setProposition(null);
    };

    const envoyer = async (event) => {
        event.preventDefault();
        const manquants = {
            ...(!seance && { seance: t('reports.erreurs.affectation') }),
            ...(seance && !proposition && { creneau: t('reports.erreurs.creneau') }),
            ...(!motif.trim() && { motif: t('reports.erreurs.motif') }),
        };
        setErreurs(manquants);
        if (Object.keys(manquants).length) return;
        setEnvoi(true);
        setErreurEnvoi('');
        try {
            await demandeReportAPI.create({
                id_affectation: seance.id_affectation,
                nouvelle_date: proposition.date,
                id_creneau_nouveau: proposition.id_creneau,
                motif: motif.trim(),
            });
            onEnvoyee();
        } catch (error) {
            setErreurEnvoi(error.message || t('reports.erreurCreation'));
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={envoyer} noValidate>
                <DialogTitle>{t('reports.titreFormulaire')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {seanceFixe ? (
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {seanceFixe.cours?.nom_cours} · {seanceFixe.groupe?.nom_groupe}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('reports.dateActuelle', { jour: dateLongue(seanceFixe.date_seance, i18n.language), heure: heureCourte(seanceFixe.creneau?.heure_debut) })}
                                </Typography>
                            </Paper>
                        ) : (
                            <TextField
                                fullWidth
                                select
                                label={t('reports.champs.seance')}
                                value={idSeance}
                                onChange={(e) => changerSeance(e.target.value)}
                                error={Boolean(erreurs.seance)}
                                helperText={erreurs.seance}
                                SelectProps={{ native: true }}
                                // Liste native (plus simple sur téléphone) : le libellé reste au-dessus
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">{t('reports.champs.choisir')}</option>
                                {seances.map((s) => (
                                    <option key={s.id_affectation} value={s.id_affectation}>
                                        {libelleSeance(s, i18n.language)}
                                    </option>
                                ))}
                            </TextField>
                        )}

                        <Box>
                            <Typography variant="subtitle2">{t('reports.champs.creneau')}</Typography>
                            {seance ? (
                                <RechercheCreneaux
                                    key={seance.id_affectation}
                                    chercher={(date_debut, date_fin) => imprevuAPI.creneauxSeance({ id_affectation: seance.id_affectation, date_debut, date_fin, garder_salle: true })}
                                    onChoisir={(p) => {
                                        setProposition(p);
                                        setErreurs((e) => ({ ...e, creneau: undefined }));
                                    }}
                                    choisi={proposition ? cleProposition(proposition) : null}
                                    // Jamais dans le passé : la recherche commence demain
                                    plageInitiale={{ debut: dansJours(1), fin: dansJours(21) }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('reports.choisirSeanceDabord')}
                                </Typography>
                            )}
                            {erreurs.creneau && (
                                <Typography variant="caption" color="error" role="alert">
                                    {erreurs.creneau}
                                </Typography>
                            )}
                        </Box>

                        {proposition && (
                            <Alert severity="info" icon={<EventRepeat />}>
                                {t('reports.nouveauCreneau', {
                                    jour: dateLongue(proposition.date, i18n.language),
                                    debut: proposition.heure_debut,
                                    fin: proposition.heure_fin,
                                    salle: proposition.nom_salle ?? t('assistant.remote'),
                                })}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label={t('reports.champs.motif')}
                            placeholder={t('reports.aideMotif')}
                            multiline
                            rows={3}
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            error={Boolean(erreurs.motif)}
                            helperText={erreurs.motif}
                        />
                        {erreurEnvoi && <Alert severity="error">{erreurEnvoi}</Alert>}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{t('common.cancel')}</Button>
                    <Button type="submit" variant="contained" disabled={envoi} startIcon={envoi ? <CircularProgress size={16} color="inherit" /> : <EventRepeat />}>
                        {t('reports.envoyer')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
