/**
 * Parcours « maquette des cours » (lot B-7 : un parcours avant de découper pages/gestion/Cours.jsx).
 * L'administration crée un module avec sa première composante, lui ajoute un TD, le renomme, puis
 * le supprime. Chaque étape est vérifiée à l'écran, comme l'utilisateur la voit.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter, supprimerModule } = require("./outils.cjs");

test.setTimeout(90_000);

test("maquette : créer un module, ajouter une composante, le renommer, le supprimer", async ({ page }) => {
  const { admin, motDePasse } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  // Un essai précédent arrêté en route a pu laisser le module : on repart sans lui
  await supprimerModule(page, { code: "PRC-RES", semestre: "S7" });
  await page.goto("/gestion/cours");

  // Créer : code, intitulé, filière, niveau, semestre, et la première composante (CM, 21 h)
  await page.getByRole("button", { name: "Ajouter un module" }).click();
  const module = page.getByRole("dialog", { name: "Ajouter un module" });
  await module.getByRole("textbox", { name: "Code" }).fill("PRC-RES");
  await module.getByRole("textbox", { name: "Intitulé" }).fill("Réseaux avancés");
  await module.getByRole("combobox", { name: "Filière" }).click();
  await page.getByRole("option").first().click();
  await module.getByRole("textbox", { name: "Niveau" }).fill("4ème année");
  await module.getByRole("combobox", { name: "Semestre" }).click();
  await page.getByRole("option", { name: "S7" }).click();
  await module.getByRole("spinbutton", { name: "Volume (heures)" }).fill("21");
  await module.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Module enregistré")).toBeVisible();
  const ligne = page.getByRole("row", { name: /PRC-RES/ });
  await expect(ligne).toContainText("Réseaux avancés");

  // Ajouter un TD de 14 h : il apparaît dans les composantes du module
  await ligne.getByRole("button", { name: "Afficher les composantes de Réseaux avancés" }).click();
  const composantes = page.getByRole("table", { name: "Composantes de Réseaux avancés" });
  await expect(composantes.getByRole("row", { name: /CM/ })).toBeVisible();
  // La ligne se déplie avec une animation : on attend qu'elle soit finie avant de cliquer, sinon, sur
  // une machine lente, le clic part pendant que le bouton glisse et le dialogue ne s'ouvre pas (CI)
  await expect(page.locator(".MuiCollapse-root.MuiCollapse-entered").getByRole("button", { name: "Ajouter une composante" })).toBeVisible();
  const composante = page.getByRole("dialog", { name: /Ajouter une composante/ });
  await expect(async () => {
    await page.getByRole("button", { name: "Ajouter une composante" }).click({ timeout: 3_000 });
    await expect(composante.getByRole("combobox", { name: "Type" })).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  await composante.getByRole("combobox", { name: "Type" }).click();
  await page.getByRole("option", { name: "TD", exact: true }).click();
  await composante.getByRole("spinbutton", { name: "Volume (heures)" }).fill("14");
  await composante.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Composante enregistrée")).toBeVisible();
  await expect(composantes.getByRole("row", { name: /TD/ })).toBeVisible();

  // Renommer
  await page.getByRole("button", { name: "Modifier Réseaux avancés", exact: true }).click();
  const edition = page.getByRole("dialog", { name: "Modifier le module" });
  await edition.getByRole("textbox", { name: "Intitulé" }).fill("Réseaux et sécurité");
  await edition.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Module enregistré")).toBeVisible();
  await expect(page.getByRole("row", { name: /PRC-RES/ }).first()).toContainText("Réseaux et sécurité");

  // Supprimer, après confirmation
  await page.getByRole("button", { name: "Supprimer Réseaux et sécurité", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Supprimé").first()).toBeVisible();
  await expect(page.getByRole("row", { name: /PRC-RES/ })).toHaveCount(0);
});
