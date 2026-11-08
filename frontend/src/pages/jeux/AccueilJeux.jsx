import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Jeux from './Jeux';

/**
 * Page Activités (/jeux). L'étudiant n'a plus de catalogue sur le web (retours du 21 octobre) :
 * il rejoint les quiz et les jeux que son enseignant lance par leur code, dans « Quiz ». Les
 * anciens liens et les boutons « retour » des jeux le mènent donc là. L'enseignant garde Activités.
 */
export default function AccueilJeux() {
  const { user } = useAuth();
  return user?.role === 'etudiant' ? <Navigate to="/quiz" replace /> : <Jeux />;
}
