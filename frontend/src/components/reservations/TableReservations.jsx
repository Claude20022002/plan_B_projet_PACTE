import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import StateChip from '../../design-system/components/StateChip';
import { ds } from '../../design-system/tokens';
import { localeEcran } from '../../utils/dates';

// Seules les exceptions portent une pastille : à valider (attente), refusée, annulée
const TON_STATUT = { demandee: 'warning', refusee: 'neutral', annulee: 'neutral' };
const hhmm = (h) => String(h || '').slice(0, 5);
const nom = (u) => (u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : '');

/**
 * Liste des réservations de salles : quand, objet, salle, participants, et les actions. Une
 * demande « à valider » ne vient plus que des anciennes données (seule l'administration réserve
 * aujourd'hui) : elle garde ses boutons Valider et Refuser.
 */
export default function TableReservations({ reservations, onValider, onRefuser, onAnnuler }) {
    const { t, i18n } = useTranslation();
    const formatDate = useMemo(() => new Intl.DateTimeFormat(localeEcran(i18n.language), { weekday: 'short', day: 'numeric', month: 'short' }), [i18n.language]);

    return (
        <TableContainer tabIndex={0} aria-label={t('nav.bookings')}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{t('resa.cols.when')}</TableCell>
                        <TableCell>{t('resa.cols.what')}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('resa.cols.room')}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('resa.cols.participants')}</TableCell>
                        <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {reservations.map((r) => (
                        <TableRow key={r.id_reservation} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                    {formatDate.format(new Date(`${r.date}T12:00:00`))}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: ds.font.board, fontVariantNumeric: 'tabular-nums' }}>
                                    {hhmm(r.heure_debut)}–{hhmm(r.heure_fin)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {r.titre}
                                    </Typography>
                                    {TON_STATUT[r.statut] && <StateChip tone={TON_STATUT[r.statut]}>{t(`resa.statuses.${r.statut}`)}</StateChip>}
                                    {r.force && <StateChip tone="warning">{t('resa.forced')}</StateChip>}
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                    {t(`resa.types.${r.type}`)}
                                    {r.demandeur ? ` · ${nom(r.demandeur)}` : ''}
                                    {r.statut === 'refusee' && r.motif_refus ? ` · ${r.motif_refus}` : ''}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{r.salle?.nom_salle ?? t('assistant.remote')}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Typography variant="body2">
                                    {[...r.participants.filter((p) => p.user).map((p) => nom(p.user)), ...r.participants.filter((p) => p.groupe).map((p) => p.groupe.nom_groupe)].join(', ') || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                {r.statut === 'demandee' && (
                                    <>
                                        <Button size="small" onClick={() => onRefuser(r)}>
                                            {t('resa.refuse')}
                                        </Button>
                                        <Button size="small" variant="contained" onClick={() => onValider(r)}>
                                            {t('resa.validate')}
                                        </Button>
                                    </>
                                )}
                                {['demandee', 'validee'].includes(r.statut) && (
                                    <Button size="small" color="error" onClick={() => onAnnuler(r)}>
                                        {t('resa.cancel')}
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
