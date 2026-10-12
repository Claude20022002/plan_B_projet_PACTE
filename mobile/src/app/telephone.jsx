import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ecran, { Message } from '../board/Ecran';
import { chargerDemandeTelephone, demanderChangementTelephone } from '../api/donnees';
import { cleEtat } from '../telephone/etat';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

/**
 * Changement de téléphone (lot R-10). Un compte est lié à un seul téléphone pour l'appel ; après un
 * changement, l'étudiant déclare ici, avec le nouveau téléphone en main, que c'est désormais le sien.
 * L'administration accepte ou refuse ; tant qu'elle n'a pas décidé, l'ancien téléphone reste lié.
 * Ouvert depuis le Compte, ou depuis le scanner après un refus.
 */
export default function Telephone() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const margeBas = useSafeAreaInsets().bottom; // écran hors onglets : pas de barre d'onglets
  const [demande, setDemande] = useState(undefined);
  const [motif, setMotif] = useState('');
  const [envoi, setEnvoi] = useState({ enCours: false, erreur: null, ok: false });

  useEffect(() => {
    chargerDemandeTelephone()
      .then(setDemande)
      .catch(() => setDemande(null));
  }, []);

  const declarer = async () => {
    setEnvoi({ enCours: true, erreur: null, ok: false });
    try {
      setDemande(await demanderChangementTelephone(motif.trim()));
      setEnvoi({ enCours: false, erreur: null, ok: true });
    } catch (e) {
      setEnvoi({ enCours: false, erreur: e?.message || t('app.telephone.erreur'), ok: false });
    }
  };

  const date = (valeur) => (valeur ? new Date(valeur).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long' }) : '');
  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/compte'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.telephone.titre')} droite={fermer}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: margeBas + 24 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.texte}>{t('app.telephone.explication')}</Text>

        {demande === undefined ? (
          <Message discret>{t('app.commun.chargement')}</Message>
        ) : (
          <View style={styles.etat} accessibilityLiveRegion="polite">
            <Text style={styles.etatTexte}>{t(`app.telephone.etats.${cleEtat(demande)}`, { le: date(demande?.decidee_le ?? demande?.demandee_le) })}</Text>
            {demande?.statut === 'refusee' ? <Text style={styles.texte}>{t('app.telephone.refusAide')}</Text> : null}
          </View>
        )}

        <Text style={styles.libelle}>{t('app.telephone.motif')}</Text>
        <TextInput
          value={motif}
          onChangeText={setMotif}
          placeholder={t('app.telephone.motifExemple')}
          placeholderTextColor={couleurs.lettreAttenuee}
          maxLength={255}
          style={styles.champ}
          accessibilityLabel={t('app.telephone.motif')}
        />

        <Pressable
          onPress={declarer}
          disabled={envoi.enCours}
          style={({ pressed }) => [styles.bouton, (pressed || envoi.enCours) && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: envoi.enCours, busy: envoi.enCours }}
        >
          {envoi.enCours ? <ActivityIndicator color={couleurs.surCadre} /> : <Text style={styles.boutonTexte}>{t('app.telephone.declarer')}</Text>}
        </Pressable>

        {envoi.ok ? <Text style={styles.succes}>{t('app.telephone.envoyee')}</Text> : null}
        {envoi.erreur ? <Text style={styles.erreur}>{envoi.erreur}</Text> : null}
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 15, lineHeight: 22 },
  etat: { padding: 14, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet, gap: 6 },
  etatTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 16, lineHeight: 22 },
  libelle: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14 },
  champ: { minHeight: CIBLE_TACTILE, paddingHorizontal: 12, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15 },
  bouton: { minHeight: CIBLE_TACTILE, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.cadre },
  boutonTexte: { color: t.couleurs.surCadre, fontFamily: t.polices.texteGras, fontSize: 15 },
  succes: { color: t.couleurs.enCours, fontFamily: t.polices.texteGras, fontSize: 15, lineHeight: 22 },
  erreur: { color: t.couleurs.reporte, fontFamily: t.polices.texteGras, fontSize: 15, lineHeight: 22 },
}));
