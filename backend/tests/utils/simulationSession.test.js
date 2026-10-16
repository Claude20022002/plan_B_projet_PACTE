import { jest } from '@jest/globals';
import { creerSession } from '../../../shared/simulations/session.js';
import { SIMULATIONS } from '../../../shared/simulations/catalogue.js';

const jeu = SIMULATIONS[0];
const vide = { defis: [], points: 0 };
const succes = { ok: true, problemes: [], enregistre: true, cree: true, points: 100, progression: { points: 100 } };
const differe = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { resolve, promise }; };
const preparer = async (essayer = jest.fn().mockResolvedValue(succes)) => {
    const api = { progression: jest.fn().mockResolvedValue(vide), essayer };
    const session = creerSession(jeu, api);
    await session.charger();
    session.saisir('programme', 'EEESSS');
    return { session, api };
};

describe('Shared web/native simulation session', () => {
    test('load, observe, free hint, save, replay, and restart', async () => {
        const { session, api } = await preparer();
        const observer = jest.fn(); const stop = session.abonner(observer);
        session.aider();
        await session.essayer(); await session.essayer();
        expect(session.lire()).toMatchObject({ indice: true, points: 100, reussis: ['robot-01'], occupe: false });
        expect(api.essayer).toHaveBeenCalledWith('robot-route', 'robot-01', { programme: 'EEESSS' });
        expect(observer).toHaveBeenCalled(); stop(); observer.mockClear();
        session.choisir('robot-02');
        expect(session.lire()).toMatchObject({ valeurs: {}, resultat: null, indice: false, points: 100 });
        expect(observer).not.toHaveBeenCalled();
    });
    test('blank input is rejected without a request', async () => {
        const { session, api } = await preparer(); session.saisir('programme', '');
        await session.essayer();
        expect(session.lire().erreur).toBe('saisie'); expect(api.essayer).not.toHaveBeenCalled();
    });
    test('network failure shows local feedback without saved points, then retry saves', async () => {
        const essayer = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(succes);
        const { session } = await preparer(essayer); await session.essayer();
        expect(session.lire()).toMatchObject({ erreur: 'enregistrement', points: 0, reussis: [], resultat: { ok: true, enregistre: false } });
        await session.essayer();
        expect(session.lire()).toMatchObject({ erreur: null, points: 100, reussis: ['robot-01'] });
    });
    test.each([401, 403, 404])('HTTP %i denies local success', async (status) => {
        const { session } = await preparer(jest.fn().mockRejectedValue({ status })); await session.essayer();
        expect(session.lire()).toMatchObject({ erreur: 'acces', resultat: null, points: 0 });
    });
    test('native status property also denies access', async () => {
        const { session } = await preparer(jest.fn().mockRejectedValue({ statut: 403 })); await session.essayer();
        expect(session.lire().erreur).toBe('acces');
    });
    test('loading errors block submissions and are retryable', async () => {
        const api = { progression: jest.fn().mockRejectedValueOnce({ status: 403 }).mockResolvedValue(vide), essayer: jest.fn() };
        const session = creerSession(jeu, api); await session.charger(); await session.essayer();
        expect(session.lire().statut).toBe('interdit'); expect(api.essayer).not.toHaveBeenCalled();
        await session.charger(); expect(session.lire().statut).toBe('pret');
    });
    test('only one attempt runs and changing a challenge ignores a stale response', async () => {
        const d = differe(); const { session, api } = await preparer(jest.fn(() => d.promise));
        const attempt = session.essayer(); await session.essayer();
        session.saisir('programme', 'N'); expect(session.lire().valeurs.programme).toBe('EEESSS');
        expect(api.essayer).toHaveBeenCalledTimes(1);
        session.choisir('robot-02'); d.resolve(succes); await attempt;
        expect(session.lire()).toMatchObject({ defiId: 'robot-02', resultat: null, points: 0, occupe: false });
    });
    test('unmount/cancel ignores late loads', async () => {
        const d = differe(); const session = creerSession(jeu, { progression: () => d.promise });
        const load = session.charger(); session.annuler(); d.resolve(vide); await load;
        expect(session.lire().statut).toBe('chargement');
    });
    test('unsuccessful plans never change progress', async () => {
        const { session } = await preparer(jest.fn().mockResolvedValue({ ok: false, enregistre: false, problemes: [] }));
        await session.essayer(); expect(session.lire()).toMatchObject({ points: 0, reussis: [] });
    });
});
