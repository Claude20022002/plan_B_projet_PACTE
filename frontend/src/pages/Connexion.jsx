import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    Link,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    IconButton,
    Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import engFormImg from '../assets/img/eng-form.webp';

export default function Connexion() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fonction: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                // Rediriger selon le rôle (le rôle vient du backend, mais on peut aussi utiliser le champ fonction)
                const role = result.data.user.role || formData.fonction.toLowerCase();
                if (role === 'admin' || formData.fonction === 'Administrateur') {
                    navigate('/dashboard/admin');
                } else if (role === 'enseignant' || formData.fonction === 'Professeur') {
                    navigate('/dashboard/enseignant');
                } else {
                    navigate('/dashboard/etudiant');
                }
            } else {
                setError(result.error || 'Erreur de connexion');
            }
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        
            <Box
                sx={{
                    width: '100%',
                    minHeight: '100vh',
                    display: 'flex',
                    borderRadius: 4,
                    p: { xs: 2, sm: 0 },
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                }}
            >
                {/* Section gauche - Image */}
                <Box
                    sx={{
                        width: { xs: '0%', sm: '40%' },
                        bgcolor: '#001962',
                        display: { xs: 'none', sm: 'flex' },
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        p: 4,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        
                            <Box
                                component="img"
                                src={engFormImg}
                                alt="Illustration HESTIM"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: 2,
                                }}
                            />
               
                    </motion.div>
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'white',
                            mt: 3,
                            textAlign: 'center',
                            fontWeight: 600,
                        }}
                    >
                        HESTIM Planner
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            mt: 1,
                            textAlign: 'center',
                        }}
                    >
                        Votre plateforme de gestion de planning
                    </Typography>
                </Box>

                {/* Divider vertical */}
                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                />

                {/* Section droite - Formulaire */}
                <Box
                    sx={{
                        flex: 1,
                        p: { xs: 4, sm: 6 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        bgcolor: 'white',
                    }}
                    component="form"
                    onSubmit={handleSubmit}
                >
                    {/* Logo HESTIM */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 4,
                        }}
                    >
                        <Box
                            component="img"
                            src="/HESTIM.png"
                            alt="HESTIM Logo"
                            sx={{
                                width: { xs: '180px', sm: '220px' },
                                height: { xs: '45px', sm: '55px' },
                                objectFit: 'contain',
                            }}
                        />
                    </Box>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Typography
                            variant="h4"
                            fontWeight={700}
                            sx={{
                                mb: 1,
                                color: '#000',
                                fontSize: { xs: '1.75rem', sm: '2rem' },
                            }}
                        >
                            Bienvenue à HESTIM
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                mb: 4,
                                color: 'text.secondary',
                                fontSize: '1rem',
                            }}
                        >
                            Accédez à votre compte pour consulter les emplois du temps
                        </Typography>

                        <Divider sx={{ mb: 4 }} />

                        <Typography
                            variant="h5"
                            fontWeight={700}
                            sx={{
                                mb: 3,
                                color: '#000',
                                fontSize: '1.5rem',
                            }}
                        >
                            Connexion
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                required
                                fullWidth
                                label="Nom d'utilisateur ou mail"
                                name="email"
                                type="text"
                                placeholder="Nom d'utilisateur ou mail"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            />

                            <TextField
                                required
                                fullWidth
                                label="Mot de passe"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mot de passe"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <FormControl fullWidth required>
                                <InputLabel>Fonction *</InputLabel>
                                <Select
                                    name="fonction"
                                    value={formData.fonction}
                                    onChange={handleChange}
                                    label="Fonction *"
                                    disabled={loading}
                                    sx={{
                                        borderRadius: 2,
                                    }}
                                >
                                    <MenuItem value="Administrateur">Administrateur</MenuItem>
                                    <MenuItem value="Professeur">Professeur</MenuItem>
                                    <MenuItem value="Etudiant">Étudiant</MenuItem>
                                </Select>
                            </FormControl>

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mt: 1,
                                }}
                            >
                                <FormControlLabel
                                    control={<Checkbox size="small" />}
                                    label="Se rappeler de moi"
                                    sx={{ fontSize: '0.875rem' }}
                                />
                                <Link
                                    component={Link}
                                    to="/forgot-password"
                                    sx={{
                                        fontSize: '0.875rem',
                                        color: '#1976d2',
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                        },
                                    }}
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </Box>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        mt: 2,
                                        py: 1.8,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        bgcolor: '#001962',
                                        borderRadius: 2,
                                        boxShadow: '0 4px 14px rgba(0, 25, 98, 0.3)',
                                        '&:hover': {
                                            bgcolor: '#002d7a',
                                            boxShadow: '0 6px 20px rgba(0, 25, 98, 0.4)',
                                        },
                                        '&:disabled': {
                                            bgcolor: '#001962',
                                            opacity: 0.6,
                                        },
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        'Connexion'
                                    )}
                                </Button>
                            </motion.div>
                        </Box>
                    </motion.div>
                </Box>
            </Box>

    );
}
