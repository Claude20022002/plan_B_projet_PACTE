/**
 * Parcours « année des groupes » (lot ME-18) : la page Groupes s'ouvre sur l'année en cours et une
 * autre année ne montre que ses groupes. La promotion 4A GEN, saisie avant que l'année 2026-2027 soit
 * déclarée (donneesGeneration.mjs), s'y est rattachée à la création de l'année. Le choix suit
 * l'administrateur sur la page Étudiants, le temps de la session.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(90_000);

test("groupes : l'année en cours par défaut, une autre année sur demande, gardée d'une page à l'autre", async ({ page }) => {
  const { admin, motDePasse } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  await page.goto("/gestion/groupes");
  await page.getByRole("combobox", { name: "Filière" }).click();
  await page.getByRole("option", { name: /^GEN · / }).click();

  const annee = page.getByRole("combobox", { name: "Année universitaire" });
  await expect(annee).toHaveText("2026-2027 (en cours)");
  await expect(page.getByText("4A GEN", { exact: true })).toBeVisible();
  await expect(page.getByText(/pas d’année reconnue/)).toHaveCount(0);

  await annee.click();
  await page.getByRole("option", { name: "2025-2026" }).click();
  await expect(page.getByText("Aucun groupe GEN en 2025-2026")).toBeVisible();

  await annee.click();
  await page.getByRole("option", { name: "Toutes les années" }).click();
  await expect(page.getByText("4A GEN", { exact: true })).toBeVisible();

  await page.goto("/gestion/etudiants");
  await expect(page.getByRole("combobox", { name: "Année universitaire" })).toHaveText("Toutes les années");
});
