/**
 * Parcours « demande de report puis décision » (lot B-8) : l'enseignante demande le report de sa
 * séance du lundi 4 janvier 2027 au lundi suivant ; l'administration l'approuve ; l'enseignante
 * voit la demande approuvée. Le nouveau jour reste un lundi, celui du créneau : le parcours ne
 * touche pas aux règles de planification, qui ont leurs propres tests.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

const MOTIF = "Jury de soutenance le même jour";
// Deux connexions et deux écrans, souvent juste après les générations qui chargent la machine
test.setTimeout(90_000);

test("demande de report : envoyée par l'enseignante, approuvée par l'administration", async ({ browser }) => {
  const { admin, enseignante, motDePasse } = lireDonnees();

  // L'enseignante demande le report
  const prof = await (await browser.newContext()).newPage();
  await seConnecter(prof, { email: enseignante.email, motDePasse, role: "enseignant" });
  await prof.goto("/demandes-report");
  await prof.getByRole("button", { name: "Nouvelle demande" }).click();
  const formulaire = prof.getByRole("dialog");
  const seance = formulaire.getByRole("combobox", { name: "Affectation" });
  await seance.selectOption({ label: (await seance.locator("option", { hasText: "04/01/2027" }).innerText()).trim() });
  await formulaire.getByLabel("Nouvelle date").fill("2027-01-11");
  await formulaire.getByRole("textbox", { name: "Motif" }).fill(MOTIF);
  await formulaire.getByRole("button", { name: "Créer" }).click();
  await expect(formulaire).toBeHidden();
  await expect(prof.getByRole("row").filter({ hasText: "En attente" })).toHaveCount(1);

  // L'administration l'approuve
  const adm = await (await browser.newContext()).newPage();
  await seConnecter(adm, { email: admin.email, motDePasse, role: "admin" });
  await adm.goto("/gestion/demandes-report");
  const ligne = adm.getByRole("row").filter({ hasText: enseignante.nom });
  await ligne.getByRole("button", { name: "Approuver" }).click();
  await expect(ligne.getByText("Approuvée")).toBeVisible();

  // L'enseignante voit la décision
  await prof.reload();
  await expect(prof.getByRole("row").filter({ hasText: "Approuvée" })).toHaveCount(1);
});
