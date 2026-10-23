import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
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

const FAMILLES = ['planner', 'studylib'];

const readStoredFamille = () => {
    try {
        const famille = localStorage.getItem('themeFamille');
        return FAMILLES.includes(famille) ? famille : 'planner';
    } catch {
        return 'planner';
    }
};

// Thème de la bibliothèque StudyLib (mêmes valeurs que l'application : mobile/src/theme.js) :
// Inter, bleu #1D4ED8, gris ardoise, coins plus arrondis, casse normale.
const STUDYLIB = {
    font: '"Inter", "Segoe UI", system-ui, sans-serif',
    radius: { xs: 6, sm: 10, md: 14, lg: 18 },
    clair: { ground: '#F8FAFC', surface: '#FFFFFF', line: '#E2E8F0', strong: '#CBD5E1', text: '#0F172A', dim: '#64748B', primary: '#1D4ED8', primaryDark: '#1E3A8A', head: '#F1F5F9', hover: '#EFF6FF', selected: '#DBEAFE' },
    sombre: { ground: '#0F172A', surface: '#1E293B', line: '#334155', strong: '#475569', text: '#F1F5F9', dim: '#94A3B8', primary: '#60A5FA', primaryDark: '#93C5FD', head: '#0F172A', hover: 'rgba(241, 245, 249, 0.06)', selected: 'rgba(96, 165, 250, 0.16)' },
};

// Panneau des séances et menu en thème StudyLib : plus de fond noir ni de marine, les gris ardoise
// et le bleu de la bibliothèque. Ils remplacent les variables CSS de design-system/tokens.js.
const PANNEAU_STUDYLIB = {
    clair: {
        board: { titre: '#0F172A', ground: '#FFFFFF', frame: '#E2E8F0', cell: '#F1F5F9', cellHinge: '#CBD5E1', seam: '#E2E8F0', letter: '#0F172A', letterDim: '#64748B', onTime: '#0F172A', live: '#15803D', delayed: '#B45309', cancelled: '#DC2626' },
        nav: { fond: '#FFFFFF', letter: '#0F172A', letterSoft: '#334155', letterDim: '#64748B', icon: '#64748B', selection: '#DBEAFE', survol: '#F1F5F9', filet: '#E2E8F0', bordBouton: '#CBD5E1', boutonActif: '#DBEAFE' },
    },
    sombre: {
        board: { titre: '#F1F5F9', ground: '#1E293B', frame: '#334155', cell: '#0F172A', cellHinge: '#020617', seam: '#334155', letter: '#F1F5F9', letterDim: '#94A3B8', onTime: '#F1F5F9', live: '#4ADE80', delayed: '#FB923C', cancelled: '#F87171' },
        nav: { fond: '#0F172A', letter: '#F1F5F9', letterSoft: '#CBD5E1', letterDim: '#94A3B8', icon: '#94A3B8', selection: 'rgba(96, 165, 250, 0.16)', survol: 'rgba(241, 245, 249, 0.06)', filet: '#1E293B', bordBouton: '#334155', boutonActif: 'rgba(96, 165, 250, 0.16)' },
    },
};

const variablesCss = (famille, mode) => {
    if (famille !== 'studylib') return {};
    const { board, nav } = PANNEAU_STUDYLIB[mode === 'light' ? 'clair' : 'sombre'];
    return {
        ...Object.fromEntries(Object.entries(board).map(([cle, valeur]) => [`--board-${cle}`, valeur])),
        ...Object.fromEntries(Object.entries(nav).map(([cle, valeur]) => [`--nav-${cle}`, valeur])),
    };
};

// Vocabulaire « volet » : capitales condensées espacées (en-têtes, boutons, horaires, codes)
const flapLabelPlanner = {
    fontFamily: ds.font.board,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
};

