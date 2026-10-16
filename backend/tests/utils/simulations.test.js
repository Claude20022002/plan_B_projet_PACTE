import { SIMULATIONS, simulationParCode } from '../../../shared/simulations/catalogue.js';
import { JEUX } from '../../../shared/jeux/catalogue.js';
import { evaluerSimulation, reponseValide, reponseDuFormulaire } from '../../../shared/simulations/moteur.js';
import { fr, en } from '../../../shared/simulations/i18n.js';
import { caseRobot, champsSimulation, tableauxSimulation, resumeSimulation } from '../../../shared/simulations/presentation.js';

const [robot, ia, stock, triage, sql, reseau, cpu, sprint, budget] = SIMULATIONS;
const evaluer = (jeu, i, reponse) => evaluerSimulation(jeu, jeu.defis[i], reponse);
const codes = (r) => r.problemes.map((p) => p.code);
const solutions = [
    [robot, 0, { programme: 'EEESSS' }], [robot, 1, { programme: 'SSSSEEEE' }], [robot, 2, { programme: 'SSSSEEENNNEESSSS' }],
    [ia, 0, { seuil: 50 }], [ia, 1, { seuil: 45 }], [ia, 2, { seuil: 35 }],
    [stock, 0, { commandes: [0, 5, 3] }], [stock, 1, { commandes: [5, 4, 0] }], [stock, 2, { commandes: [6, 3, 0] }],
    [triage, 0, { severites: [1, 4, 2, 3] }], [triage, 1, { severites: [3, 2, 1, 4] }], [triage, 2, { severites: [2, 4, 1, 3] }],
    [sql, 0, { positions: [2, 3, 1, 4] }], [sql, 1, { positions: [4, 1, 3, 2] }], [sql, 2, { positions: [4, 1, 2, 3] }],
    [reseau, 0, { ports: [0, 0, 1, 2] }], [reseau, 1, { ports: [0, 0, 1, 2] }], [reseau, 2, { ports: [2, 1, 0, 1] }],
    [cpu, 0, { ordre: [1, 0, 2, 3] }], [cpu, 1, { ordre: [2, 1, 3, 0] }], [cpu, 2, { ordre: [2, 1, 3, 0] }],
    [sprint, 0, { choix: [1, 1, 1, 0, 0] }], [sprint, 1, { choix: [1, 1, 1, 0, 0] }], [sprint, 2, { choix: [1, 1, 1, 0, 0] }],
    [budget, 0, { quantites: [2, 2, 2, 2] }], [budget, 1, { quantites: [3, 3, 3, 3] }], [budget, 2, { quantites: [4, 4, 4, 4] }],
];

