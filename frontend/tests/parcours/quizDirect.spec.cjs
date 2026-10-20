/**
 * Parcours « quiz en direct » (docs/plans/sortie-classquiz.md, lot SC-1) : l'enseignante crée un
 * quiz de deux questions et le lance en direct ; une étudiante arrive sur téléphone par le QR code
 * (/quiz/code/<code>, connexion puis retour), une autre saisit le code sur ordinateur. Chaque
 * question : les deux répondent, la question se ferme d'elle-même, chacune voit son résultat,
 * l'écran projeté montre la répartition ; puis le classement et le podium.
 * PARCOURS_CAPTURES=<dossier> enregistre les écrans.
 */
const path = require("path");
const { test, expect, devices } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(240_000);

const capturer = async (page, nom) => {
  if (process.env.PARCOURS_CAPTURES) await page.screenshot({ path: path.join(process.env.PARCOURS_CAPTURES, `direct-${nom}.png`), fullPage: true });
};

// Les écrans relisent le serveur chaque seconde : on laisse quelques relectures à chaque étape
const ETAPE = { timeout: 20_000 };

const creerQuiz = async (page, titre) => {
  await page.goto("/studio-quiz");
  await page.getByRole("button", { name: "Créer un quiz" }).first().click();
  const nouveau = page.getByRole("dialog", { name: "Nouveau quiz" });
  await nouveau.getByRole("button", { name: /Partir de zéro/ }).click();
  await nouveau.getByRole("textbox", { name: "Titre du quiz" }).fill(titre);
  await nouveau.getByRole("button", { name: "Créer" }).click();
  await expect(page.getByRole("heading", { name: titre })).toBeVisible();

  await page.getByRole("button", { name: "Ajouter une question" }).click();
  await page.getByRole("menuitem", { name: /Choix unique/ }).click();
  await page.getByRole("textbox", { name: "Énoncé" }).fill("Quel port utilise SSH ?");
  for (const [i, texte] of ["Port 21", "Port 22", "Port 23", "Port 80"].entries()) await page.getByRole("textbox", { name: `Option ${"ABCD"[i]}` }).fill(texte);
  await page.getByRole("radio", { name: "Bonne réponse : B" }).check();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Question enregistrée")).toBeVisible();

  await page.getByRole("button", { name: "Ajouter une question" }).click();
  await page.getByRole("menuitem", { name: /Vrai ou faux/ }).click();
  await page.getByRole("textbox", { name: "Énoncé" }).fill("BGP relie des systèmes autonomes.");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("2 questions · 2 points")).toBeVisible();
};

