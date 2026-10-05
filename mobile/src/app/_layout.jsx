import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts, Barlow_400Regular, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Initialise les traductions au chargement du module
import { restaurerLangue } from '../i18n';
import { AuthProvider } from '../auth/AuthContext';
import { couleurs } from '../theme';

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
  const [policesChargees] = useFonts({ Barlow_400Regular, Barlow_600SemiBold, BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold });

  useEffect(() => {
    restaurerLangue().finally(() => setLangueChargee(true));
  }, []);

  useEffect(() => {
    if (policesChargees && langueChargee) SplashScreen.hideAsync().catch(() => {});
  }, [policesChargees, langueChargee]);

  // Toucher une notification ouvre l'écran correspondant
  useEffect(() => {
    const abonnement = Notifications.addNotificationResponseReceivedListener((reponse) => {
      router.push(ecranDeLien(reponse.notification.request.content.data?.lien));
    });
    return () => abonnement.remove();
  }, [router]);

  if (!policesChargees || !langueChargee) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond }, animation: 'fade' }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
