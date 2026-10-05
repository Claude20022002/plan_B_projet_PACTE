import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import { couleurs, polices } from '../../theme';

/**
 * Cinq onglets : Tableau · Semaine · Jeux · Bibliothèque · Compte (Planner, les jeux et la
 * bibliothèque à un geste : les espaces HESTIM de shared/espaces.js). Une icône par onglet, rien d'autre ;
 * onglet actif en couleur lettre avec une barre de 2 px, les autres atténués.
 */
const ICONES = { index: 'view-dashboard-outline', semaine: 'calendar-week', jeux: 'gamepad-variant-outline', bibliotheque: 'bookshelf', compte: 'account-circle-outline' };

export default function Onglets() {
  const { t } = useTranslation();
  const { etat } = useAuth();
  if (etat === 'chargement') return <View style={{ flex: 1, backgroundColor: couleurs.fond }} />;
  if (etat !== 'connecte') return <Redirect href="/connexion" />;

  const options = (nom, titre) => ({
    title: titre,
    tabBarIcon: ({ color, focused }) => (
      <View style={{ alignItems: 'center' }}>
        {/* Barre de 2 px au-dessus de l'onglet actif */}
        <View style={{ width: 28, height: 2, marginBottom: 4, backgroundColor: focused ? couleurs.lettre : 'transparent' }} />
        <MaterialCommunityIcons name={ICONES[nom]} size={24} color={color} />
      </View>
    ),
    tabBarAccessibilityLabel: titre,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.lettre,
        tabBarInactiveTintColor: couleurs.lettreAttenuee,
        tabBarStyle: { backgroundColor: couleurs.fond, borderTopColor: couleurs.filet, borderTopWidth: 1, minHeight: 60 },
        tabBarLabelStyle: { fontFamily: polices.panneau, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      <Tabs.Screen name="index" options={options('index', t('app.onglets.tableau'))} />
      <Tabs.Screen name="semaine" options={options('semaine', t('app.onglets.semaine'))} />
      <Tabs.Screen name="jeux" options={options('jeux', t('app.onglets.jeux'))} />
      <Tabs.Screen name="bibliotheque" options={options('bibliotheque', t('app.onglets.bibliotheque'))} />
      <Tabs.Screen name="compte" options={options('compte', t('app.onglets.compte'))} />
    </Tabs>
  );
}
