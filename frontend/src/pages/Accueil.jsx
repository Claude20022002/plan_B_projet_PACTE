import { Box, Typography, Button, Container } from '@mui/material';
import { NavLink } from 'react-router-dom';
import Header from '../components/common/Header';

export default function Accueil() {
  return ( 

    <Box>
        {/* Le header */}
        <Header />

        {/* Le contenu principal */}

        <Box sx={{ backgroundColor: '#ffffffff', mt: 16, pb: 8 }}>
        <Container maxWidth="lg">
            <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4,
            }}
            >
            {/* TEXTE */}
            <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                Bienvenue sur la{' '}
                <Box component="span" sx={{ color: '#001962' }}>
                    Plateforme de gestion et planification des cours de l’HESTIM
                </Box>
                </Typography>

                <Typography variant="body1" sx={{ mb: 3 }}>
                Votre planning à portée de clic
                </Typography>

                <Button
                component={NavLink}
                to="/"
                variant="contained"
                sx={{
                    backgroundColor: '#7c4dff',
                    textTransform: 'none',
                    px: 3,
                    py: 1.2,
                    '&:hover': {
                    backgroundColor: '#5e35b1',
                    },
                }}
                >
                Récupérer Mon emploi du temps
                </Button>
            </Box>

            {/* IMAGE */}
            <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box
                component="img"
                src="frontend/public/accueil.jpg" 
                alt="Illustration"
                sx={{
                    maxWidth: '50%',
                    height: 'auto',
                }}
                />
            </Box>
            </Box>
        </Container>
        </Box>
    </Box>
  );
}

