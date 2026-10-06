import { Op } from "sequelize";
import { JeuModule, JeuProgression, Cours } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { historiqueQuiz } from "../quiz/parties.js";
import { devoirsDe } from "../quiz/devoirs.js";
import { inscritsDuModule, modulesDuJoueur } from "./jeux.js";
import { jeuParCode } from "../../../shared/jeux/catalogue.js";

/**
 * Petit historique des jeux d'un enseignant, du plus récent au plus ancien : ses quiz terminés,
 * les devoirs qu'il a donnés et, jour par jour, les défis réussis par les étudiants dans les
 * modules où il a proposé un jeu. Ni noms ni scores individuels : le détail reste dans le suivi.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const FENETRE_DEFIS_JOURS = 30;
const EVENEMENTS_MAX = 15;

const jourLocal = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).format(date);

const defisDesModules = async (user) => {
    const idsModules = await modulesDuJoueur(user);
    if (!idsModules.length) return [];
    const propositions = await JeuModule.findAll({ where: { id_cours: idsModules }, include: [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }] });
    const depuis = new Date(Date.now() - FENETRE_DEFIS_JOURS * 24 * 3600 * 1000);
    const evenements = [];
    for (const p of propositions) {
        const jeu = jeuParCode(p.code_jeu);
        if (!jeu) continue;
        const { etudiants } = await inscritsDuModule(p.id_cours);
        if (!etudiants.length) continue;
        const reussites = await JeuProgression.findAll({
            where: { id_user: etudiants, code_jeu: jeu.code, reussi_le: { [Op.gte]: depuis } },
            attributes: ["id_user", "reussi_le"],
        });
        const parJour = new Map();
        for (const r of reussites) {
            const jour = jourLocal(r.reussi_le);
            const groupe = parJour.get(jour) ?? { date: r.reussi_le, defis: 0, joueurs: new Set() };
            groupe.defis += 1;
            groupe.joueurs.add(r.id_user);
            if (r.reussi_le > groupe.date) groupe.date = r.reussi_le;
            parJour.set(jour, groupe);
        }
        for (const [jour, g] of parJour) {
            evenements.push({
                type: "defis",
                id: `${p.id_cours}-${jeu.code}-${jour}`,
                date: g.date,
                titre: jeu.titre,
                module: { code: p.cours?.code_cours, nom: p.cours?.nom_cours },
                nb_defis: g.defis,
                nb_etudiants: g.joueurs.size,
            });
        }
    }
    return evenements;
};

/** @returns {Promise<object[]>} événements { type: quiz|devoir|defis, id, date, titre, module, … } */
export const historiqueEnseignant = async (user) => {
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
    const [quiz, devoirs, defis] = await Promise.all([historiqueQuiz(user, EVENEMENTS_MAX), devoirsDe(user), defisDesModules(user)]);
    return [
        ...quiz.map((q) => ({ type: "quiz", id: `quiz-${q.id}`, id_partie: q.id, date: q.terminee_le, titre: q.titre, module: q.module, nb_joueurs: q.nb_joueurs, moyenne: q.moyenne })),
        ...devoirs.map((d) => ({ type: "devoir", id: `devoir-${d.id}`, id_devoir: d.id, date: d.donne_le, titre: d.titre, module: d.module, date_limite: d.date_limite, rendus: d.rendus, moyenne: d.moyenne })),
        ...defis,
    ]
        .filter((e) => e.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, EVENEMENTS_MAX);
};
