import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import StateChip from '../../design-system/components/StateChip';
import { ds } from '../../design-system/tokens';
import { aujourdhui, dansJours } from '../../../../shared/dates.js';
import { cleProposition } from './cleProposition';
import { localeEcran } from '../../utils/dates';

/**
 * Recherche de créneaux libres (innovation I8), sans fenêtre : une plage de dates, puis les
 * créneaux libres (`chercher(date_debut, date_fin)` → { propositions, refus }), chacun avec son
 * bouton. Chaque proposition a déjà passé les règles de planification ; les créneaux écartés sont
 * résumés par raison pour expliquer le résultat. La recherche part dès l'affichage.
 * `choisi` : clé de la proposition retenue (cleProposition), mise en avant dans la liste.
 */
export default function RechercheCreneaux({ chercher, onChoisir, libelleChoix, libelleChoisi, choisi = null, plageInitiale = null }) {
    const { t, i18n } = useTranslation();
    const [plage, setPlage] = useState(plageInitiale ?? { debut: aujourdhui(), fin: dansJours(14) });
    const [resultat, setResultat] = useState(null);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState('');
    const [choix, setChoix] = useState(null);

    const formatDate = useMemo(() => new Intl.DateTimeFormat(localeEcran(i18n.language), { weekday: 'long', day: 'numeric', month: 'long' }), [i18n.language]);

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
        lancer();
        // Une seule recherche à l'affichage ; les suivantes partent du bouton « Chercher »
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const choisir = async (proposition) => {
        setChoix(proposition);
        try {
            await onChoisir(proposition);
        } finally {
            setChoix(null);
        }
    };

    return (
        <Box>
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
                        <Box component="ul" aria-label={t('assistant.list')} sx={{ listStyle: 'none', m: 0, p: 0, borderTop: '1px solid', borderColor: 'divider', mb: 2 }}>
                            {resultat.propositions.map((p) => {
                                const retenue = choisi === cleProposition(p);
                                const jour = formatDate.format(new Date(`${p.date}T12:00:00`));
                                return (
                                    <Stack component="li" key={cleProposition(p)} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                                {jour}
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
                                        <Button
                                            size="small"
                                            variant={retenue ? 'outlined' : 'contained'}
                                            onClick={() => choisir(p)}
                                            disabled={Boolean(choix) || retenue}
                                            aria-label={`${retenue ? (libelleChoisi ?? t('assistant.chosen')) : (libelleChoix ?? t('assistant.choose'))} : ${jour}, ${p.heure_debut}`}
                                        >
                                            {retenue ? (libelleChoisi ?? t('assistant.chosen')) : (libelleChoix ?? t('assistant.choose'))}
                                        </Button>
                                    </Stack>
                                );
                            })}
                        </Box>
                    )}
                    {resultat.refus.length > 0 && (
                        <Typography variant="caption" color="text.secondary" component="div">
                            {t('assistant.excluded')} {resultat.refus.map((r) => `${t(`assistant.reasons.${r.code}`, { defaultValue: t(`rules.codes.${r.code}`, { defaultValue: r.libelle }) })} (${r.nombre})`).join(' · ')}
                        </Typography>
                    )}
                </>
            )}
        </Box>
    );
}
