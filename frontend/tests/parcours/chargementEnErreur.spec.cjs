/**
 * Chargement en erreur (recette du 20 octobre, défaut bloquant B-1) : une page dont le chargement
 * échoue affiche un message, et ce message ne doit pas relancer le chargement. Avant le correctif de
 * ToastContext, la page de la génération envoyait environ 1 500 requêtes en 10 secondes, et la limite
 * par compte bloquait alors l'administrateur partout pendant un quart d'heure.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test("un chargement en échec affiche un message une fois, sans boucle de requêtes", async ({ page }) => {
  const { admin, motDePasse } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });

  // Panne simulée d'une des trois listes que la page charge
  await page.route("**/api/calendrier/annees*", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Panne simulée" }) })
  );
  let requetes = 0;
  page.on("request", (requete) => {
    if (new URL(requete.url()).pathname.startsWith("/api/")) requetes += 1;
  });

  await page.goto("/gestion/generation-automatique");
  await expect(page.getByRole("alert").first()).toBeVisible();
  // Laisser à une éventuelle boucle le temps de se voir (des centaines de requêtes en 5 s)
  await page.waitForTimeout(5_000);

  // Un chargement normal : les trois listes, l'utilisateur, les notifications… une vingtaine au plus
  expect(requetes, "requêtes envoyées par la page en 5 s").toBeLessThan(25);
});
