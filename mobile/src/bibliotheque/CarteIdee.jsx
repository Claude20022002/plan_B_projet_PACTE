import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { creerStyles, espace } from '../theme';

/** Idée de projet : filière, niveau, durée et difficulté, description dépliée au toucher. */
export default function CarteIdee({ idee }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [deplie, setDeplie] = useState(false);
  const meta = [
    idee.filiere?.code,
    idee.level ? String(idee.level).toUpperCase() : null,
    idee.estimated_weeks ? t('app.bibliotheque.semaines', { count: idee.estimated_weeks }) : null,
    idee.difficulty ? t(`app.bibliotheque.difficultes.${idee.difficulty}`, { defaultValue: '' }) : null,
  ].filter(Boolean);

  return (
    <Pressable onPress={() => setDeplie((d) => !d)} style={styles.carte} accessibilityRole="button" accessibilityState={{ expanded: deplie }}>
      <Text style={styles.titre}>{idee.title}</Text>
      {meta.length ? <Text style={styles.meta}>{meta.join('  ·  ')}</Text> : null}
      {idee.description ? (
        <Text style={styles.texte} numberOfLines={deplie ? undefined : 3}>
          {idee.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const useStyles = creerStyles((t) => ({
  carte: { marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 6, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15, lineHeight: 21 },
  meta: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 12, textTransform: t.capitales, letterSpacing: espace(t, 0.4) },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
}));
