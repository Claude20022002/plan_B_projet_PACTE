import { Pressable, Text, TextInput, View } from 'react-native';
import { CIBLE_TACTILE, creerStyles } from '../theme';
import { caseRobot, champsSimulation, resumeSimulation, tableauxSimulation } from '../../../shared/simulations/presentation.js';

/** Theme-aware controls with explicit disabled/selected states and touch targets. */
export function BoutonSimulation({ children, onPress, disabled = false, selected = false }) {
    const s = useStyles();
    return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
        accessibilityState={{ disabled, selected }} style={[s.bouton, selected && s.selection, disabled && { opacity: 0.5 }]}>
        <Text style={s.texte}>{children}</Text>
    </Pressable>;
}

/** Native labeled rows retain every table value without requiring horizontal scrolling. */
export default function AtelierSimulation({ jeu, defi, etat, session, t, texte = (v) => (typeof v === 'string' ? v : v?.fr ?? '') }) {
    const s = useStyles();
    const { resultat, valeurs, occupe } = etat;
    const programme = valeurs.programme ?? '';
    return <View style={s.espace}>
        {jeu.moteur === 'robot' && <View>
            <Text style={s.titre} accessibilityRole="header">{t('grille')}</Text>
            {Array.from({ length: defi.taille }, (_, y) => <View key={y} style={s.ligne}>
                {Array.from({ length: defi.taille }, (_, x) => {
                    const c = caseRobot(defi, x, y, resultat, t);
                    return <View key={x} accessible accessibilityLabel={c.label} style={s.case}>
                        <Text style={s.texte}>{c.symbole || '–'}</Text>
                    </View>;
                })}
            </View>)}
            <Text style={s.texte}>{t('legende')}</Text>
        </View>}
        {jeu.moteur === 'stock' && <View><Text style={s.texte}>{t('stockInfos', defi)}</Text><Text style={s.texte}>{t('stockRegles')}</Text></View>}
        {tableauxSimulation(jeu, defi, resultat, t, 'fr', texte).map((table) => <View key={table.titre}>
            <Text style={s.titre} accessibilityRole="header">{table.titre}</Text>
            {table.lignes.map((ligne, i) => <Text key={i} style={s.donnee}>
                {ligne.map((v, j) => `${table.colonnes[j]}: ${v}`).join(' · ')}
            </Text>)}
        </View>)}
        {champsSimulation(jeu, defi, t, 'fr', texte).map((champ) => <View key={champ.cle}>
            <Text style={s.texte}>{champ.label}</Text>
            <TextInput accessibilityLabel={champ.label} value={valeurs[champ.cle] ?? ''} editable={!occupe}
                onChangeText={(v) => session.saisir(champ.cle, v)} style={s.champ}
                inputMode={champ.texte ? 'text' : 'numeric'} maxLength={champ.texte ? 160 : 3}
                autoCapitalize={champ.texte ? 'characters' : 'none'} autoCorrect={false} />
            {(champ.aide || champ.texte) && <Text style={s.texte}>{champ.aide ?? t('programmeAide')}</Text>}
        </View>)}
        {jeu.moteur === 'robot' && <View style={s.actions}>
            {['N', 'E', 'S', 'W'].map((d) => <BoutonSimulation key={d} disabled={occupe || programme.replace(/\s/g, '').length >= 40}
                onPress={() => session.saisir('programme', `${programme}${d}`)}>{t(d)}</BoutonSimulation>)}
            <BoutonSimulation disabled={occupe || !programme} onPress={() => session.saisir('programme', programme.trimEnd().slice(0, -1))}>{t('effacer')}</BoutonSimulation>
        </View>}
        {resultat && <Text style={s.texte}>{resumeSimulation(jeu, defi, resultat, t)}</Text>}
    </View>;
}

const useStyles = creerStyles((t) => ({
    espace: { gap: 16 },
    texte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16, lineHeight: 24 },
    titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 20, marginBottom: 8 },
    ligne: { flexDirection: 'row' },
    case: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.couleurs.filet },
    donnee: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15, lineHeight: 24, paddingVertical: 8, borderBottomWidth: 1, borderColor: t.couleurs.filet },
    champ: { minHeight: CIBLE_TACTILE, borderWidth: 1, borderColor: t.couleurs.lettreAttenuee, borderRadius: t.rayons.sm, padding: 12, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    bouton: { minHeight: CIBLE_TACTILE, minWidth: CIBLE_TACTILE, justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: t.couleurs.filet, borderRadius: t.rayons.sm },
    selection: { borderColor: t.couleurs.lettre, backgroundColor: t.couleurs.cellule },
}));
