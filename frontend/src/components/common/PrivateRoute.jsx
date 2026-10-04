import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { estResponsable } from '../../utils/droits';

/**
 * Route protégée.
 * @param {string|string[]|null} requiredRole - rôle(s) autorisé(s) ; null = tout utilisateur connecté
 * @param {boolean} allowResponsable - ouvre aussi la page aux responsables de filière (préparation)
 */
export default function PrivateRoute({ children, requiredRole = null, allowResponsable = false }) {
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

    // Mot de passe provisoire : rien d'autre tant qu'il n'est pas changé (le serveur bloque aussi)
    if (user?.must_change_password) {
        return <Navigate to="/changer-mot-de-passe" replace />;
    }

    const allowed = requiredRole === null || [].concat(requiredRole).includes(user?.role) || (allowResponsable && estResponsable(user));
    if (!allowed) {
        // Mauvais rôle : retour à son propre tableau plutôt qu'à la page publique
        return <Navigate to={user?.role ? `/dashboard/${user.role}` : '/'} replace />;
    }

    return children;
}
