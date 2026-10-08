import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sourcePhotoStage } from '../api/donnees';
import { creerStyles, espace, useTheme } from '../theme';

/**
 * Retour de stage d'un ancien : photo d'illustration si elle existe (servie par l'API, gardée en
 * cache par le téléphone), entreprise, poste, année, note et aperçu du texte (déplié au toucher).
 */
export default function CarteStage({ avis }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const [deplie, setDeplie] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(Boolean(avis.has_photo));
  const meta = [avis.year_done ? t('app.bibliotheque.stageAnnee', { annee: avis.year_done }) : null, avis.filiere, avis.city, t(avis.is_paid ? 'app.bibliotheque.remunere' : 'app.bibliotheque.nonRemunere')].filter(Boolean);

  return (
    <Pressable onPress={() => setDeplie((d) => !d)} style={styles.carte} accessibilityRole="button" accessibilityState={{ expanded: deplie }}>
      {photoVisible ? (
        <Image
          source={sourcePhotoStage(avis.id)}
          style={styles.photo}
          resizeMode="cover"
          onError={() => setPhotoVisible(false)}
          accessibilityLabel={t('app.bibliotheque.photoStage', { entreprise: avis.company })}
        />
      ) : null}
      <View style={styles.corps}>
        <Text style={styles.entreprise}>{avis.company}</Text>
        {avis.position ? <Text style={styles.poste}>{avis.position}</Text> : null}
        <View style={styles.ligne}>
          <View style={styles.etoiles} accessible accessibilityLabel={t('app.bibliotheque.note', { note: avis.rating })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <MaterialCommunityIcons key={n} name={n <= avis.rating ? 'star' : 'star-outline'} size={16} color={couleurs.lettre} />
            ))}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {meta.join('  ·  ')}
          </Text>
        </View>
        <Text style={styles.texte} numberOfLines={deplie ? undefined : 4}>
          {avis.description}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = creerStyles((t) => ({
  carte: { marginHorizontal: 16, marginBottom: 14, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 16 / 10, backgroundColor: t.couleurs.filet },
  corps: { padding: 14, gap: 6 },
  entreprise: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 16 },
  poste: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  etoiles: { flexDirection: 'row', gap: 1 },
  meta: { flex: 1, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 12, textTransform: t.capitales, letterSpacing: espace(t, 0.4) },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
}));
