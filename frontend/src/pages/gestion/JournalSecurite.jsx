import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, MenuItem, Pagination, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Close, GppMaybeOutlined, ShieldOutlined } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EmptyState from '../../design-system/components/EmptyState';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { journalSecuriteAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';

const PAR_PAGE = 50;
// Événements qui demandent l'attention : blocage, vol de session probable, droits changés
const ALERTES = new Set(['mfa_bloque', 'refresh_reutilise', 'mfa_reinitialisee', 'compte_modifie', 'compte_supprime', 'mot_de_passe_reinitialise_admin']);
const ECHECS = new Set(['connexion_echec', 'mfa_echec', 'connexion_compte_desactive']);

/**
 * Journal de sécurité (administration) : connexions, double authentification, mots de passe,
 * sessions et comptes, du plus récent au plus ancien. Lecture seule. Un clic sur un compte
 * n'affiche que ses événements.
 */
export default function JournalSecurite() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [types, setTypes] = useState([]);
    const [filtres, setFiltres] = useState({ evenement: '', du: '', au: '', compte: null });
    const [page, setPage] = useState(1);
    const [resultat, setResultat] = useState({ total: 0, evenements: [] });
    const [loading, setLoading] = useState(true);

    const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';
    const dateHeure = (valeur) => new Date(valeur).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'medium' });

    useEffect(() => {
        journalSecuriteAPI.evenements().then(setTypes).catch(() => setTypes([]));
    }, []);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const { evenement, du, au, compte } = filtres;
            setResultat(await journalSecuriteAPI.lister({ evenement, du, au, id_user: compte?.id_user, page, par_page: PAR_PAGE }));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [filtres, page, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    // Un filtre change : retour à la première page
    const filtrer = (changement) => {
        setFiltres((f) => ({ ...f, ...changement }));
        setPage(1);
    };

    const libelleValeur = (champ, valeur) => {
        if (champ === 'role') return t(`roles.${valeur}`, { defaultValue: String(valeur) });
        if (champ === 'actif') return t(valeur ? 'journalSecurite.actif' : 'journalSecurite.inactif');
        return String(valeur);
    };

    // Détails lisibles : « Rôle : Étudiant → Enseignant », « 12 créés, 1 erreur »…
    const details = (e) => {
        const d = e.details;
        if (!d) return null;
        if (e.evenement === 'compte_modifie') {
            return Object.entries(d)
                .map(([champ, { avant, apres }]) => `${t(`journalSecurite.champs.${champ}`)} : ${libelleValeur(champ, avant)} → ${libelleValeur(champ, apres)}`)
                .join(' · ');
        }
        if (e.evenement === 'comptes_importes') return t('journalSecurite.import', { crees: d.crees, erreurs: d.erreurs });
        if (d.role) return t(`roles.${d.role}`, { defaultValue: d.role });
        if (e.evenement === 'connexion_reussie') return [d.mobile ? t('journalSecurite.mobile') : t('journalSecurite.web'), d.mfa ? t('journalSecurite.avecMfa') : null].filter(Boolean).join(' · ');
        return null;
    };

    const nbPages = Math.max(1, Math.ceil(resultat.total / PAR_PAGE));

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                    <TextField select size="small" label={t('journalSecurite.evenement')} value={filtres.evenement} onChange={(e) => filtrer({ evenement: e.target.value })} sx={{ minWidth: 260 }}>
                        <MenuItem value="">{t('journalSecurite.tous')}</MenuItem>
                        {types.map((type) => (
                            <MenuItem key={type} value={type}>
                                {t(`journalSecurite.evenements.${type}`, { defaultValue: type })}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField type="date" size="small" label={t('journalSecurite.du')} value={filtres.du} onChange={(e) => filtrer({ du: e.target.value })} InputLabelProps={{ shrink: true }} />
                    <TextField type="date" size="small" label={t('journalSecurite.au')} value={filtres.au} onChange={(e) => filtrer({ au: e.target.value })} InputLabelProps={{ shrink: true }} />
                    {filtres.compte && (
                        <Chip label={t('journalSecurite.compteFiltre', { compte: filtres.compte.email ?? `#${filtres.compte.id_user}` })} onDelete={() => filtrer({ compte: null })} deleteIcon={<Close />} />
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: { md: 'auto' } }}>
                        {t('journalSecurite.total', { count: resultat.total })}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                    {t('journalSecurite.intro')}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={8} />
                ) : resultat.evenements.length === 0 ? (
                    <EmptyState title={t('journalSecurite.videTitre')} description={t('journalSecurite.videTexte')} />
                ) : (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.xs}px` }}>
                        {resultat.evenements.map((e, i) => {
                            const alerte = ALERTES.has(e.evenement);
                            const echec = ECHECS.has(e.evenement);
                            const texteDetails = details(e);
                            return (
                                <Stack
                                    key={e.id_evenement}
                                    direction={{ xs: 'column', md: 'row' }}
                                    spacing={{ xs: 0.5, md: 1.5 }}
                                    alignItems={{ md: 'center' }}
                                    sx={{ px: 1.5, py: 1, borderBottom: i < resultat.evenements.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
                                >
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150, fontVariantNumeric: 'tabular-nums' }}>
                                        {dateHeure(e.createdAt)}
                                    </Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {alerte ? (
                                                <GppMaybeOutlined fontSize="small" sx={{ color: 'warning.main' }} />
                                            ) : (
                                                <ShieldOutlined fontSize="small" sx={{ color: echec ? 'error.main' : 'text.disabled' }} />
                                            )}
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: echec ? 'error.main' : 'text.primary' }}>
                                                {t(`journalSecurite.evenements.${e.evenement}`, { defaultValue: e.evenement })}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                                            {e.email || e.id_user ? (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    sx={{ p: 0, minWidth: 0, textTransform: 'none', verticalAlign: 'baseline' }}
                                                    disabled={!e.id_user}
                                                    onClick={() => filtrer({ compte: { id_user: e.id_user, email: e.email } })}
                                                >
                                                    {e.email ?? `#${e.id_user}`}
                                                </Button>
                                            ) : (
                                                '-'
                                            )}
                                            {e.acteur && (
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    {' '}
                                                    {t('journalSecurite.par', { nom: `${e.acteur.prenom} ${e.acteur.nom}` })}
                                                </Typography>
                                            )}
                                        </Typography>
                                        {texteDetails && (
                                            <Typography variant="caption" color="text.secondary">
                                                {texteDetails}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Tooltip title={e.user_agent ?? ''} placement="left">
                                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: { md: 140 }, textAlign: { md: 'right' }, fontVariantNumeric: 'tabular-nums' }}>
                                            {e.ip ?? '-'}
                                        </Typography>
                                    </Tooltip>
                                </Stack>
                            );
                        })}
                    </Box>
                )}

                {nbPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination count={nbPages} page={page} onChange={(_, p) => setPage(p)} size="small" />
                    </Box>
                )}
            </Paper>
        </DashboardLayout>
    );
}
