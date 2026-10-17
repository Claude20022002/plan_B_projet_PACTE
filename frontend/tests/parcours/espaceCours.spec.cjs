/**
 * Parcours « espace de cours » (docs/plans/espace-de-cours.md, lots E-3 et E-5) : l'enseignante
 * ouvre sa classe depuis Mes classes, dépose un fichier et ajoute un lien, en masque un ; un
 * étudiant de la classe retrouve le cours dans « Mes cours » et n'y voit que ce qui est publié.
 * La Bibliothèque est la fausse de fausseBibliotheque.mjs. PARCOURS_CAPTURES=<dossier> enregistre
 * des captures des écrans, pour la relecture visuelle.
 */
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

const capturer = async (page, nom) => {
  if (process.env.PARCOURS_CAPTURES) await page.screenshot({ path: path.join(process.env.PARCOURS_CAPTURES, `${nom}.png`), fullPage: true });
};

test("espace de cours : l'enseignante dépose, l'étudiant consulte", async ({ browser }) => {
  // Deux comptes et la première compilation des pages par le site de développement
  test.setTimeout(180_000);
  const { enseignante, etudiants, motDePasse, seance } = lireDonnees();
  const prof = await browser.newPage();
  await seConnecter(prof, { email: enseignante.email, motDePasse, role: "enseignant" });

  // Mes classes → Supports de cours de la classe en cours
  await prof.goto("/mes-classes");
  await prof.getByRole("button", { name: "Supports de cours" }).first().click();
  await expect(prof).toHaveURL(/\/mes-classes\/\d+\/\d+$/);
  await expect(prof.getByText("Aucun support dans cette classe")).toBeVisible({ timeout: 20_000 });
  await capturer(prof, "espace-vide");
  await prof.getByRole("button", { name: "Ajouter des supports" }).click();
  await expect(prof.getByRole("heading", { name: "Général" })).toBeVisible();

  // Dépôt d'un fichier par la zone de dépôt (titre proposé : le nom du fichier)
  await prof.locator('input[type="file"]').setInputFiles({ name: "Chapitre_1-Introduction.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") });
  await expect(prof.getByText("Chapitre 1 Introduction")).toBeVisible({ timeout: 15_000 });

  // Un lien, puis une nouvelle section
  await prof.getByRole("button", { name: "Ajouter un lien" }).click();
  await prof.getByRole("textbox", { name: "Adresse" }).fill("https://cyber.gouv.fr/la-directive-nis-2");
  await prof.getByRole("textbox", { name: "Titre (facultatif)" }).fill("La directive NIS 2");
  await prof.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(prof.getByText("La directive NIS 2")).toBeVisible();
  await prof.getByRole("button", { name: "Nouvelle section" }).click();
  await prof.getByRole("textbox", { name: "Titre" }).fill("Semaine 2");
  await prof.getByRole("button", { name: "Créer" }).click();
  await expect(prof.getByRole("heading", { name: "Semaine 2" })).toBeVisible();

  // Un document de la Bibliothèque épinglé dans « Général », sans copie (lot E-9)
  await prof.getByRole("button", { name: "Depuis la Bibliothèque" }).first().click();
  await prof.getByRole("textbox", { name: "Rechercher un document" }).fill("OSI");
  await prof.getByRole("button", { name: "Ajouter Le modèle OSI à la section" }).click();
  await expect(prof.getByRole("dialog")).toHaveCount(0);
  await expect(prof.getByText("Le modèle OSI")).toBeVisible();

  // Le lien est masqué aux étudiants
  await prof.getByRole("button", { name: "Actions pour La directive NIS 2" }).click();
  await prof.getByRole("menuitem", { name: "Masquer aux étudiants" }).click();
  await expect(prof.getByText("Masqué", { exact: true })).toBeVisible();
  await capturer(prof, "espace-enseignant");

  // L'étudiant : Mes cours → la classe → le fichier, pas le lien masqué ni la section vide
  const etu = await browser.newPage();
  await seConnecter(etu, { email: etudiants[0].email, motDePasse, role: "etudiant" });
  await etu.goto("/mes-cours");
  await etu.getByRole("button", { name: new RegExp(seance.cours) }).click();
  await expect(etu.getByText("Chapitre 1 Introduction")).toBeVisible({ timeout: 20_000 });
  await expect(etu.getByText("Le modèle OSI")).toBeVisible();
  await expect(etu.getByText("La directive NIS 2")).toHaveCount(0);
  await expect(etu.getByRole("heading", { name: "Semaine 2" })).toHaveCount(0);
  await expect(etu.getByRole("button", { name: /Actions pour/ })).toHaveCount(0);
  await capturer(etu, "espace-etudiant");

  // Ouvrir le fichier : un nouvel onglet sur le lien signé de la Bibliothèque
  const [onglet] = await Promise.all([etu.waitForEvent("popup"), etu.getByText("Chapitre 1 Introduction").click()]);
  await expect(onglet.getByText("Support : Chapitre 1 Introduction")).toBeVisible({ timeout: 10_000 });
});
