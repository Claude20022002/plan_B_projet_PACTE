import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Message } from '../board/Ecran';
import { versDateIso } from '../stage/offre';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../theme';

const TYPES = ['stage', 'emploi', 'alternance'];

/**
 * Champs de l'offre, pré-remplis par la lecture de la page ou par la mise en forme du texte :
 * l'étudiant vérifie et corrige avant de publier. `note` explique d'où viennent les informations.
 */
export default function FormulaireOffre({ champs, onChange, note }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const maj = (cle) => (valeur) => onChange({ ...champs, [cle]: valeur });
  const dateFausse = versDateIso(champs.deadline) === false;

  const champ = (cle, libelle, options = {}) => (
    <View style={styles.groupe}>
      <Text style={styles.libelle}>{libelle}</Text>
      <TextInput style={[styles.champ, options.multiline && styles.multi]} value={champs[cle]} onChangeText={maj(cle)} placeholderTextColor={couleurs.lettreAttenuee} accessibilityLabel={libelle} maxLength={options.max ?? 150} {...options} />
    </View>
  );

  return (
    <>
      {note ? <Message discret>{note}</Message> : null}
      {champ('title', t('app.offres.champs.titre'), { max: 200 })}
      {champ('company_name', t('app.offres.champs.entreprise'))}
      {champ('city', t('app.offres.champs.ville'), { max: 120 })}

      <Text style={styles.libelle}>{t('app.offres.champs.type')}</Text>
      <View style={styles.types} accessibilityRole="radiogroup">
        {TYPES.map((type) => (
          <Pressable key={type} onPress={() => maj('type')(type)} style={[styles.type, champs.type === type && styles.typeActif]} accessibilityRole="radio" accessibilityState={{ checked: champs.type === type }}>
            <Text style={[styles.typeTexte, champs.type === type && styles.typeTexteActif]}>{t(`app.offres.types.${type}`)}</Text>
          </Pressable>
        ))}
      </View>

      {champ('deadline', t('app.offres.champs.dateLimite'), { max: 10, placeholder: t('app.offres.champs.formatDate'), keyboardType: 'numbers-and-punctuation' })}
      {dateFausse ? <Text style={styles.alerte}>{t('app.offres.champs.dateInvalide')}</Text> : null}
      {champ('salary', t('app.offres.champs.remuneration'))}
      {champ('apply_url', t('app.offres.champs.lien'), { max: 2048, autoCapitalize: 'none', autoCorrect: false, keyboardType: 'url' })}
      {champ('description', t('app.offres.champs.description'), { multiline: true, max: 5000, textAlignVertical: 'top' })}
    </>
  );
}

const useStyles = creerStyles((t) => ({
  groupe: { gap: 6, marginBottom: 6 },
  libelle: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1) },
  champ: { minHeight: CIBLE_TACTILE, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16, paddingHorizontal: 14 },
  multi: { minHeight: 180, paddingTop: 12 },
  types: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  type: { flex: 1, minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet, backgroundColor: t.couleurs.cellule },
  typeActif: { backgroundColor: t.couleurs.accent, borderColor: t.couleurs.accent },
  typeTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15 },
  typeTexteActif: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras },
  alerte: { color: t.couleurs.reporte, fontFamily: t.polices.texte, fontSize: 13, marginTop: -2, marginBottom: 6 },
}));
