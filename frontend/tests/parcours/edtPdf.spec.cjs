/**
 * Parcours « PDF de l'emploi du temps » (plan multi-établissements, lot ME-1 ;
 * conception-me1-grille-pdf-groupe-b.md) : la grille du PDF est celle des créneaux de l'école, ici
 * la grille des parcours (grille.mjs, celle de HESTIM), et non plus une grille écrite en dur.
 * Avant ME-1, le PDF libellait le 2e créneau « 10h45 - 12h30 » et n'avait pas de vendredi.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test("PDF de l'emploi du temps : la grille des créneaux de l'école", async ({ page }) => {
  test.setTimeout(120_000);
  const { etudiants, motDePasse, seance } = lireDonnees();
  await seConnecter(page, { email: etudiants[0].email, motDePasse, role: "etudiant" });
  await page.goto("/emploi-du-temps/etudiant");
  await expect(page.getByText(seance.cours).first()).toBeVisible({ timeout: 20_000 });

  // Télécharger → PDF officiel : le document s'ouvre dans une fenêtre d'impression
  await page.getByRole("button", { name: "Télécharger" }).click();
  const [pdf] = await Promise.all([page.waitForEvent("popup"), page.getByRole("menuitem", { name: "PDF officiel" }).click()]);
  // Pas de dialogue d'impression pendant le parcours
  await pdf.evaluate(() => { window.print = () => {}; });

  // En-têtes : les horaires réels de la grille, groupés en matin et après-midi
  await expect(pdf.locator("th.th-slot")).toHaveText(["09h00 - 10h45", "11h00 - 12h30", "13h30 - 15h15", "15h30 - 17h00"]);
  await expect(pdf.locator("thead th.th-mat")).toHaveText("Matin");
  await expect(pdf.locator("thead th.th-apm")).toHaveText("Après-midi");

  // Le vendredi a sa ligne ; la séance du jour (créneau 00:05 - 23:55, hors grille) est imprimée avec son horaire
  await expect(pdf.locator("th.td-jour", { hasText: "Vendredi" }).first()).toBeVisible();
  const cellule = pdf.locator("th.td-slot.has-cours", { hasText: seance.cours }).filter({ hasText: "00h05 - 23h55" });
  await expect(cellule.first()).toBeVisible();
});
