import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Skeleton, Typography } from '@mui/material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageHeader from '../design-system/components/PageHeader';
import CarteClasse from '../components/mesClasses/CarteClasse';
import SeanceEnCours from '../components/mesClasses/SeanceEnCours';
import { cleClasse, minutesAvantFin, nomClasse } from '../components/mesClasses/classe';
import { enseignantAPI } from '../services/api';
import { DEVOIRS_ACTIFS } from '../../../shared/fonctions.js';
import useLiveRefresh from '../hooks/useLiveRefresh';
import { localeEcran } from '../utils/dates';

// Le rappel de l'appel s'affiche dans les dernières minutes de la séance (le serveur envoie
// aussi une notification, même page fermée : RAPPEL_APPEL_MINUTES)
const RAPPEL_MINUTES = 5;

/**
 * Mes classes (enseignant, lot E-4) : en tête, la séance en cours et son action principale
 * (l'appel) ; dessous, une carte par classe, qui ouvre l'espace de la classe.
 * Dans les 5 dernières minutes d'une séance sans appel terminé, un rappel s'affiche.
 */
export default function MesClasses() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [maintenant, setMaintenant] = useState(() => new Date());
  const locale = localeEcran(i18n.language);

  const charger = useCallback(
    () =>
      enseignantAPI
        .mesClasses()
        .then((liste) => {
          setClasses(Array.isArray(liste) ? liste : []);
          setErreur(false);
        })
        .catch(() => setErreur(true))
        .finally(() => setMaintenant(new Date())),
    []
  );

  useEffect(() => {
    charger();
  }, [charger]);
  useLiveRefresh(charger);

  const enCours = useMemo(() => (classes ?? []).filter((c) => c.en_cours && c.prochaine_seance), [classes]);
  const aRappeler = enCours.filter((c) => c.prochaine_seance.appel !== 'ferme' && minutesAvantFin(c.prochaine_seance, maintenant) <= RAPPEL_MINUTES);

  const ouvrirAppel = (seance) => navigate(`/appel/${seance.id_affectation}`);
  // L'espace de la classe (supports, appel, élèves) ; `onglet` ouvre directement l'un d'eux
  const ouvrirEspace = (c, onglet = null) => navigate(`/mes-classes/${c.id_cours}/${c.id_groupe}${onglet ? `?onglet=${onglet}` : ''}`);
  const options = { devoirs: DEVOIRS_ACTIFS };

  return (
    <DashboardLayout>
      <PageHeader title={t('classes.page.titre')} subtitle={t('classes.page.sousTitre')} />
      {erreur && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={charger}>{t('common.retry')}</Button>}>
          {t('common.errorLoad')}
        </Alert>
      )}
      {aRappeler.map((c) => (
        <Alert
          key={cleClasse(c)}
          severity="warning"
          role="alert"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => ouvrirAppel(c.prochaine_seance)}>
              {t(`classes.page.appel.${c.prochaine_seance.appel}`)}
            </Button>
          }
        >
          {t(c.prochaine_seance.appel === 'ouvert' ? 'classes.page.rappelTerminer' : 'classes.page.rappelFaire', { classe: nomClasse(c), fin: c.prochaine_seance.heure_fin })}
        </Alert>
      ))}

      <Box sx={{ display: 'grid', gap: 3 }}>
        {classes === null && !erreur && <Skeleton variant="rectangular" height={160} />}
        {classes?.length === 0 && <Alert severity="info">{t('classes.aucune')}</Alert>}

        {enCours.map((c) => (
          <SeanceEnCours
            key={cleClasse(c)}
            classe={c}
            locale={locale}
            options={options}
            onAppel={ouvrirAppel}
            onDevoir={(cl) => navigate('/jeux', { state: { donnerDevoir: { id_cours: cl.id_cours, id_groupe: cl.id_groupe } } })}
            onSupports={(cl) => ouvrirEspace(cl)}
          />
        ))}

        {classes?.length > 0 && (
          <Box component="section" aria-labelledby="classes-toutes">
            <Typography id="classes-toutes" variant="h6" component="h2" sx={{ mb: 1.5, fontWeight: 600 }}>
              {t('classes.page.cartes')}
            </Typography>
            {/* Une carte par classe, la classe en cours comprise : c'est la porte de son espace */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
              {classes.map((c) => (
                <CarteClasse key={cleClasse(c)} classe={c} locale={locale} onOuvrir={ouvrirEspace} />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
