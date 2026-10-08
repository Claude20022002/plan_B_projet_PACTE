import { Children } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { creerStyles, espace } from '../theme';

/**
 * Bibliothèque « à l'étagère » : des couvertures de livres posées sur des planches. Mêmes couleurs
 * que le reste de l'application (cellule, filet, lettre) ; seule la tranche prend la couleur de
 * ligne du module. Titres à l'horizontale (plus lisibles qu'un dos de livre) et tout visible sans
 * défilement horizontal : trois livres par planche.
 */

export const LIVRES_PAR_PLANCHE = 3;
const MARGE = 16;
const ECART = 14;

/** Largeur d'une couverture pour l'écran courant (trois par planche). */
export const useLargeurCouverture = () => {
  const { width } = useWindowDimensions();
  return Math.floor((Math.min(width, 640) - 2 * MARGE - (LIVRES_PAR_PLANCHE - 1) * ECART) / LIVRES_PAR_PLANCHE);
};

export function Couverture({ titre, etiquette, pied, couleur, largeur, onPress, disabled, accessibilityLabel, accessibilityHint }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.livre, { width: largeur, height: Math.round(largeur * 1.42) }, pressed && styles.presse, disabled && styles.inactif]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titre}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
    >
      <View style={[styles.tranche, { backgroundColor: couleur }]} />
      <View style={styles.face}>
        {etiquette ? (
          <Text style={styles.etiquette} numberOfLines={1}>
            {etiquette}
          </Text>
        ) : null}
        <Text style={styles.titre} numberOfLines={5}>
          {titre}
        </Text>
        {pied ? (
          <Text style={styles.pied} numberOfLines={1}>
            {pied}
          </Text>
        ) : null}
      </View>
      <View style={styles.pages} />
    </Pressable>
  );
}

/** Range les couvertures par planches de trois. */
export default function Etagere({ children, accessibilityLabel }) {
  const styles = useStyles();
  const livres = Children.toArray(children);
  const planches = [];
  for (let i = 0; i < livres.length; i += LIVRES_PAR_PLANCHE) planches.push(livres.slice(i, i + LIVRES_PAR_PLANCHE));
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.etagere}>
      {planches.map((rangee, i) => (
        <View key={i} style={styles.rayon}>
          <View style={styles.rangee}>{rangee}</View>
          <View style={styles.planche} />
        </View>
      ))}
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  etagere: { paddingHorizontal: MARGE, paddingTop: 6, gap: 18 },
  rayon: {},
  rangee: { flexDirection: 'row', alignItems: 'flex-end', gap: ECART, paddingHorizontal: 4 },
  // Planche : un filet épais, ombré par une bordure plus sombre
  planche: { height: 9, marginTop: -1, borderRadius: 2, backgroundColor: t.couleurs.filet, borderBottomWidth: 3, borderBottomColor: t.sombre ? '#00000066' : '#0000001F' },
  livre: {
    flexDirection: 'row',
    backgroundColor: t.couleurs.cellule,
    borderTopRightRadius: t.rayons.xs,
    borderBottomRightRadius: t.rayons.xs,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderWidth: t.sombre ? 0 : 1,
    borderColor: t.couleurs.filet,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: t.sombre ? 0.4 : 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 2 },
    elevation: 2,
  },
  presse: { transform: [{ translateY: -3 }], opacity: 0.9 },
  inactif: { opacity: 0.45 },
  tranche: { width: 9 },
  face: { flex: 1, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 8, gap: 6 },
  etiquette: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 11, textTransform: t.capitales, letterSpacing: espace(t, 0.8) },
  titre: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 13, lineHeight: 17 },
  pied: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 11, textTransform: t.capitales },
  // Tranche des pages, côté droit
  pages: { width: 3, marginVertical: 4, borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.couleurs.filet },
}));
