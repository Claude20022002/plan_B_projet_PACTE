import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { couleurs, couleurStatut, lineColor, polices } from '../theme';

/**
 * Une ligne du panneau : heure, carré de la filière, cours (type CM/TD/TP), salle et campus,
 * statut. Lue d'une traite par TalkBack (« 11 h, Analyse numérique, salle G-LAB003, confirmée »).
 */
export default function DepartureRow({ seance: s, enVedette = false }) {
  const { t } = useTranslation();
  const statut = enVedette && s.status !== 'annule' && s.status !== 'reporte' ? 'live' : s.status;
  const libelleStatut = t(`status.${statut}`);
  const couleur = statut === 'live' ? couleurs.enCours : couleurStatut(s.status);
  const annule = s.status === 'annule';
  const lieu = s.distanciel ? [t('app.distanciel'), s.mention].filter(Boolean).join(' · ') : [s.room, s.building].filter(Boolean).join(' · ');

  return (
    <View
      style={styles.ligne}
      accessible
      accessibilityLabel={`${s.startLabel}, ${s.course}${s.courseType ? ` ${s.courseType}` : ''}, ${s.distanciel ? t('app.aDistance') : `${t('board.room')} ${s.room || '?'}`}, ${libelleStatut}`}
    >
      <Text style={[styles.heure, annule && styles.barre]} maxFontSizeMultiplier={1.4}>
        {s.startLabel}
      </Text>
      <View style={[styles.carre, { backgroundColor: lineColor(s.lineKey) }]} />
      <View style={styles.centre}>
        <Text style={[styles.cours, annule && styles.barre]} numberOfLines={1} maxFontSizeMultiplier={1.4}>
          {s.course}
          {s.courseType ? <Text style={styles.type}>  {s.courseType}</Text> : null}
        </Text>
        <Text style={styles.lieu} numberOfLines={1} maxFontSizeMultiplier={1.4}>
          {lieu}
          {s.previousLabel ? `  ·  ${t('board.previously', { value: s.previousLabel })}` : ''}
        </Text>
      </View>
      <Text style={[styles.statut, { color: couleur }]} maxFontSizeMultiplier={1.4}>
        {libelleStatut}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.filet,
    gap: 10,
  },
  heure: { width: 52, color: couleurs.lettre, fontFamily: polices.panneauGras, fontSize: 20, fontVariant: ['tabular-nums'] },
  carre: { width: 10, height: 10, borderRadius: 1 },
  centre: { flex: 1 },
  cours: { color: couleurs.lettre, fontFamily: polices.panneau, fontSize: 18, textTransform: 'uppercase', letterSpacing: 0.4 },
  type: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauMoyen, fontSize: 14 },
  lieu: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 13, marginTop: 2 },
  statut: { fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
  barre: { textDecorationLine: 'line-through', color: couleurs.lettreAttenuee },
});
