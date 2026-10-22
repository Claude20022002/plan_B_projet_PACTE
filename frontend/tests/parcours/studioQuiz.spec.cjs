/**
 * Parcours « Studio quiz » : l'enseignante crée un quiz à la main (choix unique, vrai ou faux),
 * ouvre une passation ; une étudiante la rejoint **sur téléphone par le QR code** (lien
 * /quiz/code/…, connexion puis retour au quiz), une autre **sur ordinateur par le code** ; toutes
 * deux répondent et rendent leur copie ; l'enseignante voit les deux copies dans les résultats.
 */
const { test, expect, devices } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(180_000);

const repondreEtRendre = async (page) => {
  await page.getByRole("radio", { name: /Port 22/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Enregistré" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("radio", { name: /Vrai/ }).click();
  await page.getByRole("button", { name: "Terminer" }).click();
  const rendre = page.getByRole("dialog", { name: "Envoyer vos réponses ?" });
  await expect(rendre).toContainText("Vous avez répondu à toutes les questions.");
  await rendre.getByRole("button", { name: "Envoyer mes réponses" }).click();
  await expect(page.getByRole("heading", { name: "Réponses envoyées" })).toBeVisible();
  await expect(page.getByText("100 %")).toBeVisible();
};

test("studio quiz : création, passation par QR code sur téléphone et par code sur ordinateur, résultats", async ({ page, browser }) => {
  const { enseignante, etudiants, motDePasse } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  await page.getByRole("navigation", { name: "Menu" }).getByRole("button", { name: "Mes quiz" }).click();
  await expect(page).toHaveURL(/\/studio-quiz$/);

  await page.getByRole("button", { name: "Créer un quiz" }).first().click();
  const nouveau = page.getByRole("dialog", { name: "Nouveau quiz" });
  await nouveau.getByRole("button", { name: /Partir de zéro/ }).click();
  await nouveau.getByRole("textbox", { name: "Titre du quiz" }).fill("Réseaux, contrôle 1");
  await nouveau.getByRole("button", { name: "Créer" }).click();
  await expect(page.getByRole("heading", { name: "Réseaux, contrôle 1" })).toBeVisible();

  // Question 1 : choix unique
  await page.getByRole("button", { name: "Ajouter une question" }).click();
  await page.getByRole("menuitem", { name: /Choix unique/ }).click();
  await page.getByRole("textbox", { name: "Énoncé" }).fill("Quel port utilise SSH ?");
  for (const [i, texte] of ["Port 21", "Port 22", "Port 23", "Port 80"].entries()) await page.getByRole("textbox", { name: `Option ${"ABCD"[i]}` }).fill(texte);
  await page.getByRole("radio", { name: "Bonne réponse : B" }).check();
  // Son temps en direct : borné comme le direct, puis gardé par le serveur
  const temps = page.getByRole("spinbutton", { name: "Temps en direct (secondes)" });
  await temps.fill("200");
  await expect(page.getByRole("status").filter({ hasText: "Durée : de 5 à 120 secondes" })).toBeVisible();
  await temps.fill("20");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Question enregistrée")).toBeVisible();
  const idQuiz = page.url().match(/\/studio-quiz\/(\d+)/)[1];
  const quiz = await (await page.request.get(`/api/studio-quiz/questionnaires/${idQuiz}`)).json();
  expect(quiz.questions.map((q) => q.duree_s)).toEqual([20]);

  // Question 2 : vrai ou faux (vrai par défaut)
  await page.getByRole("button", { name: "Ajouter une question" }).click();
  await page.getByRole("menuitem", { name: /Vrai ou faux/ }).click();
  await page.getByRole("textbox", { name: "Énoncé" }).fill("BGP relie des systèmes autonomes.");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("2 questions · 2 points")).toBeVisible();

  // Ouvrir la passation : les deux accès, code et QR code
  await page.getByRole("button", { name: "Diffuser ce quiz" }).click();
  const ouverture = page.getByRole("dialog", { name: "Diffuser ce quiz" });
  await ouverture.getByRole("button", { name: "Ouvrir", exact: true }).click();
  const acces = page.getByRole("dialog", { name: "Réseaux, contrôle 1" });
  const qr = acces.getByRole("img", { name: /QR code menant au quiz/ });
  await expect(qr).toBeVisible();
  const lien = (await qr.getAttribute("alt")).match(/https?:\/\/\S+\/quiz\/code\/([A-Z0-9]+)/);
  const code = lien[1];
  await expect(acces.getByText(code, { exact: true })).toBeVisible();

  // Étudiante 1, sur téléphone : le QR ouvre /quiz/code/<code>, connexion, retour au quiz
  const telephone = await browser.newContext({ ...devices["Pixel 7"], locale: "fr-FR" });
  const mobile = await telephone.newPage();
  await mobile.goto(`/quiz/code/${code}`);
  await expect(mobile).toHaveURL(/\/connexion\?next=/);
  await mobile.getByRole("textbox", { name: "Adresse email" }).fill(etudiants[1].email);
  await mobile.getByRole("textbox", { name: "Mot de passe", exact: true }).fill(motDePasse);
  await mobile.getByRole("button", { name: "Connexion", exact: true }).click();
  await expect(mobile).toHaveURL(new RegExp(`/quiz/code/${code}$`), { timeout: 20_000 });
  // Premier affichage de la page sur le serveur de développement : compilée à la demande
  await expect(mobile.getByRole("heading", { name: "Réseaux, contrôle 1" })).toBeVisible({ timeout: 20_000 });
  await mobile.getByRole("button", { name: "Commencer" }).click();
  await repondreEtRendre(mobile);
  await telephone.close();

  // Étudiante 2, sur ordinateur : elle saisit le code dans « Quiz »
  const ordinateur = await browser.newContext({ locale: "fr-FR" });
  const pc = await ordinateur.newPage();
  await seConnecter(pc, { email: etudiants[2].email, motDePasse, role: "etudiant" });
  await pc.goto("/quiz");
  await pc.getByRole("textbox", { name: "Code" }).fill(code.toLowerCase());
  await pc.getByRole("button", { name: "Rejoindre" }).click();
  await pc.getByRole("button", { name: "Commencer" }).click();
  await repondreEtRendre(pc);
  await ordinateur.close();

  // Résultats : deux copies, toutes deux réussies
  await acces.getByRole("button", { name: "Fermer" }).click();
  await page.getByRole("tab", { name: "Diffusions" }).click();
  await page.getByRole("button", { name: "Résultats" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Réussi" })).toHaveCount(2);

  // Diffuser directement depuis « Mes quiz », sans passer par l'éditeur
  await page.goto("/studio-quiz");
  await page.getByRole("button", { name: "Diffuser" }).first().click();
  const depuisListe = page.getByRole("dialog", { name: "Diffuser ce quiz" });
  await depuisListe.getByRole("button", { name: "Ouvrir", exact: true }).click();
  await expect(page.getByRole("img", { name: /QR code menant au quiz/ })).toBeVisible();

  // Page Activités : « Mes quiz » n'y est pas répété (il est dans le menu) ; « Lancer un quiz » propose le quiz du Studio
  await page.goto("/jeux");
  await expect(page.getByRole("region", { name: "Mes quiz" })).toHaveCount(0);
  await page.getByRole("button", { name: "Lancer un quiz" }).click();
  const lancement = page.getByRole("dialog", { name: "Lancer un quiz" });
  await expect(lancement.getByText("Mes quiz · chacun à son rythme (code et QR code)")).toBeVisible();
  await lancement.getByRole("button", { name: /Réseaux, contrôle 1/ }).click();
  const depuisActivites = page.getByRole("dialog", { name: "Diffuser ce quiz" });
  await depuisActivites.getByRole("button", { name: "Ouvrir", exact: true }).click();
  await expect(page.getByRole("img", { name: /QR code menant au quiz/ })).toBeVisible();
});
