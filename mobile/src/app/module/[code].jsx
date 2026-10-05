import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerDocuments, chargerSupports, lienTelechargement } from '../../api/donnees';
import { CIBLE_TACTILE, couleurs, polices } from '../../theme';

const CODE = /^[A-Za-z0-9_.-]{1,30}$/;
const taille = (octets) => (octets > 1048576 ? `${(octets / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`);

/** Documents publiés d'un module ; « Ouvrir » demande un lien signé de 5 minutes. */
export default function Module() {
  const { t } = useTranslation();
  const router = useRouter();
  const { code } = useLocalSearchParams();
  const [documents, setDocuments] = useState(null);
  const codeValide = typeof code === 'string' && CODE.test(code);
  const [erreurChargement, setErreur] = useState(false);
  const erreur = !codeValide || erreurChargement;
  const [ouverture, setOuverture] = useState(null);

  useEffect(() => {
    if (!codeValide) return;
    (async () => {
      try {
        const module = (await chargerSupports([code]))[code];
        setDocuments(module ? await chargerDocuments(module.module_id) : []);
      } catch {
        setErreur(true);
      }
    })();
  }, [code]);

  const ouvrir = async (doc) => {
    setOuverture(doc.id);
    try {
      const url = await lienTelechargement(doc.id);
      // Seul un lien HTTPS est ouvert (l'URL signée de la bibliothèque)
      if (typeof url === 'string' && url.startsWith('https://')) await WebBrowser.openBrowserAsync(url);
    } catch {
      setErreur(true);
    } finally {
      setOuverture(null);
    }
  };

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Ecran titre={String(code ?? '')} droite={fermer}>
      {erreur ? <Message>{t('app.bibliotheque.indisponible')}</Message> : null}
      <FlatList
        data={documents ?? []}
        keyExtractor={(d) => d.id}
        ListEmptyComponent={documents ? <Message>{t('app.bibliotheque.aucunDocument')}</Message> : !erreur ? <Message discret>{t('app.commun.chargement')}</Message> : null}
        renderItem={({ item: d }) => (
          <View style={styles.doc}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titre}>{d.title}</Text>
              <Text style={styles.detail}>{[String(d.type).toUpperCase(), d.year_concern, d.file_size ? taille(d.file_size) : null].filter(Boolean).join('  ·  ')}</Text>
            </View>
            <Pressable onPress={() => ouvrir(d)} disabled={ouverture === d.id} style={styles.ouvrir} accessibilityRole="button" accessibilityLabel={`${t('app.bibliotheque.telecharger')} ${d.title}`}>
              <Text style={styles.ouvrirTexte}>{t('app.bibliotheque.telecharger')}</Text>
            </Pressable>
          </View>
        )}
      />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: couleurs.filet },
  titre: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 15 },
  detail: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauMoyen, fontSize: 13, marginTop: 2 },
  ouvrir: { minHeight: CIBLE_TACTILE, minWidth: CIBLE_TACTILE + 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: couleurs.filet, borderRadius: 3, paddingHorizontal: 12 },
  ouvrirTexte: { color: couleurs.lettre, fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
});
