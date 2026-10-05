import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { couleurStatut, creerStyles, espace, lineColor, useTheme } from '../theme';

/**
 * Une ligne du panneau : heure, carré de la filière, cours (type CM/TD/TP), salle et campus,
 * statut. Lue d'une traite par TalkBack (« 11 h, Analyse numérique, salle G-LAB003, confirmée »).
 */
export default function DepartureRow({ seance: s, enVedette = false }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const statut = enVedette && s.status !== 'annule' && s.status !== 'reporte' ? 'live' : s.status;
  const libelleStatut = t(`status.${statut}`);
  const couleur = statut === 'live' ? theme.couleurs.enCours : couleurStatut(theme, s.status);
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

const useStyles = creerStyles((t) => ({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: t.couleurs.filet,
    gap: 10,
  },
  heure: { width: 52, color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: t.famille === 'planner' ? 20 : 17, fontVariant: ['tabular-nums'] },
  carre: { width: 10, height: 10, borderRadius: t.famille === 'planner' ? 1 : 5 },
  centre: { flex: 1 },
  cours: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: t.famille === 'planner' ? 18 : 16, textTransform: t.capitales, letterSpacing: espace(t, 0.4) },
  type: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 14 },
  lieu: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, marginTop: 2 },
  statut: { fontFamily: t.polices.panneau, fontSize: t.famille === 'planner' ? 14 : 13, textTransform: t.capitales, letterSpacing: espace(t, 0.8) },
  barre: { textDecorationLine: 'line-through', color: t.couleurs.lettreAttenuee },
}));
