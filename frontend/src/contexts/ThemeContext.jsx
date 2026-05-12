import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { ds } from '../design-system/tokens';

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

    const isLight = mode === 'light';
    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: ds.colors.brand.primary,
                light: '#60a5fa',
                dark: ds.colors.brand.hover,
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#111827',
                light: '#374151',
                dark: '#030712',
                contrastText: '#ffffff',
            },
            success: {
                main: ds.colors.success.text,
            },
            warning: {
                main: ds.colors.warning.text,
            },
            error: {
                main: ds.colors.danger.text,
            },
            info: {
                main: ds.colors.info.text,
            },
            background: {
                default: isLight ? ds.colors.bg.app : '#0b1220',
                paper: isLight ? ds.colors.bg.surface : '#111827',
            },
            text: {
                primary: isLight ? ds.colors.text.primary : '#f9fafb',
                secondary: isLight ? ds.colors.text.secondary : '#cbd5e1',
            },
            divider: isLight ? ds.colors.border.default : 'rgba(148, 163, 184, 0.18)',
            action: {
                hover: isLight ? '#f3f4f6' : 'rgba(148, 163, 184, 0.08)',
                selected: isLight ? ds.colors.brand.soft : 'rgba(37, 99, 235, 0.16)',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontSize: 24, lineHeight: '32px', fontWeight: 750, letterSpacing: 0 },
            h2: { fontSize: 18, lineHeight: '26px', fontWeight: 700, letterSpacing: 0 },
            h3: { fontSize: 16, lineHeight: '24px', fontWeight: 700, letterSpacing: 0 },
            h4: { fontSize: 15, lineHeight: '22px', fontWeight: 700, letterSpacing: 0 },
            h5: { fontSize: 14, lineHeight: '22px', fontWeight: 700, letterSpacing: 0 },
            h6: { fontSize: 14, lineHeight: '22px', fontWeight: 700, letterSpacing: 0 },
            body1: { fontSize: 14, lineHeight: '22px', letterSpacing: 0 },
            body2: { fontSize: 13, lineHeight: '20px', letterSpacing: 0 },
            caption: { fontSize: 12, lineHeight: '18px', letterSpacing: 0 },
            button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
        },
        shape: {
            borderRadius: ds.radius.md,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: ds.radius.md,
                        border: `1px solid ${isLight ? ds.colors.border.default : 'rgba(148, 163, 184, 0.18)'}`,
                        boxShadow: ds.shadow.card,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                    rounded: { borderRadius: ds.radius.md },
                    elevation1: {
                        boxShadow: ds.shadow.card,
                    },
                    elevation2: {
                        boxShadow: ds.shadow.card,
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: ds.radius.md,
                        minHeight: 36,
                        paddingLeft: 14,
                        paddingRight: 14,
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' },
                    },
                    containedPrimary: {
                        background: ds.colors.brand.primary,
                        '&:hover': { background: ds.colors.brand.hover },
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: { borderRadius: 999, fontWeight: 700 },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        boxShadow: 'none',
                        borderBottom: `1px solid ${isLight ? ds.colors.border.default : 'rgba(148, 163, 184, 0.18)'}`,
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        margin: '2px 10px',
                        width: 'calc(100% - 16px)',
                        minHeight: 38,
                        '&.Mui-selected': {
                            backgroundColor: isLight ? ds.colors.brand.soft : 'rgba(37, 99, 235, 0.16)',
                            '&:hover': { backgroundColor: isLight ? ds.colors.brand.soft : 'rgba(37, 99, 235, 0.22)' },
                        },
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: { borderRadius: 4, height: 6 },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    head: {
                        fontSize: 12,
                        fontWeight: 800,
                        color: isLight ? ds.colors.text.secondary : '#cbd5e1',
                        backgroundColor: isLight ? '#f9fafb' : 'rgba(148, 163, 184, 0.06)',
                    },
                    root: {
                        borderBottomColor: isLight ? ds.colors.border.default : 'rgba(148, 163, 184, 0.14)',
                    },
                },
            },
            MuiTableRow: {
                styleOverrides: {
                    root: {
                        '&:hover': {
                            backgroundColor: isLight ? '#f9fafb' : 'rgba(148, 163, 184, 0.06)',
                        },
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    size: 'small',
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

