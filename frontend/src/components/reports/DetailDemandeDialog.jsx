import { useTranslation } from 'react-i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import StatutDemande from './StatutDemande';
import { dateCourte, dateEtHeure, demandeeDe, origineDe } from './format';

/**
 * Détail d'une demande de report (administration). Une demande en attente se refuse, s'approuve
 * telle quelle, ou s'approuve sur un autre créneau libre (`onAutreCreneau`) quand celui demandé
 * ne convient pas : l'administration n'a plus à refuser puis attendre une nouvelle demande.
 */
export default function DetailDemandeDialog({ demande, creneaux, onClose, onApprouver, onAutreCreneau, onRefuser }) {
    const { t, i18n } = useTranslation();
    const enAttente = demande?.statut_demande === 'en_attente';
    // Validée, elle attend l'enseignant : l'administration peut encore la retirer, pas la revalider
    const aConfirmer = demande?.statut_demande === 'a_confirmer';

    const lignes = demande
        ? [
              [t('reportsAdmin.colonnes.enseignant'), [demande.enseignant?.prenom, demande.enseignant?.nom].filter(Boolean).join(' ') || '—'],
              [t('reports.colonnes.seance'), [demande.affectation?.cours?.nom_cours, demande.affectation?.groupe?.nom_groupe, demande.affectation?.salle?.nom_salle].filter(Boolean).join(' · ') || '—'],
              [t('reports.colonnes.origine'), dateEtHeure(origineDe(demande, creneaux), i18n.language)],
              [t('reports.colonnes.nouvelleDate'), dateEtHeure(demandeeDe(demande, creneaux), i18n.language)],
              [t('reports.colonnes.motif'), demande.motif],
              [t('reports.colonnes.dateDemande'), dateCourte(demande.date_demande, i18n.language)],
              ...(demande.motif_decision ? [[t('reports.colonnes.raisonRefus'), demande.motif_decision]] : []),
          ]
        : [];

    return (
        <Dialog open={Boolean(demande)} onClose={onClose} maxWidth="sm" fullWidth>
            {demande && (
                <>
                    <DialogTitle>{t('reportsAdmin.titreDetail')}</DialogTitle>
                    <DialogContent>
                        <Box component="dl" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, m: 0, mt: 1 }}>
                            {lignes.map(([libelle, valeur]) => (
                                <Box key={libelle}>
                                    <Typography component="dt" variant="subtitle2" color="text.secondary">
                                        {libelle}
                                    </Typography>
                                    <Typography component="dd" variant="body1" sx={{ m: 0 }}>
                                        {valeur}
                                    </Typography>
                                </Box>
                            ))}
                            <Box>
                                <Typography component="dt" variant="subtitle2" color="text.secondary">
                                    {t('reports.colonnes.statut')}
                                </Typography>
                                <Box component="dd" sx={{ m: 0, mt: 0.5 }}>
                                    <StatutDemande statut={demande.statut_demande} />
                                </Box>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Button onClick={onClose}>{t('common.close')}</Button>
                        {(enAttente || aConfirmer) && (
                            <Button color="error" onClick={() => onRefuser(demande)}>
                                {t('reportsAdmin.refuser')}
                            </Button>
                        )}
                        {enAttente && (
                            <>
                                <Button variant="outlined" onClick={() => onAutreCreneau(demande)}>
                                    {t('reportsAdmin.autreCreneau')}
                                </Button>
                                <Button color="success" variant="contained" onClick={() => onApprouver(demande)}>
                                    {t('reportsAdmin.approuver')}
                                </Button>
                            </>
                        )}
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}
