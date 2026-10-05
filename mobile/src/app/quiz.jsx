import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../board/Ecran';
import { chargerConfigQuiz } from '../api/donnees';
import { ouvrirAdresse } from '../espaces/ouvrir';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

/**
 * Partie ClassQuiz jouée dans l'application : la page de jeu (code, nom et jeton déjà remplis)
 * s'affiche ici, sans passer par le navigateur. Seule l'adresse de ClassQuiz donnée par Planner
 * est chargée ; un lien vers un autre site s'ouvre dans le navigateur.
 */
export default function Quiz() {
  const { t } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { url } = useLocalSearchParams();
  const [origine, setOrigine] = useState(undefined);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    chargerConfigQuiz()
      // Origine calculée à la main : URL de React Native n'implémente pas toutes ses propriétés
      .then((c) => setOrigine(c?.actif ? (/^(https:\/\/[^/?#]+)/.exec(c.url ?? '')?.[1] ?? null) : null))
      .catch(() => setOrigine(null));
  }, []);

  const adresse = typeof url === 'string' ? url : '';
  // La page doit être celle de ClassQuiz (même origine que la configuration de Planner)
  const autorisee = Boolean(origine) && adresse.startsWith(`${origine}/`);

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/jeux'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.jeux.quiz')} droite={fermer} espaces={false}>
      {origine === null || (origine && !autorisee) ? <Message>{t('app.jeux.quizIndisponible')}</Message> : null}
      {autorisee ? (
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: adresse }}
            style={styles.page}
            onLoadEnd={() => setChargement(false)}
            onShouldStartLoadWithRequest={(requete) => {
              if (requete.url.startsWith(`${origine}/`) || requete.url === origine || requete.url.startsWith('about:')) return true;
              ouvrirAdresse(requete.url, couleurs);
              return false;
            }}
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures={false}
            mediaPlaybackRequiresUserAction
            accessibilityLabel={t('app.jeux.quiz')}
          />
          {chargement ? <ActivityIndicator style={styles.attente} color={couleurs.lettre} size="large" /> : null}
        </View>
      ) : null}
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, backgroundColor: t.couleurs.fond },
  attente: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
}));
