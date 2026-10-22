import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { CalendarViewMonth, PlayArrow } from '@mui/icons-material';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import AttenteGeneration from './AttenteGeneration';
import ExplorerEmplois from './ExplorerEmplois';
import RapportGeneration from './RapportGeneration';
import useSuiviGeneration from './useSuiviGeneration';

const TON_STATUT = { running: 'info', completed: 'success', failed: 'danger' };

/**
 * Onglet « Générer » (R-4) : la période et les filières, rien d'autre à régler ; pendant le calcul,
 * l'écran d'attente ; à la fin, le rapport puis « Explorer les emplois du temps ».
 * `dateHeure` : Intl.DateTimeFormat de la date de la génération.
 */
export default function LancementGeneration({ dateHeure }) {
    const { t } = useTranslation();
    const { chargement, periodes, filieres, idPeriode, setIdPeriode, choisies, setChoisies, session, envoi, lancer, arreter } = useSuiviGeneration();
    // L'exploration se charge à la demande : la version d'un semestre compte des milliers de séances
    const [explorer, setExplorer] = useState(null);
    const enCours = session?.status === 'running';
    const rapport = session?.status === 'completed' ? session.config?.rapport : null;

    if (chargement) return <TableSkeleton rows={6} />;

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                {t('gen.intro')}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ md: 'flex-start' }}>
                <TextField select size="small" label={t('ref.teaching.period')} value={idPeriode} onChange={(e) => setIdPeriode(e.target.value)} sx={{ minWidth: 200 }} disabled={enCours}>
                    {periodes.map((p) => (
                        <MenuItem key={p.id_periode} value={p.id_periode}>
                            {p.libelle_annee} · {p.code}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    size="small"
                    label={t('gen.programs')}
                    value={choisies}
                    onChange={(e) => setChoisies(e.target.value)}
                    sx={{ minWidth: 260, maxWidth: { md: 420 } }}
                    disabled={enCours}
                    helperText={t('gen.programsHelp')}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                        multiple: true,
                        displayEmpty: true,
                        renderValue: (ids) => (ids.length ? filieres.filter((f) => ids.includes(f.id_filiere)).map((f) => f.code_filiere).join(', ') : t('ref.curriculum.allPrograms')),
                    }}
                >
                    {filieres.map((f) => (
                        <MenuItem key={f.id_filiere} value={f.id_filiere}>
                            {f.code_filiere} · {f.nom_filiere}
                        </MenuItem>
                    ))}
                </TextField>
                {!enCours && (
                    <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => {
                            setExplorer(null);
                            lancer();
                        }}
                        disabled={!idPeriode || envoi}
                    >
                        {t('gen.start')}
                    </Button>
                )}
            </Stack>

            {!session ? (
                <EmptyState title={t('gen.emptyTitle')} description={t('gen.emptyBody')} />
            ) : (
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2">{t('gen.lastRun', { date: dateHeure.format(new Date(session.createdAt)) })}</Typography>
                        <StateChip tone={TON_STATUT[session.status]}>{t(`gen.status.${session.status}`)}</StateChip>
                    </Stack>
                    {enCours && <AttenteGeneration session={session} onArreter={arreter} />}
                    {/* Une génération réussie se lit dans le résumé ; un échec garde le message du serveur */}
                    {session.status === 'failed' && (
                        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                            {session.last_message}
                        </Typography>
                    )}
                    {rapport && <RapportGeneration rapport={rapport} />}
                    {rapport?.id_snapshot && (
                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            {explorer === rapport.id_snapshot ? (
                                <ExplorerEmplois idSnapshot={rapport.id_snapshot} />
                            ) : (
                                <Button variant="contained" startIcon={<CalendarViewMonth />} onClick={() => setExplorer(rapport.id_snapshot)}>
                                    {t('gen.explore.open')}
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
            )}
        </>
    );
}
