import { ConfigurationEtablissement } from "../../models/index.js";
import { solveurJoignable } from "../generation/timefold/solveurClient.js";
import { generationsEnCours } from "../generation/timefold/generation.js";
import { resume } from "./compteurs.js";

/**
 * Santé et mesures du serveur pour la sonde extérieure (lot ME-21 ; conception-me21-supervision.md).
 * Aucune donnée personnelle : des états, des nombres et des durées. La sonde lit l'état public ;
 * les mesures demandent le jeton de supervision (routes/supervisionRoutes.js).
 */

const DELAI_BASE_MS = 3000;
// Erreurs 500 sur 15 minutes au-delà desquelles « erreurs » passe à « elevees » (sonde : alerte)
const seuilErreurs = () => Math.max(1, Number(process.env.SUPERVISION_SEUIL_ERREURS) || 20);

const avecDelai = (promesse, ms) =>
    Promise.race([promesse, new Promise((_, refuser) => setTimeout(() => refuser(new Error("délai dépassé")), ms).unref())]);

// Une lecture minuscule dans la base de l'école : elle répond, et dans le délai
const baseJoignable = async () => {
    try {
        await avecDelai(ConfigurationEtablissement.count(), DELAI_BASE_MS);
        return true;
    } catch {
        return false;
    }
};

/** { etat: ok | degrade, base, solveur, erreurs } ; « base » injoignable rend le service indisponible. */
export const etatDeSante = async () => {
    const [base, solveur] = await Promise.all([baseJoignable(), solveurJoignable()]);
    const composants = {
        base: base ? "ok" : "injoignable",
        solveur: solveur ? "ok" : "injoignable",
        erreurs: resume(15).erreurs5xx >= seuilErreurs() ? "elevees" : "ok",
    };
    return { etat: Object.values(composants).every((v) => v === "ok") ? "ok" : "degrade", ...composants };
};

// Connexions MySQL ouvertes et plafond (D-03 : 151 par défaut, 500 visé au lot ME-5). Lu par la
// connexion du modèle, donc celle de l'école ; passera par requete (models/acces.js) après #137.
const connexionsMysql = async () => {
    try {
        const sequelize = ConfigurationEtablissement.sequelize;
        const [[{ ouvertes }]] = await sequelize.query("SELECT VARIABLE_VALUE AS ouvertes FROM performance_schema.global_status WHERE VARIABLE_NAME = 'Threads_connected'");
        const [[{ plafond }]] = await sequelize.query("SELECT @@max_connections AS plafond");
        return { ouvertes: Number(ouvertes), plafond: Number(plafond) };
    } catch {
        return null;
    }
};

/** Mesures des 15 dernières minutes : trafic, temps de réponse, erreurs, courriels, générations, MySQL. */
export const mesuresDuServeur = async () => {
    const r = resume(15);
    return {
        fenetre_minutes: 15,
        requetes: r.requetes,
        erreurs_5xx: r.erreurs5xx,
        temps_reponse_ms: { p50: r.p50, p95: r.p95 },
        courriels_en_echec: r.courrielsEnEchec,
        generations_en_cours: generationsEnCours(),
        mysql: await connexionsMysql(),
    };
};
