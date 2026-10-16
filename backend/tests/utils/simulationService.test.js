import { jest } from '@jest/globals';

// Exercise real game services and scoring; replace only persistence and unrelated planning helpers.
const progression = { findOrCreate: jest.fn(), findAll: jest.fn() };
const affectations = { count: jest.fn() };
const appartenir = { findAll: jest.fn() };
const groupes = { findAll: jest.fn() };
const enseignements = { findAll: jest.fn() };
const liens = { findAll: jest.fn() };
jest.unstable_mockModule('../../models/index.js', () => ({
    Appartenir: appartenir, Cours: {}, CoursComposante: {}, Enseignement: enseignements,
    EnseignementEnseignant: {}, EnseignementGroupe: liens, Groupe: groupes,
    JeuModule: affectations, JeuProfil: {}, JeuProgression: progression, Users: {},
}));
jest.unstable_mockModule('../../services/planning/groupes.js', () => ({ ancetres: () => [] }));
jest.unstable_mockModule('../../services/planning/droits.js', () => ({ peutGererFiliere: () => false }));
jest.unstable_mockModule('../../services/planning/enseignements.js', () => ({
    ErreurMetier: class extends Error { constructor(message, status) { super(message); this.status = status; } },
}));
const { essayerSimulation } = await import('../../services/jeux/simulations.js');
const { enregistrerReussite } = await import('../../services/jeux/jeux.js');
const user = { id_user: 7, role: 'etudiant' };

beforeEach(() => {
    jest.clearAllMocks();
    appartenir.findAll.mockResolvedValue([{ groupe: { id_groupe: 1, id_filiere: 1 } }]);
    groupes.findAll.mockResolvedValue([{ id_groupe: 1, id_filiere: 1 }]);
    liens.findAll.mockResolvedValue([{ id_enseignement: 1 }]);
    enseignements.findAll.mockResolvedValue([{ composante: { id_cours: 12 } }]);
    affectations.count.mockResolvedValue(1);
    progression.findOrCreate.mockImplementation(async ({ where, defaults }) => [{ ...where, ...defaults }, true]);
    progression.findAll.mockResolvedValue([{ code_jeu: 'robot-route', id_defi: 'robot-01', points: 100 }]);
});

test('uses canonical XP, student identity, challenge key, and module scope', async () => {
    const r = await essayerSimulation(user, 'robot-route', 'robot-01', { programme: 'EEESSS' });
    expect(r).toMatchObject({ ok: true, enregistre: true, cree: true, points: 100, progression: { points: 100 } });
    expect(affectations.count).toHaveBeenCalledWith({ where: { code_jeu: 'robot-route', id_cours: [12] } });
    expect(progression.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({ where: { id_user: 7, code_jeu: 'robot-route', id_defi: 'robot-01' }, defaults: expect.objectContaining({ points: 100, indices: 0 }) }));
});
test('access is rechecked before evaluating every attempt', async () => {
    affectations.count.mockResolvedValue(0);
    await expect(essayerSimulation(user, 'robot-route', 'robot-01', { programme: 'EEESSS' })).rejects.toMatchObject({ status: 403 });
    expect(progression.findOrCreate).not.toHaveBeenCalled();
});
test('invalid inputs and failed plans do not persist', async () => {
    await expect(essayerSimulation(user, 'robot-route', 'robot-01', { programme: 'EEESSS', points: 999 })).rejects.toMatchObject({ status: 400 });
    expect(await essayerSimulation(user, 'robot-route', 'robot-01', { programme: 'N' })).toMatchObject({ ok: false, enregistre: false });
    expect(progression.findOrCreate).not.toHaveBeenCalled();
});
test('unknown game/challenge and legacy success endpoint cannot bypass evaluation', async () => {
    await expect(essayerSimulation(user, 'unknown', 'robot-01', {})).rejects.toMatchObject({ status: 404 });
    await expect(essayerSimulation(user, 'robot-route', 'stock-01', {})).rejects.toMatchObject({ status: 404 });
    await expect(enregistrerReussite(user, 'robot-route', 'robot-01', 0, ['pwd'])).rejects.toMatchObject({ status: 400 });
    expect(progression.findOrCreate).not.toHaveBeenCalled();
});
test('preserves stored points on repeat success and propagates storage failure', async () => {
    progression.findOrCreate.mockResolvedValueOnce([{ points: 100 }, false]).mockRejectedValueOnce(new Error('database unavailable'));
    expect(await essayerSimulation(user, 'robot-route', 'robot-01', { programme: 'EEESSS' })).toMatchObject({ cree: false, points: 100 });
    await expect(essayerSimulation(user, 'robot-route', 'robot-01', { programme: 'EEESSS' })).rejects.toThrow('database unavailable');
});
