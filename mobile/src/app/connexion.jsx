import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErreurConnexion, useAuth } from '../auth/AuthContext';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../theme';

/** Panneau de connexion : logo, email, mot de passe. Les comptes viennent de l'administration. */
export default function Connexion() {
  const { couleurs } = useTheme();
  const styles = useStyles();
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
          {envoi ? <ActivityIndicator color={couleurs.surAccent} /> : <Text style={styles.boutonTexte}>{t('app.connexion.valider')}</Text>}
        </Pressable>
        <Text style={styles.aide}>{t('app.connexion.aide')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = creerStyles((t) => ({
  ecran: { flex: 1, backgroundColor: t.couleurs.fond, paddingHorizontal: 24 },
  entete: { alignItems: 'center', gap: 12, marginBottom: 40 },
  logo: { width: 72, height: 72, borderRadius: t.rayons.md, backgroundColor: '#FFFFFF' },
  nom: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 28, textTransform: t.capitales, letterSpacing: espace(t, 1.5) },
  formulaire: { gap: 8 },
  libelle: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1), marginTop: 8 },
  champ: {
    minHeight: CIBLE_TACTILE,
    backgroundColor: t.couleurs.cellule,
    borderRadius: t.rayons.sm,
    borderWidth: t.sombre ? 0 : 1,
    borderColor: t.couleurs.filet,
    color: t.couleurs.lettre,
    fontFamily: t.polices.texte,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  ligneMdp: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  champMdp: { flex: 1 },
  oeil: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet },
  oeilTexte: { color: t.couleurs.lettre, fontSize: 18 },
  erreur: { color: t.couleurs.annule, fontFamily: t.polices.texte, fontSize: 14, marginTop: 8 },
  bouton: { marginTop: 20, minHeight: CIBLE_TACTILE + 4, backgroundColor: t.couleurs.accent, borderRadius: t.rayons.sm, alignItems: 'center', justifyContent: 'center' },
  boutonPresse: { opacity: 0.8 },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, marginTop: 16, lineHeight: 19 },
}));
