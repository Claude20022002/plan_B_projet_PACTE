import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import ChampCouleur from '../../components/etablissement/ChampCouleur';
import ApercuMarque from '../../components/etablissement/ApercuMarque';
import ChoixLogo from '../../components/etablissement/ChoixLogo';
import { adresseLogo, etablissementAPI, memoriserIdentite } from '../../services/etablissement';
import { verifierCouleur } from '../../../../shared/couleurs.js';
import { useToast } from '../../contexts/ToastContext';

// Le modèle de l'EDT du mois (modele_edt) n'est pas proposé : aucun écran ne s'en sert encore
const CHAMPS = ['nom', 'nom_court', 'couleur_principale', 'couleur_accent', 'expediteur_nom', 'adresse_reponse'];
const saisieDe = (config) => Object.fromEntries(CHAMPS.map((champ) => [champ, config[champ] ?? '']));
const produitDe = (nomCourt) => (nomCourt === 'Planner' || !nomCourt ? 'Planner' : `${nomCourt} Planner`);

// Les couleurs, le nom et le logo sont posés au démarrage du site (main.jsx) : on recharge la page
const appliquer = (identite) => {
  memoriserIdentite(identite);
  window.setTimeout(() => window.location.reload(), 900);
};

/** Une rubrique du panneau : titre à gauche, champs à droite (comme les paramètres de planification). */
function Rubrique({ titre, children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '200px 1fr' }, gap: { xs: 1.5, md: 3 }, px: { xs: 1.5, md: 2 }, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
        {titre}
      </Typography>
      <Stack spacing={2.5}>{children}</Stack>
    </Box>
  );
}

/**
 * Panneau de configuration, « Identité et marque » (D-21, lots ME-1 et ME-11) : nom, nom court,
 * couleurs, logo, expéditeur et adresse de réponse des courriels. Réservé à l'administration.
 */
export default function IdentiteEcole() {
  const { t } = useTranslation();
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [saisie, setSaisie] = useState(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    etablissementAPI
      .lireConfiguration()
      .then((lue) => {
        setConfig(lue);
        setSaisie(saisieDe(lue));
      })
      .catch(() => toast.error(t('common.errorLoad')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changer = (champ) => (valeur) => setSaisie((s) => ({ ...s, [champ]: valeur }));
  const texte = (champ) => (e) => changer(champ)(e.target.value);

  const agir = async (action) => {
    setEnCours(true);
    try {
      appliquer(await action());
      toast.success(t('etablissement.enregistre'));
    } catch (error) {
      toast.error(error.message);
      setEnCours(false);
    }
  };

  const enregistrer = () => {
    const lisibles = verifierCouleur(saisie.couleur_principale, 'principale').valide && verifierCouleur(saisie.couleur_accent, 'accent').valide;
    if (!lisibles || saisie.nom.trim().length < 2 || saisie.nom_court.trim().length < 2) return toast.error(t('etablissement.corriger'));
    // Seuls les champs changés partent au serveur
    const changes = Object.fromEntries(CHAMPS.filter((champ) => saisie[champ] !== (config[champ] ?? '')).map((champ) => [champ, saisie[champ] || null]));
    if (!Object.keys(changes).length) return undefined;
    return agir(() => etablissementAPI.modifier(changes));
  };

  if (!saisie) {
    return (
      <DashboardLayout>
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <TableSkeleton rows={6} />
        </Paper>
      </DashboardLayout>
    );
  }

  const logo = adresseLogo(config);
  const produit = produitDe(saisie.nom_court.trim());

  return (
    <DashboardLayout>
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 1.5, md: 2 }, py: 1.5, maxWidth: 820 }}>
          {t('etablissement.intro')}
        </Typography>

        <Rubrique titre={t('etablissement.sections.identite')}>
          <TextField label={t('etablissement.champs.nom')} value={saisie.nom} onChange={texte('nom')} helperText={t('etablissement.champs.nomAide')} inputProps={{ maxLength: 150 }} fullWidth />
          <TextField
            label={t('etablissement.champs.nomCourt')}
            value={saisie.nom_court}
            onChange={texte('nom_court')}
            helperText={t('etablissement.champs.nomCourtAide', { exemple: produit })}
            inputProps={{ maxLength: 30 }}
            sx={{ maxWidth: 360 }}
          />
        </Rubrique>

        <Rubrique titre={t('etablissement.sections.couleurs')}>
          <ChampCouleur libelle={t('etablissement.champs.principale')} aide={t('etablissement.champs.principaleAide')} usage="principale" valeur={saisie.couleur_principale} onChange={changer('couleur_principale')} />
          <ChampCouleur libelle={t('etablissement.champs.accent')} aide={t('etablissement.champs.accentAide')} usage="accent" valeur={saisie.couleur_accent} onChange={changer('couleur_accent')} />
          <ApercuMarque nomCourt={saisie.nom_court.trim()} principale={saisie.couleur_principale} accent={saisie.couleur_accent} logo={logo} />
        </Rubrique>

        <Rubrique titre={t('etablissement.sections.logo')}>
          <ChoixLogo
            adresse={logo}
            nomCourt={config.nom_court}
            enCours={enCours}
            onErreur={(message) => toast.error(message)}
            onEnvoyer={(fichier) => agir(() => etablissementAPI.envoyerLogo(fichier))}
            onRetirer={() => agir(() => etablissementAPI.retirerLogo())}
          />
        </Rubrique>

        <Rubrique titre={t('etablissement.sections.courriels')}>
          <TextField
            label={t('etablissement.champs.expediteur')}
            value={saisie.expediteur_nom}
            onChange={texte('expediteur_nom')}
            helperText={t('etablissement.champs.expediteurAide', { produit })}
            inputProps={{ maxLength: 100 }}
            sx={{ maxWidth: 480 }}
          />
          <TextField
            type="email"
            label={t('etablissement.champs.reponse')}
            value={saisie.adresse_reponse}
            onChange={texte('adresse_reponse')}
            helperText={t('etablissement.champs.reponseAide')}
            inputProps={{ maxLength: 255 }}
            sx={{ maxWidth: 480 }}
          />
        </Rubrique>

        <Box sx={{ px: { xs: 1.5, md: 2 }, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={enregistrer} disabled={enCours}>
            {t('etablissement.enregistrer')}
          </Button>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}
