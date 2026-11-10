/**
 * Les écoles du serveur de banc PLA-06 : chacune a sa connexion Sequelize (pool de 5, comme
 * config/db.js) et ses modèles, clonés par la fabrique de l'essai #142 (le futur coût de PLA-01).
 * Une école se charge au démarrage (mode a) ou à sa première requête (mode b), et se libère
 * (pool fermé, modèles rendus) après MESURE_INACTIVITE_MS sans requête ni tâche (P-8).
 * Le contexte enregistré auprès du middleware reste le même objet : seuls ses champs changent.
 */
import { createRequire } from "node:module";
import { hoteEcole, motDePasseEcole, nomEcole } from "./config.mjs";

const { Sequelize } = createRequire("/app/package.json")("sequelize");
const { creerEtablissement } = await import("/app/tests/integration/helpers/fabriqueEtablissement.js");
const { enregistrerEtablissement } = await import("/app/middleware/etablissementMiddleware.js");
const { migrateurPour } = await import("/app/migrations/migrator.js");

/** Une école du banc : son contexte (D-03), son usage, son coût de chargement. */
export class Ecole {
    constructor(n, maitre) {
        this.n = n;
        this.nom = nomEcole(n);
        this.motDePasse = motDePasseEcole(maitre, n);
        this.contexte = { nom: this.nom, sequelize: null, modeles: null };
        this.enCours = 0;
        this.derniere = 0;
        this.chargements = 0;
        this.liberations = 0;
        this.reveils = [];
        this.promesse = null;
        enregistrerEtablissement(hoteEcole(n), this.contexte);
    }

    get chargee() {
        return Boolean(this.contexte.sequelize);
    }

    /** Charge l'école si besoin ; rend la durée du chargement (0 si elle l'était déjà). */
    charger() {
        if (this.chargee) return Promise.resolve(0);
        this.promesse ??= (async () => {
            const debut = Date.now();
            const sequelize = new Sequelize(this.nom, this.nom, this.motDePasse, {
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT || 3306),
                dialect: "mysql",
                logging: false,
                define: { freezeTableName: true, underscored: false },
            });
            const { modeles } = creerEtablissement(this.nom, sequelize);
            Object.assign(this.contexte, { sequelize, modeles });
            this.chargements += 1;
            const duree = Date.now() - debut;
            if (this.chargements > 1) this.reveils.push(duree);
            return duree;
        })().finally(() => {
            this.promesse = null;
        });
        return this.promesse;
    }

    /** Migrations en attente de la base (M4a : ce que ferait un serveur qui vérifie avant d'écouter). */
    async migrationsEnAttente() {
        await this.charger();
        return (await migrateurPour(this.contexte.sequelize).pending()).length;
    }

    /** Exécute fn pendant que l'école est réputée occupée (ni libérée, ni oubliée). */
    async occuper(fn) {
        this.enCours += 1;
        this.derniere = Date.now();
        try {
            await this.charger();
            return await fn();
        } finally {
            this.enCours -= 1;
            this.derniere = Date.now();
        }
    }

    /** Libère l'école si elle dort depuis plus de `inactiviteMs` ; rend true si elle a été libérée. */
    async libererSiInactive(inactiviteMs, maintenant = Date.now()) {
        if (!this.chargee || this.enCours > 0 || this.promesse || maintenant - this.derniere < inactiviteMs) return false;
        const { sequelize } = this.contexte;
        Object.assign(this.contexte, { sequelize: null, modeles: null });
        this.liberations += 1;
        await sequelize.close();
        return true;
    }

    /** Connexions du pool de l'école : ouvertes, libres, utilisées, en attente. */
    pool() {
        const p = this.contexte.sequelize?.connectionManager?.pool;
        if (!p) return { taille: 0, libres: 0, utilisees: 0, attente: 0 };
        return { taille: p.size ?? 0, libres: p.available ?? 0, utilisees: p.using ?? 0, attente: p.waiting ?? 0 };
    }
}

/** Les N écoles du banc, de 1 à N. */
export const creerEcoles = (n, maitre) => new Map(Array.from({ length: n }, (_, i) => [i + 1, new Ecole(i + 1, maitre)]));

/** Bilan de toutes les écoles : chargées, connexions, chargements, libérations, réveils. */
export const bilanEcoles = (ecoles) => {
    const liste = [...ecoles.values()];
    const somme = (f) => liste.reduce((s, e) => s + f(e), 0);
    const pools = liste.map((e) => e.pool());
    return {
        chargees: liste.filter((e) => e.chargee).length,
        connexions: pools.reduce((s, p) => s + p.taille, 0),
        connexions_utilisees: pools.reduce((s, p) => s + p.utilisees, 0),
        attente: pools.reduce((s, p) => s + p.attente, 0),
        chargements: somme((e) => e.chargements),
        liberations: somme((e) => e.liberations),
        reveils_ms: liste.flatMap((e) => e.reveils),
    };
};
