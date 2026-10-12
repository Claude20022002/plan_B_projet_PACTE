/**
 * Parcours « Créer un quiz » (lot B-8, à la place de « quiz donné en devoir », décision du
 * 11 octobre) : l'enseignante choisit sa classe, écrit un sujet et lance la génération ; elle relit
 * les dix questions proposées, en corrige une, puis crée le quiz ; il arrive dans le service de quiz
 * et dans sa liste « Mes quiz ». L'IA et le service de quiz sont des faux (fausseIa.mjs,
 * fauxServiceQuiz.mjs) : le parcours éprouve le chemin de Planner, pas la qualité des questions.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

const SUJET = "Le protocole TCP";
test.setTimeout(120_000);

test("créer un quiz : classe et sujet, génération, relecture, création", async ({ page }) => {
  const { enseignante, motDePasse, seance } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  await page.goto("/jeux");

  const panneau = page.getByRole("region", { name: "Mes quiz" });
  await panneau.getByRole("button", { name: "Créer un quiz" }).click();
  const creation = page.getByRole("dialog", { name: "Créer un quiz" });
  await creation.getByRole("combobox", { name: "Classe" }).click();
  await page.getByRole("option", { name: new RegExp(seance.groupe) }).first().click();
  await creation.getByRole("textbox", { name: "Sujet du quiz" }).fill(SUJET);
  await creation.getByRole("button", { name: "Générer" }).click();

  // Relecture : les dix questions de la fausse IA, sur le sujet saisi
  const relecture = page.getByRole("dialog", { name: "Relire le quiz proposé" });
  await expect(relecture).toBeVisible({ timeout: 60_000 });
  await expect(relecture.getByRole("group", { name: /^Question \d+$/ })).toHaveCount(10);
  const premiere = relecture.getByRole("group", { name: "Question 1", exact: true });
  await expect(premiere.getByRole("textbox", { name: "Énoncé" })).toHaveValue(`${SUJET} : question 1 ?`);
  await premiere.getByRole("textbox", { name: "Énoncé" }).fill("Combien d’étapes compte la poignée de main de TCP ?");
  await relecture.getByLabel("Titre du quiz").fill("TCP, révision");
  await relecture.getByRole("button", { name: "Créer le quiz" }).click();
  await expect(relecture).toBeHidden({ timeout: 30_000 });

  // Le quiz est dans le service de quiz : la liste « Mes quiz » le montre, modifiable
  await page.reload();
  await expect(panneau.getByRole("button", { name: "Modifier le quiz TCP, révision" })).toBeVisible();
  await panneau.getByRole("button", { name: "Modifier le quiz TCP, révision" }).click();
  const edition = page.getByRole("dialog", { name: "Modifier le quiz" });
  await expect(edition.getByRole("group", { name: "Question 1", exact: true }).getByRole("textbox", { name: "Énoncé" })).toHaveValue("Combien d’étapes compte la poignée de main de TCP ?");
});