test("quiz en direct : lancé par l'enseignante, joué sur un téléphone et un ordinateur, jusqu'au podium", async ({ page, browser }) => {
  const { enseignante, etudiants, motDePasse } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  await creerQuiz(page, "Réseaux, en direct");

  // Diffuser en direct : l'écran à projeter s'ouvre sur le QR code
  await page.getByRole("button", { name: "Ouvrir une passation" }).click();
  const fenetre = page.getByRole("dialog", { name: "Ouvrir une passation" });
  await fenetre.getByRole("button", { name: "En direct" }).click();
  await fenetre.getByRole("combobox", { name: "Temps par question" }).click();
  await page.getByRole("option", { name: "30 secondes" }).click();
  await capturer(page, "lancer");
  await fenetre.getByRole("button", { name: "Lancer en direct" }).click();
  await expect(page).toHaveURL(/\/studio-quiz\/direct\/\d+$/, ETAPE);
  const qr = page.getByRole("img", { name: /QR code menant au quiz/ });
  await expect(qr).toBeVisible(ETAPE);
  const code = (await qr.getAttribute("alt")).match(/\/quiz\/code\/([A-Z0-9]+)/)[1];

  // Étudiante 1, sur téléphone, par le QR code
  const telephone = await browser.newContext({ ...devices["Pixel 7"], locale: "fr-FR" });
  const mobile = await telephone.newPage();
  await mobile.goto(`/quiz/code/${code}`);
  await expect(mobile).toHaveURL(/\/connexion\?next=/);
  await mobile.getByRole("textbox", { name: "Adresse email" }).fill(etudiants[1].email);
  await mobile.getByRole("textbox", { name: "Mot de passe", exact: true }).fill(motDePasse);
  await mobile.getByRole("button", { name: "Connexion", exact: true }).click();
  await expect(mobile).toHaveURL(/\/quiz\/direct\/\d+$/, ETAPE);
  await expect(mobile.getByText("Vous êtes prêt : le quiz démarre dès que votre enseignant le lance.")).toBeVisible(ETAPE);

  // Étudiante 2, sur ordinateur, par le code
  const poste = await (await browser.newContext({ locale: "fr-FR" })).newPage();
  await seConnecter(poste, { email: etudiants[0].email, motDePasse, role: "etudiant" });
  await poste.goto("/quiz");
  await poste.getByRole("textbox", { name: "Code" }).fill(code);
  await poste.getByRole("button", { name: "Rejoindre" }).click();
  await expect(poste).toHaveURL(/\/quiz\/direct\/\d+$/, ETAPE);

  await expect(page.getByText("2 étudiants sont là")).toBeVisible(ETAPE);
  await capturer(page, "attente");
  await page.getByRole("button", { name: "Commencer" }).click();

  // Question 1 : la bonne réponse sur le téléphone, une fausse sur l'ordinateur
  await expect(page.getByRole("heading", { name: "Quel port utilise SSH ?" })).toBeVisible(ETAPE);
  await expect(page.getByRole("timer")).toBeVisible();
  await mobile.getByRole("radio", { name: /Port 22/ }).click(ETAPE);
  await expect(mobile.getByText("Réponse envoyée. Regardez l’écran de la classe.")).toBeVisible(ETAPE);
  await capturer(mobile, "telephone-question");
  await poste.getByRole("radio", { name: /Port 21/ }).click(ETAPE);

  // Tout le monde a répondu : la question se ferme d'elle-même
  await expect(page.getByText("Bonnes réponses : 1 sur 2")).toBeVisible(ETAPE);
  await expect(mobile.getByText("Bonne réponse !")).toBeVisible(ETAPE);
  await expect(poste.getByText("Raté, ce sera pour la prochaine !")).toBeVisible(ETAPE);
  await capturer(page, "correction");
  await capturer(mobile, "telephone-correction");

  await page.getByRole("button", { name: "Classement" }).click();
  await expect(page.getByRole("list", { name: "Classement" })).toContainText(etudiants[1].prenom, ETAPE);

  // Question 2 : vrai ou faux, les deux répondent juste
  await page.getByRole("button", { name: "Voir le podium" }).or(page.getByRole("button", { name: "Question suivante" })).click();
  await expect(page.getByRole("heading", { name: "BGP relie des systèmes autonomes." })).toBeVisible(ETAPE);
  await mobile.getByRole("radio", { name: "Vrai" }).click(ETAPE);
  await poste.getByRole("radio", { name: "Vrai" }).click(ETAPE);
  await expect(page.getByText("Bonnes réponses : 2 sur 2")).toBeVisible(ETAPE);

  // Fin : podium sur l'écran projeté et sur les téléphones
  await page.getByRole("button", { name: "Voir le podium" }).click();
  await expect(page.getByRole("heading", { name: "Bravo à toute la classe !" })).toBeVisible(ETAPE);
  await expect(page.getByRole("list", { name: "Podium" })).toContainText(etudiants[1].prenom);
  await capturer(page, "podium");
  await expect(mobile.getByText(/Vous êtes 1er sur 2/)).toBeVisible(ETAPE);
  await expect(poste.getByText(/Vous êtes 2e sur 2/)).toBeVisible(ETAPE);
  await capturer(mobile, "telephone-fin");
});
