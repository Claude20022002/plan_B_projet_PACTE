/**
 * Parcours « génération puis publication » (lot B-8), avec le vrai solveur Timefold : l'administration
 * lance la génération du S2 de la filière GEN depuis l'écran, lit le rapport, et la nouvelle version
 * du planning devient active. Le test vérifie ensuite, sur les séances publiées, chaque règle posée
 * par les données (donneesGeneration.mjs).
 *
 * La semaine type n'a qu'une solution sans règle dure enfreinte : le TP du vacataire le mardi matin
 * (ses seuls créneaux déclarés), en labo ; le CM de la promotion le lundi matin (le lundi après-midi
 * est pris par une séance posée à la main, et le mardi matin par le TP de son propre TD), dans une
 * salle d'au moins 40 places.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

// Calcul de 30 secondes (le plus court proposé), puis déploiement sur douze semaines
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

  // Lancement depuis l'écran : la période, le calcul le plus court
  await page.goto("/gestion/generation-automatique");
  await page.getByRole("combobox", { name: "Période" }).click();
  await page.getByRole("option", { name: g.periode.libelle }).click();
  await page.getByRole("combobox", { name: "Durée de calcul" }).click();
  await page.getByRole("option", { name: "30 s" }).click();
  await page.getByRole("button", { name: "Lancer la génération" }).click();

  // Rapport : des séances créées, aucune règle dure enfreinte, le module sans enseignant écarté
  await expect(chiffre(page, "séances créées")).toHaveText(/^[1-9]\d*$/, { timeout: 180_000 });
  await expect(chiffre(page, "règles dures enfreintes")).toHaveText("0");
  await expect(page.getByText("Module sans enseignant").first()).toBeVisible();

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
    expect(s.creneau?.jour_semaine, `CM du ${s.date_seance} le lundi`).toBe("lundi");
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
