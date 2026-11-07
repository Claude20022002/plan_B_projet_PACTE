import React, { useEffect } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, Link, MenuItem, Select, TextField } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';

const validationSchema = yup.object({
    // Messages : des clés de traduction, traduites à l'affichage
    nom: yup.string().required('utilisateurs.erreurs.nom'),
    prenom: yup.string().required('utilisateurs.erreurs.prenom'),
    email: yup.string().email('utilisateurs.erreurs.emailInvalide').required('utilisateurs.erreurs.email'),
    role: yup.string().oneOf(['admin', 'enseignant', 'etudiant']).required('utilisateurs.erreurs.role'),
    telephone: yup.string(),
    // Longueur comme le serveur (utils/passwordHelper.js) ; mots de passe courants, personnels ou
    // divulgués : refusés par le serveur. Facultatif : sans mot de passe, le compte reçoit un lien
    // d'invitation ; un mot de passe saisi est provisoire.
    password: yup
        .string()
        .transform((valeur) => valeur || undefined)
        .min(12, 'utilisateurs.erreurs.motDePasseCourt')
        .max(64, 'utilisateurs.erreurs.motDePasseLong'),
});

const VIDE = { nom: '', prenom: '', email: '', role: 'admin', telephone: '', password: '', actif: true, niveau: '' };

const valeursDe = (user) => ({
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    telephone: user.telephone || '',
    password: '',
    actif: user.actif,
    niveau: user.niveau || '',
});

/**
 * Fenêtre de création d'un compte administrateur ou de modification d'un compte (page Utilisateurs).
 * `editing` : le compte à modifier, ou null pour une création. `onSaved(reponse)` reçoit la réponse
 * du serveur (avec le lien d'invitation à la création) ; `onError(message)` affiche l'échec.
 */
export default function FormulaireCompteDialog({ open, editing, onClose, onSaved, onError }) {
    const { t } = useTranslation();

    const formik = useFormik({
        initialValues: VIDE,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                onError('');
                const { niveau, ...dataToSend } = values;
                if (!dataToSend.password) delete dataToSend.password;
                if (editing) {
                    onSaved(await userAPI.update(editing.id_user, dataToSend), values);
                } else {
                    // La fiche étudiant ou enseignant est créée avec le compte
                    onSaved(await userAPI.create({ ...dataToSend, ...(values.role === 'etudiant' && niveau ? { profil: { niveau } } : {}) }), values);
                }
            } catch (error) {
                console.error('Erreur:', error);
                onError(error.message || t('utilisateurs.erreurSauvegarde'));
            } finally {
                setSubmitting(false);
            }
        },
    });

    // À chaque ouverture : les valeurs du compte modifié, ou un formulaire vierge
    const { setValues, resetForm } = formik;
    useEffect(() => {
        if (!open) return;
        if (editing) setValues(valeursDe(editing));
        else resetForm();
    }, [open, editing, setValues, resetForm]);

    const champ = (nom) => ({
        name: nom,
        value: formik.values[nom],
        onChange: formik.handleChange,
        error: formik.touched[nom] && Boolean(formik.errors[nom]),
        helperText: formik.touched[nom] && formik.errors[nom] && t(formik.errors[nom]),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={formik.handleSubmit}>
                <DialogTitle>{t(editing ? 'utilisateurs.titreModifier' : 'utilisateurs.titreNouveau')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField fullWidth label={t('utilisateurs.colonnes.nom')} {...champ('nom')} />
                        <TextField fullWidth label={t('utilisateurs.colonnes.prenom')} {...champ('prenom')} />
                        <TextField fullWidth label={t('utilisateurs.colonnes.email')} type="email" onBlur={formik.handleBlur} {...champ('email')} />
                        {!editing && (
                            <Alert severity="info">
                                {t('utilisateurs.infoAdmin')}{' '}
                                <Link component={RouterLink} to="/gestion/etudiants">{t('utilisateurs.pageEtudiants')}</Link> {t('utilisateurs.et')}{' '}
                                <Link component={RouterLink} to="/gestion/enseignants">{t('utilisateurs.pageEnseignants')}</Link>.
                            </Alert>
                        )}
                        {/* Le rôle d'un compte existant ne change pas ici : son profil (étudiant, enseignant) en dépend */}
                        <FormControl fullWidth sx={{ display: editing ? undefined : 'none' }}>
                            <InputLabel>{t('utilisateurs.colonnes.role')}</InputLabel>
                            <Select name="role" value={formik.values.role} onChange={formik.handleChange} label={t('utilisateurs.colonnes.role')} disabled>
                                <MenuItem value="admin">{t('roles.admin')}</MenuItem>
                                <MenuItem value="enseignant">{t('roles.enseignant')}</MenuItem>
                                <MenuItem value="etudiant">{t('roles.etudiant')}</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth label={t('utilisateurs.colonnes.telephone')} name="telephone" value={formik.values.telephone} onChange={formik.handleChange} />
                        <TextField
                            fullWidth
                            label={t(editing ? 'utilisateurs.motDePasseModifier' : 'utilisateurs.motDePasseNouveau')}
                            type="password"
                            {...champ('password')}
                            helperText={(formik.touched.password && formik.errors.password && t(formik.errors.password)) || t(editing ? 'utilisateurs.motDePasseAideModifier' : 'utilisateurs.motDePasseAideNouveau')}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{t('common.cancel')}</Button>
                    <Button type="submit" variant="contained">{t(editing ? 'utilisateurs.modifier' : 'utilisateurs.creer')}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