const buildTheme = (mode, language, famille = 'planner') => {
    const isLight = mode === 'light';
    const sl = famille === 'studylib';
    const p = sl ? STUDYLIB[isLight ? 'clair' : 'sombre'] : null;
    const c = ds.colors;
    const b = ds.boardBrut;
    const fontTitres = sl ? STUDYLIB.font : ds.font.board;
    const fontCorps = sl ? STUDYLIB.font : ds.font.body;
    const rayon = sl ? STUDYLIB.radius : ds.radius;
    const flapLabel = sl ? { fontFamily: STUDYLIB.font, fontWeight: 600, textTransform: 'none', letterSpacing: 0 } : flapLabelPlanner;

    const surface = sl ? p.surface : isLight ? c.bg.surface : b.cell;
    const ground = sl ? p.ground : isLight ? c.bg.app : b.ground;
    const line = sl ? p.line : isLight ? c.border.default : b.seam;
    const textPrimary = sl ? p.text : isLight ? c.text.primary : b.letter;
    const textSecondary = sl ? p.dim : isLight ? c.text.secondary : b.letterDim;
    const strong = sl ? p.strong : isLight ? c.border.strong : b.seam;
    const enteteTableau = sl ? p.head : isLight ? '#F6F7FA' : b.ground;

    return createTheme(
        {
            palette: {
                mode,
                primary: {
                    main: sl ? p.primary : isLight ? ds.brand.navy : '#8FA6F0',
                    dark: sl ? p.primaryDark : ds.brand.navyDeep,
                    light: sl ? '#3B82F6' : '#3350A8',
                    contrastText: sl ? (isLight ? '#FFFFFF' : '#0F172A') : isLight ? '#FFFFFF' : b.ground,
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
                    hover: sl ? p.hover : isLight ? '#EEF0F5' : 'rgba(242, 241, 236, 0.06)',
                    selected: sl ? p.selected : isLight ? ds.brand.navySoft : 'rgba(143, 166, 240, 0.16)',
                },
            },
            typography: {
                fontFamily: fontCorps,
                h1: { fontFamily: fontTitres, fontSize: '1.75rem', lineHeight: 1.15, fontWeight: 700, letterSpacing: '0.01em' },
                h2: { fontFamily: fontTitres, fontSize: '1.375rem', lineHeight: 1.2, fontWeight: 700, letterSpacing: '0.01em' },
                h3: { fontFamily: fontTitres, fontSize: '1.125rem', lineHeight: 1.25, fontWeight: 600, letterSpacing: '0.02em' },
                h4: { fontFamily: fontTitres, fontSize: '1.0625rem', lineHeight: 1.3, fontWeight: 600 },
                h5: { fontFamily: fontTitres, fontSize: '1rem', lineHeight: 1.3, fontWeight: 600 },
                h6: { fontFamily: fontTitres, fontSize: '1rem', lineHeight: 1.3, fontWeight: 600 },
                subtitle1: { fontSize: '0.9375rem', fontWeight: 600 },
                subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
                body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
                body2: { fontSize: '0.875rem', lineHeight: 1.5 },
                caption: { fontSize: '0.8125rem', lineHeight: 1.4 },
                overline: { ...flapLabel, fontSize: '0.75rem', lineHeight: 1.6, letterSpacing: '0.1em' },
                button: { ...flapLabel, fontSize: '0.9375rem' },
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
                        outlined: { borderColor: line },
                    },
                },
                MuiCard: {
                    defaultProps: { variant: 'outlined' },
                    styleOverrides: {
                        root: {
                            borderRadius: rayon.md,
                            borderColor: line,
                            boxShadow: 'none',
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
                            '&:hover': { backgroundColor: sl ? p.primaryDark : isLight ? ds.brand.navyDeep : '#A9BBF4' },
                        },
                        outlined: { borderColor: strong },
                    },
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: { borderRadius: rayon.sm },
                    },
                },
                MuiToggleButton: {
                    styleOverrides: {
                        // Par défaut, noir à 54 % : 4,49:1 sur le fond de page, sous le seuil de 4,5 (WCAG 1.4.3)
                        root: { color: textSecondary },
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        // Pastille = petit volet : angles presque droits, capitales condensées
                        root: {
                            ...flapLabel,
                            borderRadius: rayon.xs,
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
                        // En-têtes de colonnes comme sur un panneau : capitales condensées, filets fins
                        head: {
                            ...flapLabel,
                            fontSize: '0.75rem',
                            letterSpacing: '0.1em',
                            color: textSecondary,
                            backgroundColor: enteteTableau,
                            borderBottom: `1px solid ${strong}`,
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
                                backgroundColor: sl ? p.hover : isLight ? '#F6F7FA' : 'rgba(242, 241, 236, 0.04)',
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
                            backgroundColor: b.ground,
                            color: b.letter,
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
