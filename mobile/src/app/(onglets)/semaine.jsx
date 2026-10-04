import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDayLabel, groupByDay, toLocalISODate } from '../../../../shared/session.js';
import Ecran, { Message } from '../../board/Ecran';
import DepartureRow from '../../board/DepartureRow';
import { chargerSeances } from '../../api/donnees';
import { ecrireCache, lireCache } from '../../cache';
import useRafraichissement from '../../hooks/useRafraichissement';
import { CIBLE_TACTILE, couleurs, polices } from '../../theme';

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
const reviver = (s) => ({ ...s, start: s.start ? new Date(s.start) : null, end: s.end ? new Date(s.end) : null });

/** Semaine : une section par jour, du lundi au samedi, et navigation de semaine en semaine. */
export default function Semaine() {
  const { t, i18n } = useTranslation();
  const [lundi, setLundi] = useState(() => lundiDe(new Date()));
  const [seances, setSeances] = useState([]);
  const [etat, setEtat] = useState({ chargement: true, erreur: false, rafraichit: false });
  const cle = `semaine.${toLocalISODate(lundi)}`;

  const charger = useCallback(
    async ({ tire = false } = {}) => {
      if (tire) setEtat((e) => ({ ...e, rafraichit: true }));
      try {
        const { seances: lues } = await chargerSeances(lundi, decaler(lundi, 5));
        setSeances(lues);
        setEtat({ chargement: false, erreur: false, rafraichit: false });
        ecrireCache(cle, lues);
      } catch {
        const cache = await lireCache(cle);
        if (cache) setSeances(cache.donnees.map(reviver));
        setEtat({ chargement: false, erreur: !cache, rafraichit: false });
      }
    },
    [lundi, cle]
  );

  useEffect(() => {
    setSeances([]);
    setEtat({ chargement: true, erreur: false, rafraichit: false });
    charger();
  }, [charger]);
  useRafraichissement(charger);

  const sections = useMemo(() => groupByDay(seances).map(({ date, items }) => ({ title: formatDayLabel(date, i18n.language), data: items })), [seances, i18n.language]);
  const cetteSemaine = toLocalISODate(lundi) === toLocalISODate(lundiDe(new Date()));
  const libelleSemaine = t('board.weekTitle', { date: formatDayLabel(toLocalISODate(lundi), i18n.language, { weekday: undefined }) });

  const fleche = (sens) => (
    <Pressable
      onPress={() => setLundi((l) => decaler(l, 7 * sens))}
      style={styles.fleche}
      accessibilityRole="button"
      accessibilityLabel={t(sens < 0 ? 'app.semaine.precedente' : 'app.semaine.suivante')}
    >
      <MaterialCommunityIcons name={sens < 0 ? 'chevron-left' : 'chevron-right'} size={28} color={couleurs.lettre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.onglets.semaine')}>
      <View style={styles.navigation}>
        {fleche(-1)}
        <Pressable onPress={() => setLundi(lundiDe(new Date()))} disabled={cetteSemaine} style={styles.libelle} accessibilityRole="button" accessibilityLabel={cetteSemaine ? libelleSemaine : `${libelleSemaine}. ${t('app.semaine.cetteSemaine')}`}>
          <Text style={styles.libelleTexte}>{libelleSemaine}</Text>
        </Pressable>
        {fleche(1)}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => <DepartureRow seance={item} />}
        renderSectionHeader={({ section }) => <Text style={styles.jour}>{section.title}</Text>}
        stickySectionHeadersEnabled
        refreshControl={<RefreshControl refreshing={etat.rafraichit} onRefresh={() => charger({ tire: true })} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}
        ListEmptyComponent={!etat.chargement ? <Message>{t(etat.erreur ? 'app.tableau.erreur' : 'app.semaine.vide')}</Message> : null}
      />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  navigation: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: couleurs.filet },
  fleche: { width: CIBLE_TACTILE + 8, height: CIBLE_TACTILE + 8, alignItems: 'center', justifyContent: 'center' },
  libelle: { flex: 1, alignItems: 'center', minHeight: CIBLE_TACTILE, justifyContent: 'center' },
  libelleTexte: { color: couleurs.lettre, fontFamily: polices.panneau, fontSize: 17, textTransform: 'uppercase', letterSpacing: 0.8 },
  jour: { backgroundColor: couleurs.fond, color: couleurs.lettreAttenuee, fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
});
