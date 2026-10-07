import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../board/Ecran';
import { useAuth } from '../auth/AuthContext';
import { chargerAlertes, chargerAnnonces } from '../api/donnees';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

const LIEN_ANNONCE = /^\/annonces\/(\d+)$/;

/**
 * Alertes (ouvertes depuis la cloche du Tableau ou en touchant une notification) : les annonces
 * de l'école en tête (non lues marquées), puis les alertes de planning. Rechargées au retour
 * d'une annonce pour que la pastille « non lue » disparaisse.
 */
export default function Alertes() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [alertes, setAlertes] = useState(null);
  const [annonces, setAnnonces] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!utilisateur) return;
      chargerAlertes(utilisateur.id_user, { nonLues: false })
        .then(setAlertes)
        .catch(() => setAlertes([]));
      chargerAnnonces()
        .then(setAnnonces)
        .catch(() => setAnnonces(null));
    }, [utilisateur])
  );

  const dateCourte = (d) => new Date(d).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const ouvrirAnnonce = (id) => router.push(`/annonce/${id}`);

  const enTete = annonces?.annonces.length ? (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitre} accessibilityRole="header">{t('app.annonces.titre')}</Text>
        {annonces.non_lues ? <Text style={styles.sectionCompte}>{t('app.annonces.nonLues', { count: annonces.non_lues })}</Text> : null}
      </View>
      {annonces.annonces.slice(0, 5).map((a) => (
        <Pressable
          key={a.id}
          onPress={() => ouvrirAnnonce(a.id)}
          style={({ pressed }) => [styles.alerte, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={`${a.titre}. ${a.cible}`}
        >
          <View style={[styles.pastille, !a.lu_le ? styles.pastilleAnnonce : styles.pastilleVide]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.titre, a.lu_le && styles.titreLu]} numberOfLines={2}>{a.titre}</Text>
            <Text style={styles.texte} numberOfLines={2}>{a.corps}</Text>
            <Text style={styles.date}>{[a.cible, dateCourte(a.date)].join(' · ')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={couleurs.lettreAttenuee} style={{ alignSelf: 'center' }} />
        </Pressable>
      ))}
      <View style={styles.section}>
        <Text style={styles.sectionTitre} accessibilityRole="header">{t('app.alertes.titre')}</Text>
      </View>
    </View>
  ) : null;

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.alertes.titre')} droite={fermer} espaces={false}>
      <FlatList
        data={alertes ?? []}
        keyExtractor={(a) => String(a.id_notification)}
        ListEmptyComponent={alertes ? <Message>{t('app.alertes.vide')}</Message> : <Message discret>{t('app.commun.chargement')}</Message>}
        ListHeaderComponent={enTete}
        renderItem={({ item: a }) => {
          const annonce = LIEN_ANNONCE.exec(a.lien ?? '');
          const contenu = (
            <>
              {!a.lue ? <View style={styles.pastille} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.titre}>{a.titre}</Text>
                <Text style={styles.texte}>{a.message}</Text>
                <Text style={styles.date}>{dateCourte(a.createdAt || a.date_creation)}</Text>
              </View>
            </>
          );
          return annonce ? (
            <Pressable onPress={() => ouvrirAnnonce(annonce[1])} style={({ pressed }) => [styles.alerte, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`${a.titre}. ${a.message}`}>
              {contenu}
            </Pressable>
          ) : (
            <View style={styles.alerte} accessible accessibilityLabel={`${a.titre}. ${a.message}`}>
              {contenu}
            </View>
          );
        }}
      />
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  alerte: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet },
  pastille: { width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: t.couleurs.reporte },
  pastilleAnnonce: { backgroundColor: t.couleurs.accent },
  pastilleVide: { backgroundColor: 'transparent' },
  section: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  sectionTitre: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionCompte: { color: t.couleurs.accent, fontFamily: t.polices.texteGras, fontSize: 13 },
  titreLu: { fontFamily: t.polices.texte },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15 },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, marginTop: 2, lineHeight: 20 },
  date: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 13, marginTop: 4 },
}));
