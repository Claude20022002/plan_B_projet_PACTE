import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const ETIQUETTES_MAX = 3;
// Jours sans cours : la case est teintée
const TYPES_LIBRES = new Set(['vacances', 'ferie']);
const ICONE_EVENEMENT = { vacances: 'beach', ferie: 'flag-variant-outline', examen: 'school-outline', ramadan: 'moon-waning-crescent', stage: 'briefcase-outline', autre: 'calendar-star' };

/** Nom court d'un cours pour une case du calendrier : CPI-1-ANA1 → ANA1 */
const nomCourt = (s) => (s.courseCode ? s.courseCode.split('-').pop() : (s.course || '').slice(0, 4)).slice(0, 5);

/** Une étiquette par cours dans la journée (deux séances du même cours n'en font qu'une) ; un report ou une annulation reste visible */
const coursDuJour = (liste) => {
  const parCours = new Map();
  for (const s of liste) {
    const cle = s.courseCode || s.course;
    const deja = parCours.get(cle);
    if (!deja || (['reporte', 'annule'].includes(s.status) && !['reporte', 'annule'].includes(deja.status))) parCours.set(cle, s);
  }
  return [...parCours.values()];
};

const heureCourte = (h) => (typeof h === 'string' ? h.slice(0, 5) : '');

/**
 * Mois en calendrier, à la manière d'un agenda : chaque jour montre ses cours (nom court à la
 * couleur du cours), ses examens et les jours de vacances ou fériés (case teintée). Dessous, le
 * bilan du mois puis le détail du jour choisi : événements, examens et séances.
 */
