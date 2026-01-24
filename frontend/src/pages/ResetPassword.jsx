import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Link as MuiLink,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'motion/react';
import { authAPI } from '../services/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const id_user = searchParams.get('id');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token || !id_user) {
            setError('Lien de réinitialisation invalide');
        }
    }, [token, id_user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token || !id_user) {
            setError('Lien de réinitialisation invalide');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword(token, parseInt(id_user), formData.password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/connexion');
            }, 3000);
        } catch (err) {
            setError(err.message || err.error || 'Une erreur est survenue lors de la réinitialisation');
        } finally {
            setLoading(false);
        }
    };

    if (!token || !id_user) {
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
                    <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Lien de réinitialisation invalide
                        </Alert>
                        <Button fullWidth variant="contained" component={Link} to="/connexion">
                            Retour à la connexion
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

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
                            Réinitialiser votre mot de passe
                        </Typography>

                        {success ? (
                            <Box>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
                                </Alert>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => navigate('/connexion')}
                                >
                                    Aller à la connexion
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                    Entrez votre nouveau mot de passe
                                </Typography>

                                {error && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <TextField
                                        fullWidth
                                        label="Nouveau mot de passe"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        margin="normal"
                                        autoFocus
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText="Minimum 8 caractères"
                                    />

                                    <TextField
                                        fullWidth
                                        label="Confirmer le mot de passe"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        margin="normal"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        edge="end"
                                                    >
                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        sx={{ mt: 3, mb: 2 }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Réinitialiser le mot de passe'}
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
