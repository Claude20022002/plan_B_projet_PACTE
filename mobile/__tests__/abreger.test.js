import { abregerCours } from '../src/semaine/abreger';

test('abrège les titres de cours pour la grille sans couper un mot au milieu', () => {
  expect(abregerCours('Intelligence Artificielle')).toBe('Intell. Artific.');
  expect(abregerCours('Cloud Computing')).toBe('Cloud Comput.');
  expect(abregerCours('Bases de données')).toBe('Bases données');
  expect(abregerCours('Machine Learning')).toBe('Machine Learning');
  expect(abregerCours('ML')).toBe('ML');
  expect(abregerCours('de')).toBe('de');
  expect(abregerCours('')).toBe('');
});
