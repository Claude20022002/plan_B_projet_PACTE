import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import AuthSkeleton from '../components/common/AuthSkeleton';
import VersAdresse from '../components/common/VersAdresse';

/**
 * Écrans publics du mot de passe, à des adresses en français (audit du 15 octobre). Les anciennes
 * adresses anglaises restent des redirections : les e-mails de réinitialisation et les invitations
 * déjà envoyés pointent vers /reset-password?token=…, et le jeton doit suivre.
 */

const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const ChangerMotDePasse = lazy(() => import('../pages/ChangerMotDePasse'));

export const CHEMIN_OUBLI = '/mot-de-passe-oublie';
export const CHEMIN_REINITIALISATION = '/reinitialiser-mot-de-passe';

const publique = (page) => <Suspense fallback={<AuthSkeleton />}>{page}</Suspense>;

/** Routes des écrans du mot de passe, à placer telles quelles dans <Routes>. */
export const routesMotDePasse = () => [
  <Route key="oubli" path={CHEMIN_OUBLI} element={publique(<ForgotPassword />)} />,
  <Route key="reinitialisation" path={CHEMIN_REINITIALISATION} element={publique(<ResetPassword />)} />,
  <Route key="changer" path="/changer-mot-de-passe" element={publique(<ChangerMotDePasse />)} />,
  <Route key="ancien-oubli" path="/forgot-password" element={<VersAdresse chemin={CHEMIN_OUBLI} />} />,
  <Route key="ancien-reset" path="/reset-password" element={<VersAdresse chemin={CHEMIN_REINITIALISATION} />} />,
];
