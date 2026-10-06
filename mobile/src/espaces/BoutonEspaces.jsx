import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ESPACES, adresseEspace } from '../../../shared/espaces.js';
import { libelle } from '../../../shared/jeux/catalogue.js';
import { chargerConfigQuiz } from '../api/donnees';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../theme';
import Feuille from '../verre/Feuille';
import { apresFermeture, ouvrirSurLeWeb } from './ouvrir';

/** Écran de l'application pour chaque espace (le Quiz n'existe que sur le web) */
const ECRAN = { planner: '/', bibliotheque: '/bibliotheque', jeux: '/jeux' };
const ICONE = { planner: 'calendar-month-outline', bibliotheque: 'bookshelf', jeux: 'gamepad-variant-outline', quiz: 'head-question-outline' };

/**
 * Bouton des espaces HESTIM (barre de titre de chaque onglet) : la feuille liste Planner, la
 * Bibliothèque, les Jeux et le Quiz. Toucher un espace l'ouvre dans l'application ; « Site web »
 * ouvre son interface complète, déjà connecté. Tout espace est donc à deux gestes.
 */
export default function BoutonEspaces() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOuvert(true)} style={styles.bouton} accessibilityRole="button" accessibilityLabel={t('app.espaces.ouvrir')} hitSlop={4}>
        <MaterialCommunityIcons name="apps" size={24} color={couleurs.surCadre} />
      </Pressable>
      {ouvert ? <FeuilleEspaces fermer={() => setOuvert(false)} /> : null}
    </>
  );
}

function FeuilleEspaces({ fermer }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const [urlQuiz, setUrlQuiz] = useState(null);

  useEffect(() => {
    let actif = true;
    chargerConfigQuiz()
      .then((c) => actif && c?.actif && /^https:\/\//.test(c.url ?? '') && setUrlQuiz(c.url))
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, []);

  const allerA = (code) => {
    fermer();
    if (ECRAN[code]) router.navigate(ECRAN[code]);
    // Quiz : la page de jeu de ClassQuiz s'ouvre dans l'application (écran /quiz)
    else if (urlQuiz) router.push({ pathname: '/quiz', params: { url: adresseEspace(code, { role: 'etudiant', urlQuiz }) } });
  };
  // Sur iPhone, le navigateur ne s'ouvre pas tant que la feuille se ferme : on attend la fin
  const surLeWeb = (chemin) => {
    fermer();
    apresFermeture(() => ouvrirSurLeWeb(chemin, couleurs));
  };

  return (
    <Feuille fermer={fermer} style={styles.feuille}>
      <View style={styles.entete}>
        <Text style={styles.titre} accessibilityRole="header">
          {t('app.espaces.titre')}
        </Text>
        <Pressable onPress={fermer} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
          <MaterialCommunityIcons name="close" size={22} color={couleurs.lettre} />
        </Pressable>
      </View>
      <ScrollView>
        {ESPACES.map((e) => {
          const disponible = e.code !== 'quiz' || urlQuiz;
          const chemin = e.code === 'quiz' ? null : adresseEspace(e.code);
          return (
            <View key={e.code} style={[styles.ligne, !disponible && styles.inactif]}>
              <Pressable
                onPress={() => allerA(e.code)}
                disabled={!disponible}
                style={styles.principal}
                accessibilityRole="button"
                accessibilityLabel={`${libelle(e.titre, i18n.language)}. ${libelle(e.resume, i18n.language)}`}
                accessibilityState={{ disabled: !disponible }}
              >
                <View style={styles.pastille}>
                  <MaterialCommunityIcons name={ICONE[e.code]} size={24} color={couleurs.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nom}>{libelle(e.titre, i18n.language)}</Text>
                  <Text style={styles.resume} numberOfLines={2}>
                    {disponible ? libelle(e.resume, i18n.language) : t('app.espaces.indisponible')}
                  </Text>
                </View>
              </Pressable>
              {chemin ? (
                <Pressable onPress={() => surLeWeb(chemin)} style={styles.web} accessibilityRole="link" accessibilityLabel={t('app.espaces.siteDe', { espace: libelle(e.titre, i18n.language) })}>
                  <MaterialCommunityIcons name="open-in-new" size={18} color={couleurs.lettre} />
                  <Text style={styles.webTexte}>{t('app.espaces.web')}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
        <Text style={styles.aide}>{t('app.espaces.aide')}</Text>
      </ScrollView>
    </Feuille>
  );
}

const useStyles = creerStyles((t) => ({
  bouton: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  feuille: { maxHeight: '85%' },
  entete: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, paddingTop: 4 },
  titre: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 20, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingRight: 12, borderTopWidth: 1, borderTopColor: t.couleurs.filet },
  inactif: { opacity: 0.5 },
  principal: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, minHeight: CIBLE_TACTILE + 20 },
  pastille: {
    width: 44,
    height: 44,
    borderRadius: t.famille === 'planner' ? t.rayons.md : 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.couleurs.cellule,
    borderWidth: t.sombre ? 0 : 1,
    borderColor: t.couleurs.filet,
  },
  nom: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: t.famille === 'planner' ? 19 : 16, textTransform: t.capitales, letterSpacing: espace(t, 0.8) },
  resume: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, marginTop: 2, lineHeight: 18 },
  web: {
    minHeight: CIBLE_TACTILE,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: t.rayons.sm,
    borderWidth: 1,
    borderColor: t.couleurs.filet,
  },
  webTexte: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: 13, textTransform: t.capitales, letterSpacing: espace(t, 0.6) },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12, lineHeight: 17, paddingHorizontal: 16, paddingTop: 12 },
}));
