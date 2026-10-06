import { useCallback, useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Notifications } from '../notifications';
import { useFonts, Barlow_400Regular, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Initialise les traductions au chargement du module
import { restaurerLangue } from '../i18n';
import { AuthProvider } from '../auth/AuthContext';
import { restaurerTheme, ThemeProvider, useTheme } from '../theme';
import IntroLogo from '../intro/IntroLogo';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Liens d'une alerte : seulement des écrans internes de l'application. */
const ECRANS_AUTORISES = new Set(['/', '/semaine', '/alertes', '/jeux']);
const ecranDeLien = (lien) => {
  if (typeof lien !== 'string') return '/alertes';
  if (lien.startsWith('/emploi-du-temps')) return '/semaine';
  return ECRANS_AUTORISES.has(lien) ? lien : '/alertes';
};

export default function Racine() {
  const router = useRouter();
  const [langueChargee, setLangueChargee] = useState(false);
  const [preferenceTheme, setPreferenceTheme] = useState(null);
  const [policesChargees] = useFonts({
    Barlow_400Regular,
    Barlow_600SemiBold,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    restaurerLangue().finally(() => setLangueChargee(true));
    restaurerTheme().then(setPreferenceTheme);
  }, []);

  useEffect(() => {
    if (policesChargees && langueChargee && preferenceTheme) SplashScreen.hideAsync().catch(() => {});
  }, [policesChargees, langueChargee, preferenceTheme]);

  // Toucher une notification ouvre l'écran correspondant
  useEffect(() => {
    if (!Notifications) return undefined;
    const abonnement = Notifications.addNotificationResponseReceivedListener((reponse) => {
      router.push(ecranDeLien(reponse.notification.request.content.data?.lien));
    });
    return () => abonnement.remove();
  }, [router]);

  if (!policesChargees || !langueChargee || !preferenceTheme) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider preferenceInitiale={preferenceTheme}>
        <AuthProvider>
          <Pile />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// L'animation du logo n'est jouée qu'au lancement de l'application
let introJouee = false;

/** Navigation de l'application, aux couleurs du thème choisi ; le logo s'assemble par-dessus au lancement */
function Pile() {
  const { couleurs, barreStatut, polices } = useTheme();
  const [intro, setIntro] = useState(!introJouee);
  const finIntro = useCallback(() => {
    introJouee = true;
    setIntro(false);
  }, []);
  return (
    <>
      <StatusBar style={intro ? 'light' : barreStatut} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond }, animation: 'fade' }} />
      {intro ? <IntroLogo titre="HESTIM Planner" police={polices.panneauGras} onFin={finIntro} /> : null}
    </>
  );
}
