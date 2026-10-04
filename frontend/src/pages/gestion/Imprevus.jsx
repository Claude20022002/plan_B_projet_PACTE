import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, Button, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AssistantCreneauxDialog from '../../components/planning/AssistantCreneauxDialog';
import ViolationsDialog from '../../components/planning/ViolationsDialog';
import StateChip from '../../design-system/components/StateChip';
import { affectationAPI, enseignantAPI, filiereAPI, imprevuAPI, salleAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { ds } from '../../design-system/tokens';

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const hhmm = (h) => String(h || '').slice(0, 5);
const nom = (u) => (u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : '');

/**
 * Imprévus du semestre (phase P6) : absence d'un enseignant (remplaçant ou déplacement),
 * salle hors service (relogement), journée annulée (fête lunaire confirmée ou décalée).
 * L'assistant de créneaux (I8) propose les nouveaux créneaux, déjà vérifiés par les règles.
 */
export default function Imprevus() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [onglet, setOnglet] = useState(0);
    const [ref, setRef] = useState({ enseignants: [], salles: [], filieres: [] });
    const [assistant, setAssistant] = useState(null);
    const [violations, setViolations] = useState(null);

    const formatDate = useMemo(() => new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }), [i18n.language]);

    useEffect(() => {
        Promise.all([fetchAll(enseignantAPI.getAll), fetchAll(salleAPI.getAll), fetchAll(filiereAPI.getAll)])
            .then(([enseignants, salles, filieres]) => setRef({ enseignants, salles, filieres }))
            .catch(() => toast.error(t('common.errorLoad')));
    }, [t, toast]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    /** Déplace une séance sur le créneau choisi dans l'assistant (et la réactive si elle était annulée). */
    const deplacer = async (seance, p, extra = {}, apres) => {
        try {
            await affectationAPI.update(seance.id_affectation, { date_seance: p.date, id_creneau: p.id_creneau, id_salle: p.id_salle, statut: 'planifie', ...extra });
            toast.success(t('incidents.moved'));
            setAssistant(null);
            setViolations(null);
            apres?.();
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, forcer: (justification) => deplacer(seance, p, { forcer: true, justification }, apres) });
                return;
            }
            erreur(error);
        }
    };

    const ligneSeance = (s) => (
        <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {s.cours?.nom_cours} · {s.groupe?.nom_groupe}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: ds.font.board, textTransform: 'capitalize' }}>
                {formatDate.format(new Date(`${s.date_seance}T12:00:00`))} · {hhmm(s.creneau?.heure_debut)}–{hhmm(s.creneau?.heure_fin)} · {s.salle?.nom_salle ?? t('assistant.remote')} · {nom(s.enseignant)}
            </Typography>
        </Box>
    );
    const ouvrirAssistant = (seance, apres) => setAssistant({ seance, apres });

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} variant="scrollable" sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Tab label={t('incidents.tabs.absence')} />
                    <Tab label={t('incidents.tabs.room')} />
                    <Tab label={t('incidents.tabs.day')} />
                </Tabs>
                {onglet === 0 && <Absence ref_={ref} ligneSeance={ligneSeance} ouvrirAssistant={ouvrirAssistant} erreur={erreur} />}
                {onglet === 1 && <SalleHorsService ref_={ref} ligneSeance={ligneSeance} erreur={erreur} />}
                {onglet === 2 && <Journee ref_={ref} ligneSeance={ligneSeance} ouvrirAssistant={ouvrirAssistant} erreur={erreur} />}
            </Paper>

            <AssistantCreneauxDialog
                open={Boolean(assistant)}
                titre={t('incidents.findSlot')}
                sousTitre={assistant ? `${assistant.seance.cours?.nom_cours} · ${assistant.seance.groupe?.nom_groupe}` : ''}
                onClose={() => setAssistant(null)}
                chercher={(date_debut, date_fin) => imprevuAPI.creneauxSeance({ id_affectation: assistant.seance.id_affectation, date_debut, date_fin })}
                onChoisir={(p) => deplacer(assistant.seance, p, {}, assistant.apres)}
                libelleChoix={t('incidents.moveHere')}
            />
            <ViolationsDialog violations={violations?.liste} onClose={() => setViolations(null)} onForcer={violations?.forcer} />
        </DashboardLayout>
    );
}

