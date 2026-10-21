import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ViolationsDialog from '../components/planning/ViolationsDialog';
import AssistantCreneauxDialog from '../components/planning/AssistantCreneauxDialog';
import ReservationDialog from '../components/reservations/ReservationDialog';
import TableReservations from '../components/reservations/TableReservations';
import { RESERVATION_VIDE, periodeDe } from '../components/reservations/reservation';
import EmptyState from '../design-system/components/EmptyState';
import { TableSkeleton } from '../design-system/components/PremiumSkeleton';
import { enseignantAPI, groupeAPI, imprevuAPI, reservationAPI, salleAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { fetchAll } from '../utils/fetchAll';
import { aujourdhui } from '../../../shared/dates.js';

const PERIODES = ['avenir', 'passee', 'toutes'];
const minutes = (h) => {
    const [a, b] = String(h || '').slice(0, 5).split(':').map(Number);
    return a * 60 + (b || 0);
};

/**
 * Réservations de salles hors cours (phase P5), par l'administration seule (retours du 21 octobre) :
 * personne d'autre ne réserve, l'administration réserve une salle pour un événement, une réunion
 * ou une soutenance. Mêmes règles que les séances : un conflit est refusé en 409 et l'administration
 * peut forcer en justifiant. La liste s'ouvre sur les réservations à venir.
 */
export default function Reservations() {
    const { t } = useTranslation();
    const toast = useToast();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [periode, setPeriode] = useState('avenir');
    const [references, setReferences] = useState({ salles: [], enseignants: [], groupes: [] });
    const [form, setForm] = useState(null);
    const [violations, setViolations] = useState(null);
    const [refus, setRefus] = useState(null);
    const [assistant, setAssistant] = useState(false);

    const charger = useCallback(async () => {
        try {
            setReservations(await reservationAPI.getAll({}));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    useEffect(() => {
        Promise.all([fetchAll(salleAPI.getAll), fetchAll(enseignantAPI.getAll), fetchAll(groupeAPI.getAll)])
            .then(([salles, enseignants, groupes]) => setReferences({ salles, enseignants, groupes }))
            .catch(() => {});
    }, []);

    // À venir : sans les réservations annulées ou refusées ; Passées et Toutes : tout, pour l'historique
    const affichees = useMemo(() => {
        const jour = aujourdhui();
        if (periode === 'toutes') return reservations;
        return reservations.filter((r) => periodeDe(r, jour) === periode && (periode === 'passee' || !['annulee', 'refusee'].includes(r.statut)));
    }, [reservations, periode]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const corps = (f, extra = {}) => ({
        type: f.type,
        titre: f.titre.trim(),
        description: f.description.trim() || null,
        date: f.date,
        heure_debut: f.heure_debut,
        heure_fin: f.heure_fin,
        id_salle: f.id_salle || null,
        participants: [
            ...f.personnes.map((e) => ({ id_user: e.id_user, role: f.type === 'soutenance' ? 'jury' : 'participant' })),
            ...f.groupes.map((g) => ({ id_groupe: g.id_groupe, role: 'etudiant' })),
        ],
        ...extra,
    });

    const enregistrer = async (extra = {}) => {
        try {
            await reservationAPI.create(corps(form, extra));
            toast.success(t('resa.saved'));
            setForm(null);
            setViolations(null);
            charger();
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, forcer: (justification) => enregistrer({ forcer: true, justification }) });
                return;
            }
            erreur(error);
        }
    };

    const valider = async (r, extra = {}) => {
        try {
            await reservationAPI.valider(r.id_reservation, extra);
            toast.success(t('resa.validated'));
            setViolations(null);
            charger();
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, forcer: (justification) => valider(r, { forcer: true, justification }) });
                return;
            }
            erreur(error);
        }
    };

    const refuser = async () => {
        try {
            await reservationAPI.refuser(refus.reservation.id_reservation, refus.motif.trim());
            toast.success(t('resa.refused'));
            setRefus(null);
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const annuler = async (r) => {
        try {
            await reservationAPI.annuler(r.id_reservation);
            toast.success(t('resa.cancelled'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const duree = form ? Math.max(15, minutes(form.heure_fin) - minutes(form.heure_debut)) : 60;

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <ToggleButtonGroup size="small" exclusive value={periode} onChange={(_, v) => v && setPeriode(v)} aria-label={t('resa.periode')}>
                        {PERIODES.map((p) => (
                            <ToggleButton key={p} value={p}>
                                {t(`resa.periodes.${p}`)}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setForm({ ...RESERVATION_VIDE })}>
                        {t('resa.add')}
                    </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                    {t('resa.introAdmin')}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={6} />
                ) : affichees.length === 0 ? (
                    <EmptyState title={t('resa.emptyTitle')} description={t('resa.emptyBody')} actionLabel={t('resa.add')} onAction={() => setForm({ ...RESERVATION_VIDE })} />
                ) : (
                    <TableReservations reservations={affichees} onValider={valider} onRefuser={(r) => setRefus({ reservation: r, motif: '' })} onAnnuler={annuler} />
                )}
            </Paper>

            <ReservationDialog form={form} setForm={setForm} references={references} onClose={() => setForm(null)} onEnregistrer={() => enregistrer()} onTrouverCreneau={() => setAssistant(true)} />

            <AssistantCreneauxDialog
                open={assistant}
                titre={t('resa.findSlot')}
                sousTitre={t('resa.findSlotHelp', { minutes: duree })}
                onClose={() => setAssistant(false)}
                chercher={(date_debut, date_fin) =>
                    imprevuAPI.creneauxReservation({ type: form?.type, duree_minutes: duree, date_debut, date_fin, id_salle: form?.id_salle || null, participants: corps(form).participants })
                }
                onChoisir={(p) => {
                    setForm((f) => ({ ...f, date: p.date, heure_debut: p.heure_debut, heure_fin: p.heure_fin, id_salle: p.id_salle ?? f.id_salle }));
                    setAssistant(false);
                }}
            />

            <Dialog open={Boolean(refus)} onClose={() => setRefus(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('resa.refuseTitle')}</DialogTitle>
                <DialogContent>
                    <TextField label={t('resa.reason')} value={refus?.motif ?? ''} onChange={(e) => setRefus((r) => ({ ...r, motif: e.target.value }))} multiline minRows={2} fullWidth autoFocus sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRefus(null)}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={refuser} disabled={!refus?.motif.trim()}>
                        {t('resa.refuse')}
                    </Button>
                </DialogActions>
            </Dialog>

            <ViolationsDialog titre={t('resa.impossible')} aideForcer={t('resa.forceHelp')} violations={violations?.liste} onClose={() => setViolations(null)} onForcer={violations?.forcer} />
        </DashboardLayout>
    );
}
