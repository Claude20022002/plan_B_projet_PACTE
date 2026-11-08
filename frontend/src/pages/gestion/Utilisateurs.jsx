import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    IconButton,
    Chip,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert,
    Snackbar,
    Checkbox,
    TableSortLabel,
} from '@mui/material';
import { Add, Block, Edit, Delete, Search, SupervisedUserCircle, PhonelinkErase } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { userAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SkeletonTable from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import StatutCompte from '../../components/comptes/StatutCompte';
import BoutonsCompte from '../../components/comptes/BoutonsCompte';
import DialoguesComptes from '../../components/comptes/DialoguesComptes';
import FormulaireCompteDialog from '../../components/comptes/FormulaireCompteDialog';
import useActionsComptes from '../../components/comptes/useActionsComptes';

/** Comptes (administration) : liste de tous les comptes, création des comptes administrateurs, désactivation. */
export default function Utilisateurs() {
    const { t } = useTranslation();
    const { user: moi } = useAuth();
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
    const [invitation, setInvitation] = useState(null);
    const [mfaAReinitialiser, setMfaAReinitialiser] = useState(null);
    const { sorted: sortedUsers, requestSort, getSortDir } = useSortableTable(utilisateurs);

    const loadUtilisateurs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userAPI.getAll({ page: page + 1, limit: rowsPerPage });
            setUtilisateurs(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            console.error('Erreur:', err);
            setError(t('utilisateurs.erreurChargement'));
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, t]);

    useEffect(() => {
        loadUtilisateurs();
    }, [loadUtilisateurs]);

    const actions = useActionsComptes({ comptes: utilisateurs, recharger: loadUtilisateurs, onSucces: setSuccess, onErreur: setError });
    const visibles = sortedUsers.filter((u) => {
        const q = search.toLowerCase();
        return u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
    // Un compte déjà désactivé, ou le sien, n'entre pas dans une sélection
    const cochables = visibles.filter((u) => u.actif && u.id_user !== moi?.id_user).map((u) => u.id_user);

    const ouvrirFormulaire = (user = null) => {
        setEditing(user);
        setError('');
        setSuccess('');
        setOpen(true);
    };

    const compteEnregistre = (reponse, valeurs) => {
        if (editing) {
            setSuccess(t('utilisateurs.modifie'));
        } else {
            if (reponse.invitation) setInvitation({ email: valeurs.email, ...reponse.invitation });
            setSuccess(t(reponse.invitation ? 'utilisateurs.creeInvitation' : 'utilisateurs.creeProvisoire'));
        }
        setOpen(false);
        setEditing(null);
        loadUtilisateurs();
    };

    // Double authentification : téléphone perdu → retirée, sessions fermées, à reconfigurer
    const reinitialiserMfa = async () => {
        const cible = mfaAReinitialiser;
        setMfaAReinitialiser(null);
        try {
            await userAPI.reinitialiserMfa(cible.id_user);
            setSuccess(t('utilisateurs.mfaReinitialisee', { nom: `${cible.prenom} ${cible.nom}` }));
            loadUtilisateurs();
        } catch (err) {
            setError(err.response?.data?.error || err.message || t('utilisateurs.mfaErreur'));
        }
    };

    const handleDeleteConfirm = async () => {
        const { id } = confirmDialog;
        setConfirmDialog({ open: false, id: null });
        try {
            await userAPI.delete(id);
            setSuccess(t('utilisateurs.supprime'));
            loadUtilisateurs();
        } catch (err) {
            console.error('Erreur:', err);
            // Un compte qui a un historique ne se supprime pas : le serveur dit de le désactiver
            setError(err.response?.data?.code === 'A_UN_HISTORIQUE' ? t('comptes.supprimerImpossible') : t('utilisateurs.erreurSuppression'));
        }
    };

    const enTete = (champ, cle) => (
        <TableCell>
            <TableSortLabel active={getSortDir(champ) !== undefined} direction={getSortDir(champ) || 'asc'} onClick={() => requestSort(champ)}>
                {t(`utilisateurs.colonnes.${cle}`)}
            </TableSortLabel>
        </TableCell>
    );

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
                    {/* Le titre est celui de la mise en page, et le menu y ramène : plus de « Retour » ni de « Gestion des… » (recette, m-1 et m-2) */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {actions.selection.length > 0 && (
                            <Button variant="outlined" color="error" startIcon={<Block />} onClick={actions.ouvrirLot}>
                                {t('comptes.desactiverSelection', { count: actions.selection.length })}
                            </Button>
                        )}
                        <Button variant="contained" startIcon={<Add />} onClick={() => ouvrirFormulaire()}>
                            {t('utilisateurs.ajouter')}
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                        <Alert onClose={() => setError('')} severity="error">{error}</Alert>
                    </Snackbar>
                )}
                {success && (
                    <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
                        <Alert onClose={() => setSuccess('')} severity="success">{success}</Alert>
                    </Snackbar>
                )}

                <Paper sx={{ mb: 2 }}>
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            placeholder={t('utilisateurs.rechercher')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        />
                    </Box>
                </Paper>

                {loading ? (
                    <SkeletonTable columns={8} rows={rowsPerPage} />
                ) : utilisateurs.length === 0 ? (
                    <EmptyState
                        icon={SupervisedUserCircle}
                        title={t('utilisateurs.vide')}
                        description={t('utilisateurs.videAide')}
                        actionLabel={t('utilisateurs.ajouter')}
                        onAction={() => ouvrirFormulaire()}
                    />
                ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        size="small"
                                        checked={cochables.length > 0 && cochables.every((id) => actions.coches.has(id))}
                                        indeterminate={cochables.some((id) => actions.coches.has(id)) && !cochables.every((id) => actions.coches.has(id))}
                                        onChange={() => actions.toutBasculer(cochables)}
                                        disabled={cochables.length === 0}
                                        inputProps={{ 'aria-label': t('comptes.toutSelectionner') }}
                                    />
                                </TableCell>
                                {enTete('nom', 'nom')}
                                {enTete('prenom', 'prenom')}
                                {enTete('email', 'email')}
                                <TableCell>{t('utilisateurs.colonnes.role')}</TableCell>
                                <TableCell>{t('utilisateurs.colonnes.telephone')}</TableCell>
                                <TableCell>{t('utilisateurs.colonnes.statut')}</TableCell>
                                <TableCell align="right">{t('utilisateurs.colonnes.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibles.map((user) => {
                                const nom = `${user.prenom} ${user.nom}`;
                                return (
                                    <TableRow key={user.id_user} hover>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                size="small"
                                                checked={actions.coches.has(user.id_user)}
                                                onChange={() => actions.basculer(user.id_user)}
                                                disabled={!cochables.includes(user.id_user)}
                                                inputProps={{ 'aria-label': t('comptes.selectionnerNom', { nom }) }}
                                            />
                                        </TableCell>
                                        <TableCell>{user.nom}</TableCell>
                                        <TableCell>{user.prenom}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip label={t(`roles.${user.role}`, { defaultValue: user.role })} size="small" color={user.role === 'admin' ? 'error' : user.role === 'enseignant' ? 'primary' : 'default'} />
                                        </TableCell>
                                        <TableCell>{user.telephone || '-'}</TableCell>
                                        <TableCell><StatutCompte compte={user} /></TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => ouvrirFormulaire(user)} aria-label={t('utilisateurs.modifierNom', { nom })}>
                                                <Edit />
                                            </IconButton>
                                            {user.mfa_active && (
                                                <IconButton size="small" onClick={() => setMfaAReinitialiser(user)} aria-label={t('utilisateurs.mfaNom', { nom })} title={t('utilisateurs.mfaTitre')}>
                                                    <PhonelinkErase />
                                                </IconButton>
                                            )}
                                            <BoutonsCompte compte={user} actions={actions} estMoi={user.id_user === moi?.id_user} />
                                            <IconButton size="small" color="error" onClick={() => setConfirmDialog({ open: true, id: user.id_user })} aria-label={t('utilisateurs.supprimerNom', { nom })}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </TableContainer>
                )}

                <DialoguesComptes actions={actions} />

                <ConfirmDialog
                    open={confirmDialog.open}
                    title={t('utilisateurs.titreSuppression')}
                    message={t('utilisateurs.messageSuppression')}
                    confirmLabel={t('common.delete')}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDialog({ open: false, id: null })}
                />

                <ConfirmDialog
                    open={Boolean(mfaAReinitialiser)}
                    title={t('utilisateurs.mfaTitre')}
                    message={t('utilisateurs.mfaMessage', { nom: `${mfaAReinitialiser?.prenom ?? ''} ${mfaAReinitialiser?.nom ?? ''}` })}
                    confirmLabel={t('utilisateurs.reinitialiser')}
                    onConfirm={reinitialiserMfa}
                    onCancel={() => setMfaAReinitialiser(null)}
                />

                <FormulaireCompteDialog open={open} editing={editing} onClose={() => setOpen(false)} onSaved={compteEnregistre} onError={setError} />

                {/* Lien d'invitation : à transmettre si l'email n'a pas pu partir */}
                <Dialog open={Boolean(invitation)} onClose={() => setInvitation(null)} maxWidth="sm" fullWidth>
                    <DialogTitle>{t('utilisateurs.invitationDe', { email: invitation?.email })}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t(invitation?.envoyee ? 'utilisateurs.invitationEnvoyee' : 'utilisateurs.invitationNonEnvoyee')}
                        </Typography>
                        <TextField fullWidth value={invitation?.lien ?? ''} InputProps={{ readOnly: true }} onFocus={(e) => e.target.select()} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => navigator.clipboard?.writeText(invitation?.lien ?? '')}>{t('utilisateurs.copierLien')}</Button>
                        <Button variant="contained" onClick={() => setInvitation(null)}>{t('common.close')}</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}
