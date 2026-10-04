import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ds } from '../design-system/tokens';

/**
 * Première connexion d'un compte créé par l'administration avec un mot de passe provisoire
 * (ou redéfini par elle) : le serveur refuse tout le reste tant que ce n'est pas fait.
 */
export default function ChangerMotDePasse() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading, checkAuth, logout } = useAuth();
    const [form, setForm] = useState({ actuel: '', nouveau: '', confirmation: '' });
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    if (loading) return null;
    if (!user) return <Navigate to="/connexion" replace />;
    if (!user.must_change_password) return <Navigate to={`/dashboard/${user.role}`} replace />;

    const champ = (nom) => (e) => {
        setForm((f) => ({ ...f, [nom]: e.target.value }));
        setErreur('');
    };

    const enregistrer = async (event) => {
        event.preventDefault();
        if (form.nouveau !== form.confirmation) {
            setErreur(t('password.mismatch'));
            return;
        }
        setEnvoi(true);
        try {
            await authAPI.changePassword(form.actuel, form.nouveau);
            await checkAuth();
            navigate(`/dashboard/${user.role}`, { replace: true });
        } catch (error) {
            setErreur(error.response?.data?.errors?.join(' ') || error.response?.data?.error || error.message);
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0B0B0D', p: 2 }}>
            <Container maxWidth="xs">
                <Paper component="form" onSubmit={enregistrer} sx={{ p: { xs: 3, sm: 4 }, borderRadius: `${ds.radius.sm}px` }}>
                    <Typography component="h1" variant="h5" sx={{ fontFamily: ds.font.board, fontWeight: 700, mb: 1 }}>
                        {t('password.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('password.intro', { name: user?.prenom ?? '' })}
                    </Typography>
                    {erreur && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {erreur}
                        </Alert>
                    )}
                    <Stack spacing={2}>
                        <TextField type="password" label={t('password.current')} value={form.actuel} onChange={champ('actuel')} autoComplete="current-password" required autoFocus />
                        <TextField type="password" label={t('password.new')} helperText={t('password.rules')} value={form.nouveau} onChange={champ('nouveau')} autoComplete="new-password" required />
                        <TextField type="password" label={t('password.confirm')} value={form.confirmation} onChange={champ('confirmation')} autoComplete="new-password" required />
                        <Button type="submit" variant="contained" size="large" disabled={envoi}>
                            {t('password.submit')}
                        </Button>
                        <Button onClick={logout}>{t('common.logout')}</Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
