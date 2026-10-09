import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { estResponsable } from '../../utils/droits';
import { cheminSuivantSur } from '../../utils/redirection';

/**
 * Route protégée.
 * @param {string|string[]|null} requiredRole - rôle(s) autorisé(s) ; null = tout utilisateur connecté
 * @param {boolean} allowResponsable - ouvre aussi la page aux responsables de filière (préparation)
 */
export default function PrivateRoute({ children, requiredRole = null, allowResponsable = false }) {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

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
        // Retour après connexion, seulement vers un chemin autorisé (QR de l'appel…)
        const suivant = cheminSuivantSur(`${location.pathname}${location.search}`);
        return <Navigate to={suivant ? `/connexion?next=${encodeURIComponent(suivant)}` : '/connexion'} replace />;
    }

    // Mot de passe provisoire : rien d'autre tant qu'il n'est pas changé (le serveur bloque aussi)
    if (user?.must_change_password) {
        return <Navigate to="/changer-mot-de-passe" replace />;
    }

    // Administrateur sans double authentification : à configurer d'abord (le serveur bloque aussi)
    if (user?.mfa_a_configurer && location.pathname !== '/securite') {
        return <Navigate to="/securite" replace />;
    }

    const allowed = requiredRole === null || [].concat(requiredRole).includes(user?.role) || (allowResponsable && estResponsable(user));
    if (!allowed) {
        // Mauvais rôle : retour à son propre tableau plutôt qu'à la page publique
        return <Navigate to={user?.role ? `/dashboard/${user.role}` : '/'} replace />;
    }

    return children;
}
