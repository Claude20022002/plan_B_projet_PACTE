import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../board/Ecran';
import { useAuth } from '../auth/AuthContext';
import { chargerAlertes } from '../api/donnees';
import { CIBLE_TACTILE, couleurs, polices } from '../theme';

/** Alertes (ouvertes depuis la cloche du Tableau ou en touchant une notification). */
export default function Alertes() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [alertes, setAlertes] = useState(null);

  useEffect(() => {
    if (!utilisateur) return;
    chargerAlertes(utilisateur.id_user, { nonLues: false })
      .then(setAlertes)
      .catch(() => setAlertes([]));
  }, [utilisateur]);

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.alertes.titre')} droite={fermer}>
      <FlatList
        data={alertes ?? []}
        keyExtractor={(a) => String(a.id_notification)}
        ListEmptyComponent={alertes ? <Message>{t('app.alertes.vide')}</Message> : <Message discret>{t('app.commun.chargement')}</Message>}
        renderItem={({ item: a }) => (
          <View style={styles.alerte} accessible accessibilityLabel={`${a.titre}. ${a.message}`}>
            {!a.lue ? <View style={styles.pastille} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.titre}>{a.titre}</Text>
              <Text style={styles.texte}>{a.message}</Text>
              <Text style={styles.date}>{new Date(a.createdAt || a.date_creation).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        )}
      />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  alerte: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: couleurs.filet },
  pastille: { width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: couleurs.reporte },
  titre: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 15 },
  texte: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 14, marginTop: 2, lineHeight: 20 },
  date: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauMoyen, fontSize: 13, marginTop: 4 },
});
