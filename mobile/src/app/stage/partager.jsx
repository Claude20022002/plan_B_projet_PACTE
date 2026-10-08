import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { partagerStage } from '../../api/donnees';
import { choisirPhoto, formatTaille, PHOTO_MAX_OCTETS, PhotoTropLourde } from '../../stage/photo';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../../theme';

/**
 * « Partager mon stage » : un avis publié par l'étudiant lui-même, avec son accord explicite
 * (aucune collecte automatique de profils). Mêmes champs que le formulaire web de StudyLib, plus
 * une photo facultative, réduite sur le téléphone avant l'envoi.
 */
export default function PartagerStage() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const [champs, setChamps] = useState({ company_name: '', company_city: '', position: '', description: '', rating: 0, is_paid: false });
  const [accord, setAccord] = useState(false);
  const [etat, setEtat] = useState({ envoi: false, message: '', ok: false });
  const [photo, setPhoto] = useState(null); // { uri, largeur, hauteur, octets }
  const [photoMessage, setPhotoMessage] = useState('');
  const max = formatTaille(PHOTO_MAX_OCTETS);

  const ajouterPhoto = async () => {
    setPhotoMessage('');
    try {
      const choisie = await choisirPhoto();
      if (choisie) setPhoto(choisie);
    } catch (e) {
      setPhotoMessage(t(e instanceof PhotoTropLourde ? 'app.stage.photoTropLourde' : 'app.stage.photoLecture', { max }));
    }
  };
  const maj = (cle) => (valeur) => setChamps((c) => ({ ...c, [cle]: valeur }));
  const valide = accord && champs.company_name.trim() && champs.description.trim().length >= 20 && champs.rating >= 1;

  const envoyer = async () => {
    if (!valide) return;
    setEtat({ envoi: true, message: '', ok: false });
    try {
      await partagerStage({ ...champs, company_name: champs.company_name.trim(), description: champs.description.trim(), consent: true }, photo);
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
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.stage.titre')} droite={retour} espaces={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          {champ('company_name', t('app.stage.entreprise'))}
          {champ('company_city', t('app.stage.ville'), { max: 100 })}
          {champ('position', t('app.stage.poste'))}
          {champ('description', t('app.stage.avis'), { multiline: true, max: 3000, textAlignVertical: 'top' })}

          <Text style={styles.libelle}>{t('app.stage.photo')}</Text>
          {photo ? (
            <View style={styles.photoBloc}>
              <Image source={{ uri: photo.uri }} style={[styles.photo, { aspectRatio: photo.largeur / photo.hauteur }]} resizeMode="cover" accessibilityLabel={t('app.stage.photoApercu')} />
              <View style={styles.ligne}>
                <Text style={[styles.aide, { flex: 1 }]}>{`${photo.largeur} × ${photo.hauteur} px · ${formatTaille(photo.octets)}`}</Text>
                <Pressable onPress={ajouterPhoto} style={styles.lien} accessibilityRole="button">
                  <Text style={styles.lienTexte}>{t('app.stage.photoRemplacer')}</Text>
                </Pressable>
                <Pressable onPress={() => setPhoto(null)} style={styles.lien} accessibilityRole="button">
                  <Text style={styles.lienTexte}>{t('app.stage.photoRetirer')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={ajouterPhoto} style={styles.ajoutPhoto} accessibilityRole="button">
              <MaterialCommunityIcons name="image-plus" size={22} color={couleurs.lettre} />
              <Text style={styles.texte}>{t('app.stage.photoAjouter')}</Text>
            </Pressable>
          )}
          <Text style={styles.aide}>{t('app.stage.photoAide', { max })}</Text>
          {photoMessage ? <Message>{photoMessage}</Message> : null}

          <Text style={[styles.libelle, { marginTop: 10 }]}>{t('app.stage.note')}</Text>
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

const useStyles = creerStyles((t) => ({
  contenu: { padding: 16, gap: 6, paddingBottom: 40 },
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  groupe: { gap: 6, marginBottom: 6 },
  libelle: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1) },
  champ: { minHeight: CIBLE_TACTILE, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16, paddingHorizontal: 14 },
  multi: { minHeight: 140, paddingTop: 12 },
  etoiles: { flexDirection: 'row', gap: 4 },
  etoile: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: CIBLE_TACTILE, marginTop: 8 },
  texte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
  bouton: { marginTop: 16, minHeight: CIBLE_TACTILE + 4, backgroundColor: t.couleurs.accent, borderRadius: t.rayons.sm, alignItems: 'center', justifyContent: 'center' },
  inactif: { opacity: 0.4 },
  photoBloc: { gap: 4 },
  photo: { width: '100%', maxHeight: 320, borderRadius: t.rayons.sm, backgroundColor: t.couleurs.cellule },
  ajoutPhoto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: CIBLE_TACTILE + 16, borderRadius: t.rayons.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: t.couleurs.filet, backgroundColor: t.couleurs.cellule },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, lineHeight: 18 },
  lien: { minHeight: CIBLE_TACTILE, justifyContent: 'center', paddingHorizontal: 6 },
  lienTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, textDecorationLine: 'underline' },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
}));
