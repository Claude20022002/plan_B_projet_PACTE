import { Sequelize } from "sequelize";
import request from "supertest";
import app from "../../app.js";
import sequelize from "../../config/db.js";
import { resetDatabase, closeDatabase, createUser, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import fs from "node:fs";
import { AnneeUniversitaire, AppareilEtudiant, ConfigurationEtablissement, DemandeTelephone, Filiere, Groupe } from "../../models/index.js";
import { dansEtablissement, etablissementParDefaut, HorsContexteError } from "../../contexte/etablissement.js";
import { creerEtablissement } from "./helpers/fabriqueEtablissement.js";
import { migrateurPour } from "../../migrations/migrator.js";
import { enregistrerEtablissement, oublierEtablissements } from "../../middleware/etablissementMiddleware.js";

/**
 * Essai réduit de ME-3a (revue d'expert R-2, D-03) : deux écoles, deux bases, le même code.
 * L'école A est celle de config/db.js (hestim_test), l'école B a sa base (hestim_test_b). Chaque
 * requête choisit son école par le nom d'hôte ; les modèles importés par les contrôleurs et les
 * services sont des résolveurs. Trois routes réelles, sans rien y changer : une lecture avec
 * inclusions, une création qui passe par un crochet de modèle, une décision qui ouvre une transaction.
 */

const HOTE_A = "a.planner.test";
const HOTE_B = "b.planner.test";
const BASE_B = "hestim_test_b";

let ecoleA;
let ecoleB;
let connexionB;
// Un seul serveur pour tout le fichier : supertest en ouvrirait un par requête, et 20 requêtes
// simultanées ont alors perdu une connexion sur la CI (ECONNRESET)
let serveur;
const dansA = (fn) => dansEtablissement(ecoleA, fn);
const dansB = (fn) => dansEtablissement(ecoleB, fn);

const cookie = (reponse, nom) => {
    const brut = (reponse.headers["set-cookie"] || []).find((c) => c.startsWith(`${nom}=`));
    return brut ? decodeURIComponent(brut.split(";")[0].slice(nom.length + 1)) : null;
};

/** Client connecté à l'école de l'hôte donné (cookies de session et jeton CSRF). */
const connecter = async (hote, user) => {
    const agent = request.agent(serveur);
    const reponse = await agent.post("/api/auth/login").set("Host", hote).send({ email: user.email, password: PASSWORD });
    if (reponse.status !== 200) throw new Error(`Connexion impossible sur ${hote} : ${reponse.status} ${JSON.stringify(reponse.body)}`);
    const csrf = cookie(reponse, "csrf_token");
    return {
        jeton: `access_token=${cookie(reponse, "access_token")}`,
        get: (url) => agent.get(url).set("Host", hote),
        send: (methode, url, corps = {}) => agent[methode](url).set("Host", hote).set("X-CSRF-Token", csrf).send(corps),
        envoyer: (url, octets, type) => agent.put(url).set("Host", hote).set("X-CSRF-Token", csrf).set("Content-Type", type).send(octets),
    };
};

let adminA;
let adminB;
let anneeA;
let anneeB;
let filiereA;
let filiereB;

beforeAll(async () => {
    serveur = app.listen(0);
    await resetDatabase();
    await sequelize.query(`DROP DATABASE IF EXISTS \`${BASE_B}\``);
    await sequelize.query(`CREATE DATABASE \`${BASE_B}\``);
    const { username, password } = sequelize.config;
    connexionB = new Sequelize(BASE_B, username, password, { ...sequelize.options, logging: false });
    await migrateurPour(connexionB).up();

    ecoleA = etablissementParDefaut();
    ecoleB = creerEtablissement("b", connexionB);
    enregistrerEtablissement(HOTE_A, ecoleA);
    enregistrerEtablissement(HOTE_B, ecoleB);

    // Mêmes adresses dans les deux écoles, numéros d'année différents : un mélange se verrait
    adminA = await dansA(() => createUser("admin", { nom: "Alpha" }));
    adminB = await dansB(() => createUser("admin", { nom: "Beta", email: adminA.email }));
    await dansA(() => AnneeUniversitaire.create({ libelle: "2030-2031", date_debut: "2030-09-01", date_fin: "2031-08-31" }));
    anneeA = await dansA(() => AnneeUniversitaire.create({ libelle: "2031-2032", date_debut: "2031-09-01", date_fin: "2032-08-31" }));
    anneeB = await dansB(() => AnneeUniversitaire.create({ libelle: "2031-2032", date_debut: "2031-09-01", date_fin: "2032-08-31" }));
    filiereA = await dansA(() => Filiere.create({ code_filiere: "ALPHA", nom_filiere: "Filière de A" }));
    filiereB = await dansB(() => Filiere.create({ code_filiere: "BETA", nom_filiere: "Filière de B" }));
    expect(anneeA.id_annee).not.toBe(anneeB.id_annee);
});

afterAll(async () => {
    oublierEtablissements();
    await new Promise((fin) => serveur.close(fin));
    await connexionB?.close();
    await closeDatabase();
});

beforeEach(resetRateLimiters);

describe("Deux écoles, deux bases, le même code", () => {
    test("les modèles de B sont ceux de A, redéfinis sur la base de B", async () => {
        expect(ecoleB.modeles.Groupe).not.toBe(ecoleA.modeles.Groupe);
        expect(ecoleB.modeles.Groupe.sequelize).toBe(connexionB);
        expect(Object.keys(ecoleB.modeles.Groupe.associations).sort()).toEqual(Object.keys(ecoleA.modeles.Groupe.associations).sort());
        expect(await dansB(() => Groupe.findAll())).toEqual([]);
        // instanceof et new passent par le résolveur
        const groupe = await dansB(() => Groupe.build({ nom_groupe: "x" }));
        expect(groupe).toBeInstanceOf(ecoleB.modeles.Groupe);
        expect(dansB(() => groupe instanceof Groupe)).toBe(true);
        expect(dansA(() => groupe instanceof Groupe)).toBe(false);
    });

    test("route 1, lecture avec inclusions : chaque école ne voit que ses groupes", async () => {
        await dansA(() => Groupe.create({ nom_groupe: "A-1A", niveau: "1A", annee_scolaire: "2031-2032", id_filiere: filiereA.id_filiere }));
        await dansB(() => Groupe.create({ nom_groupe: "B-1A", niveau: "1A", annee_scolaire: "2031-2032", id_filiere: filiereB.id_filiere }));
        const a = await connecter(HOTE_A, adminA);
        const b = await connecter(HOTE_B, adminB);
        const listeA = (await a.get("/api/groupes")).body.data;
        const listeB = (await b.get("/api/groupes")).body.data;
        expect(listeA.map((g) => [g.nom_groupe, g.filiere.code_filiere])).toEqual([["A-1A", "ALPHA"]]);
        expect(listeB.map((g) => [g.nom_groupe, g.filiere.code_filiere])).toEqual([["B-1A", "BETA"]]);
        // Le compte connecté est celui de l'école : même adresse, deux personnes
        expect((await b.get("/api/auth/me")).body.user).toMatchObject({ nom: "Beta" });
    });

    test("route 2, création avec crochet de modèle : le groupe et son année viennent de la base de B", async () => {
        const b = await connecter(HOTE_B, adminB);
        const reponse = await b.send("post", "/api/groupes", { nom_groupe: "B-2A", niveau: "2A", annee_scolaire: "2031-2032", id_filiere: filiereB.id_filiere });
        expect(reponse.status).toBe(201);
        const cree = await dansB(() => Groupe.findOne({ where: { nom_groupe: "B-2A" } }));
        expect(cree.id_annee).toBe(anneeB.id_annee);
        expect(await dansA(() => Groupe.count({ where: { nom_groupe: "B-2A" } }))).toBe(0);
    });

    test("route 3, transaction : accepter un téléphone écrit dans la base de B seulement", async () => {
        const etudiant = await dansB(() => createUser("etudiant"));
        const demande = await dansB(() => DemandeTelephone.create({ id_user: etudiant.id_user, appareil: "empreinte-essai-b" }));
        const b = await connecter(HOTE_B, adminB);
        const reponse = await b.send("post", `/api/presences/demandes-telephone/${demande.id_demande}/accepter`);
        expect(reponse.status).toBe(200);
        expect((await dansB(() => AppareilEtudiant.findByPk(etudiant.id_user)))?.appareil).toBe("empreinte-essai-b");
        expect(await dansA(() => AppareilEtudiant.count({ where: { appareil: "empreinte-essai-b" } }))).toBe(0);
    });

    test("des requêtes des deux écoles mêlées ne se mélangent pas", async () => {
        const a = await connecter(HOTE_A, adminA);
        const b = await connecter(HOTE_B, adminB);
        const reponses = await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? b : a).get("/api/groupes")));
        reponses.forEach((r, i) => expect(r.body.data.every((g) => g.nom_groupe.startsWith(i % 2 ? "B-" : "A-"))).toBe(true));
    });

    test("un jeton de B rejoué sur A est refusé", async () => {
        const b = await connecter(HOTE_B, adminB);
        const reponse = await request(serveur).get("/api/groupes").set("Host", HOTE_A).set("Cookie", b.jeton);
        expect(reponse.status).toBe(401);
    });

    // Constat, pas un souhait : pourquoi les 23 fichiers figés par la règle de lint (sequelize.transaction
    // de config/db.js) doivent passer par enTransaction avant toute deuxième école
    test("une transaction ouverte sur la connexion de A emporte dans A l'écriture d'un modèle de B", async () => {
        await dansB(() => sequelize.transaction((transaction) => Filiere.create({ code_filiere: "PIEGE", nom_filiere: "Écrite par B" }, { transaction })));
        expect(await dansA(() => Filiere.count({ where: { code_filiere: "PIEGE" } }))).toBe(1);
        expect(await dansB(() => Filiere.count({ where: { code_filiere: "PIEGE" } }))).toBe(0);
    });

    // Audit d'isolation (fichier 18, I-3) : test.failing décrit le comportement voulu ; Jest le signale
    // dès qu'il passe, pour qu'on le change en test ordinaire avec la correction
    test.failing("chaque école lit sa propre identité (nom, couleurs, expéditeur)", async () => {
        await dansB(() => ConfigurationEtablissement.update({ nom: "École Beta", nom_court: "Beta" }, { where: { id: 1 } }));
        const nomA = (await request(serveur).get("/api/etablissement").set("Host", HOTE_A)).body.nom;
        const nomB = (await request(serveur).get("/api/etablissement").set("Host", HOTE_B)).body.nom;
        expect(nomA).not.toBe("École Beta");
        expect(nomB).toBe("École Beta");
    });
});

