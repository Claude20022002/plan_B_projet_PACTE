import { contexteCourant } from "../contexte/etablissement.js";

/**
 * Seules portes vers la connexion pour le code hors de models/ (revue d'expert, fichier 16, R-2) :
 * une transaction, une requête SQL écrite à la main. Elles prennent la connexion de l'établissement
 * courant (D-03, contexte/etablissement.js) ; le code qui les appelle ne change pas.
 * Les fonctions SQL (fn, col, literal) se prennent dans le paquet « sequelize » : elles n'ont pas
 * besoin de la connexion.
 */

/**
 * Ouvre une transaction : mêmes arguments et même retour que sequelize.transaction. Nommée
 * enTransaction pour ne pas masquer le paramètre « transaction » des fonctions qu'elle reçoit.
 */
export const enTransaction = (...args) => contexteCourant().sequelize.transaction(...args);

/** Lance une requête SQL écrite à la main : mêmes arguments et même retour que sequelize.query. */
export const requete = (...args) => contexteCourant().sequelize.query(...args);