export default function VueMois({ mois, seances, evenements = [], examens = [], jourChoisi, choisir, onSeance }) {
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
  const examensDuJour = (iso) => examens.filter((x) => x.date === iso);
  const evenementsDuJour = (iso) => evenements.filter((e) => e.date_debut <= iso && e.date_fin >= iso);

  // Bilan du mois affiché (jours du mois seulement)
  const duMois = (iso) => iso.slice(0, 7) === toLocalISODate(mois).slice(0, 7);
  const nbSeances = seances.filter((s) => s.start && duMois(toLocalISODate(s.start)) && s.status !== 'annule').length;
  const nbExamens = examens.filter((x) => duMois(x.date)).length;
  const joursLibres = jours.filter((j) => duMois(toLocalISODate(j)) && evenementsDuJour(toLocalISODate(j)).some((e) => TYPES_LIBRES.has(e.type))).length;

  const duJour = (parJour.get(jourChoisi) ?? []).sort((a, b) => a.start - b.start);
  const nomsJours = Array.from({ length: 7 }, (_, i) => decaler(debut, i).toLocaleDateString(langue, { weekday: 'narrow' }));
  const couleurSeance = (s) => (['reporte', 'annule'].includes(s.status) ? couleurStatut(theme, s.status) : lineColor(s.courseCode));

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
              const exams = examensDuJour(iso);
              const evts = evenementsDuJour(iso);
              const libre = evts.some((e) => TYPES_LIBRES.has(e.type));
              const cours = coursDuJour(liste);
              const etiquettes = cours.slice(0, exams.length ? ETIQUETTES_MAX - 1 : ETIQUETTES_MAX);
              const reste = cours.length - etiquettes.length;
              const resume = [
                t('app.semaine.nbSeances', { count: liste.length }),
                exams.length ? t('app.mois.nbExamens', { count: exams.length }) : null,
                ...evts.map((e) => e.titre),
              ].filter(Boolean);
              return (
                <Pressable
                  key={iso}
                  onPress={() => choisir(iso)}
                  style={[styles.case, libre && styles.caseLibre, choisi && styles.caseChoisie, horsMois && styles.horsMoisCase]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: choisi }}
                  accessibilityLabel={`${j.toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long' })}, ${resume.join(', ')}`}
                >
                  <View style={styles.enTeteCase}>
                    <View style={[styles.numero, iso === aujourdhui && styles.numeroAujourdhui]}>
                      <Text style={[styles.numeroTexte, iso === aujourdhui && styles.numeroTexteAujourdhui]}>{j.getDate()}</Text>
                    </View>
                    {evts.length ? <MaterialCommunityIcons name={ICONE_EVENEMENT[evts[0].type] ?? 'calendar-star'} size={11} color={theme.couleurs.accent} /> : null}
                  </View>
                  {exams.length ? (
                    <View style={[styles.etiquette, styles.etiquetteExamen]}>
                      <Text style={styles.etiquetteExamenTexte} numberOfLines={1}>{t('app.mois.exam')}</Text>
                    </View>
                  ) : null}
                  {etiquettes.map((s) => (
                    <View key={s.id} style={[styles.etiquette, { backgroundColor: `${couleurSeance(s)}${theme.sombre ? '55' : '2E'}`, borderLeftColor: couleurSeance(s) }]}>
                      <Text style={[styles.etiquetteTexte, s.status === 'annule' && styles.barre]} numberOfLines={1}>{nomCourt(s)}</Text>
                    </View>
                  ))}
                  {reste > 0 ? <Text style={styles.reste}>+{reste}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Bilan du mois */}
      <View style={styles.bilan}>
        <Bilan icone="calendar-check-outline" valeur={nbSeances} libelle={t('app.mois.seances', { count: nbSeances })} />
        <Bilan icone="school-outline" valeur={nbExamens} libelle={t('app.mois.examens', { count: nbExamens })} />
        <Bilan icone="beach" valeur={joursLibres} libelle={t('app.mois.joursLibres', { count: joursLibres })} />
      </View>

      <Text style={styles.titreJour} accessibilityRole="header">
        {new Date(`${jourChoisi}T12:00:00`).toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      {evenementsDuJour(jourChoisi).map((e) => (
        <View key={`e${e.id}`} style={styles.evenement}>
          <MaterialCommunityIcons name={ICONE_EVENEMENT[e.type] ?? 'calendar-star'} size={20} color={theme.couleurs.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.evenementTitre}>{e.titre}</Text>
            <Text style={styles.evenementDetail}>
              {[t(`app.mois.types.${e.type}`, { defaultValue: '' }), e.heure_debut ? `${heureCourte(e.heure_debut)}–${heureCourte(e.heure_fin)}` : null, e.date_confirmee === false ? t('app.mois.aConfirmer') : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
      ))}
      {examensDuJour(jourChoisi).map((x) => (
        <View key={`x${x.id}`} style={[styles.evenement, styles.examen]}>
          <MaterialCommunityIcons name="school-outline" size={20} color={theme.couleurs.lettre} />
          <View style={{ flex: 1 }}>
            <Text style={styles.evenementTitre}>{x.titre}</Text>
            <Text style={styles.evenementDetail}>{[`${heureCourte(x.heure_debut)}–${heureCourte(x.heure_fin)}`, x.salles.join(', ')].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>
      ))}
      {duJour.map((s) => (
        <CarteSeance key={s.id} seance={s} onPress={() => onSeance(s)} />
      ))}
      {!duJour.length && !examensDuJour(jourChoisi).length && !evenementsDuJour(jourChoisi).length ? <Text style={styles.vide}>{t('app.semaine.rienCeJour')}</Text> : null}
    </View>
  );
}

function Bilan({ icone, valeur, libelle }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bilanCase} accessible accessibilityLabel={`${valeur} ${libelle}`}>
      <MaterialCommunityIcons name={icone} size={18} color={couleurs.lettreAttenuee} />
      <Text style={styles.bilanValeur}>{valeur}</Text>
      <Text style={styles.bilanLibelle} numberOfLines={1}>{libelle}</Text>
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  calendrier: { paddingHorizontal: 4, paddingBottom: 6, backgroundColor: t.couleurs.cellule, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet },
  semaine: { flexDirection: 'row' },
  nomJour: { flex: 1, textAlign: 'center', paddingVertical: 8, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texteGras, fontSize: 12, textTransform: 'uppercase' },
  case: { flex: 1, minHeight: 74, margin: 1, padding: 2, borderRadius: 6, gap: 2 },
  caseLibre: { backgroundColor: `${t.couleurs.accent}${t.sombre ? '26' : '14'}` },
  caseChoisie: { borderWidth: 1.5, borderColor: t.couleurs.accent },
  horsMoisCase: { opacity: 0.4 },
  enTeteCase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 1 },
  numero: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numeroAujourdhui: { backgroundColor: t.couleurs.accent },
  numeroTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 13, fontVariant: ['tabular-nums'] },
  numeroTexteAujourdhui: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras },
  etiquette: { borderRadius: 3, borderLeftWidth: 2, paddingHorizontal: 2, paddingVertical: 1 },
  etiquetteTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 9 },
  etiquetteExamen: { backgroundColor: t.couleurs.lettre, borderLeftColor: t.couleurs.lettre },
  etiquetteExamenTexte: { color: t.couleurs.fond, fontFamily: t.polices.texteGras, fontSize: 9, textTransform: 'uppercase' },
  barre: { textDecorationLine: 'line-through' },
  reste: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texteGras, fontSize: 9, paddingLeft: 2 },
  bilan: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  bilanCase: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: t.rayons.md, backgroundColor: t.couleurs.cellule, borderWidth: 1, borderColor: t.couleurs.filet },
  bilanValeur: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 22, fontVariant: ['tabular-nums'], marginTop: 2 },
  bilanLibelle: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12 },
  titreJour: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texteGras, fontSize: 14, textTransform: 'capitalize' },
  evenement: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: t.rayons.md, backgroundColor: `${t.couleurs.accent}${t.sombre ? '26' : '14'}` },
  examen: { backgroundColor: t.couleurs.cellule, borderWidth: 1, borderColor: t.couleurs.lettre },
  evenementTitre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15 },
  evenementDetail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, marginTop: 2 },
  vide: { paddingHorizontal: 16, paddingVertical: 12, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 15 },
}));
