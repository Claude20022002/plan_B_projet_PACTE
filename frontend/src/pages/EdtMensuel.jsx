import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Autocomplete, Box, Button, GlobalStyles, Paper, Stack, TextField, Typography } from '@mui/material';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Print, Send } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import EmptyState from '../design-system/components/EmptyState';
import { TableSkeleton } from '../design-system/components/PremiumSkeleton';
import { agendaAPI, appartenanceAPI, groupeAPI, preparationAPI } from '../services/api';
import { estResponsable } from '../utils/droits';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchAll } from '../utils/fetchAll';

// Couleurs du document officiel (EDT HESTIM) : hors du style « panneau », réservé à l'impression
const DOC = { rouge: '#C00000', marine: '#001861', orange: '#F8CBAD', orangeTexte: '#843C0C', vide: '#F2F2F2', evenement: '#DDEBF7', bord: '#7F7F7F' };
const moisCourant = () => new Date().toISOString().slice(0, 7);
const heure = (h) => h.replace(':', 'h');

/** Feuille d'impression : seul le document s'imprime, en A4 portrait. */
const styleImpression = (
    <GlobalStyles
        styles={{
            '@media print': {
                '@page': { size: 'A4 portrait', margin: '8mm' },
                'body *': { visibility: 'hidden' },
                '.edt-document, .edt-document *': { visibility: 'visible' },
                '.edt-document': { position: 'absolute', left: 0, top: 0, width: '100%' },
            },
        }}
    />
);

const td = { border: `1px solid ${DOC.bord}`, padding: '2px 4px', fontSize: 11, lineHeight: 1.25, textAlign: 'center', verticalAlign: 'middle' };

/**
 * Emploi du temps du mois au format officiel HESTIM (phase P4) : copie de l'EDT d'octobre 2026
 * (docs/Planning). Le serveur calcule fusions, (P.S)/(D.S) et blocs ; la page ne fait que
 * dessiner, et s'imprime (ou s'enregistre en PDF) depuis le navigateur.
 */
