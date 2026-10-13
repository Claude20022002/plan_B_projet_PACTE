/**
 * Parcours « calendrier de l'école » (lot B-7 : un parcours avant de découper
 * pages/gestion/Calendrier.jsx). Sur l'année 2025-2026, l'administration ajoute les fériés du Maroc
 * et confirme la date d'un férié estimé, crée une fermeture qui bloque les séances, la renomme et la
 * supprime. Pas sur 2026-2027 : ses fériés (le 11 janvier 2027…) bloqueraient les dates des autres
 * parcours, qui partagent la même base.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(90_000);

test("calendrier : fériés du Maroc, date confirmée, fermeture créée, modifiée puis supprimée", async ({ page }) => {
  const { admin, motDePasse } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  await page.goto("/gestion/calendrier");
  await page.getByRole("combobox", { name: "Année universitaire" }).click();
  await page.getByRole("option", { name: "2025-2026" }).click();

  // Les fériés du Maroc en un clic ; les fêtes religieuses arrivent estimées, à confirmer
  await page.getByRole("button", { name: "Ajouter les fériés du Maroc" }).click();
  await expect(page.getByText(/événement\(s\) ajouté\(s\), dont \d+ à confirmer/)).toBeVisible();
  const aConfirmer = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Confirmer" }) });
  const avant = await aConfirmer.count();
  expect(avant).toBeGreaterThan(0);
  await aConfirmer.first().getByRole("button", { name: "Confirmer" }).click();
  await page.getByRole("dialog", { name: /Confirmer la date/ }).getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText(/Date confirmée/)).toBeVisible();
  await expect(aConfirmer).toHaveCount(avant - 1);

  // Une fermeture de deux jours, qui bloque les séances
  await page.getByRole("button", { name: "Ajouter un événement" }).click();
  const evenement = page.getByRole("dialog", { name: "Ajouter un événement" });
  await evenement.getByRole("textbox", { name: "Intitulé" }).fill("Fermeture pour travaux");
  await evenement.getByRole("combobox", { name: "Type" }).click();
  await page.getByRole("option", { name: "Autre" }).click();
  await evenement.getByLabel("Début").fill("2026-03-16");
  await evenement.getByLabel("Fin").fill("2026-03-17");
  const bloque = evenement.getByRole("switch", { name: "Aucune séance sur ces dates" });
  await bloque.check();
  await expect(bloque).toBeChecked();
  await evenement.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Événement enregistré")).toBeVisible();
  const fermeture = page.getByRole("row", { name: /Fermeture pour travaux/ });
  await expect(fermeture).toContainText("Bloquées");

  // Renommée, puis supprimée après confirmation
  await page.getByRole("button", { name: "Modifier Fermeture pour travaux", exact: true }).click();
  const edition = page.getByRole("dialog", { name: "Modifier l’événement" });
  await edition.getByRole("textbox", { name: "Intitulé" }).fill("Fermeture du bâtiment");
  await edition.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("row", { name: /Fermeture du bâtiment/ })).toBeVisible();
  await page.getByRole("button", { name: "Supprimer Fermeture du bâtiment", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByRole("row", { name: /Fermeture du bâtiment/ })).toHaveCount(0);
});
