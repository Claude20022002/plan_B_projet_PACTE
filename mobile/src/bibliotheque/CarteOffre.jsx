import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ouvrirAdresse } from '../espaces/ouvrir';
import { dateLisible } from '../stage/offre';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../theme';

/**
 * Offre de stage, d'emploi ou d'alternance partagée par un lien : poste, entreprise, ville, date
 * limite, rémunération, description (dépliée au toucher) et « Postuler » qui ouvre la page
 * d'origine. Pour mes offres, `statut` affiche où en est la vérification ; `onSupprimer` la retire.
 */
export default function CarteOffre({ offre, statut, onSupprimer }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const [deplie, setDeplie] = useState(false);
  const meta = [t(`app.offres.types.${offre.type}`), offre.city, offre.salary].filter(Boolean);

  return (
    <View style={styles.carte}>
      <Pressable onPress={() => setDeplie((d) => !d)} style={styles.corps} accessibilityRole="button" accessibilityState={{ expanded: deplie }}>
        {statut ? <Text style={[styles.statut, statut === 'approved' && styles.statutPubliee]}>{t(`app.offres.statuts.${statut}`)}</Text> : null}
        <Text style={styles.titre}>{offre.title}</Text>
        <Text style={styles.entreprise}>{offre.company}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta.join('  ·  ')}
        </Text>
        {offre.deadline ? (
          <View style={styles.ligne}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={couleurs.lettreAttenuee} />
            <Text style={styles.date}>{t('app.offres.dateLimite', { date: dateLisible(offre.deadline) })}</Text>
          </View>
        ) : null}
        {offre.description ? (
          <Text style={styles.texte} numberOfLines={deplie ? undefined : 4}>
            {offre.description}
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        <Pressable onPress={() => ouvrirAdresse(offre.apply_url, couleurs)} style={styles.postuler} accessibilityRole="link" accessibilityHint={offre.host}>
          <MaterialCommunityIcons name="open-in-new" size={18} color={couleurs.surAccent} />
          <Text style={styles.postulerTexte} numberOfLines={1}>
            {t('app.offres.postuler', { site: offre.host })}
          </Text>
        </Pressable>
        {onSupprimer ? (
          <Pressable onPress={() => onSupprimer(offre)} style={styles.supprimer} accessibilityRole="button" accessibilityLabel={t('app.offres.supprimer')}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={couleurs.lettre} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  carte: { marginHorizontal: 16, marginBottom: 14, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet, overflow: 'hidden' },
  corps: { padding: 14, paddingBottom: 8, gap: 4 },
  statut: { color: t.couleurs.reporte, fontFamily: t.polices.texteGras, fontSize: 13 },
  statutPubliee: { color: t.couleurs.enCours },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 16, lineHeight: 22 },
  entreprise: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 14 },
  meta: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 12, textTransform: t.capitales, letterSpacing: espace(t, 0.4) },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  date: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13 },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  postuler: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: CIBLE_TACTILE, paddingHorizontal: 12, borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent },
  postulerTexte: { flexShrink: 1, color: t.couleurs.surAccent, fontFamily: t.polices.texteGras, fontSize: 14 },
  supprimer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
}));