export default function EdtMensuel() {
    const { t } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const [groupes, setGroupes] = useState([]);
    const [idGroupe, setIdGroupe] = useState(params.get('groupe') ? Number(params.get('groupe')) : null);
    const [mois, setMois] = useState(params.get('mois') || moisCourant());
    const [edt, setEdt] = useState(null);
    const [loading, setLoading] = useState(false);
    const etudiant = user?.role === 'etudiant';
    // Publier et envoyer le mois (R4) : administration ou responsable de filière
    const peutPublier = user?.role === 'admin' || estResponsable(user);
    const [envoi, setEnvoi] = useState(null); // { publie, dernier_envoi, destinataires }
    const [confirmer, setConfirmer] = useState(false);
    const [publication, setPublication] = useState(false);
    const groupe = groupes.find((g) => g.id_groupe === idGroupe) ?? null;

    useEffect(() => {
        if (etudiant) {
            appartenanceAPI
                .getByEtudiant(user.id_user)
                .then((a) => setIdGroupe((g) => g ?? a.id_groupe))
                .catch(() => toast.error(t('monthly.noGroup')));
        } else {
            fetchAll(groupeAPI.getAll).then(setGroupes).catch(() => {});
        }
    }, [etudiant, user?.id_user, t, toast]);

    useEffect(() => {
        if (!idGroupe || !mois) return;
        setParams({ groupe: String(idGroupe), mois }, { replace: true });
        setLoading(true);
        preparationAPI
            .edtMensuel(idGroupe, mois)
            .then(setEdt)
            .catch((error) => toast.error(error.response?.data?.error || error.message))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idGroupe, mois]);

    useEffect(() => {
        if (!peutPublier || !groupe?.id_filiere || !mois) return undefined;
        let actif = true;
        agendaAPI.etatEdt(mois, groupe.id_filiere).then((e) => actif && setEnvoi(e)).catch(() => actif && setEnvoi(null));
        return () => {
            actif = false;
        };
    }, [peutPublier, groupe?.id_filiere, mois]);

    const publier = async () => {
        setConfirmer(false);
        setPublication(true);
        try {
            const bilan = await agendaAPI.publierEdt(mois, groupe.id_filiere);
            toast.success(t('monthly.envoi.bilan', { envoye: bilan.envoye, modifie: bilan.modifie, inchange: bilan.inchange }));
            setEnvoi(await agendaAPI.etatEdt(mois, groupe.id_filiere));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setPublication(false);
        }
    };

    const nbMatin = edt?.grille.matin.length ?? 0;
    const nbApres = edt?.grille.apres_midi.length ?? 0;

    /** Cellules d'une demi-journée pour la ligne `ligne` (0 matière, 1 enseignant, 2 salle). */
    const cellules = (items, total, ligne) => {
        const sortie = [];
        let couverts = 0;
        items.forEach((c, i) => {
            const span = c.rangs.length;
            couverts += span;
            if (c.type !== 'seance') {
                if (ligne === 0) {
                    sortie.push(
                        <td key={i} colSpan={span} rowSpan={3} style={{ ...td, background: c.type === 'evenement' ? DOC.evenement : DOC.vide, fontWeight: c.type === 'evenement' ? 700 : 400 }}>
                            {c.type === 'evenement' ? c.titre : ''}
                        </td>
                    );
                }
                return;
            }
            if (ligne === 0) {
                sortie.push(
                    <td key={i} colSpan={span} style={{ ...td, fontWeight: 700 }}>
                        {c.matiere}
                        {c.premiere_seance && <span style={{ color: DOC.rouge }}> (P.S)</span>}
                        {c.derniere_seance && <span style={{ color: DOC.rouge }}> (D.S)</span>}
                        {c.horaire_rappel && <div style={{ fontWeight: 400 }}>{c.horaire_rappel}</div>}
                    </td>
                );
            } else if (ligne === 1) {
                sortie.push(
                    <td key={i} colSpan={span} style={{ ...td, color: DOC.rouge, fontWeight: 600 }}>
                        {c.distanciel && c.mention ? c.mention : c.enseignants}
                    </td>
                );
            } else {
                sortie.push(
                    <td key={i} colSpan={span} style={{ ...td, ...(c.distanciel ? { background: DOC.orange, color: DOC.orangeTexte, fontWeight: 700 } : {}) }}>
                        {c.distanciel ? (
                            t('monthly.remote')
                        ) : (
                            <>
                                <div style={{ fontWeight: 600 }}>{c.salle.campus} :</div>
                                <div>{c.salle.detail}</div>
                            </>
                        )}
                    </td>
                );
            }
        });
        // Demi-journée sans cours dans la grille ce jour-là (samedi après-midi) : case grisée
        if (ligne === 0 && couverts < total) sortie.push(<td key="vide" colSpan={total - couverts} rowSpan={3} style={{ ...td, background: DOC.vide }} />);
        return sortie;
    };

    return (
        <DashboardLayout>
            {styleImpression}
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                    {!etudiant && (
                        <Autocomplete
                            sx={{ minWidth: 260 }}
                            size="small"
                            options={groupes}
                            value={groupes.find((g) => g.id_groupe === idGroupe) ?? null}
                            onChange={(_, v) => setIdGroupe(v?.id_groupe ?? null)}
                            getOptionLabel={(g) => g.nom_groupe}
                            isOptionEqualToValue={(a, b) => a.id_groupe === b.id_groupe}
                            renderInput={(p) => <TextField {...p} label={t('monthly.group')} />}
                        />
                    )}
                    <TextField type="month" size="small" label={t('tracking.month')} value={mois} onChange={(e) => setMois(e.target.value)} InputLabelProps={{ shrink: true }} />
                    <Box sx={{ flex: 1 }} />
                    {peutPublier && groupe && (
                        <Button variant="outlined" startIcon={<Send />} onClick={() => setConfirmer(true)} disabled={!edt || publication}>
                            {envoi?.publie ? t('monthly.envoi.renvoyer') : t('monthly.envoi.publier')}
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} disabled={!edt}>
                        {t('monthly.print')}
                    </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('monthly.help')}
                </Typography>
                {peutPublier && groupe && envoi && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color={envoi.publie ? 'success.main' : 'text.secondary'}>
                        {envoi.publie
                            ? t('monthly.envoi.etatPublie', { date: new Date(envoi.dernier_envoi).toLocaleString(), count: envoi.destinataires })
                            : t('monthly.envoi.etatNonPublie')}
                    </Typography>
                )}
                <ConfirmDialog
                    open={confirmer}
                    title={t('monthly.envoi.confirmerTitre')}
                    message={t('monthly.envoi.confirmerMessage', { filiere: groupe?.filiere?.code_filiere ?? groupe?.nom_groupe ?? '' })}
                    confirmLabel={t('monthly.envoi.publier')}
                    confirmColor="primary"
                    onConfirm={publier}
                    onCancel={() => setConfirmer(false)}
                />
            </Paper>

            {loading ? (
                <TableSkeleton rows={8} />
            ) : !edt ? (
                <EmptyState title={t('monthly.emptyTitle')} description={t('monthly.emptyBody')} />
            ) : (
                <Box className="edt-document" sx={{ bgcolor: '#FFFFFF', color: '#000000', p: { xs: 1, md: 2 }, overflowX: 'auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <img src="/HESTIM.png" alt="HESTIM" style={{ height: 42 }} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>
                            {t('monthly.year')} : {edt.entete.annee_universitaire ?? '—'}
                        </span>
                    </Box>
                    <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700 }}>{t('monthly.title')}</div>
                    <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: DOC.rouge }}>{edt.entete.intitule_classe}</div>
                    <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: DOC.marine, marginBottom: 8 }}>{edt.entete.code_classe}</div>

                    <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', minWidth: 760 }}>
                        <colgroup>
                            <col style={{ width: 70 }} />
                            <col style={{ width: 80 }} />
                            <col style={{ width: 62 }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...td, background: DOC.vide }}>{t('monthly.week')}</th>
                                <th rowSpan={2} style={{ ...td, background: DOC.vide }}>{t('monthly.days')}</th>
                                <th rowSpan={2} style={{ ...td, background: DOC.vide }}>M/E/S</th>
                                <th colSpan={nbMatin} style={{ ...td, background: DOC.vide }}>{t('monthly.morning')}</th>
                                <th colSpan={nbApres} style={{ ...td, background: DOC.vide }}>{t('monthly.afternoon')}</th>
                            </tr>
                            <tr>
                                {[...edt.grille.matin, ...edt.grille.apres_midi].map((r) => (
                                    <th key={r.rang} style={{ ...td, background: DOC.vide }}>
                                        {heure(r.heure_debut)}-{heure(r.heure_fin)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {edt.semaines.map((semaine) =>
                                semaine.jours.map((jour, j) => (
                                    <Fragment key={jour.date}>
                                        <tr>
                                            {j === 0 && (
                                                <td rowSpan={semaine.jours.length * 3} style={{ ...td, fontWeight: 700, background: DOC.vide }}>
                                                    {semaine.libelle}
                                                </td>
                                            )}
                                            <td rowSpan={3} style={{ ...td, fontWeight: 600 }}>
                                                {jour.libelle}
                                            </td>
                                            <td style={td}>{t('monthly.subject')}</td>
                                            {cellules(jour.matin, nbMatin, 0)}
                                            {cellules(jour.apres_midi, nbApres, 0)}
                                        </tr>
                                        <tr>
                                            <td style={td}>{t('monthly.teacher')}</td>
                                            {cellules(jour.matin, nbMatin, 1)}
                                            {cellules(jour.apres_midi, nbApres, 1)}
                                        </tr>
                                        <tr>
                                            <td style={td}>{t('monthly.room')}</td>
                                            {cellules(jour.matin, nbMatin, 2)}
                                            {cellules(jour.apres_midi, nbApres, 2)}
                                        </tr>
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div style={{ marginTop: 6, fontSize: 11, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {edt.pied.vendredi && <strong>{edt.pied.vendredi}</strong>}
                        {edt.pied.legende.map((l) => (
                            <span key={l}>{l}</span>
                        ))}
                    </div>
                </Box>
            )}
        </DashboardLayout>
    );
}
