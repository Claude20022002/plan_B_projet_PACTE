import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import StateChip from '../../design-system/components/StateChip';
import { ds } from '../../design-system/tokens';

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const dansJours = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
};

/**
 * Assistant de créneaux (innovation I8) : cherche des créneaux libres sur une plage de dates
 * (`chercher(date_debut, date_fin)` → { propositions, refus }) et laisse choisir l'un d'eux.
 * Chaque proposition a déjà passé les règles de planification ; les créneaux écartés sont
 * résumés par raison pour expliquer le résultat.
 */
export default function AssistantCreneauxDialog({ open, titre, sousTitre, onClose, chercher, onChoisir, libelleChoix }) {
    const { t, i18n } = useTranslation();
    const [plage, setPlage] = useState({ debut: aujourdhui(), fin: dansJours(14) });
    const [resultat, setResultat] = useState(null);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState('');
    const [choix, setChoix] = useState(null);

    const formatDate = useMemo(() => new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), [i18n.language]);

    const lancer = async () => {
        setChargement(true);
        setErreur('');
        try {
            setResultat(await chercher(plage.debut, plage.fin));
        } catch (error) {
            setErreur(error.response?.data?.error || error.message);
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        if (open) {
            setResultat(null);
            setErreur('');
            lancer();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const choisir = async (proposition) => {
        setChoix(proposition);
        try {
            await onChoisir(proposition);
        } finally {
            setChoix(null);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {titre}
                {sousTitre && (
                    <Typography variant="body2" color="text.secondary">
                        {sousTitre}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('assistant.intro')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
                    <TextField type="date" size="small" label={t('assistant.from')} value={plage.debut} onChange={(e) => setPlage((p) => ({ ...p, debut: e.target.value }))} InputLabelProps={{ shrink: true }} />
                    <TextField type="date" size="small" label={t('assistant.to')} value={plage.fin} onChange={(e) => setPlage((p) => ({ ...p, fin: e.target.value }))} InputLabelProps={{ shrink: true }} inputProps={{ min: plage.debut }} />
                    <Button variant="outlined" onClick={lancer} disabled={chargement}>
                        {t('assistant.search')}
                    </Button>
                </Stack>

                {chargement && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={28} />
                    </Box>
                )}
                {erreur && (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        {erreur}
                    </Typography>
                )}
                {resultat && !chargement && (
                    <>
                        {resultat.propositions.length === 0 ? (
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                {t('assistant.none')}
                            </Typography>
                        ) : (
                            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 2 }}>
                                {resultat.propositions.map((p) => (
                                    <Stack key={`${p.date}-${p.heure_debut}-${p.id_salle}`} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                                {formatDate.format(new Date(`${p.date}T12:00:00`))}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: ds.font.board, fontVariantNumeric: 'tabular-nums' }}>
                                                {p.heure_debut}–{p.heure_fin} · {p.nom_salle ?? t('assistant.remote')}
                                            </Typography>
                                        </Box>
                                        {p.avertissements?.length > 0 && (
                                            <StateChip tone="warning" title={p.avertissements.map((a) => a.message).join(' · ')}>
                                                {t('rules.warningsCount', { count: p.avertissements.length })}
                                            </StateChip>
                                        )}
                                        <Button size="small" variant="contained" onClick={() => choisir(p)} disabled={Boolean(choix)}>
                                            {libelleChoix ?? t('assistant.choose')}
                                        </Button>
                                    </Stack>
                                ))}
                            </Box>
                        )}
                        {resultat.refus.length > 0 && (
                            <Typography variant="caption" color="text.secondary" component="div">
                                {t('assistant.excluded')} {resultat.refus.map((r) => `${t(`assistant.reasons.${r.code}`, { defaultValue: t(`rules.codes.${r.code}`, { defaultValue: r.libelle }) })} (${r.nombre})`).join(' · ')}
                            </Typography>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
