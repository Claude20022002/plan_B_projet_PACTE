import { codeSessionScanne, ecranDeSession } from '../src/jeux/session';

/** QR d'une session de jeu projetée par l'enseignant (src/jeux/session.js). */

test('QR de session de jeu reconnu ; appel, quiz et autres adresses ignorés', () => {
  expect(codeSessionScanne('https://planner.finadmintech.fr/jeux/session/ABC234')).toBe('ABC234');
  expect(codeSessionScanne('https://planner.finadmintech.fr/jeux/session/ABC234?ref=qr')).toBe('ABC234');
  expect(codeSessionScanne('42.1739.abcDEF_ghiJKL-mnoPQR')).toBeNull();
  expect(codeSessionScanne('https://quiz.finadmintech.fr/play?pin=482913')).toBeNull();
  expect(codeSessionScanne('https://planner.finadmintech.fr/jeux/session/ABC234/autre')).toBeNull();
  expect(codeSessionScanne('https://planner.finadmintech.fr/jeux/session/abc234')).toBeNull();
  expect(codeSessionScanne(undefined)).toBeNull();
});

test('une session mène au tableau de la classe ou au jeu', () => {
  expect(ecranDeSession({ id_session_jeu: 7, mode: 'collectif', code_jeu: 'terminal-linux' })).toBe('/jeu-direct/7');
  expect(ecranDeSession({ id_session_jeu: 7, mode: 'individuel', code_jeu: 'terminal-linux' })).toBe('/terminal');
  expect(ecranDeSession({ id_session_jeu: 7, mode: 'individuel', code_jeu: 'inconnu' })).toBeNull();
});