function Absence({ ref_, ligneSeance, ouvrirAssistant, erreur }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [form, setForm] = useState({ enseignant: null, date_debut: aujourdhui(), date_fin: aujourdhui(), motif: '' });
    const [resultat, setResultat] = useState(null);
    const [choix, setChoix] = useState({});

    const declarer = async () => {
        try {
            const reponse = await imprevuAPI.declarerAbsence({ id_user: form.enseignant.id_user, date_debut: form.date_debut, date_fin: form.date_fin, motif: form.motif.trim() });
            setResultat(reponse);
            toast.success(t('incidents.absenceSaved', { count: reponse.seances.length }));
        } catch (error) {
            erreur(error);
        }
    };

    const confier = async (ligne) => {
        try {
            await imprevuAPI.remplacer(ligne.seance.id_affectation, { id_user: choix[ligne.seance.id_affectation] });
            toast.success(t('incidents.replaced'));
            setResultat((r) => ({ ...r, seances: r.seances.filter((x) => x.seance.id_affectation !== ligne.seance.id_affectation) }));
        } catch (error) {
            erreur(error);
        }
    };

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
                {t('incidents.absenceIntro')}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <Autocomplete
                    sx={{ minWidth: 260 }}
                    size="small"
                    options={ref_.enseignants.filter((e) => e.user)}
                    value={form.enseignant}
                    onChange={(_, v) => setForm((f) => ({ ...f, enseignant: v }))}
                    getOptionLabel={(e) => `${e.user.nom} ${e.user.prenom}`}
                    isOptionEqualToValue={(a, b) => a.id_user === b.id_user}
                    renderInput={(params) => <TextField {...params} label={t('incidents.teacher')} />}
                />
                <TextField size="small" type="date" label={t('assistant.from')} value={form.date_debut} onChange={(e) => setForm((f) => ({ ...f, date_debut: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="date" label={t('assistant.to')} value={form.date_fin} onChange={(e) => setForm((f) => ({ ...f, date_fin: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label={t('incidents.reason')} value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} sx={{ flex: 1 }} />
                <Button variant="contained" onClick={declarer} disabled={!form.enseignant || !form.motif.trim()}>
                    {t('incidents.declare')}
                </Button>
            </Stack>
            {resultat && (
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                    {resultat.seances.length === 0 && (
                        <Typography variant="body2" sx={{ py: 1.5 }}>
                            {t('incidents.noSession')}
                        </Typography>
                    )}
                    {resultat.seances.map((ligne) => (
                        <Stack key={ligne.seance.id_affectation} direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            {ligneSeance(ligne.seance)}
                            <TextField select size="small" label={t('incidents.substitute')} value={choix[ligne.seance.id_affectation] ?? ''} onChange={(e) => setChoix((c) => ({ ...c, [ligne.seance.id_affectation]: e.target.value }))} sx={{ minWidth: 240 }}>
                                {ligne.remplacants.length === 0 && <MenuItem disabled>{t('incidents.noSubstitute')}</MenuItem>}
                                {ligne.remplacants.map((r) => (
                                    <MenuItem key={r.id_user} value={r.id_user}>
                                        {r.nom} {r.prenom}
                                        {r.competent ? ` · ${t('incidents.qualified')}` : ''}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Button size="small" variant="contained" disabled={!choix[ligne.seance.id_affectation]} onClick={() => confier(ligne)}>
                                {t('incidents.assign')}
                            </Button>
                            <Button size="small" startIcon={<AutoAwesome />} onClick={() => ouvrirAssistant(ligne.seance, () => setResultat((r) => ({ ...r, seances: r.seances.filter((x) => x.seance.id_affectation !== ligne.seance.id_affectation) })))}>
                                {t('incidents.move')}
                            </Button>
                        </Stack>
                    ))}
                </Box>
            )}
        </>
    );
}

function SalleHorsService({ ref_, ligneSeance, erreur }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [form, setForm] = useState({ id_salle: '', date_debut: aujourdhui(), date_fin: aujourdhui() });
    const [resultat, setResultat] = useState(null);

    const lancer = async (appliquer) => {
        try {
            const reponse = await imprevuAPI.reloger(form.id_salle, { date_debut: form.date_debut, date_fin: form.date_fin, appliquer });
            setResultat(reponse);
            if (appliquer) toast.success(t('incidents.relocated', { count: reponse.seances.filter((s) => s.deplacee).length }));
        } catch (error) {
            erreur(error);
        }
    };

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
                {t('incidents.roomIntro')}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <TextField select size="small" label={t('incidents.room')} value={form.id_salle} onChange={(e) => setForm((f) => ({ ...f, id_salle: e.target.value }))} sx={{ minWidth: 240 }}>
                    {ref_.salles.map((s) => (
                        <MenuItem key={s.id_salle} value={s.id_salle}>
                            {s.nom_salle} · {s.type_salle}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField size="small" type="date" label={t('assistant.from')} value={form.date_debut} onChange={(e) => setForm((f) => ({ ...f, date_debut: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="date" label={t('assistant.to')} value={form.date_fin} onChange={(e) => setForm((f) => ({ ...f, date_fin: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <Button variant="outlined" onClick={() => lancer(false)} disabled={!form.id_salle}>
                    {t('incidents.preview')}
                </Button>
                <Button variant="contained" onClick={() => lancer(true)} disabled={!resultat || resultat.seances.every((s) => !s.salle_proposee || s.deplacee)}>
                    {t('incidents.apply')}
                </Button>
            </Stack>
            {resultat && (
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                    {resultat.seances.length === 0 && (
                        <Typography variant="body2" sx={{ py: 1.5 }}>
                            {t('incidents.noSession')}
                        </Typography>
                    )}
                    {resultat.seances.map((ligne) => (
                        <Stack key={ligne.seance.id_affectation} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            {ligneSeance(ligne.seance)}
                            {ligne.salle_proposee ? (
                                <Typography variant="body2" sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>
                                    → {ligne.salle_proposee.nom_salle}
                                </Typography>
                            ) : (
                                <StateChip tone="warning">{t('incidents.noRoom')}</StateChip>
                            )}
                            {ligne.deplacee && <StateChip tone="success">{t('incidents.done')}</StateChip>}
                        </Stack>
                    ))}
                </Box>
            )}
        </>
    );
}

function Journee({ ref_, ligneSeance, ouvrirAssistant, erreur }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [form, setForm] = useState({ date: aujourdhui(), id_filiere: '', motif: '' });
    const [seances, setSeances] = useState(null);
    const [annulees, setAnnulees] = useState([]);

    const charger = async () => {
        try {
            setSeances(await imprevuAPI.jour(form.date, { id_filiere: form.id_filiere }));
            setAnnulees([]);
        } catch (error) {
            erreur(error);
        }
    };

    const annuler = async () => {
        try {
            const reponse = await imprevuAPI.annulerJour(form.date, { motif: form.motif.trim(), id_filiere: form.id_filiere || null });
            toast.success(t('incidents.dayCancelled', { count: reponse.annulees.length }));
            setAnnulees(seances.filter((s) => reponse.annulees.includes(s.id_affectation)));
            setSeances([]);
        } catch (error) {
            erreur(error);
        }
    };

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
                {t('incidents.dayIntro')}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <TextField size="small" type="date" label={t('incidents.date')} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <TextField select size="small" label={t('ref.curriculum.program')} value={form.id_filiere} onChange={(e) => setForm((f) => ({ ...f, id_filiere: e.target.value }))} sx={{ minWidth: 200 }} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
                    <MenuItem value="">{t('ref.curriculum.allPrograms')}</MenuItem>
                    {ref_.filieres.map((f) => (
                        <MenuItem key={f.id_filiere} value={f.id_filiere}>
                            {f.code_filiere}
                        </MenuItem>
                    ))}
                </TextField>
                <Button variant="outlined" onClick={charger}>
                    {t('incidents.show')}
                </Button>
            </Stack>
            {seances && seances.length > 0 && (
                <>
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 2 }}>
                        {seances.map((s) => (
                            <Box key={s.id_affectation} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                {ligneSeance(s)}
                            </Box>
                        ))}
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField size="small" label={t('incidents.reason')} value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} sx={{ flex: 1 }} placeholder={t('incidents.reasonExample')} />
                        <Button variant="contained" color="error" onClick={annuler} disabled={!form.motif.trim()}>
                            {t('incidents.cancelDay', { count: seances.length })}
                        </Button>
                    </Stack>
                </>
            )}
            {seances && seances.length === 0 && annulees.length === 0 && (
                <Typography variant="body2" sx={{ py: 1 }}>
                    {t('incidents.noSession')}
                </Typography>
            )}
            {annulees.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                        {t('incidents.toMakeUp')}
                    </Typography>
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}>
                        {annulees.map((s) => (
                            <Stack key={s.id_affectation} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                {ligneSeance(s)}
                                <Button size="small" startIcon={<AutoAwesome />} onClick={() => ouvrirAssistant(s, () => setAnnulees((a) => a.filter((x) => x.id_affectation !== s.id_affectation)))}>
                                    {t('incidents.makeUp')}
                                </Button>
                            </Stack>
                        ))}
                    </Box>
                </Box>
            )}
        </>
    );
}
