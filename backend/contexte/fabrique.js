import sequelizeParDefaut from "../config/db.js";
import * as definitions from "../models/definitions.js";

/**
 * Modèles d'un autre établissement, pour l'essai réduit de ME-3a seulement. Les modèles de l'école
 * par défaut (definitions.js, liés à config/db.js) servent de patrons : on les redéfinit à
 * l'identique sur une autre connexion, avec leurs crochets, leurs méthodes et leurs relations.
 * ME-3a complet remplacera ce clonage par une vraie fabrique (chaque fichier de modèle exporte
 * « (sequelize) => sequelize.define(...) »), sans rien changer au reste : l'essai ne juge que les
 * résolveurs et le contexte.
 */

// Champs que Sequelize ajoute lui-même à chaque attribut lors de la définition
const attributs = (patron) =>
    Object.fromEntries(Object.entries(patron.rawAttributes).map(([nom, { Model: _m, fieldName: _f, _modelAttribute: _a, ...reste }]) => [nom, reste]));

const copierCrochets = (patron, copie) => {
    for (const [type, crochets] of Object.entries(patron.options.hooks ?? {})) {
        for (const crochet of crochets) {
            if (typeof crochet === "function") copie.addHook(type, crochet);
            else copie.addHook(type, crochet.name, crochet.fn);
        }
    }
};

// Méthodes ajoutées à la main (Users.prototype.toJSON) : celles que la copie n'a pas déjà
const copierMembres = (source, cible) => {
    for (const cle of Reflect.ownKeys(source)) {
        if (!Object.hasOwn(cible, cle)) Object.defineProperty(cible, cle, Object.getOwnPropertyDescriptor(source, cle));
    }
};

const relier = (patron, copies) => {
    const copie = copies.get(patron.name);
    for (const association of Object.values(patron.associations)) {
        const options = { ...association.options };
        if (association.associationType === "BelongsToMany") {
            const lien = association.through.model;
            options.through = { ...association.options.through, model: copies.get(lien.name) ?? lien };
        }
        const methode = association.associationType[0].toLowerCase() + association.associationType.slice(1);
        copie[methode](copies.get(association.target.name), options);
    }
};

/**
 * Crée l'établissement « nom » sur la connexion donnée : { nom, sequelize, modeles }, où modeles a
 * les mêmes clés que les exports de models/index.js.
 */
export const creerEtablissement = (nom, sequelize) => {
    const patrons = Object.values(sequelizeParDefaut.models);
    const copies = new Map();
    for (const patron of patrons) {
        const { sequelize: _s, hooks: _h, ...options } = patron.options;
        const copie = sequelize.define(patron.name, attributs(patron), { ...options, hooks: {} });
        copierCrochets(patron, copie);
        copies.set(patron.name, copie);
    }
    for (const patron of patrons) relier(patron, copies);
    for (const patron of patrons) {
        copierMembres(patron.prototype, copies.get(patron.name).prototype);
        copierMembres(patron, copies.get(patron.name));
    }
    const modeles = Object.fromEntries(Object.entries(definitions).map(([cle, patron]) => [cle, copies.get(patron.name)]));
    return { nom, sequelize, modeles };
};
