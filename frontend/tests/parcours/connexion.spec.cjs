/**
 * Parcours « connexion » (lot B-8) : chaque rôle arrive sur son tableau de bord, un mauvais mot de
 * passe est refusé, et une page protégée renvoie vers la connexion.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.describe("Connexion", () => {
  // Les comptes sont lus dans chaque test : ils sont créés au démarrage du serveur, après le chargement de ce fichier
  const COMPTES = { admin: (d) => d.admin, enseignant: (d) => d.enseignante, etudiant: (d) => d.etudiants[0] };
  for (const role of Object.keys(COMPTES)) {
    test(`${role} : arrive sur son tableau de bord`, async ({ page }) => {
      const donnees = lireDonnees();
      await seConnecter(page, { email: COMPTES[role](donnees).email, motDePasse: donnees.motDePasse, role });
    });
  }

  test("mauvais mot de passe : refusé, on reste sur la connexion", async ({ page }) => {
    const donnees = lireDonnees();
    await page.goto("/connexion");
    await page.getByRole("textbox", { name: "Adresse email" }).fill(donnees.enseignante.email);
    await page.getByRole("textbox", { name: "Mot de passe", exact: true }).fill(`${donnees.motDePasse}-faux`);
    await page.getByRole("button", { name: "Connexion", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/connexion$/);
  });

  test("page protégée sans connexion : renvoi vers la connexion", async ({ page }) => {
    await page.goto("/mes-classes");
    await expect(page).toHaveURL(/\/connexion/);
  });
});
