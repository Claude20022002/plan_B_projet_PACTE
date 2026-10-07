import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toLocalISODate } from '../../../shared/session.js';
import { couleurStatut, creerStyles, lineColor, useTheme } from '../theme';
import { useMargeOnglets } from '../verre/Verre';
import { abregerCours } from './abreger';

const HEURE = 60; // hauteur d'une heure (points)
const JOURS = 6; // du lundi au samedi
const LARGEUR_HEURES = 40;

const minutesDe = (date) => date.getHours() * 60 + date.getMinutes();
const decaler = (date, jours) => {
  const d = new Date(date);
  d.setDate(d.getDate() + jours);
  return d;
};

/** Séances d'un jour réparties en colonnes quand elles se chevauchent : { s, colonne, colonnes } */
const disposer = (seances) => {
  const triees = [...seances].sort((a, b) => a.start - b.start);
  const resultat = [];
  let groupe = [];
  let finGroupe = 0;
  const fermerGroupe = () => {
    const fins = [];
    const places = groupe.map((s) => {
      let colonne = fins.findIndex((fin) => fin <= s.start);
      if (colonne === -1) colonne = fins.length;
      fins[colonne] = s.end;
      return { s, colonne };
    });
    places.forEach((p) => resultat.push({ ...p, colonnes: fins.length }));
    groupe = [];
  };
  for (const s of triees) {
    if (groupe.length && s.start >= finGroupe) fermerGroupe();
    groupe.push(s);
    finGroupe = Math.max(finGroupe, s.end);
  }
  if (groupe.length) fermerGroupe();
  return resultat;
};

/**
 * Semaine en grille horaire (à la manière d'un agenda d'étudiant) : une colonne par jour du
 * lundi au samedi, chaque séance en bloc à la couleur de son cours ; reportée ou annulée, elle
 * prend la couleur de son statut. Titres abrégés (abreger.js) : la colonne est trop étroite pour
 * un mot long. Trait de l'heure courante sur aujourd'hui.
 */
export default function GrilleSemaine({ lundi, seances, onSeance }) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const margeBas = useMargeOnglets();
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setMaintenant(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const jours = Array.from({ length: JOURS }, (_, i) => decaler(lundi, i));
  const aujourdhui = toLocalISODate(maintenant);
  const valides = seances.filter((s) => s.start && s.end);
  const debut = Math.min(8, ...valides.map((s) => s.start.getHours()));
  const fin = Math.max(18, ...valides.map((s) => Math.ceil(minutesDe(s.end) / 60)));
  const heures = Array.from({ length: fin - debut }, (_, i) => debut + i);
  const langue = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

  return (
    <View style={{ flex: 1 }}>
      {/* En-tête des jours */}
      <View style={styles.entete}>
        <View style={{ width: LARGEUR_HEURES }} />
        {jours.map((j) => {
          const iso = toLocalISODate(j);
          const estAujourdhui = iso === aujourdhui;
          return (
            <View key={iso} style={styles.jour} accessible accessibilityLabel={j.toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long' })}>
              <Text style={[styles.jourNom, estAujourdhui && styles.jourNomActif]}>{j.toLocaleDateString(langue, { weekday: 'short' }).replace('.', '')}</Text>
              <View style={[styles.jourNumero, estAujourdhui && styles.jourNumeroActif]}>
                <Text style={[styles.jourNumeroTexte, estAujourdhui && styles.jourNumeroTexteActif]}>{j.getDate()}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: margeBas }} scrollIndicatorInsets={{ bottom: margeBas }}>
        <View style={{ flexDirection: 'row', height: heures.length * HEURE }}>
          {/* Heures */}
          <View style={{ width: LARGEUR_HEURES }}>
            {heures.map((h) => (
              <Text key={h} style={[styles.heure, { top: (h - debut) * HEURE - 7 }]}>{`${h}h`}</Text>
            ))}
          </View>
          {jours.map((j) => {
            const iso = toLocalISODate(j);
            const duJour = disposer(valides.filter((s) => toLocalISODate(s.start) === iso));
            return (
              <View key={iso} style={styles.colonne}>
                {heures.map((h) => (
                  <View key={h} style={[styles.trait, { top: (h - debut) * HEURE }]} />
                ))}
                {duJour.map(({ s, colonne, colonnes }) => {
                  const statut = ['reporte', 'annule'].includes(s.status) ? s.status : null;
                  const couleur = statut ? couleurStatut(theme, statut) : lineColor(s.courseCode);
                  const haut = ((minutesDe(s.start) - debut * 60) / 60) * HEURE;
                  const hauteur = Math.max(22, ((s.end - s.start) / 3_600_000) * HEURE - 2);
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => onSeance(s)}
                      style={({ pressed }) => [
                        styles.bloc,
                        {
                          top: haut + 1,
                          height: hauteur,
                          left: `${(100 * colonne) / colonnes}%`,
                          width: `${100 / colonnes}%`,
                          backgroundColor: `${couleur}${theme.sombre ? '40' : '24'}`,
                          borderLeftColor: couleur,
                        },
                        statut === 'annule' && styles.annule,
                        pressed && styles.presse,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${s.startLabel}–${s.endLabel}, ${s.course}, ${s.room || ''}`}
                    >
                      <Text style={[styles.blocCours, statut === 'annule' && styles.barre]} numberOfLines={Math.max(1, Math.floor(hauteur / 15) - 1)}>
                        {abregerCours(s.course)}
                      </Text>
                      {hauteur > 44 ? <Text style={styles.blocDetail} numberOfLines={2}>{[s.courseType, s.distanciel ? null : s.room].filter(Boolean).join(' · ')}</Text> : null}
                    </Pressable>
                  );
                })}
                {/* Heure courante */}
                {iso === aujourdhui && maintenant.getHours() >= debut && maintenant.getHours() < fin ? (
                  <View style={[styles.maintenant, { top: ((minutesDe(maintenant) - debut * 60) / 60) * HEURE }]} />
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  entete: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet, backgroundColor: t.couleurs.fond },
  jour: { flex: 1, alignItems: 'center', gap: 4 },
  jourNom: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12, textTransform: 'capitalize' },
  jourNomActif: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras },
  jourNumero: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  jourNumeroActif: { backgroundColor: t.couleurs.accent },
  jourNumeroTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15 },
  jourNumeroTexteActif: { color: t.couleurs.surAccent },
  heure: { position: 'absolute', right: 6, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 11 },
  colonne: { flex: 1, borderLeftWidth: 1, borderLeftColor: t.couleurs.filet },
  trait: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: t.couleurs.filet },
  bloc: { position: 'absolute', paddingHorizontal: 3, paddingVertical: 2, borderLeftWidth: 3, borderRadius: 3, overflow: 'hidden' },
  annule: { opacity: 0.55 },
  presse: { opacity: 0.6 },
  blocCours: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 11, lineHeight: 14 },
  blocDetail: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 10, lineHeight: 13, marginTop: 1 },
  barre: { textDecorationLine: 'line-through' },
  // Trait de l'heure courante : couleur d'action (le rouge est réservé aux annulations)
  maintenant: { position: 'absolute', left: -1, right: 0, height: 2, backgroundColor: t.couleurs.accent },
}));
