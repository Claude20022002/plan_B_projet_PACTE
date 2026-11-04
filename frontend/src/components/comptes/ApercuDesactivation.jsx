import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { localeEcran } from '../../utils/dates';

const Rubrique = ({ titre, children }) => (
    <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2">{titre}</Typography>
        {children}
    </Box>
);

const Liste = ({ lignes }) => (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {lignes.map((l, i) => (
            <Typography key={i} component="li" variant="body2">{l}</Typography>
        ))}
    </Box>
);

/**
 * Ce que la désactivation d'un compte touche, à partir de sa date d'effet (lot ME-17, « aperçu
 * puis appliquer ») : pour un enseignant ses séances à venir, ses services, ses responsabilités et
 * ses demandes de report ; pour un étudiant ses groupes. `apercu` est la réponse de
 * GET /users/:id/desactivation. Rien n'est modifié ici.
 */
export default function ApercuDesactivation({ apercu }) {
    const { t, i18n } = useTranslation();
    const jour = (date) => new Date(`${date}T00:00:00`).toLocaleDateString(localeEcran(i18n.language), { weekday: 'short', day: 'numeric', month: 'short' });
    const { seances = [], services = [], responsabilites, demandes_report_en_cours: demandes = 0, groupes = [] } = apercu;
    const filieres = responsabilites?.filieres ?? [];
    const modules = responsabilites?.modules ?? [];
    const rien = !seances.length && !services.length && !filieres.length && !modules.length && !demandes && !groupes.length;

    return (
        <Box>
            {rien && <Typography variant="body2" color="text.secondary">{t('comptes.apercu.rien')}</Typography>}
            {seances.length > 0 && (
                <Rubrique titre={t('comptes.apercu.seances', { count: seances.length })}>
                    <Liste lignes={seances.slice(0, 8).map((s) => `${jour(s.date)} ${s.heure_debut ?? ''}-${s.heure_fin ?? ''} · ${s.module ?? ''} · ${s.groupe ?? ''}`)} />
                    {seances.length > 8 && <Typography variant="caption" color="text.secondary">{t('comptes.apercu.etAutres', { count: seances.length - 8 })}</Typography>}
                </Rubrique>
            )}
            {services.length > 0 && (
                <Rubrique titre={t('comptes.apercu.services', { count: services.length })}>
                    <Liste lignes={services.map((s) => `${s.module ?? ''} (${s.nature ?? ''}) · ${s.periode}`)} />
                </Rubrique>
            )}
            {(filieres.length > 0 || modules.length > 0) && (
                <Rubrique titre={t('comptes.apercu.responsabilites')}>
                    <Liste lignes={[...filieres.map((f) => t('comptes.apercu.filiere', { nom: f.nom ?? f.code })), ...modules.map((m) => t('comptes.apercu.module', { nom: m.nom ?? m.code }))]} />
                </Rubrique>
            )}
            {demandes > 0 && <Rubrique titre={t('comptes.apercu.demandes', { count: demandes })} />}
            {groupes.length > 0 && (
                <Rubrique titre={t('comptes.apercu.groupes', { count: groupes.length })}>
                    <Liste lignes={groupes.map((g) => `${g.nom_groupe}${g.effectif ? ` · ${t('comptes.apercu.effectif', { count: g.effectif })}` : ''}`)} />
                    <Typography variant="caption" color="text.secondary">{t('comptes.apercu.effectifAide')}</Typography>
                </Rubrique>
            )}
            {apercu.compte?.role === 'enseignant' && apercu.a_traiter > 0 && <Alert severity="warning" sx={{ mt: 1 }}>{t('comptes.apercu.bloquant')}</Alert>}
        </Box>
    );
}
