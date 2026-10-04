/**
 * Client HTTP : Bearer et X-Client, renouvellement unique d'un jeton expiré, session perdue
 * quand le renouvellement est refusé, session gardée hors ligne.
 */
jest.mock('expo-secure-store', () => {
  const coffre = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked',
    getItemAsync: jest.fn(async (k) => coffre.get(k) ?? null),
    setItemAsync: jest.fn(async (k, v) => void coffre.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void coffre.delete(k)),
    __coffre: coffre,
  };
});

const reponse = (status, corps) => ({ status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(corps) });

let client;
let SecureStore;

beforeEach(async () => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_API_URL = 'https://planner.test';
  SecureStore = require('expo-secure-store');
  SecureStore.__coffre.clear();
  client = require('../src/api/client');
  await client.definirJetons({ acces: 'acces-1', renouvellement: 'renouv-1' });
  global.fetch = jest.fn();
});

test('envoie le jeton en Bearer et se présente comme client mobile', async () => {
  fetch.mockResolvedValueOnce(reponse(200, { ok: true }));
  await client.planner('/auth/me');
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('https://planner.test/api/auth/me');
  expect(options.headers).toMatchObject({ Authorization: 'Bearer acces-1', 'X-Client': 'mobile' });
});

test('jeton expiré : un seul renouvellement pour des appels simultanés, puis nouvel essai', async () => {
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith('/auth/refresh')) return reponse(200, { access_token: 'acces-2', refresh_token: 'renouv-2' });
    return options.headers.Authorization === 'Bearer acces-2' ? reponse(200, { donnees: url }) : reponse(401, { code: 'TOKEN_EXPIRED' });
  });
  const [a, b] = await Promise.all([client.planner('/a'), client.planner('/b')]);
  expect(a.donnees).toMatch(/\/a$/);
  expect(b.donnees).toMatch(/\/b$/);
  expect(fetch.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
  // Le jeton de renouvellement part dans le corps, jamais dans l'URL
  const appelRefresh = fetch.mock.calls.find(([url]) => url.endsWith('/auth/refresh'));
  expect(JSON.parse(appelRefresh[1].body)).toEqual({ refresh_token: 'renouv-1' });
  expect(SecureStore.__coffre.get('hestim.jeton_renouvellement')).toBe('renouv-2');
});

test('renouvellement refusé : jetons effacés et session perdue', async () => {
  const perdue = jest.fn();
  client.definirSurSessionPerdue(perdue);
  fetch.mockImplementation(async (url) => (url.endsWith('/auth/refresh') ? reponse(403, { code: 'REFRESH_REUSE_DETECTED' }) : reponse(401, { code: 'TOKEN_EXPIRED' })));
  await expect(client.planner('/a')).rejects.toMatchObject({ statut: 401 });
  expect(perdue).toHaveBeenCalledTimes(1);
  expect(SecureStore.__coffre.size).toBe(0);
});

test('hors ligne : erreur réseau, la session est gardée', async () => {
  const perdue = jest.fn();
  client.definirSurSessionPerdue(perdue);
  fetch.mockRejectedValue(new TypeError('Network request failed'));
  await expect(client.planner('/a')).rejects.toMatchObject({ code: 'RESEAU' });
  expect(perdue).not.toHaveBeenCalled();
  expect(SecureStore.__coffre.get('hestim.jeton_acces')).toBe('acces-1');
});

test('bibliothèque : un 401 sans code déclenche aussi le renouvellement', async () => {
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith('/auth/refresh')) return reponse(200, { access_token: 'acces-2', refresh_token: 'renouv-2' });
    return options.headers.Authorization === 'Bearer acces-2' ? reponse(200, { supports: {} }) : reponse(401, { message: 'Unauthenticated.' });
  });
  await expect(client.biblio('/modules/supports?codes[]=X')).resolves.toEqual({ supports: {} });
  expect(fetch.mock.calls[0][0]).toBe('https://planner.test/biblio/api/modules/supports?codes[]=X');
});
