import { Navigate, useLocation } from 'react-router-dom';

/** Redirige vers `chemin` en gardant les paramètres de l'adresse (une ancienne adresse renommée). */
export default function VersAdresse({ chemin }) {
  const { search } = useLocation();
  return <Navigate to={{ pathname: chemin, search }} replace />;
}
