import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * /tableau : entrée de Planner pour les autres espaces (StudyLib, ClassQuiz), qui ne connaissent
 * pas le rôle : mène directement au tableau du rôle connecté (protégé par PrivateRoute).
 */
export default function VersTableau() {
  const { user } = useAuth();
  return <Navigate to={user?.role ? `/dashboard/${user.role}` : '/connexion'} replace />;
}
