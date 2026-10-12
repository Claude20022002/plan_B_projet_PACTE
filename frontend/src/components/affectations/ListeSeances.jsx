import {
    Box,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { AutoAwesome, Delete, Edit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../design-system/components/StatusBadge';
import { formatHeure } from '../../utils/session';

/** Les séances en cartes sur mobile, en tableau sinon. */
export default function ListeSeances({ affectations, mobile, onDeplacer, onModifier, onSupprimer }) {
    const { t } = useTranslation();
    if (mobile) {
        return (
            <Stack spacing={1.25}>
                {affectations.map((aff) => (
                    <Paper
                        key={aff.id_affectation}
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2 }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={800} noWrap>
                                    {aff.cours?.nom_cours || '-'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {aff.groupe?.nom_groupe || '-'} · {aff.salle?.nom_salle || '-'}
                                </Typography>
                            </Box>
                            <StatusBadge status={aff.statut} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {aff.enseignant?.prenom || ''} {aff.enseignant?.nom || '-'} · {new Date(aff.date_seance).toLocaleDateString('fr-FR')} · {formatHeure(aff.creneau?.heure_debut)} – {formatHeure(aff.creneau?.heure_fin)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
                            <IconButton size="small" onClick={() => onDeplacer(aff)} aria-label={t('incidents.move')}><AutoAwesome fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => onModifier(aff)} aria-label={`Modifier la séance ${aff.cours?.nom_cours ?? ''} du ${new Date(aff.date_seance).toLocaleDateString('fr-FR')}`}><Edit fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => onSupprimer(aff.id_affectation)} aria-label={`Supprimer la séance ${aff.cours?.nom_cours ?? ''} du ${new Date(aff.date_seance).toLocaleDateString('fr-FR')}`}><Delete fontSize="small" /></IconButton>
                        </Box>
                    </Paper>
                ))}
            </Stack>
        );
    }
    return (
            <TableContainer>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cours</TableCell>
                            <TableCell>Groupe</TableCell>
                            <TableCell>Enseignant</TableCell>
                            <TableCell>Salle</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Créneau</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {affectations.map((aff) => (
                            <TableRow key={aff.id_affectation}>
                                <TableCell sx={{ fontWeight: 700 }}>{aff.cours?.nom_cours || '-'}</TableCell>
                                <TableCell>{aff.groupe?.nom_groupe || '-'}</TableCell>
                                <TableCell>
                                    {aff.enseignant?.prenom || ''} {aff.enseignant?.nom || '-'}
                                </TableCell>
                                <TableCell>{aff.salle?.nom_salle || '-'}</TableCell>
                                <TableCell>
                                    {new Date(aff.date_seance).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {formatHeure(aff.creneau?.heure_debut)} – {formatHeure(aff.creneau?.heure_fin)}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={aff.statut} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => onDeplacer(aff)} aria-label={t('incidents.move')} title={t('incidents.move')}>
                                        <AutoAwesome fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => onModifier(aff)} aria-label={`Modifier la séance ${aff.cours?.nom_cours ?? ''} du ${new Date(aff.date_seance).toLocaleDateString('fr-FR')}`}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => onSupprimer(aff.id_affectation)} aria-label={`Supprimer la séance ${aff.cours?.nom_cours ?? ''} du ${new Date(aff.date_seance).toLocaleDateString('fr-FR')}`}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
    );
}
