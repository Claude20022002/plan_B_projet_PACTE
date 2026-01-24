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
import { authAPI } from '../services/api';

export default function ForgotPassword() {
    const navigate = useNavigate();
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
            setError(err.message || 'Une erreur est survenue');
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                            Mot de passe oublié ?
                        </Typography>

                        {success ? (
                            <Box>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.
                                    Vérifiez votre boîte de réception.
                                </Alert>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => navigate('/connexion')}
                                    sx={{ mt: 2 }}
                                >
                                    Retour à la connexion
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </Typography>

                                {error && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <TextField
                                        fullWidth
                                        label="Adresse email"
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
                                        {loading ? <CircularProgress size={24} /> : 'Envoyer le lien de réinitialisation'}
                                    </Button>
                                </form>

                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <MuiLink component={Link} to="/connexion" underline="hover">
                                        Retour à la connexion
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
