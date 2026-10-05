import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../board/Ecran';
import { chargerPartiesQuiz } from '../api/donnees';
import { CIBLE_TACTILE, couleurs, polices } from '../theme';

/**
 * Jeux : parties ClassQuiz lancées pendant les séances de l'étudiant (ouvert depuis le Tableau
 * ou la notification « Quiz en cours »). Rejoindre ouvre la partie dans le navigateur intégré,
 * code et nom déjà remplis : rien à saisir.
 */
export default function Jeux() {
  const { t } = useTranslation();
  const router = useRouter();
  const [parties, setParties] = useState(null);
  const [etat, setEtat] = useState({ erreur: false, rafraichit: false });

  const charger = useCallback(async ({ tire = false } = {}) => {
    setEtat((e) => ({ ...e, rafraichit: tire }));
    try {
      setParties(await chargerPartiesQuiz());
      setEtat({ erreur: false, rafraichit: false });
    } catch {
      setParties((p) => p ?? []);
      setEtat({ erreur: true, rafraichit: false });
    }
  }, []);

  useEffect(() => {
    charger();
    // Une partie se lance en cours de séance : on revérifie toutes les 20 secondes
    const id = setInterval(() => charger(), 20000);
    return () => clearInterval(id);
  }, [charger]);

  const rejoindre = (partie) =>
    WebBrowser.openBrowserAsync(partie.url, { toolbarColor: couleurs.fond, controlsColor: couleurs.lettre, dismissButtonStyle: 'close' }).catch(() => {});

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.jeux.titre')} droite={fermer}>
      <FlatList
        data={parties ?? []}
        keyExtractor={(p) => String(p.id)}
        refreshControl={<RefreshControl refreshing={etat.rafraichit} onRefresh={() => charger({ tire: true })} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}
        ListHeaderComponent={etat.erreur ? <Message>{t('app.jeux.erreur')}</Message> : null}
        ListEmptyComponent={parties ? <Message>{t('app.jeux.vide')}</Message> : <Message discret>{t('app.commun.chargement')}</Message>}
        renderItem={({ item: p }) => (
          <View style={styles.partie}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statut}>{t('app.jeux.enCours')}</Text>
              <Text style={styles.titre}>{p.titre}</Text>
              {p.module ? <Text style={styles.module}>{p.module.nom}</Text> : null}
              <Text style={styles.code}>{t('app.jeux.code', { pin: p.pin })}</Text>
            </View>
            {p.url ? (
              <Pressable onPress={() => rejoindre(p)} style={styles.rejoindre} accessibilityRole="button" accessibilityLabel={`${t('app.jeux.rejoindre')} : ${p.titre}`}>
                <Text style={styles.rejoindreTexte}>{t('app.jeux.rejoindre')}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  partie: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: couleurs.filet },
  statut: { color: couleurs.enCours, fontFamily: polices.panneauGras, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  titre: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 16, marginTop: 2 },
  module: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 14, marginTop: 2 },
  code: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauMoyen, fontSize: 14, marginTop: 4, letterSpacing: 1 },
  rejoindre: { minHeight: CIBLE_TACTILE, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 4, backgroundColor: couleurs.lettre },
  rejoindreTexte: { color: couleurs.fond, fontFamily: polices.panneauGras, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' },
});
