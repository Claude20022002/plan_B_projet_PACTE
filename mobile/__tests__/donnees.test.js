jest.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'u', getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

import { versSeance } from '../src/api/donnees';

/** Séance de l'API /emplois-du-temps/moi → ligne du panneau mobile. */
test('campus, type de composante et distanciel', () => {
  const s = versSeance({
    id_affectation: 9,
    date_seance: '2027-03-02',
    statut: 'reporte',
    date_seance_initiale: '2027-03-01',
    creneau: { heure_debut: '13:30:00', heure_fin: '15:15:00' },
    cours: { nom_cours: 'Data Science', code_cours: 'IIIA-DS', type_cours: 'CM', id_filiere: 3 },
    salle: null,
    enseignant: { prenom: 'Ali', nom: 'Dupont' },
    enseignement: { composante: { type: 'TP', modalite: 'distanciel', mention: 'Blended Coursera' } },
  });
  expect(s).toMatchObject({ id: 9, startLabel: '13:30', courseType: 'TP', distanciel: true, mention: 'Blended Coursera', teacher: 'Ali Dupont', status: 'reporte', previousLabel: '01/03' });

  const enSalle = versSeance({ id_affectation: 10, date_seance: '2027-03-02', statut: 'planifie', creneau: { heure_debut: '09:00:00', heure_fin: '10:45:00' }, cours: { nom_cours: 'ML' }, salle: { nom_salle: 'ST-204', campus: { code: 'ST', nom: 'Stendhal' } } });
  expect(enSalle).toMatchObject({ room: 'ST-204', building: 'Stendhal', distanciel: false });
});
