import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * Route protégée.
 * @param {string|string[]|null} requiredRole - rôle(s) autorisé(s) ; null = tout utilisateur connecté
 */
export default function PrivateRoute({ children, requiredRole = null }) {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/connexion" replace />;
    }

    const allowed = requiredRole === null || [].concat(requiredRole).includes(user?.role);
    if (!allowed) {
        // Mauvais rôle : retour à son propre tableau plutôt qu'à la page publique
        return <Navigate to={user?.role ? `/dashboard/${user.role}` : '/'} replace />;
    }

    return children;
}
