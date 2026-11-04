/**
 * Parcours « année des groupes » (lot ME-18) : la page Groupes s'ouvre sur l'année en cours et une
 * autre année ne montre que ses groupes. La promotion 4A GEN, saisie avant que l'année 2026-2027 soit
 * déclarée (donneesGeneration.mjs), s'y est rattachée à la création de l'année. Le choix suit
 * l'administrateur sur la page Étudiants, le temps de la session.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter, enTeteCsrf } = require("./outils.cjs");

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

  // Page compilée à froid par le serveur de développement : le sélecteur attend les années plus de 5 s
  await page.goto("/gestion/etudiants");
  await expect(page.getByRole("combobox", { name: "Année universitaire" })).toHaveText("Toutes les années", { timeout: 20_000 });
});

test("EDT du mois : seules les classes de l'année du mois affiché sont proposées", async ({ page }) => {
  const { admin, motDePasse } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  await page.goto("/emploi-du-temps/mensuel?mois=2027-01");
  const classe = page.getByRole("combobox", { name: "Classe (groupe)" });
  await classe.fill("GEN");
  await expect(page.getByRole("option", { name: "4A GEN" })).toBeVisible();
  await classe.press("Escape");

  // Mars 2026 est en 2025-2026 : la promotion de 2026-2027 n'y est plus proposée
  await page.getByLabel("Mois").fill("2026-03");
  await classe.fill("GEN");
  await expect(page.getByRole("option", { name: "4A GEN" })).toHaveCount(0);
});

test("étudiants, toutes les années : deux « 4A GEN » se distinguent dans le menu, l'import refuse de choisir", async ({ page }) => {
  const { admin, motDePasse } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  // Une promotion 4A GEN en 2025-2026 aussi, le temps du test : supprimée à la fin, et au début
  // d'un essai rejoué (relance de la CI) si le précédent s'est arrêté avant
  const groupesDe = async (annee) => (await (await page.request.get(`/api/groupes?annee_scolaire=${annee}&limit=100`)).json()).data;
  const retirerAncienne = async () => {
    for (const g of (await groupesDe("2025-2026")).filter((g) => g.nom_groupe === "4A GEN")) {
      const reponse = await page.request.delete(`/api/groupes/${g.id_groupe}`, { headers: await enTeteCsrf(page) });
      expect(reponse.ok(), `suppression de 4A GEN 2025-2026 : ${await reponse.text()}`).toBeTruthy();
    }
  };
  await retirerAncienne();
  const { id_filiere } = (await groupesDe("2026-2027")).find((g) => g.nom_groupe === "4A GEN");
  const ancienne = { nom_groupe: "4A GEN", niveau: "4ème année", annee: 4, effectif: 0, annee_scolaire: "2025-2026", type_groupe: "promotion", id_filiere };
  const creation = await page.request.post("/api/groupes", { headers: await enTeteCsrf(page), data: ancienne });
  expect(creation.ok(), `création de 4A GEN 2025-2026 : ${await creation.text()}`).toBeTruthy();

  try {
    await page.goto("/gestion/etudiants");
    const annee = page.getByRole("combobox", { name: "Année universitaire" });
    await expect(annee).toHaveText("2026-2027 (en cours)", { timeout: 20_000 });
    await annee.click();
    await page.getByRole("option", { name: "Toutes les années" }).click();

    // La fiche : l'année suit le nom de chaque groupe (le menu « Groupe » est le dernier de la fiche)
    await page.getByRole("button", { name: "Ajouter un étudiant" }).click();
    await page.getByRole("dialog", { name: "Nouvel étudiant" }).getByRole("combobox").last().click();
    await expect(page.getByRole("option", { name: "4A GEN · 2025-2026" })).toBeVisible();
    await expect(page.getByRole("option", { name: "4A GEN · 2026-2027" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "Nouvel étudiant" }).getByRole("button", { name: "Annuler" }).click();

    // L'import : la ligne est refusée plutôt que rattachée à l'une des deux au hasard
    await page.getByRole("button", { name: "Importer (Excel/CSV)" }).click();
    const fichier = ["nom;prenom;email;telephone;numero_etudiant;niveau;groupe", "ESSAI;Lina;lina.essai@exemple.hestim.test;;E2026999;4A;4A GEN"].join("\n");
    await page.getByRole("dialog", { name: "Importer des étudiants" }).locator('input[type="file"]').setInputFiles({ name: "etudiants.csv", mimeType: "text/csv", buffer: Buffer.from(fichier) });
    await expect(page.getByText(/Le groupe 4A GEN existe dans plusieurs années \(20\d\d-20\d\d, 20\d\d-20\d\d\)/)).toBeVisible();
    await expect(page.getByText("Lignes importées : 0 · en erreur : 1")).toBeVisible();
  } finally {
    await retirerAncienne();
  }
});
