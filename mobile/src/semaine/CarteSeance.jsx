import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { couleurStatut, creerStyles, lineColor, useTheme } from '../theme';

/**
 * Séance en carte d'agenda : barre de la couleur du cours à gauche, heures de début et de fin,
 * cours et type, salle et campus, enseignant ; le statut n'apparaît que s'il sort de l'ordinaire.
 */
export default function CarteSeance({ seance: s, onPress }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const annule = s.status === 'annule';
  const special = ['reporte', 'annule'].includes(s.status);
  const lieu = s.distanciel ? [t('app.distanciel'), s.mention].filter(Boolean).join(' · ') : [s.room, s.building].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.carte, pressed && styles.presse]}
      accessibilityRole="button"
      accessibilityLabel={`${s.startLabel}–${s.endLabel}, ${s.course}${s.courseType ? ` ${s.courseType}` : ''}, ${lieu}${s.teacher ? `, ${s.teacher}` : ''}${special ? `, ${t(`status.${s.status}`)}` : ''}`}
    >
      <View style={[styles.barre, { backgroundColor: lineColor(s.courseCode) }, annule && styles.attenue]} />
      <View style={styles.heures}>
        <Text style={[styles.debut, annule && styles.barreTexte]}>{s.startLabel}</Text>
        <Text style={styles.fin}>{s.endLabel}</Text>
      </View>
      <View style={styles.centre}>
        <Text style={[styles.cours, annule && styles.barreTexte]} numberOfLines={1}>
          {s.course}
          {s.courseType ? <Text style={styles.type}>  {s.courseType}</Text> : null}
        </Text>
        <Text style={styles.lieu} numberOfLines={1}>{lieu}</Text>
      </View>
      <View style={styles.droite}>
        {special ? <Text style={[styles.statut, { color: couleurStatut(theme, s.status) }]}>{t(`status.${s.status}`)}</Text> : null}
        {s.teacher ? <Text style={styles.enseignant} numberOfLines={1}>{s.teacher}</Text> : null}
      </View>
    </Pressable>
  );
}

const useStyles = creerStyles((t) => ({
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingRight: 14,
    backgroundColor: t.couleurs.cellule,
    borderBottomWidth: 1,
    borderBottomColor: t.couleurs.filet,
  },
  presse: { opacity: 0.7 },
  barre: { alignSelf: 'stretch', width: 5 },
  attenue: { opacity: 0.35 },
  heures: { width: 56, paddingVertical: 10 },
  debut: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, fontVariant: ['tabular-nums'] },
  fin: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, fontVariant: ['tabular-nums'], marginTop: 2 },
  centre: { flex: 1, paddingVertical: 10 },
  cours: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 16 },
  type: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13 },
  lieu: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, marginTop: 2 },
  droite: { maxWidth: '32%', alignItems: 'flex-end', gap: 2 },
  statut: { fontFamily: t.polices.texteGras, fontSize: 12 },
  enseignant: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12 },
  barreTexte: { textDecorationLine: 'line-through', color: t.couleurs.lettreAttenuee },
}));