describe("Échec fermé (mode strict)", () => {
    beforeAll(() => {
        process.env.CONTEXTE_STRICT = "true";
    });
    afterAll(() => {
        delete process.env.CONTEXTE_STRICT;
    });

    test("hors de tout établissement, un modèle refuse de servir", async () => {
        expect(() => Groupe.findAll()).toThrow(HorsContexteError);
        expect(() => new Groupe()).toThrow(HorsContexteError);
    });

    // Les lecteurs de corps (express.json, express.raw) appellent la suite depuis un événement du flux
    // de la requête : si le contexte s'y perdait, le mode strict le ferait échouer ici
    test("le contexte survit à la lecture d'un gros corps JSON et d'un fichier envoyé", async () => {
        const b = await connecter(HOTE_B, adminB);
        const gros = { nom_groupe: "B-3A", niveau: "3A", annee_scolaire: "2031-2032", id_filiere: filiereB.id_filiere, remplissage: "x".repeat(300_000) };
        expect((await b.send("post", "/api/groupes", gros)).status).toBe(201);
        expect(await dansB(() => Groupe.count({ where: { nom_groupe: "B-3A" } }))).toBe(1);

        const logo = fs.readFileSync(new URL("../../assets/ecole/logo-hestim.png", import.meta.url));
        const avantA = (await dansA(() => ConfigurationEtablissement.findByPk(1))).logo_maj_le;
        expect((await b.envoyer("/api/etablissement/logo", logo, "image/png")).status).toBe(200);
        expect((await dansA(() => ConfigurationEtablissement.findByPk(1))).logo_maj_le).toEqual(avantA);
        expect((await dansB(() => ConfigurationEtablissement.findByPk(1))).logo_maj_le).not.toEqual(avantA);
    });

    test("un hôte inconnu n'atteint aucune base", async () => {
        const reponse = await request(serveur).get("/api/groupes").set("Host", "inconnue.planner.test");
        expect(reponse.status).toBe(404);
    });
});
