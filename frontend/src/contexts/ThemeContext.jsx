import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme doit être utilisé dans un ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'light';
    });

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: '#1a3a8f',
                light: '#4a6dbf',
                dark: '#001062',
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#e8a020',
                light: '#ffd04f',
                dark: '#b07000',
                contrastText: '#000000',
            },
            success: {
                main: '#2e7d32',
                light: '#60ad5e',
                dark: '#005005',
            },
            warning: {
                main: '#ed6c02',
                light: '#ff9d3f',
                dark: '#b53d00',
            },
            error: {
                main: '#c62828',
                light: '#ff5f52',
                dark: '#8e0000',
            },
            info: {
                main: '#0277bd',
                light: '#58a5f0',
                dark: '#004c8c',
            },
            background: {
                default: mode === 'light' ? '#f4f6fb' : '#0d1117',
                paper: mode === 'light' ? '#ffffff' : '#161b22',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 700 },
            h2: { fontWeight: 700 },
            h3: { fontWeight: 700 },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            subtitle1: { fontWeight: 500 },
            button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
        },
        shape: {
            borderRadius: 10,
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        boxShadow: mode === 'light'
                            ? '0 2px 12px rgba(26, 58, 143, 0.08)'
                            : '0 2px 12px rgba(0, 0, 0, 0.4)',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    rounded: { borderRadius: 12 },
                    elevation2: {
                        boxShadow: mode === 'light'
                            ? '0 2px 12px rgba(26, 58, 143, 0.08)'
                            : '0 2px 12px rgba(0, 0, 0, 0.4)',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: { borderRadius: 8, paddingLeft: 16, paddingRight: 16 },
                    containedPrimary: {
                        background: 'linear-gradient(135deg, #1a3a8f 0%, #2952c4 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #0e2460 0%, #1a3a8f 100%)' },
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: { borderRadius: 6, fontWeight: 500 },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        background: mode === 'light'
                            ? 'linear-gradient(90deg, #001062 0%, #1a3a8f 100%)'
                            : 'linear-gradient(90deg, #0d1117 0%, #161b22 100%)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        margin: '2px 8px',
                        width: 'calc(100% - 16px)',
                        '&.Mui-selected': {
                            backgroundColor: mode === 'light' ? 'rgba(26, 58, 143, 0.12)' : 'rgba(26, 58, 143, 0.25)',
                            '&:hover': { backgroundColor: mode === 'light' ? 'rgba(26, 58, 143, 0.18)' : 'rgba(26, 58, 143, 0.35)' },
                        },
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: { borderRadius: 4, height: 6 },
                },
            },
        },
    });

    const value = {
        mode,
        toggleTheme,
        theme,
    };

    return (
        <ThemeContext.Provider value={value}>
            <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
        </ThemeContext.Provider>
    );
};

