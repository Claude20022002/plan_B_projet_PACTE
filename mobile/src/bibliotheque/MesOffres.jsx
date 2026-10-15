import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { chargerMesOffres, supprimerOffre } from '../api/donnees';
import CarteOffre from './CarteOffre';
import { creerStyles, espace } from '../theme';

/**
 * « Mes partages » : les offres que j'ai partagées, avec leur statut (à vérifier, publiée, refusée,
 * expirée), au-dessus de mes retours de stage. Rien n'est affiché tant que je n'en ai partagé aucune.
 */
export default function MesOffres({ version }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [offres, setOffres] = useState([]);

  useEffect(() => {
    let actif = true;
    chargerMesOffres().then(
      (r) => actif && setOffres(r),
      () => actif && setOffres([])
    );
    return () => {
      actif = false;
    };
  }, [version]);

  const supprimer = (offre) =>
    Alert.alert(t('app.offres.supprimerTitre'), offre.title, [
      { text: t('app.commun.annuler'), style: 'cancel' },
      {
        text: t('app.offres.supprimer'),
        style: 'destructive',
        onPress: () => supprimerOffre(offre.id).then(() => setOffres((l) => l.filter((o) => o.id !== offre.id)), () => Alert.alert(t('app.offres.erreur'))),
      },
    ]);

  if (offres.length === 0) return null;
  return (
    <>
      <Text style={styles.section}>{t('app.offres.mesOffres')}</Text>
      {offres.map((o) => (
        <CarteOffre key={o.id} offre={o} statut={o.statut} onSupprimer={supprimer} />
      ))}
      <Text style={styles.section}>{t('app.offres.mesAvis')}</Text>
    </>
  );
}

const useStyles = creerStyles((t) => ({
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1), paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
}));
