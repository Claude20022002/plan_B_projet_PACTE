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
import { nommerEcole, restaurerLangue } from '../i18n';
import { AuthProvider } from '../auth/AuthContext';
import { restaurerTheme, ThemeProvider, useTheme } from '../theme';
import IntroLogo, { aUneIntro } from '../intro/IntroLogo';
import { chargerIdentite, identiteEcole } from '../ecole';
import { appliquerMarque } from '../marque';
import { ecranDeLien } from '../alertes/liens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Racine() {
  const router = useRouter();
  const [langueChargee, setLangueChargee] = useState(false);
  const [ecoleChargee, setEcoleChargee] = useState(false);
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
    // L'école avant le premier écran : nom dans les textes, couleurs sur les thèmes
    chargerIdentite()
      .then((identite) => {
        nommerEcole(identite);
        appliquerMarque(identite);
      })
      .finally(() => setEcoleChargee(true));
  }, []);

  useEffect(() => {
    if (policesChargees && langueChargee && ecoleChargee && preferenceTheme) SplashScreen.hideAsync().catch(() => {});
  }, [policesChargees, langueChargee, ecoleChargee, preferenceTheme]);

  // Toucher une notification ouvre l'écran correspondant
  useEffect(() => {
    if (!Notifications) return undefined;
    const abonnement = Notifications.addNotificationResponseReceivedListener((reponse) => {
      router.push(ecranDeLien(reponse.notification.request.content.data?.lien));
    });
    return () => abonnement.remove();
  }, [router]);

  if (!policesChargees || !langueChargee || !ecoleChargee || !preferenceTheme) return null;

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

/** Navigation de l'application, aux couleurs du thème choisi ; le logo de l'école pilote s'assemble par-dessus au lancement */
function Pile() {
  const { couleurs, barreStatut, polices } = useTheme();
  const ecole = identiteEcole();
  const [intro, setIntro] = useState(!introJouee && aUneIntro(ecole.nom_court));
  const finIntro = useCallback(() => {
    introJouee = true;
    setIntro(false);
  }, []);
  return (
    <>
      <StatusBar style={intro ? 'light' : barreStatut} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond }, animation: 'fade' }} />
      {intro ? <IntroLogo titre={ecole.produit} police={polices.panneauGras} onFin={finIntro} /> : null}
    </>
  );
}
