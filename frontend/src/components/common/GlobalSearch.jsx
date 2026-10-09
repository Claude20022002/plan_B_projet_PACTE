import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Typography,
    InputAdornment,
    IconButton,
    CircularProgress,
    Divider,
} from '@mui/material';
import {
    Search,
    Close,
    Room,
    School,
    Book,
    Groups,
    Schedule,
    Person,
} from '@mui/icons-material';
import { salleAPI, enseignantAPI, coursAPI, groupeAPI, etudiantAPI } from '../../services/api';

// Insensible à la casse et aux accents (« etudiant » trouve « Étudiant »)
const normalize = (value) =>
    String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const personLabel = (item) => {
    const person = item.user || item;
    return [person.prenom, person.nom].filter(Boolean).join(' ');
};

const SEARCH_SOURCES = [
    { type: 'salle', load: salleAPI.getAll, label: (item) => item.nom_salle },
    { type: 'enseignant', load: enseignantAPI.getAll, label: personLabel },
    { type: 'cours', load: coursAPI.getAll, label: (item) => item.nom_cours },
    { type: 'groupe', load: groupeAPI.getAll, label: (item) => item.nom_groupe },
    { type: 'etudiant', load: etudiantAPI.getAll, label: personLabel },
];

const getEntityIcon = (type) => {
    const icons = {
        salle: <Room />,
        enseignant: <School />,
        cours: <Book />,
        groupe: <Groups />,
        affectation: <Schedule />,
        etudiant: <Person />,
    };
    return icons[type] || <Search />;
};

const getEntityPath = (type) => {
    const paths = {
        salle: `/gestion/salles`,
        enseignant: `/gestion/enseignants`,
        cours: `/gestion/cours`,
        groupe: `/gestion/groupes`,
        affectation: `/gestion/affectations`,
        etudiant: `/gestion/etudiants`,
    };
    return paths[type] || '/';
};

export default function GlobalSearch({ open, onClose }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchTerm.length >= 2) {
                performSearch(searchTerm);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const performSearch = async (term) => {
        setLoading(true);
        try {
            // Passe par le client API commun (même origine, cookies, CSRF).
            // L'API ne filtre pas encore par texte : on charge une page et on filtre ici.
            const params = { limit: 100 };
            const settled = await Promise.allSettled(
                SEARCH_SOURCES.map((source) => source.load(params))
            );

            const needle = normalize(term);
            const allResults = [];
            settled.forEach((outcome, index) => {
                if (outcome.status !== 'fulfilled') return;
                const { type, label } = SEARCH_SOURCES[index];
                const items = outcome.value?.data || outcome.value || [];
                items.forEach((item) => {
                    const text = label(item);
                    if (text && normalize(text).includes(needle)) {
                        allResults.push({ ...item, type, label: text });
                    }
                });
            });

            setResults(allResults.slice(0, 10)); // Limiter à 10 résultats
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (result) => {
        const path = getEntityPath(result.type);
        navigate(path);
        onClose();
        setSearchTerm('');
        setResults([]);
    };

    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1300,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                pt: 10,
            }}
            onClick={onClose}
        >
            <Paper
                elevation={24}
                sx={{
                    width: '90%',
                    maxWidth: 600,
                    mt: 8,
                    maxHeight: '70vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <TextField
                        inputRef={searchRef}
                        fullWidth
                        placeholder="Rechercher (salles, cours, enseignants, groupes...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <Close />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        autoFocus
                    />
                </Box>

                <Box sx={{ overflow: 'auto', flex: 1 }}>
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}

                    {!loading && searchTerm.length < 2 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Tapez au moins 2 caractères pour rechercher
                            </Typography>
                        </Box>
                    )}

                    {!loading && searchTerm.length >= 2 && results.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Aucun résultat trouvé
                            </Typography>
                        </Box>
                    )}

                    {!loading && results.length > 0 && (
                        <List>
                            {results.map((result, index) => (
                                <React.Fragment key={`${result.type}-${result.id || index}`}>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => handleResultClick(result)}>
                                            <ListItemIcon>
                                                {getEntityIcon(result.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={result.label}
                                                secondary={result.type}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    {index < results.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
