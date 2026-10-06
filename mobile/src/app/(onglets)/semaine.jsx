import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDayLabel, groupByDay, toLocalISODate } from '../../../../shared/session.js';
import Ecran, { Message } from '../../board/Ecran';
import { chargerSeances } from '../../api/donnees';
import { ecrireCache, lireCache } from '../../cache';
import useRafraichissement from '../../hooks/useRafraichissement';
import CarteSeance from '../../semaine/CarteSeance';
import FicheSeance from '../../semaine/FicheSeance';
import GrilleSemaine from '../../semaine/GrilleSemaine';
import VueMois, { debutGrilleMois } from '../../semaine/VueMois';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../../theme';
import { useMargeOnglets } from '../../verre/Verre';

const VUES = ['liste', 'grille', 'mois'];
const ICONES_VUES = { liste: 'format-list-bulleted', grille: 'view-week-outline', mois: 'calendar-month-outline' };
const CLE_VUE = 'hestim.semaine.vue';

const lundiDe = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};
const decaler = (date, jours) => {
  const d = new Date(date);
  d.setDate(d.getDate() + jours);
  return d;
};
const AUCUNE = [];
const reviver = (s) => ({ ...s, start: s.start ? new Date(s.start) : null, end: s.end ? new Date(s.end) : null });

/**
 * Séances, événements et examens d'une période ; sans réseau, la dernière copie enregistrée sur
 * le téléphone (horsLigne, avec son heure), ou une erreur s'il n'y en a pas.
 */
const lirePeriode = async (du, au, cle) => {
  try {
    const { seances, evenements, examens } = await chargerSeances(du, au);
    ecrireCache(cle, { seances, evenements, examens });
    return { cle, seances, evenements, examens, erreur: false, horsLigne: null };
  } catch {
    const cache = await lireCache(cle);
    if (!cache) return { cle, seances: [], evenements: [], examens: [], erreur: true, horsLigne: null };
    // Anciennes copies : la liste des séances seule
    const d = Array.isArray(cache.donnees) ? { seances: cache.donnees } : cache.donnees;
    return { cle, seances: (d.seances ?? []).map(reviver), evenements: d.evenements ?? [], examens: d.examens ?? [], erreur: false, horsLigne: cache.le };
  }
};

/**
 * Semaine, à la manière d'un agenda d'étudiant : la liste des séances par jour, la grille horaire
 * de la semaine, ou le mois en calendrier. Toucher une séance ouvre son détail (report : date et
 * heure d'origine puis les nouvelles). Vue choisie retenue sur l'appareil.
 */
