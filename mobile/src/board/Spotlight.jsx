import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { relativeTo } from '../../../shared/session.js';
import FlapTiles from './FlapTiles';
import { CIBLE_TACTILE, couleurs, couleurStatut, polices } from '../theme';

/**
 * La séance en vedette (en cours ou prochaine) : l'heure sur les volets, la salle en très grand
 * comme un numéro de quai, puis quand, où, avec qui, et les supports du cours s'il y en a.
 */
export default function Spotlight({ seance: s, phase, maintenant, supports, onSupports }) {
  const { t, i18n } = useTranslation();
  const enCours = phase === 'live';
  const quand = enCours ? t('board.startedAgo') : t('board.startsIn', { duration: relativeTo(s.start, i18n.language, maintenant) });
  const couleur = s.status === 'reporte' || s.status === 'annule' ? couleurStatut(s.status) : couleurs.enCours;

  return (
    <View style={styles.cadre}>
      <View style={styles.entete}>
        <View style={[styles.lampe, { backgroundColor: couleur }]} />
        <Text style={[styles.phase, { color: couleur }]}>{t(`status.${enCours ? 'live' : 'next'}`)}</Text>
        <Text style={styles.quand}>{quand}</Text>
      </View>
      <FlapTiles valeur={s.startLabel} taille={44} accessibilityLabel={`${t('board.time')} ${s.startLabel}`} />
      <Text style={styles.cours} numberOfLines={2} maxFontSizeMultiplier={1.4}>
        {s.course}
        {s.courseType ? `  ${s.courseType}` : ''}
      </Text>
      <Text style={styles.salle} maxFontSizeMultiplier={1.4} accessibilityLabel={s.distanciel ? t('app.distanciel') : `${t('board.room')} ${s.room}`}>
        {s.distanciel ? t('app.distanciel').toUpperCase() : s.room || '—'}
      </Text>
      <Text style={styles.details} maxFontSizeMultiplier={1.4}>
        {[s.building, s.floor !== null && s.floor !== undefined ? t('board.floor', { floor: s.floor }) : null, `${s.startLabel}–${s.endLabel}`, s.teacher].filter(Boolean).join('  ·  ')}
      </Text>
      {s.previousLabel ? <Text style={styles.avant}>{t('board.previously', { value: s.previousLabel })}</Text> : null}
      {supports?.documents ? (
        <Pressable onPress={onSupports} style={styles.supports} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.supportsTexte}>{t('board.supports', { count: supports.documents })}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { margin: 16, padding: 16, backgroundColor: couleurs.cellule, borderRadius: 4, gap: 10 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lampe: { width: 8, height: 8, borderRadius: 4 },
  phase: { fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  quand: { marginLeft: 'auto', color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 13 },
  cours: { color: couleurs.lettre, fontFamily: polices.panneau, fontSize: 22, textTransform: 'uppercase', letterSpacing: 0.4 },
  salle: { color: couleurs.lettre, fontFamily: polices.panneauGras, fontSize: 56, lineHeight: 60, letterSpacing: 1 },
  details: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 14 },
  avant: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 13, textDecorationLine: 'line-through' },
  supports: { minHeight: CIBLE_TACTILE, justifyContent: 'center' },
  supportsTexte: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 15, textDecorationLine: 'underline' },
});
