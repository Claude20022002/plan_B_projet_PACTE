import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import { frFR, enUS } from '@mui/material/locale';
import { useTranslation } from 'react-i18next';
import { FAMILLES, paletteDe, variablesCss } from '../design-system/familles';

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

const readStoredFamille = () => {
    try {
        const famille = localStorage.getItem('themeFamille');
        return FAMILLES.includes(famille) ? famille : 'planner';
    } catch {
        return 'planner';
    }
};

// Palette de la famille choisie (design-system/familles.js) habillée en thème MUI
const buildTheme = (mode, language, famille = 'planner') => {
    const p = paletteDe(famille, mode);
    const { rayon, libelle, bouton } = p;

    return createTheme(
        {
            palette: {
                mode,
                primary: {
                    main: p.primary,
                    dark: p.primaryDark,
                    light: p.primaryLight,
                    contrastText: p.contrastText,
                },
                secondary: {
                    main: '#F26322',
                    contrastText: '#1A0A02',
                },
                success: { main: p.success },
                warning: { main: p.warning },
                error: { main: p.error },
                info: { main: p.info },
                background: { default: p.ground, paper: p.surface },
                text: { primary: p.text, secondary: p.dim },
                divider: p.line,
                action: { hover: p.hover, selected: p.selected },
            },
            typography: {
                fontFamily: p.fontCorps,
                h1: { fontFamily: p.fontTitres, fontSize: '1.75rem', lineHeight: 1.15, fontWeight: 700, letterSpacing: '0.01em' },
                h2: { fontFamily: p.fontTitres, fontSize: '1.375rem', lineHeight: 1.2, fontWeight: 700, letterSpacing: '0.01em' },
                h3: { fontFamily: p.fontCorps, fontSize: '1.125rem', lineHeight: 1.25, fontWeight: 600, letterSpacing: '0.02em' },
                h4: { fontFamily: p.fontCorps, fontSize: '1.0625rem', lineHeight: 1.3, fontWeight: 600 },
                h5: { fontFamily: p.fontCorps, fontSize: '1rem', lineHeight: 1.3, fontWeight: 600 },
                h6: { fontFamily: p.fontCorps, fontSize: '1rem', lineHeight: 1.3, fontWeight: 600 },
                subtitle1: { fontSize: '0.9375rem', fontWeight: 600 },
                subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
                body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
                body2: { fontSize: '0.875rem', lineHeight: 1.5 },
                caption: { fontSize: '0.8125rem', lineHeight: 1.4 },
                overline: { ...libelle, fontSize: '0.75rem', lineHeight: 1.6 },
                button: { ...bouton, fontSize: '0.9375rem' },
            },
            shape: { borderRadius: rayon.md },
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
                        outlined: { borderColor: p.line },
                    },
                },
                MuiCard: {
                    defaultProps: { variant: 'outlined' },
                    styleOverrides: {
                        // Carte : filet et ombre douce (DESIGN.md, Elevation & Depth)
                        root: {
                            borderRadius: rayon.md,
                            borderColor: p.line,
                            boxShadow: p.ombreCarte,
                        },
                    },
                },
                MuiButton: {
                    defaultProps: { disableElevation: true },
                    styleOverrides: {
                        root: {
                            borderRadius: rayon.sm,
                            minHeight: 40,
                            paddingLeft: 16,
                            paddingRight: 16,
                        },
                        sizeSmall: { minHeight: 32, fontSize: '0.8125rem', paddingLeft: 10, paddingRight: 10 },
                        containedPrimary: {
                            '&:hover': { backgroundColor: p.primaryHover },
                        },
                        outlined: { borderColor: p.strong },
                    },
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: { borderRadius: rayon.sm },
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        // Pastille d'état : pilule ronde, libellé en capitales
                        root: {
                            ...libelle,
                            borderRadius: 999,
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
                            backgroundColor: p.surface,
                            borderBottom: `1px solid ${p.line}`,
                        },
                    },
                },
                MuiListItemButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: rayon.sm,
                            minHeight: 40,
                        },
                    },
                },
                MuiTableContainer: {
                    styleOverrides: {
                        root: { borderRadius: rayon.md },
                    },
                },
                MuiTableCell: {
                    styleOverrides: {
                        // En-têtes de colonnes : libellés en capitales sur gris doux, filets fins
                        head: {
                            ...libelle,
                            fontSize: '0.75rem',
                            color: p.dim,
                            backgroundColor: p.head,
                            borderBottom: `1px solid ${p.strong}`,
                            whiteSpace: 'nowrap',
                        },
                        root: {
                            borderBottomColor: p.line,
                            fontVariantNumeric: 'tabular-nums',
                        },
                    },
                },
                MuiTableRow: {
                    styleOverrides: {
                        root: {
                            '&.MuiTableRow-hover:hover': {
                                backgroundColor: p.hover,
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
                        root: { borderRadius: rayon.sm },
                    },
                },
                MuiTooltip: {
                    styleOverrides: {
                        tooltip: {
                            backgroundColor: p.tooltip.fond,
                            color: p.tooltip.texte,
                            fontSize: '0.8125rem',
                            borderRadius: rayon.sm,
                        },
                    },
                },
                MuiDialog: {
                    styleOverrides: {
                        paper: { borderRadius: rayon.lg },
                    },
                },
                MuiAlert: {
                    styleOverrides: {
                        root: { borderRadius: rayon.sm },
                    },
                },
                MuiLinearProgress: {
                    styleOverrides: {
                        root: { borderRadius: 2, height: 4 },
                    },
                },
                MuiTab: {
                    styleOverrides: {
                        root: { ...bouton, fontSize: '0.875rem', minHeight: 44 },
                    },
                },
            },
        },
        language === 'en' ? enUS : frFR
    );
};

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(readStoredMode);
    const [famille, setFamille] = useState(readStoredFamille);
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

    // Planner (panneau des départs) ou StudyLib (bibliothèque) : choisi dans les Paramètres, retenu sur le navigateur
    const memoriser = (cle, valeur) => {
        try {
            localStorage.setItem(cle, valeur);
        } catch {
            // Préférence non mémorisée : sans conséquence
        }
    };
    const choisirFamille = (suivante) => {
        if (!FAMILLES.includes(suivante)) return;
        setFamille(suivante);
        memoriser('themeFamille', suivante);
    };
    const choisirMode = (suivant) => {
        if (suivant !== 'light' && suivant !== 'dark') return;
        setMode(suivant);
        memoriser('themeMode', suivant);
    };

    const theme = useMemo(() => buildTheme(mode, i18n.language, famille), [mode, i18n.language, famille]);

    const value = { mode, toggleTheme, choisirMode, famille, choisirFamille, theme };

    return (
        <ThemeContext.Provider value={value}>
            <MUIThemeProvider theme={theme}>
                <GlobalStyles styles={{ ':root': variablesCss(famille, mode) }} />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
