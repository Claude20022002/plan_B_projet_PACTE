import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ecran from '../board/Ecran';
import { creerStyles } from '../theme';
import useSimulation from '../jeux/useSimulation';
import AtelierSimulation, { BoutonSimulation } from '../jeux/AtelierSimulation';
import { simulationParCode } from '../../../shared/simulations/catalogue.js';
import { libelle } from '../../../shared/jeux/catalogue.js';

/** Registered simulations share their engine and progress with the web, not a webview. */
export default function Simulation() {
    const { code } = useLocalSearchParams();
    const jeu = simulationParCode(code);
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const s = useStyles();
    return <Ecran droite={null} titre={jeu ? libelle(jeu.titre, i18n.language) : t('simulations.parcours')}>
        <View style={s.retour}><BoutonSimulation onPress={() => router.canGoBack() ? router.back() : router.replace('/jeux')}>{t('simulations.retour')}</BoutonSimulation></View>
        {jeu ? <Partie key={jeu.code} jeu={jeu} /> : <Text style={s.texte}>{t('simulations.acces')}</Text>}
    </Ecran>;
}

function Partie({ jeu }) {
    const { t: traduire, i18n } = useTranslation();
    const t = (cle, valeurs = {}) => String(traduire(`simulations.${cle}`, valeurs));
    const texte = (v) => libelle(v, i18n.language);
    const s = useStyles();
    const marges = useSafeAreaInsets();
    const { etat, session } = useSimulation(jeu);
    const { resultat } = etat;
    const defi = jeu.defis.find((d) => d.id === etat.defiId);
    const prochain = jeu.defis[jeu.defis.indexOf(defi) + 1];
    return <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.contenu, { paddingBottom: marges.bottom + 24 }]}>
            <Text style={s.texte}>{texte(jeu.objectif)}</Text>
            <Text style={s.texte}>{t('cadre')}</Text>
            <Text style={s.texte}>{t('regles')}</Text>
            {etat.statut !== 'pret' ? <View>
                <Text style={s.texte}>{t(etat.statut === 'chargement' ? 'charger' : etat.statut === 'interdit' ? 'acces' : 'chargementErreur')}</Text>
                {etat.statut !== 'chargement' && <BoutonSimulation onPress={session.charger}>{t('reessayer')}</BoutonSimulation>}
            </View> : <>
                <Text style={s.texte}>{t('progression', { count: etat.reussis.length, total: jeu.defis.length, points: etat.points })}</Text>
                <View style={s.actions}>{jeu.defis.map((d) => <BoutonSimulation key={d.id} selected={d.id === defi.id} onPress={() => session.choisir(d.id)}>
                    {t('niveau', { n: d.niveau })}{etat.reussis.includes(d.id) ? ` · ${t('reussi')}` : ''}
                </BoutonSimulation>)}</View>
                <Text accessibilityRole="header" style={s.titre}>{texte(defi.titre)}</Text>
                <Text style={s.texte}>{texte(defi.consigne)}</Text>
                <AtelierSimulation jeu={jeu} defi={defi} etat={etat} session={session} t={t} texte={texte} />
                <View style={s.actions}>
                    <BoutonSimulation disabled={etat.occupe} onPress={session.essayer}>{t(etat.occupe ? 'testEnCours' : 'tester')}</BoutonSimulation>
                    <BoutonSimulation disabled={etat.indice} onPress={session.aider}>{t('indice')}</BoutonSimulation>
                    <BoutonSimulation onPress={() => session.choisir(defi.id)}>{t('recommencer')}</BoutonSimulation>
                    {resultat?.enregistre && prochain && <BoutonSimulation onPress={() => session.choisir(prochain.id)}>{t('suivant')}</BoutonSimulation>}
                </View>
                {etat.indice && <Text style={s.texte}>{texte(defi.indice)}</Text>}
                <View accessibilityLiveRegion="polite">
                    {etat.erreur && <Text style={s.texte}>{t(etat.erreur)}</Text>}
                    {resultat && <>
                        <Text style={s.titre}>{t(resultat.ok ? 'succes' : 'ajuste')}</Text>
                        {resultat.enregistre && <Text style={s.texte}>{t(resultat.cree ? 'sauvegarde' : 'deja', { points: resultat.points })}</Text>}
                        {resultat.problemes.map((p, i) => <Text key={i} style={s.texte}>{t(`problemes.${p.code}`, p.valeurs)}</Text>)}
                        <Text accessibilityRole="header" style={s.titre}>{t('bilan')}</Text>
                        <Text style={s.texte}>{texte(defi.bilan)}</Text>
                    </>}
                </View>
            </>}
            <Link href={jeu.curriculum.url} style={s.lien}>{t('source')}: {texte(jeu.curriculum.titre)}</Link>
        </ScrollView>
    </KeyboardAvoidingView>;
}

const useStyles = creerStyles((t) => ({
    flex: { flex: 1 }, retour: { paddingHorizontal: 16, paddingVertical: 8 },
    contenu: { padding: 16, gap: 16 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    texte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16, lineHeight: 24 },
    titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 22 },
    lien: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 14, textDecorationLine: 'underline', paddingVertical: 12 },
}));
