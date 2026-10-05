import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BoutonEspaces from '../espaces/BoutonEspaces';
import { creerStyles, espace } from '../theme';

/**
 * Écran : barre de titre (marine HESTIM sur Planner, blanche ou ardoise sur StudyLib), puis le
 * sol. Le bouton des espaces (Planner, Bibliothèque, Jeux, Quiz, sites web) ouvre tous les
 * espaces en deux gestes ; les écrans de détail le remplacent par leur bouton retour.
 */
export default function Ecran({ titre, droite, espaces = true, children }) {
  const marges = useSafeAreaInsets();
  const styles = useStyles();
  return (
    <View style={styles.ecran}>
      <View style={[styles.barre, { paddingTop: marges.top + 10 }]}>
        <Text style={styles.titre} accessibilityRole="header" maxFontSizeMultiplier={1.4} numberOfLines={1}>
          {titre}
        </Text>
        {droite}
        {espaces ? <BoutonEspaces /> : null}
      </View>
      {children}
    </View>
  );
}

/** Message d'état (vide, erreur, hors ligne) */
export function Message({ children, discret = false }) {
  const styles = useStyles();
  return <Text style={[styles.message, discret && styles.discret]}>{children}</Text>;
}

const useStyles = creerStyles((t) => ({
  ecran: { flex: 1, backgroundColor: t.couleurs.fond },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.couleurs.cadre,
    paddingLeft: 16,
    paddingRight: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: t.couleurs.bordCadre,
  },
  titre: { flex: 1, color: t.couleurs.surCadre, fontFamily: t.polices.panneauGras, fontSize: 22, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
  message: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15, padding: 16, lineHeight: 22 },
  discret: { color: t.couleurs.lettreAttenuee, fontSize: 13, paddingVertical: 8 },
}));
