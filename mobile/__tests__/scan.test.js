jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('expo-screen-capture', () => ({ addScreenshotListener: jest.fn(() => ({ remove: jest.fn() })) }));

import { origineDe, partieDuPin, pinScanne } from '../src/quiz/scan';

/** Scan d'un QR : appel ou partie de quiz projetée (src/quiz/scan.js). */
const ORIGINE = 'https://quiz.finadmintech.fr';

test('origine https d’une adresse', () => {
  expect(origineDe(`${ORIGINE}/play?pin=1`)).toBe(ORIGINE);
  expect(origineDe('http://quiz.test/play')).toBeNull();
  expect(origineDe(undefined)).toBeNull();
});

test('QR de quiz reconnu ; code d’appel et autre site ignorés', () => {
  expect(pinScanne(`${ORIGINE}/play?pin=482913`, ORIGINE)).toBe('482913');
  expect(pinScanne('42.1739.abcDEF_ghiJKL-mnoPQR', ORIGINE)).toBeNull();
  expect(pinScanne('https://pirate.test/play?pin=482913', ORIGINE)).toBeNull();
  // Quiz non installé : tout QR part à l'appel
  expect(pinScanne(`${ORIGINE}/play?pin=482913`, null)).toBeNull();
});

test('seule une partie de mes séances s’ouvre, avec mon lien personnel', () => {
  const parties = [
    { id: 7, titre: 'Réseaux', url: `${ORIGINE}/play?pin=111111&name=Mintsa+O.&hid=12.abc` },
    { id: 9, titre: 'Linux', url: `${ORIGINE}/play?pin=482913&name=Mintsa+O.&hid=12.def` },
  ];
  expect(partieDuPin(parties, '482913', ORIGINE)).toBe(parties[1]);
  expect(partieDuPin(parties, '999999', ORIGINE)).toBeNull();
  expect(partieDuPin(null, '482913', ORIGINE)).toBeNull();
});
