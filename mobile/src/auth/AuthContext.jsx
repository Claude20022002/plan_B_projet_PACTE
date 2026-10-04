import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { chargerJetons, definirJetons, definirSurSessionPerdue, ErreurApi, jetonsCourants, planner } from '../api/client';
import { desinscrireDesNotifications, inscrireAuxNotifications } from '../push';
import { viderCache } from '../cache';

/**
 * Session de l'étudiant : jetons dans le trousseau sécurisé, profil relu au démarrage (/auth/me).
 * L'application V1 est réservée aux étudiants ; un autre rôle est refusé et sa session fermée.
 */
const AuthContext = createContext(null);

export class ErreurConnexion extends Error {
  constructor(cle) {
    super(cle);
    this.cle = cle;
  }
}

export function AuthProvider({ children }) {
  const [etat, setEtat] = useState('chargement');
  const [utilisateur, setUtilisateur] = useState(null);

  const oublier = useCallback(async () => {
    await definirJetons(null);
    await viderCache();
    setUtilisateur(null);
    setEtat('deconnecte');
  }, []);

  useEffect(() => {
    definirSurSessionPerdue(() => {
      viderCache();
      setUtilisateur(null);
      setEtat('deconnecte');
    });
    (async () => {
      const jetons = await chargerJetons().catch(() => null);
      if (!jetons) return setEtat('deconnecte');
      try {
        const { user } = await planner('/auth/me');
        setUtilisateur(user);
        setEtat('connecte');
      } catch (erreur) {
        // Hors ligne : on garde la session, le cache s'affichera
        if (erreur instanceof ErreurApi && erreur.code === 'RESEAU') setEtat('connecte');
        else await oublier();
      }
    })();
  }, [oublier]);

  const connexion = useCallback(
    async (email, motDePasse) => {
      let donnees;
      try {
        donnees = await planner('/auth/login', { method: 'POST', body: { email, password: motDePasse }, auth: false });
      } catch (erreur) {
        if (erreur.code === 'CONFIG_HTTP') throw new ErreurConnexion('app.connexion.erreurConfiguration');
        if (erreur.statut === 401 || erreur.statut === 403) throw new ErreurConnexion('app.connexion.erreurIdentifiants');
        if (erreur.statut === 429) throw new ErreurConnexion('app.connexion.erreurTrop');
        throw new ErreurConnexion('app.connexion.erreurReseau');
      }
      await definirJetons({ acces: donnees.access_token, renouvellement: donnees.refresh_token });
      if (donnees.user?.role !== 'etudiant') {
        await planner('/auth/logout', { method: 'POST', body: { refresh_token: jetonsCourants()?.renouvellement } }).catch(() => {});
        await oublier();
        throw new ErreurConnexion('app.connexion.erreurRole');
      }
      if (donnees.user?.must_change_password) {
        await planner('/auth/logout', { method: 'POST', body: { refresh_token: jetonsCourants()?.renouvellement } }).catch(() => {});
        await oublier();
        throw new ErreurConnexion('app.connexion.erreurMotDePasse');
      }
      setUtilisateur(donnees.user);
      setEtat('connecte');
      // Les alertes ne bloquent pas l'entrée dans l'application
      inscrireAuxNotifications().catch(() => {});
    },
    [oublier]
  );

  const deconnexion = useCallback(async () => {
    await desinscrireDesNotifications();
    await planner('/auth/logout', { method: 'POST', body: { refresh_token: jetonsCourants()?.renouvellement } }).catch(() => {});
    await oublier();
  }, [oublier]);

  const valeur = useMemo(() => ({ etat, utilisateur, connexion, deconnexion }), [etat, utilisateur, connexion, deconnexion]);
  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
