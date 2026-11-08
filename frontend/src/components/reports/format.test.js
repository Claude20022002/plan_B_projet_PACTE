/**
 * Date d'origine d'une demande de report (recette du 20 octobre, M-6). Lancé par `npm run test:unit`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateEtHeure, demandeeDe, origineDe } from './format.js';

const creneaux = new Map([
    [1, { heure_debut: '09:00:00' }],
    [2, { heure_debut: '13:30:00' }],
    [3, { heure_debut: '15:30:00' }],
]);

// Une séance reportée deux fois : 4 janvier à 9 h, puis 11 janvier à 13 h 30, aujourd'hui 18 janvier à 15 h 30
const seance = { date_seance: '2027-01-18', creneau: { heure_debut: '15:30:00' }, date_seance_initiale: '2027-01-04', id_creneau_initial: 1 };

test('la séance telle qu’elle était à la demande, gardée par le serveur', () => {
    const seconde = { statut_demande: 'approuve', affectation: seance, date_seance_origine: '2027-01-11', id_creneau_origine: 2, creneauOrigine: { heure_debut: '13:30:00' } };
    assert.deepEqual(origineDe(seconde, creneaux), { date: '2027-01-11', heure: '13:30' });
    // Sans le créneau joint, l'heure vient de la liste des créneaux
    assert.deepEqual(origineDe({ ...seconde, creneauOrigine: undefined }, creneaux), { date: '2027-01-11', heure: '13:30' });
});

test('une demande d’avant M-6 : la séance actuelle tant qu’elle n’a pas bougé, sinon sa première date', () => {
    assert.deepEqual(origineDe({ statut_demande: 'en_attente', affectation: seance }, creneaux), { date: '2027-01-18', heure: '15:30' });
    assert.deepEqual(origineDe({ statut_demande: 'approuve', affectation: seance }, creneaux), { date: '2027-01-04', heure: '09:00' });
    assert.deepEqual(origineDe({ statut_demande: 'approuve' }, creneaux), { date: null, heure: '' });
});

test('une demande acceptée sans date n’a pas encore de nouvelle date', () => {
    const demande = { statut_demande: 'a_reprogrammer', nouvelle_date: '2027-02-01', id_creneau_nouveau: 1 };
    assert.equal(dateEtHeure(demandeeDe(demande, creneaux), 'fr', 'À venir'), 'À venir');
    assert.match(dateEtHeure(demandeeDe({ ...demande, statut_demande: 'a_confirmer' }, creneaux), 'fr'), /01\/02\/2027 · 09:00$/);
});
