import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { Download } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ViolationsDialog from '../../components/planning/ViolationsDialog';
import AssistantCreneauxDialog from '../../components/planning/AssistantCreneauxDialog';
import TableDemandesAdmin from '../../components/reports/TableDemandesAdmin';
import DetailDemandeDialog from '../../components/reports/DetailDemandeDialog';
import useDemandesAdmin from '../../components/reports/useDemandesAdmin';
import { dateCourte } from '../../components/reports/format';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import useCreneauxParId from '../../hooks/useCreneauxParId';
import { imprevuAPI } from '../../services/api';
import { exportToExcelLazy } from '../../utils/lazyExports';
import { COLS_DEMANDES_REPORT } from '../../utils/exportColumns';
import { dansJours } from '../../../../shared/dates.js';

/**
 * Demandes de report (administration) : la liste, le détail d'une demande, et sa décision.
 * Quand le créneau demandé est pris, l'administration choisit un autre créneau libre et approuve
 * en une fois (recette du 20 octobre, B-2) ; un refus se confirme, car l'enseignant est prévenu
 * aussitôt et la décision ne s'annule pas (M-5).
 */
export default function DemandesReportAdmin() {
    const { t, i18n } = useTranslation();
    const confirmer = useConfirmation();
    const creneaux = useCreneauxParId();
    const { demandes, chargement, enCours, violations, fermerViolations, approuver, refuser, approuverSur } = useDemandesAdmin();
    const [detail, setDetail] = useState(null);
    const [aDeplacer, setADeplacer] = useState(null);

    const confirmerRefus = async (demande) => {
        const ok = await confirmer({
            titre: t('reportsAdmin.refusTitre'),
            message: t('reportsAdmin.refusMessage', {
                enseignant: [demande.enseignant?.prenom, demande.enseignant?.nom].filter(Boolean).join(' '),
                seance: demande.affectation?.cours?.nom_cours ?? '',
                date: dateCourte(demande.nouvelle_date, i18n.language),
            }),
            libelle: t('reportsAdmin.refuser'),
        });
        if (!ok) return;
        setDetail(null);
        await refuser(demande);
    };

    const ouvrirAssistant = (demande) => {
        setDetail(null);
        setADeplacer(demande);
    };

    return (
        <DashboardLayout>
            <Box>
                {/* Le titre est celui de la mise en page (« Demandes de report ») : seule l'action reste ici */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button variant="outlined" startIcon={<Download />} onClick={() => exportToExcelLazy(demandes, COLS_DEMANDES_REPORT, 'Demandes_Report', t('reports.titre'))} size="small">
                        {t('reportsAdmin.exporter')}
                    </Button>
                </Box>

                {chargement ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : demandes.length === 0 ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            {t('reportsAdmin.aucune')}
                        </Typography>
                    </Paper>
                ) : (
                    <TableDemandesAdmin demandes={demandes} creneaux={creneaux} enCours={enCours} onVoir={setDetail} onApprouver={approuver} onRefuser={confirmerRefus} />
                )}
            </Box>

            <DetailDemandeDialog
                demande={detail}
                creneaux={creneaux}
                onClose={() => setDetail(null)}
                onApprouver={(demande) => {
                    setDetail(null);
                    approuver(demande);
                }}
                onAutreCreneau={ouvrirAssistant}
                onRefuser={confirmerRefus}
            />
            <ViolationsDialog
                violations={violations?.liste}
                onClose={fermerViolations}
                onForcer={violations?.forcer}
                onCorriger={violations ? () => ouvrirAssistant(violations.demande) : undefined}
                libelleCorriger={t('reportsAdmin.autreCreneau')}
            />
            <AssistantCreneauxDialog
                open={Boolean(aDeplacer)}
                titre={t('reportsAdmin.autreCreneau')}
                sousTitre={aDeplacer ? [aDeplacer.affectation?.cours?.nom_cours, aDeplacer.affectation?.groupe?.nom_groupe, aDeplacer.affectation?.salle?.nom_salle].filter(Boolean).join(' · ') : ''}
                onClose={() => setADeplacer(null)}
                // Salle gardée : une demande de report ne change que la date et l'heure
                chercher={(date_debut, date_fin) => imprevuAPI.creneauxSeance({ id_affectation: aDeplacer.id_affectation, date_debut, date_fin, garder_salle: true })}
                plageInitiale={{ debut: dansJours(1), fin: dansJours(21) }}
                onChoisir={async (p) => {
                    if (await approuverSur(aDeplacer, p)) setADeplacer(null);
                }}
                libelleChoix={t('reportsAdmin.approuverIci')}
            />
        </DashboardLayout>
    );
}
