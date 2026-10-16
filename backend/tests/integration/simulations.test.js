import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from './helpers/testApp.js';
import { resetRateLimiters } from '../../middleware/rateLimiterMiddleware.js';
import { AnneeUniversitaire, CoursComposante, Enseignement, EnseignementEnseignant, JeuProgression, Periode } from '../../models/index.js';

let prof, eleve, tiers, direction, cours;
const url = (code = 'robot-route', defi = 'robot-01') => `/api/jeux/${code}/defis/${defi}/essais`;
const bonne = { reponse: { programme: 'EEESSS' }, points: 999999, ok: true };

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser('admin');
    const enseignant = await createUser('enseignant');
    const etudiant = await createUser('etudiant');
    const autre = await createUser('etudiant');
    const fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    cours = fixture.cours.id_cours;
    const annee = await AnneeUniversitaire.create({ libelle: '2026-2027', date_debut: '2026-09-01', date_fin: '2027-07-31', active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: 'S1', date_debut: '2026-09-14', date_fin: '2027-01-22', nb_semaines: 15 });
    const composante = await CoursComposante.create({ id_cours: cours, type: 'TP', volume_heures: 21, niveau_groupe: 'promotion' });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 21 });
    await enseignement.setGroupes([fixture.groupe.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: enseignant.id_user, role: 'principal', statut_service: 'accepte' });
    [prof, eleve, tiers, direction] = await Promise.all([enseignant, etudiant, autre, admin].map((u) => loginAs(u)));
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

test('requires authentication, eligible role, and teacher assignment', async () => {
    expect((await anonymous().get('/api/jeux/robot-route/progression')).status).toBe(401);
    expect((await anonymous().post(url()).send(bonne)).status).toBe(403);
    expect((await direction.send('post', url(), bonne)).status).toBe(403);
    expect((await eleve.send('post', url(), bonne)).status).toBe(403);
    for (const code of ['robot-route', 'threshold-lab', 'stock-pilot']) {
        expect((await prof.send('post', `/api/jeux/${code}/modules`, { id_cours: cours })).status).toBe(201);
    }
    const catalogue = await eleve.get('/api/jeux');
    expect(catalogue.body.jeux).toHaveLength(3);
    expect(catalogue.body.jeux.every((j) => j.source === null && j.curriculum.url)).toBe(true);
    expect((await tiers.send('post', url(), bonne)).status).toBe(403);
});

test('evaluates canonical inputs, rejects malformed answers and endpoint bypass', async () => {
    expect((await eleve.send('post', url(), { reponse: { programme: 'N' }, ok: true })).body).toMatchObject({ ok: false, enregistre: false });
    expect((await eleve.send('post', url(), { reponse: { programme: 'EEESSS', points: 9999 } })).status).toBe(400);
    expect((await eleve.send('post', url('unknown'), bonne)).status).toBe(404);
    expect((await eleve.send('post', url('robot-route', 'stock-01'), bonne)).status).toBe(404);
    expect((await eleve.send('post', '/api/jeux/robot-route/defis/robot-01/reussite', { commandes: ['pwd'] })).status).toBe(400);
    expect((await eleve.agent.post(url()).send(bonne)).status).toBe(403);
    expect(await JeuProgression.count()).toBe(0);
});

test('stores first mastery only and isolates student progress', async () => {
    const premier = await eleve.send('post', url(), bonne);
    expect(premier.status).toBe(201);
    expect(premier.body).toMatchObject({ ok: true, enregistre: true, cree: true, points: 100, progression: { points: 100, reussis: 1 } });
    const replay = await eleve.send('post', url(), bonne);
    expect(replay.status).toBe(200);
    expect(replay.body).toMatchObject({ cree: false, points: 100, progression: { points: 100, reussis: 1 } });
    const suivi = await prof.get(`/api/jeux/robot-route/modules/${cours}/suivi`);
    expect(suivi.body.etudiants[0]).toMatchObject({ points: 100, reussis: 1 });
    expect((await prof.get('/api/jeux/robot-route/progression')).body.points).toBe(0);
    expect(await JeuProgression.count()).toBe(1);
});

test('evaluates AI and inventory plans on the server', async () => {
    expect((await eleve.send('post', url('threshold-lab', 'seuil-03'), { reponse: { seuil: 35 } })).body).toMatchObject({ ok: true, precision: 60, rappel: 100, cout: 4, points: 200 });
    expect((await eleve.send('post', url('stock-pilot', 'stock-03'), { reponse: { commandes: [6, 3, 0] } })).body).toMatchObject({ ok: true, restant: 0, cout: 108, points: 200 });
});

test('revoked assignment blocks new attempts and progression access', async () => {
    expect((await prof.send('delete', `/api/jeux/robot-route/modules/${cours}`)).status).toBe(200);
    expect((await eleve.send('post', url(), bonne)).status).toBe(403);
    expect((await eleve.get('/api/jeux/robot-route/progression')).status).toBe(403);
});
