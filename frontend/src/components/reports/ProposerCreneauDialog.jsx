import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Typography } from '@mui/material';
import { EventRepeat } from '@mui/icons-material';
import RechercheCreneaux from '../planning/RechercheCreneaux';
import { cleProposition } from '../planning/cleProposition';
import { demandeReportAPI, imprevuAPI } from '../../services/api';
import { dansJours } from '../../../../shared/dates.js';
import { dateLongue, heureCourte } from './format';

/**
 * L'enseignant refuse la place validée par l'administration et propose un autre créneau
 * (décision du 21 octobre). Les créneaux viennent de l'assistant, salle gardée, à partir de
 * demain ; le serveur revérifie le créneau choisi. S'il vient d'être pris (422), le message
 * s'affiche, la recherche repart et la fenêtre reste ouverte.
 * `demande` : la demande à confirmer (null : fermée) ; `avertissement` : message affiché à
 * l'ouverture (la place proposée a été prise) ; `onProposee()` après un créneau retenu.
 */
export default function ProposerCreneauDialog({ demande, avertissement = '', onClose, onProposee }) {
    const { t, i18n } = useTranslation();
    const [proposition, setProposition] = useState(null);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    // Change à chaque refus du serveur : la recherche repart avec ce qui est encore libre
    const [recherche, setRecherche] = useState(0);

    useEffect(() => {
        setProposition(null);
        setErreur('');
    }, [demande?.id_demande]);

    const envoyer = async (event) => {
        event.preventDefault();
        if (!proposition) return;
        setEnvoi(true);
        setErreur('');
        try {
            await demandeReportAPI.confirmer(demande.id_demande, { action: 'proposer', nouvelle_date: proposition.date, id_creneau: proposition.id_creneau });
            onProposee();
        } catch (error) {
            setErreur(error.response?.data?.code === 'AUCUN_CRENEAU_LIBRE' ? t('reports.plusLibre') : error.message);
            if (error.status === 422) {
                setProposition(null);
                setRecherche((n) => n + 1);
            }
        } finally {
            setEnvoi(false);
        }
    };

    const seance = demande?.affectation;

    return (
        <Dialog open={Boolean(demande)} onClose={onClose} maxWidth="sm" fullWidth>
            {demande && (
                <form onSubmit={envoyer} noValidate>
                    <DialogTitle>{t('reports.proposer')}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {[seance?.cours?.nom_cours, seance?.groupe?.nom_groupe].filter(Boolean).join(' · ')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('reports.dateActuelle', { jour: dateLongue(seance?.date_seance, i18n.language), heure: heureCourte(seance?.creneau?.heure_debut) })}
                                </Typography>
                            </Paper>
                            {(erreur || avertissement) && (
                                <Alert severity="warning" role="alert">
                                    {erreur || avertissement}
                                </Alert>
                            )}
                            <RechercheCreneaux
                                key={`${demande.id_demande}-${recherche}`}
                                chercher={(date_debut, date_fin) => imprevuAPI.creneauxSeance({ id_affectation: demande.id_affectation, date_debut, date_fin, garder_salle: true })}
                                onChoisir={setProposition}
                                choisi={proposition ? cleProposition(proposition) : null}
                                // Jamais dans le passé : la recherche commence demain
                                plageInitiale={{ debut: dansJours(1), fin: dansJours(21) }}
                            />
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
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>{t('common.cancel')}</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!proposition || envoi}
                            startIcon={envoi ? <CircularProgress size={16} color="inherit" /> : <EventRepeat />}
                        >
                            {t('reports.proposerCe')}
                        </Button>
                    </DialogActions>
                </form>
            )}
        </Dialog>
    );
}
