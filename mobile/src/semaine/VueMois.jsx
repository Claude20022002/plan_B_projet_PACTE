import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toLocalISODate } from '../../../shared/session.js';
import { couleurStatut, creerStyles, lineColor, useTheme } from '../theme';
import CarteSeance from './CarteSeance';

const decaler = (date, jours) => {
  const d = new Date(date);
  d.setDate(d.getDate() + jours);
  return d;
};

/** Premier lundi de la grille d'un mois (6 semaines affichées) */
export const debutGrilleMois = (mois) => {
  const premier = new Date(mois.getFullYear(), mois.getMonth(), 1);
  return decaler(premier, -((premier.getDay() + 6) % 7));
};

/**
 * Mois en calendrier : un point par séance (couleur du cours, du statut s'il est reporté ou
 * annulé), le jour choisi entouré ; dessous, les séances de ce jour en cartes d'agenda.
 */
export default function VueMois({ mois, seances, jourChoisi, choisir, onSeance }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const langue = i18n.language === 'en' ? 'en-GB' : 'fr-FR';
  const debut = debutGrilleMois(mois);
  const jours = Array.from({ length: 42 }, (_, i) => decaler(debut, i));
  const aujourdhui = toLocalISODate(new Date());
  const parJour = new Map();
  for (const s of seances) {
    if (!s.start) continue;
    const iso = toLocalISODate(s.start);
    parJour.set(iso, [...(parJour.get(iso) ?? []), s]);
  }
  const duJour = (parJour.get(jourChoisi) ?? []).sort((a, b) => a.start - b.start);
  const nomsJours = Array.from({ length: 7 }, (_, i) => decaler(debut, i).toLocaleDateString(langue, { weekday: 'narrow' }));

  return (
    <View>
      <View style={styles.calendrier}>
        <View style={styles.semaine}>
          {nomsJours.map((n, i) => (
            <Text key={i} style={styles.nomJour}>{n}</Text>
          ))}
        </View>
        {Array.from({ length: 6 }, (_, rang) => (
          <View key={rang} style={styles.semaine}>
            {jours.slice(rang * 7, rang * 7 + 7).map((j) => {
              const iso = toLocalISODate(j);
              const horsMois = j.getMonth() !== mois.getMonth();
              const choisi = iso === jourChoisi;
              const liste = parJour.get(iso) ?? [];
              return (
                <Pressable
                  key={iso}
                  onPress={() => choisir(iso)}
                  style={styles.case}
                  accessibilityRole="button"
                  accessibilityState={{ selected: choisi }}
                  accessibilityLabel={`${j.toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long' })}, ${t('app.semaine.nbSeances', { count: liste.length })}`}
                >
                  <View style={[styles.numero, choisi && styles.numeroChoisi]}>
                    <Text style={[styles.numeroTexte, horsMois && styles.horsMois, iso === aujourdhui && styles.aujourdhui, choisi && styles.numeroTexteChoisi]}>{j.getDate()}</Text>
                  </View>
                  <View style={styles.points}>
                    {liste.slice(0, 4).map((s) => (
                      <View key={s.id} style={[styles.point, { backgroundColor: ['reporte', 'annule'].includes(s.status) ? couleurStatut(theme, s.status) : lineColor(s.courseCode) }, horsMois && { opacity: 0.4 }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.titreJour} accessibilityRole="header">
        {new Date(`${jourChoisi}T12:00:00`).toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      {duJour.length ? duJour.map((s) => <CarteSeance key={s.id} seance={s} onPress={() => onSeance(s)} />) : <Text style={styles.vide}>{t('app.semaine.rienCeJour')}</Text>}
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  calendrier: { paddingHorizontal: 8, paddingBottom: 8, backgroundColor: t.couleurs.cellule, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet },
  semaine: { flexDirection: 'row' },
  nomJour: { flex: 1, textAlign: 'center', paddingVertical: 8, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texteGras, fontSize: 12, textTransform: 'uppercase' },
  case: { flex: 1, alignItems: 'center', paddingVertical: 4, minHeight: 50 },
  numero: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  numeroChoisi: { backgroundColor: t.couleurs.accent },
  numeroTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15 },
  numeroTexteChoisi: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras },
  horsMois: { color: t.couleurs.lettreAttenuee, opacity: 0.6 },
  aujourdhui: { fontFamily: t.polices.texteGras, textDecorationLine: 'underline' },
  points: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  point: { width: 6, height: 6, borderRadius: 3 },
  titreJour: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texteGras, fontSize: 14, textTransform: 'capitalize' },
  vide: { paddingHorizontal: 16, paddingVertical: 12, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 15 },
}));
