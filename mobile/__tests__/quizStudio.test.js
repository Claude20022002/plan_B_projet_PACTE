import { cheminQuiz, codeQuizScanne } from '../src/quiz/studio';

/** QR d'un quiz du Studio diffusé par l'enseignant (src/quiz/studio.js, R-10). */

test('QR de quiz du Studio reconnu ; appel, jeu, ClassQuiz et autres adresses ignorés', () => {
  expect(codeQuizScanne('https://planner.finadmintech.fr/quiz/code/KM7Q2X')).toBe('KM7Q2X');
  expect(codeQuizScanne('https://planner.finadmintech.fr/quiz/code/KM7Q2X?ref=qr')).toBe('KM7Q2X');
  expect(codeQuizScanne('https://planner.finadmintech.fr/jeux/session/KM7Q2X')).toBeNull();
  expect(codeQuizScanne('https://quiz.finadmintech.fr/play?pin=482913')).toBeNull();
  expect(codeQuizScanne('42.1739.abcDEF_ghiJKL-mnoPQR')).toBeNull();
  expect(codeQuizScanne('https://planner.finadmintech.fr/quiz/code/km7q2x')).toBeNull();
  expect(codeQuizScanne('https://planner.finadmintech.fr/quiz/code/KM7Q2X/autre')).toBeNull();
  expect(codeQuizScanne(null)).toBeNull();
});

test('le quiz s’ouvre sur le chemin du site, pas sur l’adresse lue', () => {
  expect(cheminQuiz('KM7Q2X')).toBe('/quiz/code/KM7Q2X');
});
