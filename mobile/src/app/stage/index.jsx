import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ecran, { Message } from '../../board/Ecran';
import { chargerFiltresStages, chargerMesStages, chargerStages } from '../../api/donnees';
import CarteStage from '../../bibliotheque/CarteStage';
import FiltresStages from '../../bibliotheque/FiltresStages';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../../theme';

const DELAI_RECHERCHE_MS = 400;
const VIDE = { avis: [], page: 0, suite: false, total: 0 };

/**
 * Stages : deux onglets. « Tous les avis » : les retours de stage partagés par les étudiants de
 * l'école, avec une recherche et des filtres (ville, secteur, année, rémunération). « Mes partages » :
 * mes propres retours, publiés ou en attente. « Partager mon stage » reste en tête.
 */
/** Onglet « Tous les avis » ou « Mes partages » */
function Onglet({ actif, libelle, onPress, styles }) {
  return (
    <Pressable onPress={onPress} style={[styles.onglet, actif && styles.ongletActif]} accessibilityRole="tab" accessibilityState={{ selected: actif }}>
      <Text style={[styles.ongletTexte, actif && styles.ongletTexteActif]}>{libelle}</Text>
    </Pressable>
  );
}

export default function Stages() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const margeBas = useSafeAreaInsets().bottom;
  const [onglet, setOnglet] = useState('tous');
  const [saisie, setSaisie] = useState('');
  const [filtres, setFiltres] = useState({ q: '' });
  const [valeurs, setValeurs] = useState(null);
  const [version, setVersion] = useState(0);
  // Résultats de la requête « cle » (onglet, filtres, version) : en chargement tant qu'ils ne la portent pas
  const cle = JSON.stringify([onglet, filtres, version]);
  const [resultats, setResultats] = useState({ cle: null, ...VIDE, erreur: false });
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const etat = { chargement: resultats.cle !== cle || suiteEnCours, erreur: resultats.cle === cle && resultats.erreur };

  // La recherche part après une courte pause de frappe
  useEffect(() => {
    const minuterie = setTimeout(() => setFiltres((f) => ({ ...f, q: saisie.trim() })), DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuterie);
  }, [saisie]);

  useEffect(() => {
    chargerFiltresStages().then(setValeurs, () => setValeurs({}));
  }, []);

  const page = useCallback((n) => (onglet === 'tous' ? chargerStages(filtres, n) : chargerMesStages(n)), [onglet, filtres]);

  // Première page à chaque changement d'onglet, de filtre ou au rafraîchissement
  useEffect(() => {
    let actif = true;
    page(1).then(
      (r) => actif && setResultats({ cle, ...r, erreur: false }),
      () => actif && setResultats({ cle, ...VIDE, erreur: true })
    );
    return () => {
      actif = false;
    };
  }, [page, cle]);

  const suivante = async () => {
    setSuiteEnCours(true);
    try {
      const r = await page(resultats.page + 1);
      setResultats((avant) => ({ ...avant, ...r, avis: [...avant.avis, ...r.avis] }));
    } finally {
      setSuiteEnCours(false);
    }
  };

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.stages.titre')} droite={fermer} espaces={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: margeBas + 24 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => setVersion((v) => v + 1)} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}
      >
        <View style={styles.onglets} accessibilityRole="tablist">
          {['tous', 'miens'].map((valeur) => (
            <Onglet key={valeur} actif={onglet === valeur} libelle={t(`app.stages.${valeur}`)} onPress={() => setOnglet(valeur)} styles={styles} />
          ))}
        </View>

        <Pressable onPress={() => router.push('/stage/partager')} style={styles.partager} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={20} color={couleurs.surAccent} />
          <Text style={styles.partagerTexte}>{t('app.bibliotheque.partagerStage')}</Text>
        </Pressable>

        {onglet === 'miens' ? <View style={{ height: 12 }} /> : null}
        {onglet === 'tous' ? (
          <>
            <View style={styles.recherche}>
              <MaterialCommunityIcons name="magnify" size={20} color={couleurs.lettreAttenuee} />
              <TextInput value={saisie} onChangeText={setSaisie} placeholder={t('app.stages.rechercher')} placeholderTextColor={couleurs.lettreAttenuee} style={styles.champ} returnKeyType="search" autoCorrect={false} accessibilityLabel={t('app.stages.rechercher')} />
            </View>
            <FiltresStages valeurs={valeurs} filtres={filtres} onChange={setFiltres} />
            {!etat.chargement && !etat.erreur ? <Text style={styles.total}>{t('app.stages.total', { count: resultats.total })}</Text> : null}
          </>
        ) : null}

        {etat.erreur ? <Message>{t('app.bibliotheque.indisponible')}</Message> : null}
        {!etat.erreur && !etat.chargement && resultats.avis.length === 0 ? (
          <Message discret>{t(onglet === 'tous' ? 'app.stages.aucunResultat' : 'app.stages.aucunPartage')}</Message>
        ) : null}
        {resultats.avis.map((a) => (
          <View key={a.id}>
            {onglet === 'miens' && a.publie === false ? <Text style={styles.attente}>{t('app.stages.enAttente')}</Text> : null}
            <CarteStage avis={a} />
          </View>
        ))}
        {etat.chargement ? <ActivityIndicator style={{ marginTop: 16 }} color={couleurs.lettre} /> : null}
        {!etat.chargement && resultats.suite ? (
          <Pressable onPress={suivante} style={styles.plus} accessibilityRole="button">
            <Text style={styles.plusTexte}>{t('app.stages.plus')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  onglets: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet, overflow: 'hidden' },
  onglet: { flex: 1, minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', backgroundColor: t.couleurs.cellule },
  ongletActif: { backgroundColor: t.couleurs.accent },
  ongletTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15 },
  ongletTexteActif: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras },
  partager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 12, minHeight: CIBLE_TACTILE, borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent },
  partagerTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras, fontSize: 15 },
  recherche: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 12, minHeight: CIBLE_TACTILE, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet },
  champ: { flex: 1, minHeight: CIBLE_TACTILE, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16 },
  total: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  attente: { color: t.couleurs.reporte, fontFamily: t.polices.texteGras, fontSize: 13, paddingHorizontal: 16, paddingTop: 12 },
  plus: { minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  plusTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, textDecorationLine: 'underline' },
}));
