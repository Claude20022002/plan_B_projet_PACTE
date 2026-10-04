/**
 * Supports de cours d'un module dans la bibliothèque (StudyLib, sous /biblio sur la même origine) :
 * { documents, url } ou null (module absent, bibliothèque indisponible, session expirée).
 * Une réponse par code et par chargement de page : le panneau se rafraîchit souvent.
 */
const cache = new Map();

const memeOrigine = (url) => {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
};

export const supportsDuCours = (code) => {
  if (!code) return Promise.resolve(null);
  if (!cache.has(code)) {
    cache.set(
      code,
      fetch(`/biblio/modules/supports?codes[]=${encodeURIComponent(code)}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const s = d?.supports?.[code];
          // Lien accepté seulement sur la même origine (jamais un lien externe injecté)
          return s && Number.isInteger(s.documents) && memeOrigine(s.url) ? s : null;
        })
        .catch(() => null)
    );
  }
  return cache.get(code);
};
