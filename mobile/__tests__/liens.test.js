import { alerteOuvrable, ecranDeLien } from '../src/alertes/liens';

/** Écran ouvert par une alerte ou une notification push (src/alertes/liens.js, lot R-14). */

test('quiz : la partie en cours ou ses résultats, sinon la page Activités', () => {
  expect(ecranDeLien('/jeux?partie=42')).toBe('/partie/42');
  expect(ecranDeLien('/jeux?resultats=42')).toBe('/resultats/42');
  expect(ecranDeLien('/jeux')).toBe('/jeux');
  // Paramètre inconnu ou identifiant invalide : pas d'écran précis
  expect(ecranDeLien('/jeux?partie=abc')).toBe('/alertes');
  expect(ecranDeLien('/jeux?autre=42')).toBe('/alertes');
});

test('annonce, emploi du temps, liens externes', () => {
  expect(ecranDeLien('/annonces/7')).toBe('/annonce/7');
  expect(ecranDeLien('/emploi-du-temps/etudiant')).toBe('/semaine');
  expect(ecranDeLien('https://pirate.test')).toBe('/alertes');
  expect(ecranDeLien(undefined)).toBe('/alertes');
});

test('seules les alertes qui mènent à un écran précis sont cliquables', () => {
  expect(alerteOuvrable('/jeux?partie=1')).toBe(true);
  expect(alerteOuvrable('/annonces/3')).toBe(true);
  expect(alerteOuvrable(null)).toBe(false);
});
