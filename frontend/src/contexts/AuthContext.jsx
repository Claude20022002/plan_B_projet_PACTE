import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Vérifier si l'utilisateur est connecté au chargement
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const data = await authAPI.getMe();
            setUser(data.user);
            setIsAuthenticated(true);
            window.dispatchEvent(new CustomEvent('auth:payload', { detail: data }));
        } catch (error) {
            // Ne pas logger les erreurs de connexion pour éviter le spam
            // Un visiteur non connecté (401) n'est pas une erreur
            if (!error.isConnectionError && error.status !== 401) {
                console.error('Erreur de vérification auth:', error);
            }
            // Pas de session : on vide l'état local, sans appel de déconnexion inutile au serveur
            if (error.status === 401 || error.message?.includes('401')) {
                setUser(null);
                setIsAuthenticated(false);
            } else if (error.isConnectionError) {
                // Si erreur de connexion, garder le token mais marquer comme non authentifié
                // L'utilisateur pourra réessayer quand le serveur sera disponible
                setIsAuthenticated(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const ouvrirSession = (data) => {
        setUser(data.user);
        setIsAuthenticated(true);
        window.dispatchEvent(new CustomEvent('auth:payload', { detail: data }));
    };

    // Second temps de la connexion (double authentification) : code de l'application ou de secours
    const verifierMfa = async (defi, code) => {
        try {
            const data = await authAPI.mfaVerifier(defi, code);
            ouvrirSession(data);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const login = async (email, password) => {
        try {
            const data = await authAPI.login({ email, password });
            // Double authentification : pas encore de session, le code est demandé
            if (data.mfa_requis) return { success: false, mfa: true, defi: data.defi };
            setUser(data.user);
            setIsAuthenticated(true);
            window.dispatchEvent(new CustomEvent('auth:payload', { detail: data }));
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            localStorage.removeItem('token');
            window.dispatchEvent(new CustomEvent('auth:logout'));
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        verifierMfa,
        logout,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

