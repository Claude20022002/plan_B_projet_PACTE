import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { couleurs, polices } from '../theme';

/** Écran du panneau : barre de titre marine (seul usage du marine), puis le sol sombre. */
export default function Ecran({ titre, droite, children }) {
  const marges = useSafeAreaInsets();
  return (
    <View style={styles.ecran}>
      <View style={[styles.barre, { paddingTop: marges.top + 10 }]}>
        <Text style={styles.titre} accessibilityRole="header" maxFontSizeMultiplier={1.4}>
          {titre}
        </Text>
        {droite}
      </View>
      {children}
    </View>
  );
}

/** Message d'état sur le panneau (vide, erreur, hors ligne) */
export function Message({ children, discret = false }) {
  return <Text style={[styles.message, discret && styles.discret]}>{children}</Text>;
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  barre: { flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.cadre, paddingHorizontal: 16, paddingBottom: 12 },
  titre: { flex: 1, color: '#FFFFFF', fontFamily: polices.panneauGras, fontSize: 22, textTransform: 'uppercase', letterSpacing: 1.2 },
  message: { color: couleurs.lettre, fontFamily: polices.texte, fontSize: 15, padding: 16, lineHeight: 22 },
  discret: { color: couleurs.lettreAttenuee, fontSize: 13, paddingVertical: 8 },
});
