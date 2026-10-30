import { noterRequete } from "../services/supervision/compteurs.js";

/**
 * Durée et code de chaque requête, pour les mesures de la supervision (lot ME-21) : notés à la fin
 * de la réponse, sans chemin ni compte (services/supervision/compteurs.js).
 */
export const mesurerRequetes = (req, res, next) => {
    const debut = process.hrtime.bigint();
    res.on("finish", () => noterRequete(Number(process.hrtime.bigint() - debut) / 1e6, res.statusCode));
    next();
};
