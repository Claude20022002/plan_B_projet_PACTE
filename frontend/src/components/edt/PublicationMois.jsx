import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertTitle, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { Send } from '@mui/icons-material';
import ConfirmDialog from '../common/ConfirmDialog';
import usePublicationMois from './usePublicationMois';

/**
 * Publication du mois d'une filière, sur la page « EDT du mois » (administration et responsable).
 * Les étudiants voient la version publiée (décision du 21 octobre 2026) : un changement en masse
 * (génération, import, préparation) ne leur parvient qu'à la publication suivante. Trois cas :
 * jamais publié (« Publier et envoyer ») ; publié avec des changements non publiés, classe par
 * classe (`onChoisirClasse(id)` affiche la classe), et « Publier les changements » ; publié et à jour.
 * `groupe` : la classe affichée ; la publication vaut pour toute sa filière.
 */
export default function PublicationMois({ mois, groupe, onChoisirClasse }) {
    const { t, i18n } = useTranslation();
    const { etat, envoi, publier } = usePublicationMois(mois, groupe?.id_filiere ?? null);
    const [confirmer, setConfirmer] = useState(false);
    if (!etat) return null;

    const aRepublier = etat.classes_a_republier ?? [];
    const cas = !etat.publie ? 'premiere' : aRepublier.length ? 'changements' : 'aJour';
    const filiere = groupe.filiere?.code_filiere ?? groupe.nom_groupe;
    const date = etat.dernier_envoi ? new Date(etat.dernier_envoi).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const bouton = (libelle) => (
        <Button variant="contained" size="small" startIcon={<Send />} onClick={() => setConfirmer(true)} disabled={envoi} sx={{ mt: 1.5 }}>
            {libelle}
        </Button>
    );

    return (
        <Box sx={{ mt: 1.5 }}>
            {cas === 'premiere' && (
                <Alert severity="info">
                    {t('monthly.envoi.etatNonPublie')}
                    <Box>{bouton(t('monthly.envoi.publier'))}</Box>
                </Alert>
            )}
            {cas === 'changements' && (
                <Alert severity="warning">
                    <AlertTitle>{t('monthly.envoi.changementsTitre')}</AlertTitle>
                    {t('monthly.envoi.changementsTexte', { date })}
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {aRepublier.map((c) => (
                            <Chip
                                key={c.id_groupe}
                                size="small"
                                label={`${c.nom_groupe} · ${t('monthly.envoi.nbChangements', { count: c.changements })}`}
                                onClick={() => onChoisirClasse(c.id_groupe)}
                                variant={c.id_groupe === groupe.id_groupe ? 'filled' : 'outlined'}
                            />
                        ))}
                    </Stack>
                    <Box>{bouton(t('monthly.envoi.publierChangements'))}</Box>
                </Alert>
            )}
            {cas === 'aJour' && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                    {t('monthly.envoi.etatPublie', { date, count: etat.destinataires })} {t('monthly.envoi.aJour')}
                </Typography>
            )}
            <ConfirmDialog
                open={confirmer}
                title={t(cas === 'changements' ? 'monthly.envoi.confirmerChangementsTitre' : 'monthly.envoi.confirmerTitre')}
                message={t(cas === 'changements' ? 'monthly.envoi.confirmerChangementsMessage' : 'monthly.envoi.confirmerMessage', { filiere })}
                confirmLabel={t(cas === 'changements' ? 'monthly.envoi.publierChangements' : 'monthly.envoi.publier')}
                confirmColor="primary"
                onConfirm={() => {
                    setConfirmer(false);
                    publier();
                }}
                onCancel={() => setConfirmer(false)}
            />
        </Box>
    );
}
