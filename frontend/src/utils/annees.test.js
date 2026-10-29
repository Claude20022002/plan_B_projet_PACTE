/**
 * Sélecteur d'année des pages de gestion (lot ME-18) : l'année en cours par défaut, un choix qui
 * ne désigne plus aucune année retombe sur elle. Lancé par `npm run test:unit` (lanceur de Node).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOUTES, anneeDuJour, anneeEnCours, filtreAnnee, groupesDeLAnnee, groupesDuJour, valeurRetenue } from './annees.js';

const passee = { id_annee: 1, libelle: '2025-2026', date_debut: '2025-09-01', date_fin: '2026-08-31', active: false };
const courante = { id_annee: 2, libelle: '2026-2027', date_debut: '2026-09-01', date_fin: '2027-08-31', active: false };

test("l'année marquée active passe avant les dates", () => {
    assert.equal(anneeEnCours([passee, courante], '2026-10-29'), courante);
    assert.equal(anneeEnCours([{ ...passee, active: true }, courante], '2026-10-29').id_annee, 1);
});

test('sans année active, celle qui contient le jour ; sinon aucune', () => {
    assert.equal(anneeEnCours([passee, courante], '2026-03-02'), passee);
    assert.equal(anneeEnCours([passee, courante], '2031-01-01'), null);
});

test("sans choix, ou un choix d'une année disparue, l'année en cours", () => {
    assert.equal(valeurRetenue([passee, courante], null, '2026-10-29'), '2');
    assert.equal(valeurRetenue([passee, courante], '99', '2026-10-29'), '2');
    assert.equal(valeurRetenue([passee, courante], '1', '2026-10-29'), '1');
});

test("toutes les années : sur demande, ou quand aucune année n'est en cours", () => {
    assert.equal(valeurRetenue([passee, courante], TOUTES), TOUTES);
    assert.equal(valeurRetenue([], null), TOUTES);
    assert.deepEqual(filtreAnnee(TOUTES), {});
    assert.deepEqual(filtreAnnee('2'), { id_annee: '2' });
});

const groupes = [
    { id_groupe: 10, nom_groupe: '4A IIIA', id_annee: 1 },
    { id_groupe: 20, nom_groupe: '4A IIIA', id_annee: 2 },
    { id_groupe: 30, nom_groupe: 'Promo spéciale', id_annee: null },
];
const noms = (liste) => liste.map((g) => g.id_groupe);

test("une date donne les groupes de son année, et ceux d'année inconnue", () => {
    assert.deepEqual(noms(groupesDuJour(groupes, [passee, courante], '2027-01-04')), [20, 30]);
    assert.deepEqual(noms(groupesDuJour(groupes, [passee, courante], '2026-03-02')), [10, 30]);
});

test("sans date, ou une date hors de toute année, l'année en cours ; sans année, tous les groupes", () => {
    assert.equal(anneeDuJour([passee, { ...courante, active: true }], '').id_annee, 2);
    assert.equal(anneeDuJour([passee, { ...courante, active: true }], '2031-01-01').id_annee, 2);
    assert.deepEqual(noms(groupesDuJour(groupes, [], '2027-01-04')), [10, 20, 30]);
});

test('un groupe déjà choisi reste proposé, même d\'une autre année', () => {
    assert.deepEqual(noms(groupesDuJour(groupes, [passee, courante], '2027-01-04', [10])), [10, 20, 30]);
    assert.deepEqual(noms(groupesDeLAnnee(groupes, TOUTES)), [10, 20, 30]);
    assert.deepEqual(noms(groupesDeLAnnee(groupes, '1', ['10'])), [10, 30]);
});
