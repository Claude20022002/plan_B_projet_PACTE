import { cleEtat, proposerChangement } from '../src/telephone/etat';

/** Changement de téléphone (R-10) : texte selon la demande, et proposition depuis le scanner (erreurs au format d'ErreurApi). */

test('le texte suit la dernière demande ; sans demande ou statut inconnu : « aucune »', () => {
  expect(cleEtat(null)).toBe('aucune');
  expect(cleEtat({ statut: 'en_attente' })).toBe('enAttente');
  expect(cleEtat({ statut: 'acceptee' })).toBe('acceptee');
  expect(cleEtat({ statut: 'refusee' })).toBe('refusee');
  expect(cleEtat({ statut: 'autre' })).toBe('aucune');
});

test('le scanner propose le changement après un refus 409 seulement', () => {
  expect(proposerChangement({ statut: 409, message: 'Votre compte est lié à un autre téléphone.' })).toBe(true);
  expect(proposerChangement({ statut: 403, message: 'Séance d’un autre groupe' })).toBe(false);
  expect(proposerChangement({ statut: 0, code: 'RESEAU' })).toBe(false);
  expect(proposerChangement(undefined)).toBe(false);
});
