/**
 * Parcours « IIIA, deux promotions » (lot B-8), avec le vrai solveur : la 3A (modules de l'an
 * dernier) et la 4A (modules de cette année) de la filière IIIA, générées ensemble (donneesIiia.mjs).
 * Le solveur doit tout placer sans enfreindre une règle dure : aucune classe ni aucun enseignant à
 * deux endroits à la fois (une enseignante est partagée entre les deux promotions), les labos pour
 * les modules en salle info, des salles assez grandes, pas de salle en distanciel.
 * Puis chaque profil d'étudiant ne voit que les modules de sa promotion.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter, publierMois } = require("./outils.cjs");

test.setTimeout(300_000);

const chiffre = (page, libelle) => page.getByText(libelle, { exact: true }).locator("xpath=preceding-sibling::*[1]");

/** Séances actives d'un groupe sur une plage de dates */
const seancesDu = async (page, idGroupe, debut, fin) => {
  const reponse = await page.request.get(`/api/affectations/groupe/${idGroupe}?date_from=${debut}&date_to=${fin}&limit=100`);
  expect(reponse.ok()).toBeTruthy();
  const corps = await reponse.json();
  return (corps.data ?? corps).filter((s) => ["planifie", "confirme", "realise"].includes(s.statut));
};

/** Aucune ressource (classe, enseignant) sur deux séances au même créneau du même jour */
const sansDoublon = (seances, cle, nom) => {
  const vues = seances.map((s) => `${cle(s)}|${s.date_seance}|${s.id_creneau}`);
  expect(new Set(vues).size, nom).toBe(vues.length);
};

test("IIIA : 3A et 4A placées ensemble sans conflit, chaque étudiant voit sa promotion", async ({ page, browser }, testInfo) => {
  const { admin, motDePasse, iiia } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });

  await page.goto("/gestion/generation-automatique");
  await page.getByRole("combobox", { name: "Période" }).click();
  await page.getByRole("option", { name: iiia.periode.libelle }).click();
  await page.getByRole("button", { name: "Lancer la génération" }).click();
  // Le rapport affiché avant la fin est celui de la génération précédente : attendre la fin du calcul
  const arreter = page.getByRole("button", { name: "Arrêter et garder" });
  await expect(arreter).toBeVisible();
  await expect(arreter).toBeHidden({ timeout: 240_000 });
  await expect(chiffre(page, "séances créées")).toHaveText(/^[1-9]\d*$/, { timeout: 240_000 });
  await expect(chiffre(page, "conflits")).toHaveText("0");
  await testInfo.attach("rapport de génération", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

  // Première semaine de cours (du lundi au samedi) : la semaine type complète
  const semaine = [iiia.periode.debut, new Date(Date.parse(`${iiia.periode.debut}T00:00:00Z`) + 5 * 86400000).toISOString().slice(0, 10)];
  const groupes3a = [iiia.groupes.promo3, iiia.groupes.g1, iiia.groupes.g2];
  const brut3a = (await Promise.all(groupes3a.map((g) => seancesDu(page, g, ...semaine)))).flat();
  // Une séance de promotion revient dans la liste de chaque groupe : une seule fois chacune
  const seances3a = [...new Map(brut3a.map((s) => [s.id_affectation, s])).values()];
  const seances4a = await seancesDu(page, iiia.groupes.promo4, ...semaine);

  const modules = (liste) => [...new Set(liste.map((s) => s.cours?.code_cours))].sort();
  expect(modules(seances3a), "tous les modules de la 3A placés").toEqual([...iiia.modules.troisieme].sort());
  expect(modules(seances4a), "tous les modules de la 4A placés").toEqual([...iiia.modules.quatrieme].sort());

  // Une classe n'est jamais à deux endroits : la promotion et chacun de ses groupes de TD
  for (const td of [iiia.groupes.g1, iiia.groupes.g2]) {
    sansDoublon(seances3a.filter((s) => s.id_groupe === iiia.groupes.promo3 || s.id_groupe === td), () => "3A", `3A et son TD ${td} sans chevauchement`);
  }
  sansDoublon(seances4a, () => "4A", "4A sans chevauchement");
  // Les enseignants non plus, y compris l'enseignante partagée entre les deux promotions
  const toutes = [...seances3a, ...seances4a];
  sansDoublon(toutes, (s) => s.id_user_enseignant, "aucun enseignant à deux endroits");
  const partagee = toutes.filter((s) => s.id_user_enseignant === iiia.enseignantePartagee.id);
  expect(new Set(partagee.map((s) => s.id_groupe)).size, "l'enseignante partagée a cours avec les deux promotions").toBeGreaterThanOrEqual(2);

  // Salles : labo pour la salle info, assez de places, aucune en distanciel
  for (const s of toutes) {
    const code = s.cours?.code_cours;
    if (["3A-RESB", "4A-IBM"].includes(code)) {
      expect(s.id_salle, `${code} en distanciel, sans salle`).toBeNull();
      continue;
    }
    expect(s.salle, `${code} du ${s.date_seance} a une salle`).toBeTruthy();
    if (["3A-AN", "3A-GRA"].includes(code)) expect(s.salle.type_salle, `${code} en labo`).toBe("Labo informatique");
    const effectif = s.id_groupe === iiia.groupes.promo3 ? 40 : s.id_groupe === iiia.groupes.promo4 ? 30 : 20;
    expect(s.salle.capacite, `${code} du ${s.date_seance} : salle assez grande`).toBeGreaterThanOrEqual(effectif);
  }

  // Les étudiants ne voient rien avant la publication du mois par l'administration
  await publierMois(page, { mois: semaine[0].slice(0, 7), idFiliere: iiia.filiere });

  // Chaque profil d'étudiant ne voit que sa promotion (emploi du temps du mois)
  const profils = [
    ["3A", iiia.etudiants.troisieme, "Analyse numérique", "Théorie des langages et compilation"],
    ["4A", iiia.etudiants.quatrieme, "Théorie des langages et compilation", "Analyse numérique"],
  ];
  for (const [nom, compte, attendu, absent] of profils) {
    const vue = await (await browser.newContext({ locale: "fr-FR" })).newPage();
    await seConnecter(vue, { email: compte.email, motDePasse, role: "etudiant" });
    // Le mois publié, pas le mois courant : le semestre d'essai commence le premier lundi après demain,
    // qui tombe dans le mois suivant dès la fin du mois (le parcours échouait le 26 octobre 2026)
    await vue.goto(`/emploi-du-temps/mensuel?mois=${semaine[0].slice(0, 7)}`);
    await expect(vue.getByText(attendu).first(), `${nom} voit ${attendu}`).toBeVisible({ timeout: 20_000 });
    await expect(vue.getByText(absent), `${nom} ne voit pas ${absent}`).toHaveCount(0);
    await testInfo.attach(`emploi du temps ${nom}`, { body: await vue.screenshot({ fullPage: true }), contentType: "image/png" });
  }
});
