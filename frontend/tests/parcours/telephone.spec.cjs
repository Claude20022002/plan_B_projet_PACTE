/**
 * Parcours « changement de téléphone » (lots R-10 et R-9) : l'étudiante déclare depuis l'application
 * le téléphone qu'elle tient en main ; l'administration voit la demande dans « À traiter », l'ouvre
 * et l'accepte ; le nouveau téléphone est lié au compte, et lui seul. L'application est simulée par
 * ses requêtes (en-têtes X-Client et X-Appareil), comme pour le scan de l'appel.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

const API = `http://127.0.0.1:${process.env.PARCOURS_PORT_API || "5001"}/api`;
test.setTimeout(90_000);

/** Requêtes de l'application mobile, installée sur le téléphone `appareil`. */
const application = async (request, { email, motDePasse, appareil }) => {
  const connexion = await request.post(`${API}/auth/login`, { headers: { "X-Client": "mobile" }, data: { email, password: motDePasse } });
  expect(connexion.ok()).toBeTruthy();
  const { access_token: jeton } = await connexion.json();
  const headers = { "X-Client": "mobile", Authorization: `Bearer ${jeton}`, "X-Appareil": appareil };
  return {
    declarer: (motif) => request.post(`${API}/presences/telephone/demande`, { headers, data: { motif } }),
    demande: async () => (await (await request.get(`${API}/presences/telephone/demande`, { headers })).json()).data,
  };
};

test("changement de téléphone : déclaré par l'étudiante, accepté depuis « À traiter »", async ({ page, request }) => {
  const { admin, motDePasse, changementTelephone: c } = lireDonnees();
  const nom = `${c.etudiante.prenom} ${c.etudiante.nom}`;

  // L'étudiante, sur son nouveau téléphone
  const nouveau = await application(request, { email: c.etudiante.email, motDePasse, appareil: c.nouveau });
  expect((await nouveau.declarer("Écran cassé")).status()).toBe(201);
  expect(await nouveau.demande()).toMatchObject({ statut: "en_attente", motif: "Écran cassé" });

  // L'administration : la demande est dans « À traiter », la ligne mène à la page où décider
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  const file = page.getByRole("region", { name: "À traiter" });
  await file.getByRole("button", { name: new RegExp(`${nom} a changé de téléphone`) }).click();
  await expect(page).toHaveURL(/\/gestion\/signalements-presence$/);
  const demandes = page.getByRole("region", { name: /changement de téléphone demandé/ });
  await expect(demandes.getByText(nom)).toBeVisible();
  await expect(demandes.getByText("Écran cassé")).toBeVisible();
  await demandes.getByRole("button", { name: "Accepter" }).click();
  await expect(page.getByText(`Nouveau téléphone de ${nom} lié à son compte`)).toBeVisible();
  await expect(demandes).toBeHidden();

  // Le nouveau téléphone est le sien : le redéclarer n'a plus de sens
  expect(await nouveau.demande()).toMatchObject({ statut: "acceptee" });
  const encore = await nouveau.declarer();
  expect(encore.status()).toBe(409);
  expect((await encore.json()).message).toContain("déjà celui de votre compte");
  // L'ancien téléphone, lui, n'est plus lié : il ne peut que redemander
  const ancien = await application(request, { email: c.etudiante.email, motDePasse, appareil: c.ancien });
  expect((await ancien.declarer()).status()).toBe(201);
});