describe('Curriculum simulations', () => {
    test.each(solutions)('$code challenge $1 is solvable, deterministic, and immutable', (jeu, i, reponse) => {
        const avant = JSON.stringify([jeu, reponse]);
        const resultat = evaluer(jeu, i, reponse);
        expect(resultat.ok).toBe(true);
        expect(resultat.problemes).toEqual([]);
        expect(evaluer(jeu, i, reponse)).toEqual(resultat);
        expect(JSON.stringify([jeu, reponse])).toBe(avant);
        const t = (cle, valeurs) => {
            const brut = en[cle] ?? cle;
            return valeurs ? brut.replace(/\{\{(\w+)\}\}/g, (_, k) => String(valeurs[k] ?? '')) : brut;
        };
        expect(resumeSimulation(jeu, jeu.defis[i], resultat, t)).toBeTruthy();
        expect(champsSimulation(jeu, jeu.defis[i], t, 'fr', (v) => (typeof v === 'string' ? v : v?.fr ?? '')).length).toBeGreaterThan(0);
        for (const table of tableauxSimulation(jeu, jeu.defis[i], resultat, t, 'fr', (v) => (typeof v === 'string' ? v : v?.fr ?? ''))) {
            expect(table.lignes.every((ligne) => ligne.length === table.colonnes.length)).toBe(true);
        }
    });

    test('keeps terminal, unique stable IDs, three levels, and bilingual content', () => {
        expect(JEUX[0].code).toBe('terminal-linux');
        expect(JEUX[0].defis).toHaveLength(66);
        expect(new Set(JEUX.map((j) => j.code)).size).toBe(JEUX.length);
        expect(simulationParCode('unknown')).toBeNull();
        expect(SIMULATIONS).toHaveLength(9);
        for (const jeu of SIMULATIONS) {
            expect(jeu.defis.map((d) => d.niveau)).toEqual([1, 2, 3]);
            expect(jeu.defis.reduce((s, d) => s + d.xp, 0)).toBe(450);
            expect(jeu.source).toBeNull();
            expect(jeu.curriculum.url).toMatch(/^https:\/\/.*hestim\.ma\//);
            for (const defi of jeu.defis) for (const champ of ['titre', 'consigne', 'indice', 'bilan']) {
                expect(defi[champ].fr).toBeTruthy(); expect(defi[champ].en).toBeTruthy();
            }
        }
        expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
        expect(Object.keys(fr.problemes).sort()).toEqual(Object.keys(en.problemes).sort());
    });

    test.each([null, [], {}, { seuil: '50' }, { seuil: -1 }, { seuil: 101 }, { seuil: 0.5 }, { seuil: NaN }, { seuil: 50, points: 9999 }])('rejects malformed thresholds %j', (r) => {
        expect(reponseValide('seuil', r)).toBe(false);
    });
    test.each(['', ' ', 'NESX', 'alert(1)', 'E'.repeat(41), ' '.repeat(160) + 'S'])('rejects malformed movement %j', (programme) => {
        expect(reponseValide('robot', { programme })).toBe(false);
    });
    test.each([[1, 2], [1, 2, 3, 4], [1, '2', 3], [-1, 0, 0], [101, 0, 0], [1.5, 0, 0], Array(3)])('rejects malformed orders %j', (...commandes) => {
        expect(reponseValide('stock', { commandes })).toBe(false);
    });
    test.each([
        { severites: [1, 2, 3] }, { severites: [0, 1, 2, 3] }, { severites: [1, 2, 3, 5] },
        { severites: [1, 2, 3, null] }, { severites: 'x' }, {}, { seuil: 3 },
    ])('rejects malformed triage payload %j', (r) => {
        expect(reponseValide('triage', r)).toBe(false);
    });
    test.each([
        { positions: [1, 2, 3] }, { positions: [1, 1, 2, 3] }, { positions: [0, 1, 2, 3] },
        { positions: [1, 2, 3, 5] }, { positions: [1, 2, 3, null] }, { positions: [1, 1, 1, 1] },
        {}, { severites: [1, 2, 3, 4] },
    ])('rejects malformed SQL payload %j', (r) => {
        expect(reponseValide('sql', r)).toBe(false);
    });
    test.each([
        { ports: [0, 1] }, { ports: [0, 1, 2, 3] }, { ports: [-1, 0, 1, 2] },
        { ports: [0, 1, 2, null] }, { ports: [0, 1, 2, 1.5] }, {}, { positions: [1, 2, 3, 4] },
    ])('rejects malformed network payload %j', (r) => {
        expect(reponseValide('reseau', r)).toBe(false);
    });
    test('blank form values never coerce to zero; zero is valid', () => {
        expect(reponseDuFormulaire('seuil', {}).seuil).toBeNull();
        expect(reponseDuFormulaire('stock', {}).commandes).toEqual([null, null, null]);
        expect(reponseDuFormulaire('triage', {}).severites).toEqual([null, null, null, null]);
        expect(reponseDuFormulaire('sql', {}).positions).toEqual([null, null, null, null]);
        expect(reponseDuFormulaire('reseau', {}).ports).toEqual([null, null, null, null]);
        expect(reponseDuFormulaire('cpu', {}).ordre).toEqual([null, null, null, null]);
        expect(reponseDuFormulaire('sprint', {}).choix).toEqual([null, null, null, null, null]);
        expect(reponseDuFormulaire('budget', {}).quantites).toEqual([null, null, null, null]);
        expect(reponseDuFormulaire('seuil', { seuil: '0' })).toEqual({ seuil: 0 });
        expect(reponseDuFormulaire('cpu', { cpu0: '1', cpu1: '0', cpu2: '2', cpu3: '3' })).toEqual({ ordre: [1, 0, 2, 3] });
        expect(reponseDuFormulaire('sprint', { item0: '1', item1: '0', item2: '1', item3: '1', item4: '0' })).toEqual({ choix: [1, 0, 1, 1, 0] });
        expect(reponseDuFormulaire('budget', { poste0: '5', poste1: '3', poste2: '100', poste3: '0' })).toEqual({ quantites: [5, 3, 100, 0] });
        expect(reponseValide('seuil', { seuil: 0 })).toBe(true);
        expect(reponseValide('seuil', { seuil: 100 })).toBe(true);
        expect(evaluerSimulation(null, null, {})).toBeNull();
    });
    test('robot stops at collision/boundary and enforces checkpoint and move limit', () => {
        expect(evaluer(robot, 0, { programme: 'N' }).trajet).toEqual([[0, 0]]);
        expect(codes(evaluer(robot, 0, { programme: 'ES' }))).toContain('collision');
        expect(codes(evaluer(robot, 1, { programme: 'ESSSSEEE' }))).toContain('checkpoint');
        expect(codes(evaluer(robot, 0, { programme: 'EWEEESSS' }))).toContain('steps');
        expect(evaluer(robot, 0, { programme: ' E E E\nS S S ' }).ok).toBe(true);
        expect(caseRobot(robot.defis[0], 1, 1, null, (s) => s).label).toContain('obstacle');
    });
    test('threshold is inclusive, precision is undefined without predictions, costs are weighted', () => {
        expect(evaluer(ia, 1, { seuil: 45 })).toMatchObject({ vp: 3, fp: 1, vn: 2, fn: 0, precision: 75, rappel: 100 });
        expect(evaluer(ia, 0, { seuil: 100 })).toMatchObject({ precision: null, rappel: 0, ok: false });
        expect(evaluer(ia, 2, { seuil: 36 })).toMatchObject({ fn: 1, fp: 2, cout: 12, ok: false });
        expect(codes(evaluer(ia, 0, { seuil: 0 }))).toContain('precision');
    });
    test('inventory checks capacity before demand, lost sales, lead time, budget, and transit', () => {
        expect(codes(evaluer(stock, 0, { commandes: [6, 0, 0] }))).toContain('capacity');
        const rupture = evaluer(stock, 1, { commandes: [0, 4, 0] });
        expect(rupture.jours[1]).toMatchObject({ manque: 5, fermeture: 0 });
        expect(rupture.jours[2]).toMatchObject({ ouverture: 0, reception: 4, manque: 0 });
        expect(evaluer(stock, 1, { commandes: [5, 4, 1] })).toMatchObject({ transit: 1, cout: 100, ok: false });
        expect(codes(evaluer(stock, 2, { commandes: [7, 3, 0] }))).toEqual(expect.arrayContaining(['budget', 'remaining']));
    });
    test('cyber triage uses scope × data × status and reports per-incident severity', () => {
        const niveau0 = evaluer(triage, 0, { severites: [1, 4, 2, 3] });
        expect(niveau0.evenements.map((e) => e.score)).toEqual([48, 1, 12, 8]);
        expect(niveau0.evenements.map((e) => e.attendu)).toEqual([1, 4, 2, 3]);
        const erreur = evaluer(triage, 0, { severites: [4, 4, 2, 3] });
        expect(erreur.ok).toBe(false);
        expect(codes(erreur)).toEqual(['triage']);
        expect(erreur.problemes[0].valeurs).toMatchObject({ index: 1, attendu: 1, donne: 4 });
    });
    test('SQL ordering requires a valid permutation and the canonical position for each fragment', () => {
        expect(evaluer(sql, 0, { positions: [2, 3, 1, 4] }).ok).toBe(true);
        expect(reponseValide('sql', { positions: [1, 1, 1, 1] })).toBe(false);
        const decalage = evaluer(sql, 0, { positions: [3, 2, 1, 4] });
        expect(decalage.ok).toBe(false);
        expect(codes(decalage)).toEqual(['ordre', 'ordre']);
    });
    test('network topology enforces switch capacity, subnet co-location, and isolation', () => {
        expect(evaluer(reseau, 0, { ports: [0, 1, 2, 0] }).ok).toBe(true);
        const surcharge = evaluer(reseau, 0, { ports: [0, 0, 0, 0] });
        expect(codes(surcharge)).toContain('capacite');
        const vlan = evaluer(reseau, 1, { ports: [0, 1, 1, 0] });
        expect(codes(vlan)).toEqual(['sous_reseau']);
        const isolation = evaluer(reseau, 1, { ports: [0, 0, 1, 0] });
        expect(codes(isolation)).toEqual(['capacite', 'isolation']);
        const zero = evaluer(reseau, 2, { ports: [1, 1, 1, 1] });
        expect(codes(zero)).toEqual(expect.arrayContaining(['capacite', 'isolation']));
        expect(evaluer(reseau, 2, { ports: [2, 1, 0, 1] }).ok).toBe(true);
    });
    test('cpu scheduler validates permutation, deadlines, and average turnaround', () => {
        expect(reponseValide('cpu', { ordre: [0, 0, 1, 2] })).toBe(false);
        expect(reponseValide('cpu', { ordre: [0, 1, 2] })).toBe(false);
        expect(reponseValide('cpu', { ordre: [0, 1, 2, 4] })).toBe(false);
        const late = evaluer(cpu, 0, { ordre: [3, 2, 1, 0] });
        expect(late.ok).toBe(false);
        expect(codes(late)).toEqual(expect.arrayContaining(['echeance']));
        const highAvg = evaluer(cpu, 2, { ordre: [0, 1, 2, 3] });
        expect(highAvg.ok).toBe(false);
    });
    test('sprint validates mandatory, capacity, value, and dependency constraints', () => {
        expect(reponseValide('sprint', { choix: [1, 0] })).toBe(false);
        expect(reponseValide('sprint', { choix: [1, 0, 1, 0, 2] })).toBe(false);
        const missing = evaluer(sprint, 0, { choix: [0, 1, 1, 0, 0] });
        expect(codes(missing)).toContain('obligatoire');
        const overloaded = evaluer(sprint, 0, { choix: [1, 1, 1, 1, 0] });
        expect(codes(overloaded)).toContain('charge');
        const lowValue = evaluer(sprint, 0, { choix: [1, 0, 0, 0, 0] });
        expect(codes(lowValue)).toContain('valeur');
        const badDep = evaluer(sprint, 1, { choix: [0, 1, 1, 0, 0] });
        expect(codes(badDep)).toEqual(expect.arrayContaining(['obligatoire', 'dependance']));
    });
    test('budget validates total cap, minimum coverage, and unit cost ceiling', () => {
        expect(reponseValide('budget', { quantites: [1, 2, 3] })).toBe(false);
        expect(reponseValide('budget', { quantites: [1, 2, 3, -1] })).toBe(false);
        expect(reponseValide('budget', { quantites: [1, 2, 3, 1000] })).toBe(false);
        const overBudget = evaluer(budget, 1, { quantites: [10, 10, 10, 10] });
        expect(codes(overBudget)).toContain('depassement');
        const lowCouv = evaluer(budget, 1, { quantites: [1, 5, 5, 5] });
        expect(codes(lowCouv)).toContain('couverture');
    });
});
