import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { partagerStage } from '../../api/donnees';
import { CIBLE_TACTILE, couleurs, polices, rayons } from '../../theme';

/**
 * « Partager mon stage » : un avis publié par l'étudiant lui-même, avec son accord explicite
 * (aucune collecte automatique de profils). Mêmes champs que le formulaire web de StudyLib.
 */
export default function PartagerStage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [champs, setChamps] = useState({ company_name: '', company_city: '', position: '', description: '', rating: 0, is_paid: false });
  const [accord, setAccord] = useState(false);
  const [etat, setEtat] = useState({ envoi: false, message: '', ok: false });
  const maj = (cle) => (valeur) => setChamps((c) => ({ ...c, [cle]: valeur }));
  const valide = accord && champs.company_name.trim() && champs.description.trim().length >= 20 && champs.rating >= 1;

  const envoyer = async () => {
    if (!valide) return;
    setEtat({ envoi: true, message: '', ok: false });
    try {
      await partagerStage({ ...champs, company_name: champs.company_name.trim(), description: champs.description.trim() });
      setEtat({ envoi: false, message: t('app.stage.merci'), ok: true });
      setTimeout(() => router.back(), 1200);
    } catch {
      setEtat({ envoi: false, message: t('app.stage.erreur'), ok: false });
    }
  };

  const champ = (cle, libelle, options = {}) => (
    <View style={styles.groupe}>
      <Text style={styles.libelle}>{libelle}</Text>
      <TextInput style={[styles.champ, options.multiline && styles.multi]} value={champs[cle]} onChangeText={maj(cle)} placeholderTextColor={couleurs.lettreAttenuee} accessibilityLabel={libelle} maxLength={options.max ?? 150} {...options} />
    </View>
  );

  const retour = (
    <Pressable onPress={() => router.back()} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.stage.titre')} droite={retour}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          {champ('company_name', t('app.stage.entreprise'))}
          {champ('company_city', t('app.stage.ville'), { max: 100 })}
          {champ('position', t('app.stage.poste'))}
          {champ('description', t('app.stage.avis'), { multiline: true, max: 3000, textAlignVertical: 'top' })}

          <Text style={styles.libelle}>{t('app.stage.note')}</Text>
          <View style={styles.etoiles} accessibilityRole="adjustable" accessibilityLabel={`${t('app.stage.note')} ${champs.rating}/5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => maj('rating')(n)} style={styles.etoile} accessibilityRole="button" accessibilityLabel={`${n}/5`}>
                <MaterialCommunityIcons name={n <= champs.rating ? 'star' : 'star-outline'} size={30} color={couleurs.lettre} />
              </Pressable>
            ))}
          </View>

          <View style={styles.ligne}>
            <Text style={[styles.texte, { flex: 1 }]}>{t('app.stage.remunere')}</Text>
            <Switch value={champs.is_paid} onValueChange={maj('is_paid')} trackColor={{ true: couleurs.enCours, false: couleurs.filet }} />
          </View>
          <View style={styles.ligne}>
            <Text style={[styles.texte, { flex: 1 }]}>{t('app.stage.consentement')}</Text>
            <Switch value={accord} onValueChange={setAccord} trackColor={{ true: couleurs.enCours, false: couleurs.filet }} accessibilityLabel={t('app.stage.consentement')} />
          </View>

          {etat.message ? <Message>{etat.message}</Message> : null}
          <Pressable onPress={envoyer} disabled={!valide || etat.envoi || etat.ok} style={[styles.bouton, (!valide || etat.envoi) && styles.inactif]} accessibilityRole="button" accessibilityState={{ disabled: !valide }}>
            <Text style={styles.boutonTexte}>{t('app.stage.envoyer')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: 16, gap: 6, paddingBottom: 40 },
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  groupe: { gap: 6, marginBottom: 6 },
  libelle: { color: couleurs.lettreAttenuee, fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  champ: { minHeight: CIBLE_TACTILE, backgroundColor: couleurs.cellule, borderRadius: rayons.sm, color: couleurs.lettre, fontFamily: polices.texte, fontSize: 16, paddingHorizontal: 14 },
  multi: { minHeight: 140, paddingTop: 12 },
  etoiles: { flexDirection: 'row', gap: 4 },
  etoile: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: CIBLE_TACTILE, marginTop: 8 },
  texte: { color: couleurs.lettre, fontFamily: polices.texte, fontSize: 14, lineHeight: 20 },
  bouton: { marginTop: 16, minHeight: CIBLE_TACTILE + 4, backgroundColor: couleurs.lettre, borderRadius: rayons.sm, alignItems: 'center', justifyContent: 'center' },
  inactif: { opacity: 0.4 },
  boutonTexte: { color: couleurs.fond, fontFamily: polices.panneauGras, fontSize: 18, textTransform: 'uppercase', letterSpacing: 1.2 },
});
