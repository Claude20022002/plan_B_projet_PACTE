import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerAnnonce, marquerAnnonceLue } from '../../api/donnees';
import { ouvrirSurLeWeb } from '../../espaces/ouvrir';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../../theme';

/**
 * Une annonce (R1), ouverte depuis les alertes ou en touchant sa notification : texte complet,
 * accusé de lecture à l'ouverture. La pièce jointe s'ouvre sur le site, déjà connecté.
 */
export default function Annonce() {
  const { id } = useLocalSearchParams();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const margeBas = useSafeAreaInsets().bottom; // écran hors onglets : pas de barre d'onglets
  const [annonce, setAnnonce] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let actif = true;
    chargerAnnonce(id)
      .then((a) => {
        if (!actif) return;
        setAnnonce(a);
        if (!a.lu_le && !a.est_auteur) marquerAnnonceLue(id).catch(() => {});
      })
      .catch(() => actif && setErreur(true));
    return () => {
      actif = false;
    };
  }, [id]);

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/alertes'))} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  const date = annonce ? new Date(annonce.date).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <Ecran titre={t('app.annonces.titre')} droite={fermer} espaces={false}>
      {erreur ? <Message>{t('app.annonces.introuvable')}</Message> : null}
      {!annonce && !erreur ? <Message discret>{t('app.commun.chargement')}</Message> : null}
      {annonce ? (
        <ScrollView contentContainerStyle={[styles.contenu, { paddingBottom: margeBas + 24 }]}>
          <Text style={styles.meta}>{[annonce.auteur ? `${annonce.auteur.prenom} ${annonce.auteur.nom}` : null, annonce.cible, date].filter(Boolean).join(' · ')}</Text>
          <Text style={styles.titre} accessibilityRole="header">{annonce.titre}</Text>
          <Text style={styles.corps} selectable>{annonce.corps}</Text>
          {annonce.piece_jointe ? (
            <View style={styles.piece}>
              <Pressable
                onPress={() => ouvrirSurLeWeb(`/annonces/${annonce.id}`, couleurs)}
                style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityHint={t('app.annonces.pieceJointeAide')}
              >
                <MaterialCommunityIcons name="paperclip" size={20} color={couleurs.lettre} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.boutonTexte}>{t('app.annonces.pieceJointe')}</Text>
                  <Text style={styles.boutonDetail} numberOfLines={1}>{annonce.piece_jointe.nom}</Text>
                </View>
              </Pressable>
              <Text style={styles.aide}>{t('app.annonces.pieceJointeAide')}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  contenu: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  meta: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 13 },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 20, lineHeight: 26 },
  corps: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16, lineHeight: 24 },
  piece: { marginTop: 8, gap: 6 },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: CIBLE_TACTILE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: t.couleurs.filet,
    borderRadius: 8,
    backgroundColor: t.couleurs.cellule,
  },
  boutonTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15 },
  boutonDetail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, marginTop: 2 },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12 },
}));
