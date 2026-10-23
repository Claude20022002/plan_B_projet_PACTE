/**
 * Parcours « Créer un quiz » (R-9, retours du 21 octobre) : un quiz n'est attaché ni à une classe
 * ni à un module. L'enseignante crée un quiz depuis « Mes quiz » en donnant un sujet seul ; l'IA
 * (fausse IA des parcours, fausseIa.mjs) écrit les questions, qui arrivent « à relire » dans
 * l'éditeur. Aucune étape ne demande de classe.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(120_000);

test("créer un quiz : un sujet suffit, sans classe ni module", async ({ page }) => {
  const { enseignante, motDePasse } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  await page.getByRole("navigation", { name: "Menu" }).getByRole("button", { name: "Mes quiz" }).click();
  await expect(page).toHaveURL(/\/studio-quiz$/);

  await page.getByRole("button", { name: "Créer un quiz" }).first().click();
  const nouveau = page.getByRole("dialog", { name: "Nouveau quiz" });
  await nouveau.getByRole("button", { name: /Générer avec l’IA/ }).click();

  const generer = page.getByRole("dialog", { name: "Générer des questions avec l’IA" });
  await expect(generer).toBeVisible();
  await expect(generer.getByRole("combobox", { name: /Classe|Module/ })).toHaveCount(0);
  await generer.getByRole("textbox", { name: /^Sujet/ }).fill("Adressage IP");
  await generer.getByRole("spinbutton", { name: "Nombre de questions" }).fill("3");
  await generer.getByRole("button", { name: "Générer" }).click();

  // Le quiz s'ouvre aussitôt ; les questions arrivent quand l'IA a fini (l'éditeur relit le serveur)
  await expect(page).toHaveURL(/\/studio-quiz\/\d+$/);
  await expect(page.getByRole("heading", { name: "Adressage IP" })).toBeVisible();
  await expect(page.getByText("3 questions proposées par l’IA restent à relire avant d’ouvrir le quiz.")).toBeVisible({ timeout: 30_000 });
  for (const n of [1, 2, 3]) await expect(page.getByText(`Adressage IP : question ${n} ?`).first()).toBeVisible();
});
