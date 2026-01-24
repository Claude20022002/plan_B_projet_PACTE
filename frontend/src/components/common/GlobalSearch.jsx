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

const getEntityPath = (type, id) => {
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
            // Recherche dans toutes les entités
            const [sallesRes, enseignantsRes, coursRes, groupesRes, affectationsRes, etudiantsRes] = await Promise.allSettled([
                fetch(`http://localhost:5000/api/salles?search=${encodeURIComponent(term)}`).then(r => r.json()),
                fetch(`http://localhost:5000/api/enseignants?search=${encodeURIComponent(term)}`).then(r => r.json()),
                fetch(`http://localhost:5000/api/cours?search=${encodeURIComponent(term)}`).then(r => r.json()),
                fetch(`http://localhost:5000/api/groupes?search=${encodeURIComponent(term)}`).then(r => r.json()),
                fetch(`http://localhost:5000/api/affectations?search=${encodeURIComponent(term)}`).then(r => r.json()),
                fetch(`http://localhost:5000/api/etudiants?search=${encodeURIComponent(term)}`).then(r => r.json()),
            ]);

            const allResults = [];
            
            if (sallesRes.status === 'fulfilled' && sallesRes.value.data) {
                sallesRes.value.data.forEach(item => {
                    allResults.push({ ...item, type: 'salle', label: item.nom_salle });
                });
            }
            if (enseignantsRes.status === 'fulfilled' && enseignantsRes.value.data) {
                enseignantsRes.value.data.forEach(item => {
                    allResults.push({ ...item, type: 'enseignant', label: `${item.prenom} ${item.nom}` });
                });
            }
            if (coursRes.status === 'fulfilled' && coursRes.value.data) {
                coursRes.value.data.forEach(item => {
                    allResults.push({ ...item, type: 'cours', label: item.nom_cours });
                });
            }
            if (groupesRes.status === 'fulfilled' && groupesRes.value.data) {
                groupesRes.value.data.forEach(item => {
                    allResults.push({ ...item, type: 'groupe', label: item.nom_groupe });
                });
            }
            if (affectationsRes.status === 'fulfilled' && affectationsRes.value.data) {
                affectationsRes.value.data.forEach(item => {
                    allResults.push({ ...item, type: 'affectation', label: `Affectation ${item.id_affectation}` });
                });
            }
            if (etudiantsRes.status === 'fulfilled' && etudiantsRes.value.data) {
                etudiantsRes.value.data.forEach(item => {
                    allResults.push({ ...item, type: 'etudiant', label: `${item.prenom} ${item.nom}` });
                });
            }

            setResults(allResults.slice(0, 10)); // Limiter à 10 résultats
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (result) => {
        const path = getEntityPath(result.type, result.id);
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
