import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Message } from '../board/Ecran';
import { chargerOffres } from '../api/donnees';
import CarteOffre from './CarteOffre';
import FiltresStages, { FILTRES_OFFRES } from './FiltresStages';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

const DELAI_RECHERCHE_MS = 400;
const VIDE = { offres: [], page: 0, suite: false, total: 0 };

/**
 * Onglet « Offres » : offres de stage, d'emploi et d'alternance publiées et encore ouvertes (la
 * date limite la plus proche d'abord), avec une recherche et des filtres (type, ville).
 * `version` change au rafraîchissement de l'écran.
 */
export default function ListeOffres({ version }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const [saisie, setSaisie] = useState('');
  const [filtres, setFiltres] = useState({ q: '' });
  const [villes, setVilles] = useState([]);
  // Résultats de la requête « cle » : en chargement tant qu'ils ne la portent pas
  const cle = JSON.stringify([filtres, version]);
  const [resultats, setResultats] = useState({ cle: null, ...VIDE, erreur: false });
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const chargement = resultats.cle !== cle || suiteEnCours;
  const erreur = resultats.cle === cle && resultats.erreur;

  useEffect(() => {
    const minuterie = setTimeout(() => setFiltres((f) => ({ ...f, q: saisie.trim() })), DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuterie);
  }, [saisie]);

  const page = useCallback((n) => chargerOffres(filtres, n), [filtres]);

  useEffect(() => {
    let actif = true;
    page(1).then(
      (r) => {
        if (!actif) return;
        setResultats({ cle, ...r, erreur: false });
        // Les villes viennent avec la liste ; on garde celles connues quand un filtre les réduit
        setVilles((avant) => (r.villes.length ? r.villes : avant));
      },
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
      setResultats((avant) => ({ ...avant, ...r, offres: [...avant.offres, ...r.offres] }));
    } finally {
      setSuiteEnCours(false);
    }
  };

  return (
    <>
      <View style={styles.recherche}>
        <MaterialCommunityIcons name="magnify" size={20} color={couleurs.lettreAttenuee} />
        <TextInput value={saisie} onChangeText={setSaisie} placeholder={t('app.offres.rechercher')} placeholderTextColor={couleurs.lettreAttenuee} style={styles.champ} returnKeyType="search" autoCorrect={false} accessibilityLabel={t('app.offres.rechercher')} />
      </View>
      <FiltresStages valeurs={{ villes }} filtres={filtres} onChange={setFiltres} liste={FILTRES_OFFRES} />
      {!chargement && !erreur && resultats.total > 0 ? <Text style={styles.total}>{t('app.offres.total', { count: resultats.total })}</Text> : null}

      {erreur ? <Message>{t('app.bibliotheque.indisponible')}</Message> : null}
      {!erreur && !chargement && resultats.offres.length === 0 ? <Message discret>{t('app.offres.aucune')}</Message> : null}
      {resultats.offres.map((o) => (
        <CarteOffre key={o.id} offre={o} />
      ))}
      {chargement ? <ActivityIndicator style={{ marginTop: 16 }} color={couleurs.lettre} /> : null}
      {!chargement && resultats.suite ? (
        <Pressable onPress={suivante} style={styles.plus} accessibilityRole="button">
          <Text style={styles.plusTexte}>{t('app.offres.plus')}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const useStyles = creerStyles((t) => ({
  recherche: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 12, minHeight: CIBLE_TACTILE, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet },
  champ: { flex: 1, minHeight: CIBLE_TACTILE, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16 },
  total: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  plus: { minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  plusTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, textDecorationLine: 'underline' },
}));
