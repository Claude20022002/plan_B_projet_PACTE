import { basculer, cleResultat, deplacer, ecranDuQuiz, estBonChoix, ordreDeDepart, reponseVide, secondesRestantes } from '../src/quiz/direct';

/** Joueur natif du quiz en direct (src/quiz/direct.js, lot SC-1c). */

test('seul un quiz en direct a un écran dans l’application ; les autres s’ouvrent sur le site', () => {
  expect(ecranDuQuiz({ mode: 'direct', id_session: 12 })).toBe('/quiz-direct/12');
  expect(ecranDuQuiz({ mode: 'rythme', id_session: 12 })).toBeNull();
  expect(ecranDuQuiz({ mode: 'direct' })).toBeNull();
  expect(ecranDuQuiz(null)).toBeNull();
});

test('le chrono suit l’heure du serveur, pas celle du téléphone', () => {
  const vue = { etape: 'question', debut_ms: 100_000, duree_s: 20 };
  expect(secondesRestantes(vue, 0, 100_000)).toBe(20);
  expect(secondesRestantes(vue, 0, 110_500)).toBe(10);
  // Téléphone en retard de 5 s sur le serveur : il reste 5 s de moins qu'il ne le croit
  expect(secondesRestantes(vue, 5_000, 110_500)).toBe(5);
  expect(secondesRestantes(vue, 0, 130_000)).toBe(0);
  expect(secondesRestantes({ ...vue, etape: 'correction' }, 0, 100_000)).toBeNull();
  expect(secondesRestantes({ etape: 'question', debut_ms: null, duree_s: 20 })).toBeNull();
});

test('une remise en ordre ne commence jamais dans l’ordre reçu (le juste, côté serveur du direct)', () => {
  const elements = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  // Un tirage qui rendrait l'ordre reçu est refait
  let appels = 0;
  const aleatoire = () => (appels++ < 2 ? 0.999 : 0);
  const tire = ordreDeDepart(elements, aleatoire);
  expect(tire).not.toEqual(['a', 'b', 'c']);
  expect([...tire].sort()).toEqual(['a', 'b', 'c']);
  expect(ordreDeDepart([{ id: 'seul' }])).toEqual(['seul']);
  expect(ordreDeDepart(undefined)).toEqual([]);
});

test('monter et descendre un élément, sans sortir de la liste', () => {
  expect(deplacer(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
  expect(deplacer(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  expect(deplacer(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  expect(deplacer(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c']);
});

test('choix multiple : un toucher coche, un second décoche', () => {
  expect(basculer(null, 'x')).toEqual(['x']);
  expect(basculer(['x', 'y'], 'x')).toEqual(['y']);
});

test('réponse vide : rien à envoyer', () => {
  expect(reponseVide(null)).toBe(true);
  expect(reponseVide('  ')).toBe(true);
  expect(reponseVide([])).toBe(true);
  expect(reponseVide(false)).toBe(false);
  expect(reponseVide('3,5')).toBe(false);
  expect(reponseVide(['a'])).toBe(false);
});

test('correction : le résultat et les bons choix', () => {
  expect(cleResultat('juste')).toBe('juste');
  expect(cleResultat('sans_reponse')).toBe('sansReponse');
  expect(cleResultat(undefined)).toBe('sansReponse');
  expect(estBonChoix('o2', 'o2')).toBe(true);
  expect(estBonChoix(['o1', 'o3'], 'o3')).toBe(true);
  expect(estBonChoix(false, false)).toBe(true);
  expect(estBonChoix(false, true)).toBe(false);
});
