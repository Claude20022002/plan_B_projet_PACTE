import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErreurConnexion, useAuth } from '../auth/AuthContext';
import { CIBLE_TACTILE, couleurs, polices, rayons } from '../theme';

/** Panneau de connexion : logo, email, mot de passe. Les comptes viennent de l'administration. */
export default function Connexion() {
  const { t } = useTranslation();
  const { etat, connexion } = useAuth();
  const marges = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [visible, setVisible] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (etat === 'connecte') return <Redirect href="/" />;

  const valider = async () => {
    if (!email.trim() || !motDePasse) return;
    setErreur('');
    setEnvoi(true);
    try {
      await connexion(email.trim(), motDePasse);
    } catch (e) {
      setErreur(t(e instanceof ErreurConnexion ? e.cle : 'app.connexion.erreurReseau'));
      setMotDePasse('');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.ecran, { paddingTop: marges.top + 32 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.entete}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors accessibilityLabel="HESTIM" />
        <Text style={styles.nom} accessibilityRole="header">
          {t('app.nom')}
        </Text>
      </View>

      <View style={styles.formulaire}>
        <Text style={styles.libelle}>{t('app.connexion.email')}</Text>
        <TextInput
          style={styles.champ}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          placeholderTextColor={couleurs.lettreAttenuee}
          placeholder="prenom.nom@hestim.ma"
          accessibilityLabel={t('app.connexion.email')}
          returnKeyType="next"
        />
        <Text style={styles.libelle}>{t('app.connexion.motDePasse')}</Text>
        <View style={styles.ligneMdp}>
          <TextInput
            style={[styles.champ, styles.champMdp]}
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry={!visible}
            autoComplete="current-password"
            textContentType="password"
            accessibilityLabel={t('app.connexion.motDePasse')}
            returnKeyType="go"
            onSubmitEditing={valider}
          />
          <Pressable onPress={() => setVisible((v) => !v)} style={styles.oeil} accessibilityRole="button" accessibilityLabel={t(visible ? 'app.connexion.masquer' : 'app.connexion.afficher')}>
            <Text style={styles.oeilTexte}>{visible ? '◉' : '○'}</Text>
          </Pressable>
        </View>

        {erreur ? (
          <Text style={styles.erreur} accessibilityLiveRegion="polite">
            {erreur}
          </Text>
        ) : null}

        <Pressable onPress={valider} disabled={envoi} style={({ pressed }) => [styles.bouton, (pressed || envoi) && styles.boutonPresse]} accessibilityRole="button">
          {envoi ? <ActivityIndicator color={couleurs.fond} /> : <Text style={styles.boutonTexte}>{t('app.connexion.valider')}</Text>}
        </Pressable>
        <Text style={styles.aide}>{t('app.connexion.aide')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond, paddingHorizontal: 24 },
  entete: { alignItems: 'center', gap: 12, marginBottom: 40 },
  logo: { width: 72, height: 72, borderRadius: rayons.md, backgroundColor: '#FFFFFF' },
  nom: { color: couleurs.lettre, fontFamily: polices.panneauGras, fontSize: 28, textTransform: 'uppercase', letterSpacing: 1.5 },
  formulaire: { gap: 8 },
  libelle: { color: couleurs.lettreAttenuee, fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  champ: {
    minHeight: CIBLE_TACTILE,
    backgroundColor: couleurs.cellule,
    borderRadius: rayons.sm,
    color: couleurs.lettre,
    fontFamily: polices.texte,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  ligneMdp: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  champMdp: { flex: 1 },
  oeil: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.cellule, borderRadius: rayons.sm },
  oeilTexte: { color: couleurs.lettre, fontSize: 18 },
  erreur: { color: couleurs.annule, fontFamily: polices.texte, fontSize: 14, marginTop: 8 },
  bouton: { marginTop: 20, minHeight: CIBLE_TACTILE + 4, backgroundColor: couleurs.lettre, borderRadius: rayons.sm, alignItems: 'center', justifyContent: 'center' },
  boutonPresse: { opacity: 0.8 },
  boutonTexte: { color: couleurs.fond, fontFamily: polices.panneauGras, fontSize: 18, textTransform: 'uppercase', letterSpacing: 1.2 },
  aide: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 13, marginTop: 16, lineHeight: 19 },
});
