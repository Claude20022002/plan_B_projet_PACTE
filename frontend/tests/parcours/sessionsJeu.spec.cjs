/**
 * Parcours « sessions de jeu » : l'enseignante lance le terminal Linux en classe.
 *  - Ensemble, au tableau : une étudiante rejoint **sur téléphone par le QR code**
 *    (/jeux/session/<code>, connexion puis retour), envoie une commande ; l'enseignante la joue
 *    au tableau ; l'étudiante voit sa réponse jouée.
 *  - Chacun sur son téléphone : une autre étudiante saisit le code dans « Activités » et arrive
 *    dans le jeu ; l'enseignante la voit dans la liste.
 * PARCOURS_CAPTURES=<dossier> enregistre les écrans.
 */
const path = require("path");
const { test, expect, devices } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(180_000);

const capturer = async (page, nom) => {
  if (process.env.PARCOURS_CAPTURES) await page.screenshot({ path: path.join(process.env.PARCOURS_CAPTURES, `${nom}.png`), fullPage: true });
};

/** Lance le terminal Linux dans le module de la classe ; rend le code lu dans le QR code. */
const lancer = async (page, mode) => {
  await page.goto("/jeux");
  const catalogue = page.getByRole("region", { name: "Tous les jeux" });
  await catalogue.getByRole("button", { name: "Lancer en classe" }).click();
  const fenetre = page.getByRole("dialog", { name: /Lancer « Terminal Linux » en classe/ });
  await fenetre.getByRole("combobox", { name: "Module" }).click();
  await page.getByRole("option", { name: /Algorithmique/ }).click();
  await fenetre.getByRole("radio", { name: new RegExp(mode) }).check();
  await capturer(page, `lancer-${mode.includes("tableau") ? "collectif" : "individuel"}`);
  await fenetre.getByRole("button", { name: "Lancer et afficher le QR code" }).click();
  await expect(page).toHaveURL(/\/jeux\/sessions\/\d+$/);
  const qr = page.getByRole("img", { name: /QR code/ });
  await expect(qr).toBeVisible();
  return (await qr.getAttribute("alt")).match(/\/jeux\/session\/([A-Z0-9]{6})/)[1];
};

test("sessions de jeu : au tableau avec la classe par QR code, puis chacun sur son téléphone par le code", async ({ page, browser }) => {
  const { enseignante, etudiants, motDePasse } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });

  // L'enseignante ne « joue » plus pour elle : pas de bouton Continuer, mais Lancer en classe
  await page.goto("/jeux");
  await expect(page.getByRole("region", { name: "Tous les jeux" }).getByRole("button", { name: /Continuer|Jouer/ })).toHaveCount(0);

  // ── Ensemble, au tableau ──
  const code = await lancer(page, "Ensemble, au tableau");
  await expect(page.getByText("Les réponses envoyées par les étudiants arrivent ici.")).toBeVisible();
  await capturer(page, "tableau-prof-vide");

  const telephone = await browser.newContext({ ...devices["Pixel 7"], locale: "fr-FR" });
  const mobile = await telephone.newPage();
  await mobile.goto(`/jeux/session/${code}`);
  await expect(mobile).toHaveURL(/\/connexion\?next=/);
  await mobile.getByRole("textbox", { name: "Adresse email" }).fill(etudiants[1].email);
  await mobile.getByRole("textbox", { name: "Mot de passe", exact: true }).fill(motDePasse);
  await mobile.getByRole("button", { name: "Connexion", exact: true }).click();
  await expect(mobile).toHaveURL(/\/jeux\/direct\/\d+$/, { timeout: 20_000 });
  await mobile.getByRole("textbox", { name: "Votre réponse (une commande)" }).fill("pwd");
  await mobile.getByRole("button", { name: "Envoyer" }).click();
  await expect(mobile.getByText("Votre réponse attend le choix de l’enseignant :")).toBeVisible();
  await capturer(mobile, "telephone-reponse-envoyee");

  // La réponse arrive au tableau (relu toutes les 3 s) ; l'enseignante la joue
  const reponses = page.getByRole("region", { name: "Réponses des étudiants" });
  await expect(reponses.getByText("pwd", { exact: true })).toBeVisible({ timeout: 10_000 });
  await capturer(page, "tableau-prof-reponse");
  await reponses.getByRole("button", { name: "Jouer" }).click();
  const terminal = page.getByRole("log");
  await expect(terminal).toContainText("pwd");
  await expect(terminal).toContainText("/home/classe");
  await capturer(page, "tableau-prof-joue");

  await expect(mobile.getByText("Votre réponse a été jouée au tableau :")).toBeVisible({ timeout: 10_000 });
  await expect(mobile.getByRole("log")).toContainText("/home/classe");
  await capturer(mobile, "telephone-reponse-jouee");
  await telephone.close();

  await page.getByRole("button", { name: "Terminer la session" }).click();
  await page.getByRole("dialog", { name: "Terminer la session ?" }).getByRole("button", { name: "Terminer la session" }).click();
  await expect(page.getByText("Session terminée").first()).toBeVisible();

  // ── Chacun sur son téléphone ──
  const codeSeul = await lancer(page, "Chacun sur son téléphone");
  const ordinateur = await browser.newContext({ locale: "fr-FR" });
  const poste = await ordinateur.newPage();
  await seConnecter(poste, { email: etudiants[2].email, motDePasse, role: "etudiant" });
  await poste.goto("/jeux");
  await poste.getByRole("textbox", { name: "Code affiché par l’enseignant" }).fill(codeSeul.toLowerCase());
  await poste.getByRole("button", { name: "Rejoindre" }).click();
  await expect(poste).toHaveURL(/\/jeux\/terminal-linux$/, { timeout: 20_000 });
  await ordinateur.close();

  await expect(page.getByText(`${etudiants[2].prenom} ${etudiants[2].nom}`)).toBeVisible({ timeout: 10_000 });
  await capturer(page, "individuel-prof");
});
