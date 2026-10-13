import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Collapse, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Add, Delete, Edit, KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import StateChip from '../../design-system/components/StateChip';
import { ds, lineColor } from '../../design-system/tokens';
import { TYPES } from './constantes';
import { libelleSeance, rythme, volumeTotal } from './formatage';

/** Une ligne de la maquette : le module, et dessous ses composantes quand on le déplie. */
export default function LigneModule({ module, ouvert, nombre, nomEnseignant, onBasculer, onModifier, onSupprimer, onAjouterComposante, onModifierComposante, onSupprimerComposante }) {
    const { t } = useTranslation();
    return (
        <Fragment>
            <TableRow hover sx={{ '& > td': { borderBottom: ouvert ? 0 : undefined } }}>
                <TableCell sx={{ px: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => onBasculer()}
                        aria-expanded={ouvert}
                        aria-label={t(ouvert ? 'ref.curriculum.collapse' : 'ref.curriculum.expand', { name: module.nom_cours })}
                    >
                        {ouvert ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Box component="span" aria-hidden sx={{ width: 9, height: 9, borderRadius: '2px', flexShrink: 0, bgcolor: lineColor(module.id_filiere) }} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {module.nom_cours}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {module.code_cours} · {module.niveau}
                            </Typography>
                        </Box>
                    </Stack>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{module.filiere?.code_filiere}</TableCell>
                <TableCell sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>{module.semestre}</TableCell>
                <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {module.composantes.map((c) => `${c.type} ${nombre.format(c.volume_heures)} h`).join(' · ') || '-'}
                    </Typography>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{nombre.format(volumeTotal(module))} h</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{module.ects ?? '-'}</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{module.id_responsable ? nomEnseignant(module.id_responsable) : '-'}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" onClick={() => onModifier()} aria-label={t('ref.common.editItem', { name: module.nom_cours })}>
                        <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onSupprimer()} aria-label={t('ref.common.deleteItem', { name: module.nom_cours })}>
                        <Delete fontSize="small" />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={9} sx={{ py: 0, px: { xs: 0.5, md: 2 }, borderBottom: ouvert ? undefined : 0 }}>
                    <Collapse in={ouvert} timeout="auto" unmountOnExit>
                        <Box sx={{ pl: { md: 5 }, pb: 2, pt: 0.5 }}>
                            <Table size="small" aria-label={t('ref.curriculum.componentsOf', { name: module.nom_cours })}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('ref.curriculum.compCols.type')}</TableCell>
                                        <TableCell align="right">{t('ref.curriculum.compCols.volume')}</TableCell>
                                        <TableCell>{t('ref.curriculum.compCols.group')}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.curriculum.compCols.session')}</TableCell>
                                        <TableCell>{t('ref.curriculum.compCols.mode')}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.curriculum.compCols.room')}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.curriculum.compCols.rhythm')}</TableCell>
                                        <TableCell align="right" />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {module.composantes.map((c) => (
                                        <TableRow key={c.id_composante}>
                                            <TableCell sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>{c.type}</TableCell>
                                            <TableCell align="right">{nombre.format(c.volume_heures)} h</TableCell>
                                            <TableCell>{t(`ref.groupTypes.${c.niveau_groupe}`)}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{libelleSeance(t, c.creneaux_par_seance)}</TableCell>
                                            <TableCell>
                                                {c.modalite === 'presentiel' ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('ref.modes.presentiel')}
                                                    </Typography>
                                                ) : (
                                                    <StateChip tone="info" title={c.mention || undefined}>
                                                        {t(`ref.modes.${c.modalite}`)}
                                                    </StateChip>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                {c.type_salle_requis ? t(`ref.roomTypes.${c.type_salle_requis}`, { defaultValue: c.type_salle_requis }) : '-'}
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{rythme(t, c)}</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                <IconButton size="small" onClick={() => onModifierComposante(c)} aria-label={t('ref.common.editItem', { name: `${module.nom_cours} ${c.type}` })}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => onSupprimerComposante(c)} aria-label={t('ref.common.deleteItem', { name: `${module.nom_cours} ${c.type}` })}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {module.composantes.length < TYPES.length && (
                                <Button size="small" startIcon={<Add />} onClick={() => onAjouterComposante()} sx={{ mt: 1 }}>
                                    {t('ref.curriculum.addComponent')}
                                </Button>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
}
