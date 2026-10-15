/**
 * Parcours entre les rôles : ce que fait l'un, l'autre le voit.
 *  - L'administration change la salle de la séance du jour : l'étudiante et l'enseignante en sont
 *    prévenues et voient la nouvelle salle dans leur emploi du temps. La salle d'origine est remise
 *    à la fin, pour les parcours suivants (ils partagent la base).
 *  - L'enseignante ouvre les supports d'une classe depuis « Mes classes » : l'espace de la classe
 *    s'ouvre dans Planner (le dépôt lui-même est vérifié par espaceCours.spec.cjs).
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

// Trois connexions à la suite
test.setTimeout(120_000);

test("séance du jour déplacée dans une autre salle : l'étudiante et l'enseignante sont prévenues", async ({ browser }) => {
  const { admin, enseignante, etudiants, motDePasse, seance } = lireDonnees();

  // L'administration change la salle (par l'API du site, avec sa session : l'écran des séances a son propre parcours)
  const adm = await (await browser.newContext()).newPage();
  await seConnecter(adm, { email: admin.email, motDePasse, role: "admin" });
  const lire = async (chemin) => {
    const reponse = await adm.request.get(`/api${chemin}`);
    expect(reponse.ok(), `GET ${chemin}`).toBeTruthy();
    return reponse.json();
  };
  const avant = await lire(`/affectations/${seance.id}`);
  const affectation = avant.affectation ?? avant.data ?? avant;
  const salles = await lire("/salles?limit=200");
  const nouvelle = (salles.data ?? salles).find((s) => s.id_salle !== affectation.id_salle && s.capacite >= 8);
  expect(nouvelle, "une autre salle d'au moins 8 places").toBeTruthy();

  // Jeton CSRF, comme le site (services/api.js) : cookie puis en-tête X-CSRF-Token
  const jeton = await adm.request.get("/api/auth/csrf-token");
  const csrf = (await adm.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? (await jeton.json()).csrfToken;
  const deplacer = (id_salle) =>
    adm.request.put(`/api/affectations/${seance.id}`, {
      headers: { "X-CSRF-Token": decodeURIComponent(csrf) },
      data: {
        date_seance: affectation.date_seance,
        statut: affectation.statut,
        id_cours: affectation.id_cours,
        id_groupe: affectation.id_groupe,
        id_user_enseignant: affectation.id_user_enseignant,
        id_salle,
        id_creneau: affectation.id_creneau,
        // Le type de la salle peut différer de celui demandé par le cours : l'administration force en justifiant
        forcer: true,
        justification: "Parcours : salle d'origine indisponible",
      },
    });
  const reponse = await deplacer(nouvelle.id_salle);
  expect(reponse.ok(), `déplacement : ${await reponse.text()}`).toBeTruthy();

  try {
    // L'étudiante : notification, puis la salle dans son emploi du temps
    const etu = await (await browser.newContext()).newPage();
    await seConnecter(etu, { email: etudiants[0].email, motDePasse, role: "etudiant" });
    await etu.goto("/notifications");
    await expect(etu.getByText("Séance modifiée").first()).toBeVisible();
    await expect(etu.getByText(nouvelle.nom_salle).first()).toBeVisible();
    await etu.goto("/emploi-du-temps/etudiant");
    await expect(etu.getByText(nouvelle.nom_salle).first()).toBeVisible({ timeout: 15_000 });

    // L'enseignante : même chose
    const prof = await (await browser.newContext()).newPage();
    await seConnecter(prof, { email: enseignante.email, motDePasse, role: "enseignant" });
    await prof.goto("/notifications");
    await expect(prof.getByText("Séance modifiée").first()).toBeVisible();
    await prof.goto("/emploi-du-temps/enseignant");
    await expect(prof.getByText(nouvelle.nom_salle).first()).toBeVisible({ timeout: 15_000 });
  } finally {
    const retour = await deplacer(affectation.id_salle);
    expect(retour.ok(), "salle d'origine remise").toBeTruthy();
  }
});

test("Mes classes : les supports de cours s'ouvrent dans l'espace de la classe", async ({ page }) => {
  const { enseignante, motDePasse, seance } = lireDonnees();

  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  await page.goto("/mes-classes");
  // Plus de message à la classe ni d'annonces pour l'enseignant
  await expect(page.getByRole("button", { name: "Écrire à la classe" })).toHaveCount(0);
  await expect(page.getByRole("navigation").getByText("Annonces", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Supports de cours" }).first().click();
  await expect(page).toHaveURL(/\/mes-classes\/\d+\/\d+$/);
  await expect(page.getByRole("heading", { name: seance.cours, exact: true })).toBeVisible({ timeout: 15_000 });
});

test("Paramètres : le thème StudyLib retire les fonds noirs du panneau et la marine du menu", async ({ page }) => {
  const { enseignante, motDePasse } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });
  // Plus de « Mes séances » dans le menu : le tableau et l'emploi du temps les montrent déjà
  await expect(page.getByRole("navigation").getByText("Mes séances", { exact: true })).toHaveCount(0);

  const variable = (nom) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), nom);
  await page.goto("/parametres");
  await page.getByRole("button", { name: "StudyLib", exact: true }).click();
  await page.getByRole("button", { name: "Clair", exact: true }).click();
  expect(await variable("--board-ground")).toBe("#FFFFFF");
  expect(await variable("--nav-fond")).toBe("#FFFFFF");

  // Retour au thème Planner : les variables disparaissent, les couleurs du panneau reviennent
  await page.getByRole("button", { name: "Planner", exact: true }).click();
  expect(await variable("--board-ground")).toBe("");
});
