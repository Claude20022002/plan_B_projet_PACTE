import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Card, CardActionArea, CardContent, Skeleton, Typography } from '@mui/material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageHeader from '../design-system/components/PageHeader';
import EmptyState from '../design-system/components/EmptyState';
import { espaceCoursAPI } from '../services/espaceCours';

/**
 * « Mes cours » de l'étudiant (docs/plans/espace-de-cours.md, § 5.3) : une carte par cours qui a
 * des supports publiés par ses enseignants. La Bibliothèque reste le lieu des documents de toute
 * l'école ; ici, seulement ceux de ses classes.
 */
export default function MesCours() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cours, setCours] = useState(null);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(
    () =>
      espaceCoursAPI
        .mesCours()
        .then((liste) => {
          setCours(liste);
          setErreur(false);
        })
        .catch(() => setErreur(true)),
    []
  );
  useEffect(() => {
    charger();
  }, [charger]);

  return (
    <DashboardLayout>
      <PageHeader title={t('espaceCours.mesCours')} subtitle={t('espaceCours.mesCoursAide')} />
      {erreur && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={charger}>{t('common.retry')}</Button>}>
          {t('common.errorLoad')}
        </Alert>
      )}
      {cours === null && !erreur && <Skeleton variant="rounded" height={120} />}
      {cours?.length === 0 && <EmptyState title={t('espaceCours.aucunCours')} description={t('espaceCours.aucunCoursAide')} />}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
        {cours?.map((c) => (
          <Card key={`${c.id_cours}:${c.id_groupe}`} variant="outlined">
            <CardActionArea onClick={() => navigate(`/mes-cours/${c.id_cours}/${c.id_groupe}`)} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
                  {c.nom_cours}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.code_cours} · {c.nom_groupe}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </DashboardLayout>
  );
}
