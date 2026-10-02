import request from "supertest";
import app from "../../../app.js";
import sequelize from "../../../config/db.js";
import {
    Users,
    Enseignant,
    Etudiant,
    Filiere,
    Groupe,
    Salle,
    Creneau,
    Cours,
    Affectation,
    Appartenir,
} from "../../../models/index.js";
import { hashPassword } from "../../../utils/passwordHelper.js";
import { resetRateLimiters } from "../../../middleware/rateLimiterMiddleware.js";
import { getDefaultInstitution } from "../../../utils/tenantHelper.js";

export const PASSWORD = "Hestim@2026";

/**
 * Recrée toutes les tables. Refuse de s'exécuter hors d'une base de test,
 * pour qu'une mauvaise configuration ne puisse jamais vider une vraie base.
 */
export const resetDatabase = async () => {
    const dbName = sequelize.getDatabaseName();
    if (!dbName?.endsWith("_test")) {
        throw new Error(`Refus de réinitialiser "${dbName}" : seule une base *_test est autorisée`);
    }
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    resetRateLimiters();
};

export const closeDatabase = () => sequelize.close();

let userCounter = 0;

/**
 * Crée un compte (et son profil enseignant/étudiant) avec le mot de passe de test.
 */
export const createUser = async (role, overrides = {}) => {
    userCounter += 1;
    const user = await Users.create({
        nom: `Nom${userCounter}`,
        prenom: `Prenom${userCounter}`,
        email: `${role}${userCounter}@hestim.test`,
        role,
        actif: true,
        password_hash: await hashPassword(PASSWORD),
        ...overrides,
    });

    if (role === "enseignant") {
        await Enseignant.create({ id_user: user.id_user, specialite: "Informatique", departement: "Informatique" });
    }
    if (role === "etudiant") {
        await Etudiant.create({ id_user: user.id_user, numero_etudiant: `E${1000 + userCounter}`, niveau: "3A" });
    }
    return user;
};

const extractCookie = (response, name) => {
    const cookies = response.headers["set-cookie"] || [];
    const raw = cookies.find((cookie) => cookie.startsWith(`${name}=`));
    return raw ? decodeURIComponent(raw.split(";")[0].slice(name.length + 1)) : null;
};

/**
 * Client authentifié : agent supertest (cookies conservés) + jeton CSRF de la session.
 * Utiliser client.send(method, url, body) pour les requêtes modifiantes.
 */
export const loginAs = async (user, password = PASSWORD) => {
    const agent = request.agent(app);
    const response = await agent.post("/api/auth/login").send({ email: user.email, password });
    if (response.status !== 200) {
        throw new Error(`Connexion impossible pour ${user.email} : ${response.status} ${JSON.stringify(response.body)}`);
    }
    const csrf = extractCookie(response, "csrf_token");
    const accessToken = extractCookie(response, "access_token");

    return {
        user,
        agent,
        csrf,
        // Permet de rejouer le jeton d'accès hors de l'agent (tests de révocation)
        accessCookie: `access_token=${accessToken}`,
        get: (url) => agent.get(url),
        send: (method, url, body = {}) =>
            agent[method](url).set("X-CSRF-Token", csrf).send(body),
    };
};

/** Client anonyme */
export const anonymous = () => request(app);

/**
 * Jeu de données minimal de planification : une filière, deux groupes,
 * une salle, un créneau, un cours et une séance pour l'enseignant fourni.
 */
export const createPlanningFixture = async ({ admin, enseignant, etudiant } = {}) => {
    // Multi-tenant (retiré en phase 2) : les contrôleurs filtrent sur l'institution de la session
    const { id_institution } = await getDefaultInstitution();
    const scoped = (Model, data) => Model.create({ ...data, id_institution });

    const filiere = await scoped(Filiere, { code_filiere: `IIA${userCounter}`, nom_filiere: "Informatique & IA" });
    const groupe = await scoped(Groupe, {
        nom_groupe: `IIA-3A-${userCounter}`,
        niveau: "3A",
        effectif: 25,
        annee_scolaire: "2026-2027",
        id_filiere: filiere.id_filiere,
    });
    const autreGroupe = await scoped(Groupe, {
        nom_groupe: `IIA-3B-${userCounter}`,
        niveau: "3A",
        effectif: 25,
        annee_scolaire: "2026-2027",
        id_filiere: filiere.id_filiere,
    });
    const salle = await scoped(Salle, {
        nom_salle: `G-10${userCounter}`,
        type_salle: "Salle de cours",
        capacite: 40,
        batiment: "Gandhi",
    });
    const creneau = await scoped(Creneau, {
        jour_semaine: "lundi",
        heure_debut: "09:00:00",
        heure_fin: "10:45:00",
        duree_minutes: 105,
    });
    const cours = await scoped(Cours, {
        code_cours: `INF${userCounter}`,
        nom_cours: "Algorithmique",
        niveau: "3A",
        volume_horaire: 30,
        type_cours: "CM",
        semestre: "S1",
        id_filiere: filiere.id_filiere,
    });

    let affectation = null;
    if (enseignant) {
        affectation = await scoped(Affectation, {
            date_seance: "2027-01-04", // un lundi
            statut: "planifie",
            id_cours: cours.id_cours,
            id_groupe: groupe.id_groupe,
            id_user_enseignant: enseignant.id_user,
            id_salle: salle.id_salle,
            id_creneau: creneau.id_creneau,
            id_user_admin: admin.id_user,
        });
    }
    if (etudiant) {
        await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: groupe.id_groupe });
    }

    return { filiere, groupe, autreGroupe, salle, creneau, cours, affectation };
};

/** Vérifie récursivement qu'aucune clé password_hash n'apparaît dans une réponse */
export const containsPasswordHash = (payload) => JSON.stringify(payload ?? null).includes("password_hash");