export default function Semaine() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const margeBas = useMargeOnglets();
  const { t, i18n } = useTranslation();
  const [vue, setVue] = useState('liste');
  const [lundi, setLundi] = useState(() => lundiDe(new Date()));
  const [mois, setMois] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [jourChoisi, setJourChoisi] = useState(() => toLocalISODate(new Date()));
  const [fiche, setFiche] = useState(null);
  const [resultat, setResultat] = useState({ cle: null, seances: [], evenements: [], examens: [], erreur: false, horsLigne: null });
  const [rafraichit, setRafraichit] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLE_VUE)
      .then((v) => VUES.includes(v) && setVue(v))
      .catch(() => {});
  }, []);
  const choisirVue = (v) => {
    setVue(v);
    AsyncStorage.setItem(CLE_VUE, v).catch(() => {});
  };

  // Période lue : la semaine (liste, grille) ou les six semaines affichées du mois
  const parMois = vue === 'mois';
  const du = parMois ? debutGrilleMois(mois) : lundi;
  const au = parMois ? decaler(du, 41) : decaler(lundi, 5);
  const cle = parMois ? `mois.${toLocalISODate(mois)}` : `semaine.${toLocalISODate(lundi)}`;
  const aJour = resultat.cle === cle;
  // Tableau vide stable entre deux rendus (dépendance des mémos ci-dessous)
  const seances = aJour ? resultat.seances : AUCUNE;

  const charger = useCallback(
    () =>
      lirePeriode(du, au, cle).then((lu) => {
        setResultat(lu);
        setRafraichit(false);
      }),
    // du et au découlent de la clé
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cle]
  );
  useEffect(() => {
    charger();
  }, [charger]);
  useRafraichissement(charger);

  const sections = useMemo(() => groupByDay(seances).map(({ date, items }) => ({ title: formatDayLabel(date, i18n.language), data: items })), [seances, i18n.language]);
  const langue = i18n.language === 'en' ? 'en-GB' : 'fr-FR';
  const libelle = parMois
    ? mois.toLocaleDateString(langue, { month: 'long', year: 'numeric' })
    : t('board.weekTitle', { date: formatDayLabel(toLocalISODate(lundi), i18n.language, { weekday: undefined }) });
  const actuel = parMois ? mois.getMonth() === new Date().getMonth() && mois.getFullYear() === new Date().getFullYear() : toLocalISODate(lundi) === toLocalISODate(lundiDe(new Date()));

  const avancer = (sens) => {
    if (parMois) {
      const suivant = new Date(mois.getFullYear(), mois.getMonth() + sens, 1);
      setMois(suivant);
      setJourChoisi(toLocalISODate(suivant));
    } else setLundi((l) => decaler(l, 7 * sens));
  };
  const revenir = () => {
    setLundi(lundiDe(new Date()));
    setMois(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setJourChoisi(toLocalISODate(new Date()));
  };

  const rafraichissement = <RefreshControl refreshing={rafraichit} onRefresh={() => { setRafraichit(true); charger(); }} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />;
  const vide = aJour ? <Message>{t(resultat.erreur ? 'app.tableau.erreur' : 'app.semaine.vide')}</Message> : null;

  return (
    <Ecran titre={t('app.onglets.semaine')}>
      {/* Vue : liste, semaine en grille, mois */}
      <View style={styles.vues} accessibilityRole="tablist">
        {VUES.map((v) => {
          const actif = v === vue;
          return (
            <Pressable key={v} onPress={() => choisirVue(v)} style={[styles.vue, actif && styles.vueActive]} accessibilityRole="tab" accessibilityState={{ selected: actif }}>
              <MaterialCommunityIcons name={ICONES_VUES[v]} size={18} color={actif ? couleurs.surAccent : couleurs.lettreAttenuee} />
              <Text style={[styles.vueTexte, actif && styles.vueTexteActif]}>{t(`app.semaine.vues.${v}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      {aJour && resultat.horsLigne ? (
        <Text style={styles.horsLigne}>{t('app.semaine.horsLigne', { heure: new Date(resultat.horsLigne).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</Text>
      ) : null}

      <View style={styles.navigation}>
        <Pressable onPress={() => avancer(-1)} style={styles.fleche} accessibilityRole="button" accessibilityLabel={t(parMois ? 'app.semaine.moisPrecedent' : 'app.semaine.precedente')}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={couleurs.lettre} />
        </Pressable>
        <Text style={styles.libelleTexte} accessibilityRole="header">{libelle}</Text>
        {!actuel ? (
          <Pressable onPress={revenir} style={styles.retour} accessibilityRole="button">
            <Text style={styles.retourTexte}>{t('app.semaine.aujourdhui')}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => avancer(1)} style={styles.fleche} accessibilityRole="button" accessibilityLabel={t(parMois ? 'app.semaine.moisSuivant' : 'app.semaine.suivante')}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={couleurs.lettre} />
        </Pressable>
      </View>

      {vue === 'liste' ? (
        <SectionList
          sections={sections}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => <CarteSeance seance={item} onPress={() => setFiche(item)} />}
          renderSectionHeader={({ section }) => <Text style={styles.jour}>{section.title}</Text>}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: margeBas }}
          scrollIndicatorInsets={{ bottom: margeBas }}
          refreshControl={rafraichissement}
          ListEmptyComponent={vide}
        />
      ) : null}
      {vue === 'grille' ? <GrilleSemaine lundi={lundi} seances={seances} onSeance={setFiche} /> : null}
      {vue === 'mois' ? (
        <ScrollView refreshControl={rafraichissement} contentContainerStyle={{ paddingBottom: margeBas }} scrollIndicatorInsets={{ bottom: margeBas }}>
          {aJour && resultat.erreur ? (
            vide
          ) : (
            <VueMois mois={mois} seances={seances} evenements={aJour ? resultat.evenements : AUCUNE} examens={aJour ? resultat.examens : AUCUNE} jourChoisi={jourChoisi} choisir={setJourChoisi} onSeance={setFiche} />
          )}
        </ScrollView>
      ) : null}

      <FicheSeance seance={fiche} fermer={() => setFiche(null)} />
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  horsLigne: { marginHorizontal: 16, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: t.rayons.sm, backgroundColor: t.couleurs.cellule, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13 },
  vues: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginTop: 12, padding: 3, borderRadius: t.rayons.md, backgroundColor: t.couleurs.cellule },
  vue: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, borderRadius: t.rayons.sm },
  vueActive: { backgroundColor: t.couleurs.accent },
  vueTexte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 0.6) },
  vueTexteActif: { color: t.couleurs.surAccent },
  navigation: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: t.couleurs.filet },
  fleche: { width: CIBLE_TACTILE + 4, height: CIBLE_TACTILE + 4, alignItems: 'center', justifyContent: 'center' },
  libelleTexte: { flex: 1, textAlign: 'center', color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: 17, textTransform: t.famille === 'planner' ? 'uppercase' : 'capitalize', letterSpacing: espace(t, 0.8) },
  retour: { minHeight: 32, paddingHorizontal: 10, justifyContent: 'center', borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet },
  retourTexte: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: 13, textTransform: t.capitales },
  jour: { backgroundColor: t.couleurs.fond, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1.2), paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
}));
