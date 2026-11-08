/**
 * Parcours « génération puis publication » (lot B-8), avec le vrai solveur Timefold : l'administration
 * lance la génération du S2 de la filière GEN depuis l'écran, lit le rapport, et la nouvelle version
 * du planning devient active. Le test vérifie ensuite, sur les séances publiées, chaque règle posée
 * par les données (donneesGeneration.mjs).
 *
 * Règles attendues : le TP du vacataire le mardi matin (ses seuls créneaux déclarés), en labo ; le CM
 * de la promotion hors du lundi après-midi (pris par une séance posée à la main) et jamais en même
 * temps que le TP de son propre TD, dans une salle d'au moins 40 places.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

// Calcul de 30 secondes (la durée choisie par le serveur pour un petit problème), puis déploiement sur douze semaines
test.setTimeout(240_000);

/** Valeur d'un chiffre du rapport, d'après son libellé */
const chiffre = (page, libelle) => page.getByText(libelle, { exact: true }).locator("xpath=preceding-sibling::*[1]");

/** Séances d'un groupe sur la période (la liste est paginée par 100) */
const seancesDu = async (page, idGroupe, periode) => {
  const reponse = await page.request.get(`/api/affectations/groupe/${idGroupe}?date_from=${periode.debut}&date_to=${periode.fin}&limit=100`);
  expect(reponse.ok()).toBeTruthy();
  const corps = await reponse.json();
  return (corps.data ?? corps).filter((s) => ["planifie", "confirme", "realise"].includes(s.statut));
};

test("génération puis publication : le solveur respecte toutes les règles", async ({ page }) => {
  const { admin, motDePasse, generation: g } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });

  // Lancement depuis l'écran : la période, rien d'autre à régler (R-4)
  await page.goto("/gestion/generation-automatique");
  await page.getByRole("combobox", { name: "Période" }).click();
  await page.getByRole("option", { name: g.periode.libelle }).click();
  await page.getByRole("button", { name: "Lancer la génération" }).click();
  // L'écran d'attente dit l'étape en cours ; le rapport affiché avant la fin est celui de la
  // génération précédente : attendre la fin du calcul
  await expect(page.getByRole("status").filter({ hasText: /^(Préparation|Calcul|Placement)/ })).toBeVisible();
  const arreter = page.getByRole("button", { name: "Arrêter et garder" });
  await expect(arreter).toBeVisible();
  await expect(arreter).toBeHidden({ timeout: 180_000 });

  // Rapport : des séances créées, aucun conflit, le module sans enseignant écarté, avec le lien qui le corrige
  await expect(chiffre(page, "séances créées")).toHaveText(/^[1-9]\d*$/, { timeout: 180_000 });
  await expect(chiffre(page, "conflits")).toHaveText("0");
  const sansEnseignant = page.getByRole("region", { name: "À corriger avant de relancer" }).getByRole("listitem").filter({ hasText: "Module sans enseignant" });
  await expect(sansEnseignant.getByRole("link", { name: "Corriger" })).toHaveAttribute("href", /^\/gestion\/enseignements\?enseignement=\d+$/);

  // Exploration : une classe à la fois, au format de l'école puis en tableau, et le PDF
  await page.getByRole("button", { name: "Explorer les emplois du temps" }).click();
  const explorer = page.getByRole("region", { name: "Emplois du temps générés" });
  await expect(explorer.getByText(/^Classe 1 sur \d+$/)).toBeVisible();
  await expect(explorer.locator(".edt-document")).toBeVisible();
  await explorer.getByRole("button", { name: "Tableau" }).click();
  await expect(explorer.getByRole("row")).not.toHaveCount(0);
  await explorer.getByRole("button", { name: "Suivante" }).click();
  await expect(explorer.getByText(/^Classe 2 sur \d+$/)).toBeVisible();
  // Le PDF passe par la fenêtre d'impression : on compte les documents qu'elle recevrait
  await page.evaluate(() => {
    window.print = () => {
      window.documentsImprimes = document.querySelectorAll(".edt-impression-seule .edt-document").length;
    };
  });
  await explorer.getByRole("button", { name: /du mois$/ }).click();
  await expect.poll(() => page.evaluate(() => window.documentsImprimes)).toBeGreaterThan(0);

  // Publication : la version générée est la version active du planning
  await page.getByRole("tab", { name: "Versions" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Active" })).toHaveCount(1);

  // Les séances publiées, vérifiées une à une
  const promo = await seancesDu(page, g.groupes.promo, g.periode);
  const td = await seancesDu(page, g.groupes.td, g.periode);
  const cm = promo.filter((s) => s.cours?.code_cours === "GEN-ML");
  const tp = td.filter((s) => s.cours?.code_cours === "GEN-ML");
  expect(cm.length, "séances de CM").toBeGreaterThan(0);
  expect(tp.length, "séances de TP").toBeGreaterThan(0);

  for (const s of tp) {
    expect(g.creneaux.mardi, `TP du ${s.date_seance} sur un créneau déclaré par le vacataire`).toContain(s.id_creneau);
    expect(s.id_salle, `TP du ${s.date_seance} en labo`).toBe(g.salles.labo);
    expect(s.id_user_enseignant).toBe(g.enseignants.vacataire);
  }
  for (const s of cm) {
    expect(s.id_creneau, `CM du ${s.date_seance} hors du lundi après-midi déjà pris`).not.toBe(g.creneaux.lundiApresMidi);
    // La promotion compte 40 étudiants : toute salle d'au moins 40 places convient (pas le labo de 25)
    expect(s.salle?.capacite, `CM du ${s.date_seance} dans une salle assez grande`).toBeGreaterThanOrEqual(40);
    expect(s.id_user_enseignant).toBe(g.enseignants.permanent);
  }
  // Le jour férié est sauté ; la séance posée à la main reste
  expect([...cm, ...tp].map((s) => s.date_seance)).not.toContain(g.ferie);
  expect(promo.filter((s) => s.cours?.code_cours === "GEN-AUT").map((s) => s.date_seance).sort()).toEqual(["2027-03-01", "2027-03-08"]);

  // Jamais deux séances en même temps pour la promotion (son TD compris)
  const occupations = [...promo, ...td].map((s) => `${s.date_seance}|${s.id_creneau}`);
  expect(new Set(occupations).size, "aucun chevauchement").toBe(occupations.length);
});
