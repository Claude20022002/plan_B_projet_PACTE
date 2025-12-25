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
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const data = await authAPI.getMe();
            setUser(data.user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Erreur de vérification auth:', error);
            // Ne pas déconnecter automatiquement si c'est juste une erreur réseau
            if (error.status === 401 || error.message?.includes('401')) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const data = await authAPI.login({ email, password });
            localStorage.setItem('token', data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const data = await authAPI.register(userData);
            localStorage.setItem('token', data.token);
            setUser(data.user);
            setIsAuthenticated(true);
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
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

