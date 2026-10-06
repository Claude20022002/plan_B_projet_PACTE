import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CIBLE_TACTILE, couleurStatut, creerStyles, espace, lineColor, useTheme } from '../theme';
import Feuille from '../verre/Feuille';

const dateLongue = (iso, langue) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(langue === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function Ligne({ icone, children, barre = false }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.ligne}>
      <MaterialCommunityIcons name={icone} size={20} color={couleurs.lettreAttenuee} />
      <Text style={[styles.ligneTexte, barre && styles.barre]}>{children}</Text>
    </View>
  );
}

/**
 * Détail d'une séance (toucher une séance dans le tableau, la semaine ou le mois) : date, heures,
 * salle, enseignant, groupe ; pour un report, la date et l'heure d'origine barrées puis les
 * nouvelles ; pour une annulation, la mention claire. Lien vers les supports du cours.
 */
export default function FicheSeance({ seance: s, fermer }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  if (!s) return null;

  const statut = ['reporte', 'annule'].includes(s.status) ? s.status : null;
  const couleur = statut ? couleurStatut(theme, statut) : null;
  const salle = s.distanciel
    ? [t('app.distanciel'), s.mention].filter(Boolean).join(' · ')
    : [s.room ? `${t('board.room')} ${s.room}` : null, s.floor !== null && s.floor !== undefined ? t('board.floor', { floor: s.floor }) : null, s.building].filter(Boolean).join(' · ');
  const initial = statut === 'reporte' && s.initial ? s.initial : null;

  return (
    <Feuille fermer={fermer} style={styles.feuille}>
      <ScrollView>
        <View style={styles.entete}>
          <View style={[styles.pastille, { backgroundColor: lineColor(s.courseCode) }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.titre, statut === 'annule' && styles.barre]} accessibilityRole="header">{s.course}</Text>
            <Text style={styles.sousTitre}>{[s.courseType, s.courseCode].filter(Boolean).join(' · ')}</Text>
          </View>
          <Pressable onPress={fermer} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
            <MaterialCommunityIcons name="close" size={22} color={theme.couleurs.lettre} />
          </Pressable>
        </View>

        {statut ? (
          <View style={[styles.bandeau, { borderColor: couleur }]}>
            <Text style={[styles.bandeauTitre, { color: couleur }]}>{t(`status.${statut}`)}</Text>
            <Text style={styles.bandeauTexte}>{t(statut === 'annule' ? 'app.fiche.annuleeTexte' : 'app.fiche.reporteeTexte')}</Text>
          </View>
        ) : null}

        {initial ? (
          <View style={styles.bloc}>
            <Text style={styles.section}>{t('app.fiche.initialement')}</Text>
            <Ligne icone="calendar-remove-outline" barre>
              {[dateLongue(initial.date, i18n.language), initial.startLabel && initial.endLabel ? `${initial.startLabel}–${initial.endLabel}` : null].filter(Boolean).join(' · ')}
            </Ligne>
            <Text style={[styles.section, { color: couleur }]}>{t('app.fiche.nouvelleDate')}</Text>
          </View>
        ) : null}

        <View style={styles.bloc}>
          <Ligne icone="calendar-month-outline">{dateLongue(s.date, i18n.language)}</Ligne>
          <Ligne icone="clock-outline">{`${s.startLabel}–${s.endLabel}`}</Ligne>
          {salle ? <Ligne icone={s.distanciel ? 'laptop' : 'door'}>{salle}</Ligne> : null}
          {s.teacher ? <Ligne icone="account-tie-outline">{s.teacher}</Ligne> : null}
          {s.group ? <Ligne icone="account-group-outline">{s.group}</Ligne> : null}
        </View>

        {s.courseCode ? (
          <Pressable
            onPress={() => {
              fermer();
              router.push(`/module/${encodeURIComponent(s.courseCode)}`);
            }}
            style={styles.bouton}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="file-document-multiple-outline" size={20} color={theme.couleurs.surAccent} />
            <Text style={styles.boutonTexte}>{t('app.fiche.supports')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Feuille>
  );
}

const useStyles = creerStyles((t) => ({
  feuille: { maxHeight: '85%' },
  entete: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingLeft: 16, paddingRight: 4, paddingTop: 12 },
  pastille: { width: 14, height: 14, borderRadius: t.famille === 'planner' ? 2 : 7, marginTop: 8 },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 22, textTransform: t.capitales, letterSpacing: espace(t, 0.6) },
  sousTitre: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, marginTop: 2 },
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  bandeau: { marginHorizontal: 16, marginTop: 14, padding: 12, borderLeftWidth: 4, borderRadius: t.rayons.sm, backgroundColor: t.couleurs.cellule, gap: 2 },
  bandeauTitre: { fontFamily: t.polices.panneauGras, fontSize: 16, textTransform: t.capitales, letterSpacing: espace(t, 1) },
  bandeauTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
  bloc: { marginHorizontal: 16, marginTop: 14, gap: 10 },
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 12, letterSpacing: espace(t, 1.6), textTransform: t.capitales },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ligneTexte: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16 },
  barre: { textDecorationLine: 'line-through', color: t.couleurs.lettreAttenuee },
  bouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginTop: 22, minHeight: CIBLE_TACTILE, borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 16, textTransform: t.capitales, letterSpacing: espace(t, 1) },
}));
