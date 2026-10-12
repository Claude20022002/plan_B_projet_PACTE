/**
 * Parcours « modifier un quiz depuis Planner » (lot IA-5) : l'enseignante ouvre, depuis la page
 * Activités, un quiz qu'elle a dans le service de quiz (un faux service, fauxServiceQuiz.mjs, qui
 * vérifie la signature de chaque requête) ; elle change le titre et une réponse, ajoute une
 * question et enregistre ; rouvert, le quiz a gardé ses changements.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(90_000);

test("mes quiz : un quiz du service de quiz modifié depuis la page Activités", async ({ page }) => {
  const { enseignante, motDePasse, quiz } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  await page.goto("/jeux");

  const panneau = page.getByRole("region", { name: "Mes quiz" });
  await expect(panneau.getByText("Dans le service de quiz")).toBeVisible();
  await expect(panneau.getByText("2 questions")).toBeVisible();
  await panneau.getByRole("button", { name: `Modifier le quiz ${quiz.titre}` }).click();

  const dialogue = page.getByRole("dialog", { name: "Modifier le quiz" });
  await expect(dialogue.getByRole("textbox", { name: "Énoncé" }).first()).toHaveValue("Quel protocole route entre systèmes autonomes ?");
  await dialogue.getByLabel("Titre du quiz").fill("Routage IP, version 2");
  // Question 2 : « 443 » devient « 443 (TCP) »
  const question2 = dialogue.getByRole("group", { name: "Question 2" });
  await question2.getByRole("textbox", { name: "Réponse 2", exact: true }).fill("443 (TCP)");
  // Une question ajoutée, avec sa bonne réponse cochée
  await dialogue.getByRole("button", { name: "Ajouter une question" }).click();
  const question3 = dialogue.getByRole("group", { name: "Question 3" });
  await question3.getByRole("textbox", { name: "Énoncé" }).fill("Protocole de résolution d’adresses ?");
  await question3.getByRole("textbox", { name: "Réponse 1", exact: true }).fill("ARP");
  await question3.getByRole("textbox", { name: "Réponse 2", exact: true }).fill("DNS");
  await dialogue.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Quiz « Routage IP, version 2 » enregistré")).toBeVisible();
  await expect(dialogue).toBeHidden();

  // Rouvert : le service de quiz a bien reçu la nouvelle version
  await expect(panneau.getByText("3 questions")).toBeVisible();
  await panneau.getByRole("button", { name: "Modifier le quiz Routage IP, version 2" }).click();
  await expect(dialogue.getByLabel("Titre du quiz")).toHaveValue("Routage IP, version 2");
  await expect(dialogue.getByRole("group", { name: "Question 2" }).getByRole("textbox", { name: "Réponse 2", exact: true })).toHaveValue("443 (TCP)");
  await expect(dialogue.getByRole("group", { name: "Question 3" }).getByRole("textbox", { name: "Énoncé" })).toHaveValue("Protocole de résolution d’adresses ?");
});
