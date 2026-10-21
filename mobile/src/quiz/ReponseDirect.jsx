import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { basculer, deplacer, estBonChoix } from './direct';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

/**
 * Réponse à une question du quiz en direct (lot SC-1c), pour les six types que le direct pose :
 * choix unique, choix multiple, vrai ou faux, nombre, réponse courte, remise en ordre (boutons
 * monter et descendre, plus sûrs au doigt qu'un glisser-déposer). `bonneReponse` (correction) met la
 * bonne réponse en évidence ; `desactive` fige la réponse (envoyée, chrono écoulé, correction).
 */
export default function ReponseDirect({ question, valeur, onChange, desactive = false, bonneReponse }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const corrigee = bonneReponse !== undefined && bonneReponse !== null;

  const choix = (id, libelle, choisi) => {
    const bon = corrigee && estBonChoix(bonneReponse, id);
    const rate = corrigee && choisi && !bon;
    return (
      <Pressable
        key={String(id)}
        onPress={() => onChange(question.type === 'choix_multiple' ? basculer(valeur, id) : id)}
        disabled={desactive}
        style={({ pressed }) => [styles.choix, choisi && styles.choisi, bon && styles.bon, rate && styles.rate, pressed && { opacity: 0.7 }]}
        accessibilityRole={question.type === 'choix_multiple' ? 'checkbox' : 'radio'}
        accessibilityState={{ checked: choisi, disabled: desactive }}
      >
        <Text style={[styles.choixTexte, choisi && styles.choisiTexte]}>{libelle}</Text>
        {bon ? <MaterialCommunityIcons name="check-circle" size={22} color={couleurs.enCours} accessibilityLabel={t('app.direct.bonneReponse')} /> : null}
      </Pressable>
    );
  };

  switch (question.type) {
    case 'choix_unique':
      return <View style={styles.liste}>{question.options.map((o) => choix(o.id, o.texte, valeur === o.id))}</View>;
    case 'choix_multiple':
      return (
        <View style={styles.liste}>
          {question.nombre_attendu ? <Text style={styles.aide}>{t('app.direct.nombreAttendu', { count: question.nombre_attendu })}</Text> : null}
          {question.options.map((o) => choix(o.id, o.texte, Array.isArray(valeur) && valeur.includes(o.id)))}
        </View>
      );
    case 'vrai_faux':
      return (
        <View style={styles.ligne}>
          <View style={{ flex: 1 }}>{choix(true, t('app.direct.vrai'), valeur === true)}</View>
          <View style={{ flex: 1 }}>{choix(false, t('app.direct.faux'), valeur === false)}</View>
        </View>
      );
    case 'numerique':
    case 'reponse_courte': {
      const numerique = question.type === 'numerique';
      // Bonne réponse lisible : la valeur (et son unité), ou la première réponse acceptée
      const attendue = !corrigee ? null : numerique ? [bonneReponse.valeur, bonneReponse.unite].filter((v) => v !== null && v !== undefined).join(' ') : bonneReponse[0];
      return (
        <View style={styles.liste}>
          <View style={styles.ligne}>
            <TextInput
              value={valeur ?? ''}
              onChangeText={onChange}
              editable={!desactive}
              keyboardType={numerique ? 'decimal-pad' : 'default'}
              autoCorrect={false}
              maxLength={200}
              placeholder={t(numerique ? 'app.direct.nombre' : 'app.direct.reponse')}
              placeholderTextColor={couleurs.lettreAttenuee}
              style={[styles.champ, { flex: 1 }]}
              accessibilityLabel={t(numerique ? 'app.direct.nombre' : 'app.direct.reponse')}
            />
            {numerique && question.unite ? <Text style={styles.choixTexte}>{question.unite}</Text> : null}
          </View>
          {attendue !== null ? <Text style={styles.aide}>{t('app.direct.attendue', { reponse: attendue })}</Text> : null}
        </View>
      );
    }
    case 'ordre': {
      const parId = new Map(question.elements.map((e) => [e.id, e]));
      const ordre = Array.isArray(valeur) ? valeur : question.elements.map((e) => e.id);
      return (
        <View style={styles.liste}>
          {!desactive ? <Text style={styles.aide}>{t('app.direct.ordreAide')}</Text> : null}
          {ordre.map((id, i) => (
            <View key={id} style={[styles.choix, corrigee && (bonneReponse[i] === id ? styles.bon : styles.rate)]}>
              <Text style={[styles.choixTexte, { flex: 1 }]}>{`${i + 1}. ${parId.get(id)?.texte ?? ''}`}</Text>
              {!desactive ? (
                <View style={styles.ligne}>
                  <Pressable onPress={() => onChange(deplacer(ordre, i, -1))} disabled={i === 0} style={[styles.fleche, i === 0 && { opacity: 0.3 }]} accessibilityRole="button" accessibilityLabel={t('app.direct.monter', { element: parId.get(id)?.texte })}>
                    <MaterialCommunityIcons name="arrow-up" size={22} color={couleurs.lettre} />
                  </Pressable>
                  <Pressable onPress={() => onChange(deplacer(ordre, i, 1))} disabled={i === ordre.length - 1} style={[styles.fleche, i === ordre.length - 1 && { opacity: 0.3 }]} accessibilityRole="button" accessibilityLabel={t('app.direct.descendre', { element: parId.get(id)?.texte })}>
                    <MaterialCommunityIcons name="arrow-down" size={22} color={couleurs.lettre} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      );
    }
    default:
      // Le direct ne pose que les six types ci-dessus ; un autre ne se joue pas ici
      return <Text style={styles.aide}>{t('app.direct.typeAbsent')}</Text>;
  }
}

const useStyles = creerStyles((t) => ({
  liste: { gap: 10 },
  ligne: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  choix: {
    minHeight: CIBLE_TACTILE + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: t.couleurs.filet,
    borderRadius: t.rayons.md,
    backgroundColor: t.couleurs.cellule,
  },
  choisi: { borderColor: t.couleurs.accent },
  choisiTexte: { fontFamily: t.polices.texteGras },
  bon: { borderColor: t.couleurs.enCours },
  rate: { borderColor: t.couleurs.reporte },
  choixTexte: { flexShrink: 1, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16, lineHeight: 22 },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
  champ: {
    minHeight: CIBLE_TACTILE,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: t.couleurs.filet,
    borderRadius: t.rayons.sm,
    color: t.couleurs.lettre,
    fontFamily: t.polices.texte,
    fontSize: 16,
  },
  fleche: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
}));
