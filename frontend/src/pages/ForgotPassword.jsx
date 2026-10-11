import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Link as MuiLink,
} from '@mui/material';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { ds } from '../design-system/tokens';

/** Mot de passe oublié : demande du lien de réinitialisation par email. */
export default function ForgotPassword() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authAPI.forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.message || t('forgot.erreur'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: ds.board.ground, // fond du panneau (charte HESTIM)
                padding: 2,
            }}
        >
            <Container maxWidth="sm">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Paper
                        elevation={10}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.95)',
                        }}
                    >
                        <Typography variant="h4" fontWeight="bold" gutterBottom align="center" sx={{ mb: 3 }}>
                            {t('forgot.titre')}
                        </Typography>

                        {success ? (
                            <Box>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    {t('forgot.envoye')}
                                </Alert>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => navigate('/connexion')}
                                    sx={{ mt: 2 }}
                                >
                                    {t('forgot.retourConnexion')}
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                    {t('forgot.intro')}
                                </Typography>

                                {error && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <TextField
                                        fullWidth
                                        label={t('login.email')}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        margin="normal"
                                        autoFocus
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        sx={{ mt: 3, mb: 2 }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : t('forgot.envoyer')}
                                    </Button>
                                </form>

                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <MuiLink component={Link} to="/connexion" underline="hover">
                                        {t('forgot.retourConnexion')}
                                    </MuiLink>
                                </Box>
                            </>
                        )}
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
}
