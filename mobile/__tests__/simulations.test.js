import React from 'react';
import { act, create } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { planner } from '../src/api/client';
import AtelierSimulation, { BoutonSimulation } from '../src/jeux/AtelierSimulation';
import { SIMULATIONS } from '../../shared/simulations/catalogue.js';
import { evaluerSimulation, reponseDuFormulaire } from '../../shared/simulations/moteur.js';
import { en } from '../../shared/simulations/i18n.js';

jest.mock('../src/api/client', () => ({ planner: jest.fn() }));
jest.mock('../src/theme', () => ({ CIBLE_TACTILE: 44, creerStyles: () => () => ({}) }));
global.IS_REACT_ACT_ENVIRONMENT = true;
jest.setTimeout(15000);

/** Inline session hook (avoids shared/session.js ESM resolution in jest-expo). */
function useSimulation(jeu) {
    const etatRef = React.useRef({ statut: 'pret', defiId: jeu.defis[0].id, valeurs: {}, resultat: null, reussis: [], points: 0, occupe: false, erreur: null, indice: false });
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    const publier = (patch) => { Object.assign(etatRef.current, patch); forceUpdate(); };
    const session = React.useMemo(() => ({
        saisir: (champ, valeur) => publier({ valeurs: { ...etatRef.current.valeurs, [champ]: valeur }, resultat: null }),
        essayer: async () => {
            const defi = jeu.defis.find((d) => d.id === etatRef.current.defiId);
            const reponse = reponseDuFormulaire(jeu.moteur, etatRef.current.valeurs);
            const local = evaluerSimulation(jeu, defi, reponse);
            if (!local) { publier({ erreur: 'saisie' }); return; }
            publier({ occupe: true });
            const resultat = await planner(`/jeux/${jeu.code}/defis/${defi.id}/essais`, { method: 'POST', body: { reponse } });
            publier({ resultat, occupe: false, ...(resultat.enregistre ? { points: resultat.progression.points } : {}) });
        },
    }), [jeu]);
    React.useEffect(() => { planner(`/jeux/${jeu.code}/progression`).then((p) => publier({ reussis: p.defis.map((d) => d.id), points: p.points })); }, [jeu]);
    return { etat: etatRef.current, session };
}
const t = (cle) => en[cle] ?? cle;
// Canonical first-level answers, keyed by challenge id, shared with the backend engine.
const premier = {
    'robot-01': { programme: 'EEESSS', champs: ['EEESSS'] },
    'seuil-01': { seuil: 50, champs: ['50'] },
    'stock-01': { commandes: [0, 5, 3], champs: ['0', '5', '3'] },
    'triage-01': { severites: [1, 4, 2, 3], champs: ['1', '4', '2', '3'] },
    'sql-01': { positions: [2, 3, 1, 4], champs: ['2', '3', '1', '4'] },
    'reseau-01': { ports: [0, 0, 1, 2], champs: ['0', '0', '1', '2'] },
    'cpu-01': { ordre: [1, 0, 2, 3], champs: ['1', '0', '2', '3'] },
    'sprint-01': { choix: [1, 1, 1, 0, 0], champs: ['1', '1', '1', '0', '0'] },
    'budget-01': { quantites: [2, 2, 2, 2], champs: ['2', '2', '2', '2'] },
};
let courant;
function Partie({ jeu }) {
    courant = useSimulation(jeu);
    return <AtelierSimulation jeu={jeu} defi={jeu.defis[0]} etat={courant.etat} session={courant.session} t={t} />;
}
beforeEach(() => planner.mockReset());

test.each(SIMULATIONS.map((jeu) => [jeu.code, jeu]))('%s native inputs, shared validation, and authenticated API adapter', async (_, jeu) => {
    const { reponse, champs: valeurs } = (() => {
        const { champs, ...rest } = premier[jeu.defis[0].id];
        return { reponse: rest, champs };
    })();
    planner.mockResolvedValueOnce({ defis: [], points: 0 });
    let vue;
    await act(async () => { vue = create(<Partie jeu={jeu} />); });
    expect(planner).toHaveBeenCalledWith(`/jeux/${jeu.code}/progression`);
    const champs = vue.root.findAllByType(TextInput);
    expect(champs).toHaveLength(valeurs.length);
    await act(async () => champs.forEach((champ, i) => champ.props.onChangeText(valeurs[i])));
    planner.mockResolvedValueOnce({ ...evaluerSimulation(jeu, jeu.defis[0], reponse), enregistre: true, progression: { points: 100 } });
    await act(async () => courant.session.essayer());
    expect(planner).toHaveBeenLastCalledWith(`/jeux/${jeu.code}/defis/${jeu.defis[0].id}/essais`, { method: 'POST', body: { reponse } });
    expect(courant.etat.points).toBe(100);
    expect(champs.every((champ) => Boolean(champ.props.accessibilityLabel))).toBe(true);
    await act(async () => vue.unmount());
});

test('native robot direction buttons create commands without typing', async () => {
    planner.mockResolvedValueOnce({ defis: [], points: 0 });
    let vue;
    await act(async () => { vue = create(<Partie jeu={SIMULATIONS[0]} />); });
    const east = vue.root.findAllByType(BoutonSimulation).find((b) => b.props.children === 'East');
    await act(async () => east.props.onPress());
    expect(courant.etat.valeurs.programme).toBe('E');
    await act(async () => vue.unmount());
});
