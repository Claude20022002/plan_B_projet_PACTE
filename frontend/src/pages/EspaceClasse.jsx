import { useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Breadcrumbs, Button, Link, Skeleton, Stack, Tab, Tabs } from '@mui/material';
import { Add, CreateNewFolder } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageHeader from '../design-system/components/PageHeader';
import EmptyState from '../design-system/components/EmptyState';
import SectionCours from '../components/espaceCours/SectionCours';
import SaisieDialog from '../components/espaceCours/SaisieDialog';
import OngletAppel from '../components/espaceCours/OngletAppel';
import OngletEleves from '../components/espaceCours/OngletEleves';
import useEspaceCours from '../hooks/useEspaceCours';
import { espaceCoursAPI } from '../services/espaceCours';
import { useAuth } from '../contexts/AuthContext';

const ONGLETS = ['supports', 'appel', 'eleves'];

/**
 * Espace de cours d'une classe (docs/plans/espace-de-cours.md, § 5.2). L'enseignant y a trois
 * onglets : les supports rangés en sections, l'appel (séances et bilans) et les élèves (taux de
 * présence, export) ; l'onglet est gardé dans l'adresse. L'étudiant ne voit que les supports.
 */
export default function EspaceClasse() {
  const { idCours, idGroupe } = useParams();
  const [parametres, setParametres] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Fenêtre de saisie partagée par toutes les actions : une promesse résolue à la validation
  const [saisie, setSaisie] = useState(null);
  const resoudre = useRef(null);
  const saisir = (options) =>
    new Promise((resolve) => {
      resoudre.current = resolve;
      setSaisie(options);
    });
  const fermerSaisie = (valeurs) => {
    resoudre.current?.(valeurs);
    resoudre.current = null;
    setSaisie(null);
  };

  const { espace, erreur, charger, ouvrir, actionSupport, actionSection, nouvelleSection } = useEspaceCours(idCours, idGroupe, saisir);
  const gere = Boolean(espace?.gere);
  const sections = espace?.sections ?? [];
  const onglet = gere && ONGLETS.includes(parametres.get('onglet')) ? parametres.get('onglet') : 'supports';
  const retour = user?.role === 'etudiant' ? { libelle: t('espaceCours.mesCours'), chemin: '/mes-cours' } : { libelle: t('classes.page.titre'), chemin: '/mes-classes' };
  const nomFichier = espace ? `presences-${espace.classe.code_cours}-${espace.classe.nom_groupe}.csv` : 'presences.csv';

  // Première section créée d'un geste : « Général »
  const commencer = async () => {
    await espaceCoursAPI.creerSection(idCours, idGroupe, t('espaceCours.general'));
    await charger();
  };

  const supports = (
    <>
      {espace && sections.length === 0 && (
        <EmptyState
          title={t(gere ? 'espaceCours.videEnseignant' : 'espaceCours.videEtudiant')}
          description={gere ? t('espaceCours.videEnseignantAide') : undefined}
          actionLabel={gere ? t('espaceCours.commencer') : undefined}
          onAction={gere ? commencer : undefined}
          icon={<Add />}
        />
      )}
      <Stack spacing={2}>
        {sections.map((s, i) => (
          <SectionCours
            key={s.id_section}
            section={s}
            sections={sections}
            gere={gere}
            premiere={i === 0}
            derniere={i === sections.length - 1}
            onOuvrir={ouvrir}
            onActionSupport={actionSupport}
            onActionSection={actionSection}
            onRecharger={charger}
          />
        ))}
      </Stack>
      {/* Une seule action par écran : « Nouvelle section » est sous la dernière section */}
      {gere && sections.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Button startIcon={<CreateNewFolder />} onClick={nouvelleSection} sx={{ textTransform: 'none' }}>
            {t('espaceCours.nouvelleSection')}
          </Button>
        </Box>
      )}
    </>
  );

  return (
    <DashboardLayout>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate(retour.chemin)}>
          {retour.libelle}
        </Link>
        <span>{espace ? `${espace.classe.nom_cours} · ${espace.classe.nom_groupe}` : '…'}</span>
      </Breadcrumbs>
      <PageHeader title={espace?.classe.nom_cours ?? t('espaceCours.titrePage')} subtitle={espace ? `${espace.classe.code_cours} · ${espace.classe.nom_groupe}` : undefined} />

      {erreur && (
        <Alert severity={erreur.status === 404 ? 'info' : 'warning'} sx={{ mb: 2 }} action={erreur.status === 404 ? null : <Button onClick={charger}>{t('common.retry')}</Button>}>
          {erreur.status === 404 ? t('espaceCours.introuvable') : t('common.errorLoad')}
        </Alert>
      )}
      {!espace && !erreur && <Skeleton variant="rounded" height={180} />}

      {gere && (
        <Tabs
          value={onglet}
          onChange={(_, valeur) => setParametres(valeur === 'supports' ? {} : { onglet: valeur }, { replace: true })}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {ONGLETS.map((o) => (
            <Tab key={o} value={o} label={t(`espaceCours.onglets.${o}`)} sx={{ textTransform: 'none', fontSize: '0.9375rem' }} />
          ))}
        </Tabs>
      )}

      {espace && onglet === 'supports' && supports}
      {gere && onglet === 'appel' && <OngletAppel idCours={idCours} idGroupe={idGroupe} />}
      {gere && onglet === 'eleves' && <OngletEleves idCours={idCours} idGroupe={idGroupe} nomFichier={nomFichier} />}

      <SaisieDialog
        ouvert={Boolean(saisie)}
        titre={saisie?.titre}
        champs={saisie?.champs}
        libelleValider={saisie?.libelleValider}
        onFermer={() => fermerSaisie(null)}
        onValider={async (v) => fermerSaisie(v)}
      />
    </DashboardLayout>
  );
}
