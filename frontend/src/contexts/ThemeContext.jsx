import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { frFR, enUS } from '@mui/material/locale';
import { useTranslation } from 'react-i18next';
import { ds } from '../design-system/tokens';

const ThemeContext = createContext(null);

// Le hook vit avec son provider (même convention que AuthContext)
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme doit être utilisé dans un ThemeProvider');
    }
    return context;
};

const readStoredMode = () => {
    try {
        return localStorage.getItem('themeMode') === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

// Vocabulaire « volet » : capitales condensées espacées (en-têtes, boutons, horaires, codes)
const flapLabel = {
    fontFamily: ds.font.board,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
};

const buildTheme = (mode, language) => {
    const isLight = mode === 'light';
    const c = ds.colors;
    const b = ds.board;

    const surface = isLight ? c.bg.surface : b.cell;
    const ground = isLight ? c.bg.app : b.ground;
    const line = isLight ? c.border.default : b.seam;
    const textPrimary = isLight ? c.text.primary : b.letter;
    const textSecondary = isLight ? c.text.secondary : b.letterDim;

    return createTheme(
        {
            palette: {
                mode,
                primary: {
                    main: isLight ? ds.brand.navy : '#8FA6F0',
                    dark: ds.brand.navyDeep,
                    light: '#3350A8',
                    contrastText: isLight ? '#FFFFFF' : b.ground,
                },
                secondary: {
                    main: ds.brand.orange,
                    contrastText: '#1A0A02',
                },
                success: { main: isLight ? c.success.text : b.live },
                warning: { main: isLight ? c.warning.text : b.delayed },
                error: { main: isLight ? c.danger.text : b.cancelled },
                info: { main: isLight ? c.info.text : '#8FA6F0' },
                background: { default: ground, paper: surface },
                text: { primary: textPrimary, secondary: textSecondary },
                divider: line,
                action: {
                    hover: isLight ? '#EEF0F5' : 'rgba(242, 241, 236, 0.06)',
                    selected: isLight ? ds.brand.navySoft : 'rgba(143, 166, 240, 0.16)',
                },
            },
            typography: {
                fontFamily: ds.font.body,
                h1: { fontFamily: ds.font.board, fontSize: '1.75rem', lineHeight: 1.15, fontWeight: 700, letterSpacing: '0.01em' },
                h2: { fontFamily: ds.font.board, fontSize: '1.375rem', lineHeight: 1.2, fontWeight: 700, letterSpacing: '0.01em' },
                h3: { fontFamily: ds.font.board, fontSize: '1.125rem', lineHeight: 1.25, fontWeight: 600, letterSpacing: '0.02em' },
                h4: { fontFamily: ds.font.board, fontSize: '1.0625rem', lineHeight: 1.3, fontWeight: 600 },
                h5: { fontFamily: ds.font.board, fontSize: '1rem', lineHeight: 1.3, fontWeight: 600 },
                h6: { fontFamily: ds.font.board, fontSize: '1rem', lineHeight: 1.3, fontWeight: 600 },
                subtitle1: { fontSize: '0.9375rem', fontWeight: 600 },
                subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
                body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
                body2: { fontSize: '0.875rem', lineHeight: 1.5 },
                caption: { fontSize: '0.8125rem', lineHeight: 1.4 },
                overline: { ...flapLabel, fontSize: '0.75rem', lineHeight: 1.6, letterSpacing: '0.1em' },
                button: { ...flapLabel, fontSize: '0.9375rem' },
            },
            shape: { borderRadius: ds.radius.md },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        body: {
                            backgroundImage: 'none',
                            fontVariantNumeric: 'tabular-nums',
                        },
                    },
                },
                MuiPaper: {
                    defaultProps: { elevation: 0 },
                    styleOverrides: {
                        root: { backgroundImage: 'none' },
                        outlined: { borderColor: line },
                    },
                },
                MuiCard: {
                    defaultProps: { variant: 'outlined' },
                    styleOverrides: {
                        root: {
                            borderRadius: ds.radius.md,
                            borderColor: line,
                            boxShadow: 'none',
                        },
                    },
                },
                MuiButton: {
                    defaultProps: { disableElevation: true },
                    styleOverrides: {
                        root: {
                            borderRadius: ds.radius.sm,
                            minHeight: 40,
                            paddingLeft: 16,
                            paddingRight: 16,
                        },
                        sizeSmall: { minHeight: 32, fontSize: '0.8125rem', paddingLeft: 10, paddingRight: 10 },
                        containedPrimary: {
                            '&:hover': { backgroundColor: isLight ? ds.brand.navyDeep : '#A9BBF4' },
                        },
                        outlined: { borderColor: isLight ? c.border.strong : b.seam },
                    },
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: { borderRadius: ds.radius.sm },
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        // Pastille = petit volet : angles presque droits, capitales condensées
                        root: {
                            ...flapLabel,
                            borderRadius: ds.radius.xs,
                            fontSize: '0.75rem',
                            letterSpacing: '0.08em',
                            height: 26,
                        },
                    },
                },
                MuiAppBar: {
                    defaultProps: { elevation: 0, color: 'inherit' },
                    styleOverrides: {
                        root: {
                            backgroundImage: 'none',
                            backgroundColor: surface,
                            borderBottom: `1px solid ${line}`,
                        },
                    },
                },
                MuiListItemButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: ds.radius.sm,
                            minHeight: 40,
                        },
                    },
                },
                MuiTableContainer: {
                    styleOverrides: {
                        root: { borderRadius: ds.radius.md },
                    },
                },
                MuiTableCell: {
                    styleOverrides: {
                        // En-têtes de colonnes comme sur un panneau : capitales condensées, filets fins
                        head: {
                            ...flapLabel,
                            fontSize: '0.75rem',
                            letterSpacing: '0.1em',
                            color: textSecondary,
                            backgroundColor: isLight ? '#F6F7FA' : b.ground,
                            borderBottom: `1px solid ${isLight ? c.border.strong : b.seam}`,
                            whiteSpace: 'nowrap',
                        },
                        root: {
                            borderBottomColor: line,
                            fontVariantNumeric: 'tabular-nums',
                        },
                    },
                },
                MuiTableRow: {
                    styleOverrides: {
                        root: {
                            '&.MuiTableRow-hover:hover': {
                                backgroundColor: isLight ? '#F6F7FA' : 'rgba(242, 241, 236, 0.04)',
                            },
                        },
                    },
                },
                MuiTablePagination: {
                    styleOverrides: {
                        selectLabel: { fontSize: '0.8125rem' },
                        displayedRows: { fontSize: '0.8125rem' },
                    },
                },
                MuiTextField: {
                    defaultProps: { size: 'small' },
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: { borderRadius: ds.radius.sm },
                    },
                },
                MuiTooltip: {
                    styleOverrides: {
                        tooltip: {
                            backgroundColor: b.ground,
                            color: b.letter,
                            fontSize: '0.8125rem',
                            borderRadius: ds.radius.sm,
                        },
                    },
                },
                MuiDialog: {
                    styleOverrides: {
                        paper: { borderRadius: ds.radius.lg },
                    },
                },
                MuiAlert: {
                    styleOverrides: {
                        root: { borderRadius: ds.radius.sm },
                    },
                },
                MuiLinearProgress: {
                    styleOverrides: {
                        root: { borderRadius: 2, height: 4 },
                    },
                },
                MuiTab: {
                    styleOverrides: {
                        root: { ...flapLabel, fontSize: '0.875rem', minHeight: 44 },
                    },
                },
            },
        },
        language === 'en' ? enUS : frFR
    );
};

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(readStoredMode);
    const { i18n } = useTranslation();

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem('themeMode', newMode);
            } catch {
                // Préférence non mémorisée : sans conséquence
            }
            return newMode;
        });
    };

    const theme = useMemo(() => buildTheme(mode, i18n.language), [mode, i18n.language]);

    const value = { mode, toggleTheme, theme };

    return (
        <ThemeContext.Provider value={value}>
            <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
