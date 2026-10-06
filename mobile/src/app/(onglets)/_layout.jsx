import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import { espace, useTheme } from '../../theme';
import { HAUTEUR_ONGLETS, Verre } from '../../verre/Verre';

/**
 * Cinq onglets : Tableau · Semaine · Jeux · Bibliothèque · Compte (Planner, les jeux et la
 * bibliothèque à un geste : les espaces HESTIM de shared/espaces.js ; le bouton des espaces de la
 * barre de titre mène aussi au Quiz et aux sites web). Une icône par onglet ; onglet actif avec
 * une barre de 2 px (Planner) ou en bleu StudyLib, les autres atténués. La barre est en verre
 * dépoli : le contenu défile dessous (chaque onglet garde une marge, useMargeOnglets).
 */
const ICONES = { index: 'view-dashboard-outline', semaine: 'calendar-week', jeux: 'gamepad-variant-outline', bibliotheque: 'bookshelf', compte: 'account-circle-outline' };

export default function Onglets() {
  const { t } = useTranslation();
  const { etat } = useAuth();
  const theme = useTheme();
  const { couleurs, polices } = theme;
  const actif = theme.famille === 'planner' ? couleurs.lettre : couleurs.accent;
  const marges = useSafeAreaInsets();
  if (etat === 'chargement') return <View style={{ flex: 1, backgroundColor: couleurs.fond }} />;
  if (etat !== 'connecte') return <Redirect href="/connexion" />;

  const options = (nom, titre) => ({
    title: titre,
    tabBarIcon: ({ color, focused }) => (
      <View style={{ alignItems: 'center' }}>
        {/* Barre de 2 px au-dessus de l'onglet actif */}
        <View style={{ width: 28, height: 2, marginBottom: 4, borderRadius: 1, backgroundColor: focused ? actif : 'transparent' }} />
        <MaterialCommunityIcons name={ICONES[nom]} size={24} color={color} />
      </View>
    ),
    tabBarAccessibilityLabel: titre,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: actif,
        tabBarInactiveTintColor: couleurs.lettreAttenuee,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: theme.verre.bord,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: HAUTEUR_ONGLETS + marges.bottom,
          paddingBottom: marges.bottom,
        },
        tabBarBackground: () => <Verre style={StyleSheet.absoluteFill} opacite={0.62} />,
        tabBarLabelStyle: { fontFamily: polices.panneau, fontSize: theme.famille === 'planner' ? 12 : 11, textTransform: theme.capitales, letterSpacing: espace(theme, 0.8) },
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
