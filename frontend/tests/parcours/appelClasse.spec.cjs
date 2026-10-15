/**
 * Parcours « appel d'une classe » et « Mon service » (docs/plans/espace-de-cours.md, lots E-7 et
 * E-8) : depuis l'espace de la classe, l'enseignante ouvre l'appel du jour, marque une étudiante en
 * retard (trois statuts, pas d'« excusé »), termine l'appel si ce n'est fait, puis retrouve le bilan
 * dans l'onglet Élèves et l'exporte. Enfin, « Mon service » réunit ses trois pages en onglets.
 * La base est partagée avec appel.spec.cjs : l'appel du jour peut déjà être terminé.
 */
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

const capturer = async (page, nom) => {
  if (process.env.PARCOURS_CAPTURES) await page.screenshot({ path: path.join(process.env.PARCOURS_CAPTURES, `${nom}.png`), fullPage: true });
};

test("appel de la classe : un retard, le bilan, l'export", async ({ page }) => {
  test.setTimeout(180_000);
  const { enseignante, etudiants, motDePasse } = lireDonnees();
  const retardataire = etudiants[7];
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });

  // Mes classes → la classe → onglet Appel → la séance du jour
  await page.goto("/mes-classes");
  await page.getByRole("button", { name: "Supports de cours" }).first().click();
  await page.getByRole("tab", { name: "Appel" }).click();
  await expect(page).toHaveURL(/onglet=appel/);
  await page.getByRole("button", { name: /Appel à faire|présents/ }).first().click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/appel\/\d+$/);

  // Trois statuts, pas d'« excusé »
  const statut = page.getByRole("group", { name: `Statut de ${retardataire.prenom} ${retardataire.nom}` });
  await expect(statut.getByRole("button")).toHaveText(["Présent", "En retard", "Absent"], { timeout: 20_000 });
  await statut.getByRole("button", { name: "En retard" }).click();
  await expect(statut.getByRole("button", { name: "En retard" })).toHaveAttribute("aria-pressed", "true");
  await capturer(page, "appel-statuts");

  // Appel encore ouvert : on le termine (le bilan ne compte que les appels terminés)
  const terminer = page.getByRole("button", { name: "Terminer l’appel" });
  if (await terminer.isVisible()) {
    await terminer.click();
    await page.getByRole("dialog").getByRole("button", { name: "Terminer l’appel" }).click();
  }
  await expect(page.getByText(/en retard/).first()).toBeVisible();

  // Onglet Élèves : la retardataire a un retard ; export CSV
  await page.goto("/mes-classes");
  await page.getByRole("button", { name: "Supports de cours" }).first().click();
  await page.getByRole("tab", { name: "Élèves" }).click();
  const ligne = page.getByRole("row", { name: new RegExp(`${retardataire.nom} ${retardataire.prenom}`) });
  await expect(ligne.getByRole("cell").nth(3)).toHaveText("1");
  await capturer(page, "classe-eleves");
  const [telechargement] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exporter (CSV)" }).click()]);
  expect(telechargement.suggestedFilename()).toMatch(/^presences-.*\.csv$/);
});

test("Mon service : services, disponibilités et demandes de report en onglets", async ({ page }) => {
  const { enseignante, motDePasse } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  // Une seule entrée de menu au lieu de trois
  const menu = page.getByRole("navigation");
  await expect(menu.getByText("Mes disponibilités", { exact: true })).toHaveCount(0);
  await expect(menu.getByText("Mes demandes de report", { exact: true })).toHaveCount(0);
  await menu.getByText("Mon service", { exact: true }).click();
  await expect(page).toHaveURL(/\/mes-services$/);
  await page.getByRole("tab", { name: "Disponibilités" }).click();
  await expect(page).toHaveURL(/\/disponibilites$/);
  await page.getByRole("tab", { name: "Demandes de report" }).click();
  await expect(page).toHaveURL(/\/demandes-report$/);
  await expect(page.getByRole("tab", { name: "Demandes de report" })).toHaveAttribute("aria-selected", "true");
  await capturer(page, "mon-service");
});
