import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { relativeTo } from '../../../shared/session.js';
import FlapTiles from './FlapTiles';
import { CIBLE_TACTILE, couleurStatut, creerStyles, espace, useTheme } from '../theme';

/**
 * La séance en vedette (en cours ou prochaine) : l'heure sur les volets, la salle en très grand
 * comme un numéro de quai, puis quand, où, avec qui, et les supports du cours s'il y en a.
 */
export default function Spotlight({ seance: s, phase, maintenant, supports, onSupports }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const enCours = phase === 'live';
  const quand = enCours ? t('board.startedAgo') : t('board.startsIn', { duration: relativeTo(s.start, i18n.language, maintenant) });
  const couleur = s.status === 'reporte' || s.status === 'annule' ? couleurStatut(theme, s.status) : theme.couleurs.enCours;

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

const useStyles = creerStyles((t) => ({
  cadre: {
    margin: 16,
    padding: 16,
    backgroundColor: t.couleurs.cellule,
    borderRadius: t.rayons.md,
    gap: 10,
    // Clair : la carte se détache du sol par un filet, comme les cartes StudyLib
    ...(t.sombre ? null : { borderWidth: 1, borderColor: t.couleurs.filet }),
  },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lampe: { width: 8, height: 8, borderRadius: 4 },
  phase: { fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1) },
  quand: { marginLeft: 'auto', color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13 },
  cours: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: t.famille === 'planner' ? 22 : 19, textTransform: t.capitales, letterSpacing: espace(t, 0.4) },
  salle: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: t.famille === 'planner' ? 56 : 44, lineHeight: t.famille === 'planner' ? 60 : 50, letterSpacing: espace(t, 1) },
  details: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14 },
  avant: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, textDecorationLine: 'line-through' },
  supports: { minHeight: CIBLE_TACTILE, justifyContent: 'center' },
  supportsTexte: { color: t.famille === 'planner' ? t.couleurs.lettre : t.couleurs.accent, fontFamily: t.polices.texteGras, fontSize: 15, textDecorationLine: t.famille === 'planner' ? 'underline' : 'none' },
}));
