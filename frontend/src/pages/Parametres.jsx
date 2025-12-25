import React, { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Snackbar,
    Divider,
    Avatar,
    IconButton,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
    nom: yup.string().required('Le nom est requis'),
    prenom: yup.string().required('Le prénom est requis'),
    email: yup.string().email('Email invalide').required('L\'email est requis'),
    telephone: yup.string(),
    password: yup.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Les mots de passe ne correspondent pas'),
});

export default function Parametres() {
    const { user, checkAuth } = useAuth();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
    const fileInputRef = useRef(null);

    React.useEffect(() => {
        if (user?.avatar_url) {
            setAvatarPreview(user.avatar_url);
        }
    }, [user]);

    const formik = useFormik({
        initialValues: {
            nom: user?.nom || '',
            prenom: user?.prenom || '',
            email: user?.email || '',
            telephone: user?.telephone || '',
            password: '',
            confirmPassword: '',
            avatar_url: user?.avatar_url || '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                const dataToSend = {
                    nom: values.nom,
                    prenom: values.prenom,
                    email: values.email,
                    telephone: values.telephone,
                };
                if (values.password) {
                    dataToSend.password = values.password;
                }
                if (values.avatar_url) {
                    dataToSend.avatar_url = values.avatar_url;
                }
                await userAPI.update(user.id_user, dataToSend);
                setSuccess('Paramètres mis à jour avec succès');
                await checkAuth();
                formik.setFieldValue('password', '');
                formik.setFieldValue('confirmPassword', '');
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la mise à jour');
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Paramètres du compte
                </Typography>

                {error && (
                    <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                        <Alert onClose={() => setError('')} severity="error">
                            {error}
                        </Alert>
                    </Snackbar>
                )}

                {success && (
                    <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
                        <Alert onClose={() => setSuccess('')} severity="success">
                            {success}
                        </Alert>
                    </Snackbar>
                )}

                <Paper sx={{ p: 3, mt: 2 }}>
                    <form onSubmit={formik.handleSubmit}>
                        <Typography variant="h6" gutterBottom>
                            Informations personnelles
                        </Typography>
                        
                        {/* Avatar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Avatar
                                src={avatarPreview}
                                sx={{ width: 100, height: 100 }}
                            >
                                {user?.prenom?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="avatar-upload"
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            // Vérifier la taille (max 2MB)
                                            if (file.size > 2 * 1024 * 1024) {
                                                setError('L\'image est trop grande. Taille maximale : 2MB');
                                                return;
                                            }
                                            
                                            // Vérifier le type
                                            if (!file.type.startsWith('image/')) {
                                                setError('Le fichier doit être une image');
                                                return;
                                            }
                                            
                                            // Convertir en base64
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64String = reader.result;
                                                formik.setFieldValue('avatar_url', base64String);
                                                setAvatarPreview(base64String);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <label htmlFor="avatar-upload">
                                    <IconButton color="primary" component="span">
                                        <PhotoCamera />
                                    </IconButton>
                                </label>
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    Cliquez pour changer votre photo de profil
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                            <TextField
                                fullWidth
                                label="Nom"
                                name="nom"
                                value={formik.values.nom}
                                onChange={formik.handleChange}
                                error={formik.touched.nom && Boolean(formik.errors.nom)}
                                helperText={formik.touched.nom && formik.errors.nom}
                            />
                            <TextField
                                fullWidth
                                label="Prénom"
                                name="prenom"
                                value={formik.values.prenom}
                                onChange={formik.handleChange}
                                error={formik.touched.prenom && Boolean(formik.errors.prenom)}
                                helperText={formik.touched.prenom && formik.errors.prenom}
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                            />
                            <TextField
                                fullWidth
                                label="Téléphone"
                                name="telephone"
                                value={formik.values.telephone}
                                onChange={formik.handleChange}
                                error={formik.touched.telephone && Boolean(formik.errors.telephone)}
                                helperText={formik.touched.telephone && formik.errors.telephone}
                            />
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="h6" gutterBottom>
                            Changer le mot de passe
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Nouveau mot de passe"
                                name="password"
                                type="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
                            />
                            <TextField
                                fullWidth
                                label="Confirmer le mot de passe"
                                name="confirmPassword"
                                type="password"
                                value={formik.values.confirmPassword}
                                onChange={formik.handleChange}
                                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                            />
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
                                Enregistrer les modifications
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </DashboardLayout>
    );
}

