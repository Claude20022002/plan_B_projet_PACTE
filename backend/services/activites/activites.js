import { Cours } from "../../models/index.js";
import { accueilJeux, modulesDuJoueur } from "../jeux/jeux.js";
import { devoirsDe } from "../quiz/devoirs.js";
import { partiesEnCours } from "../quiz/parties.js";

/**
 * Espace « Activités » : quiz, jeux et devoirs forment un même ensemble, choisi ou créé par
 * l'enseignant dans un module pour vérifier la compréhension d'un cours ou d'une notion, ou pour
 * faire s'entraîner. Cette vue les regroupe par module :
 *  - l'étudiant voit ce que ses enseignants ont proposé dans ses modules (quiz en cours d'abord) ;
 *  - l'enseignant voit chacun de ses modules, même vide, pour y ajouter une activité.
 * L'administration ne gère pas les activités.
 */

const vide = (module) => ({ id_cours: module.id_cours ?? null, code: module.code, nom: module.nom, quiz: [], devoirs: [], jeux: [] });

export const activitesDe = async (user) => {
    if (user.role === "admin") return { modules: [] };
    const [jeux, devoirs, quiz] = await Promise.all([accueilJeux(user), devoirsDe(user), partiesEnCours(user)]);

    const parCode = new Map();
    const module = (m) => {
        if (!m?.code) return null;
        if (!parCode.has(m.code)) parCode.set(m.code, vide(m));
        const existant = parCode.get(m.code);
        if (!existant.id_cours && m.id_cours) existant.id_cours = m.id_cours;
        return existant;
    };

    // L'enseignant voit tous ses modules ; l'étudiant, ceux où quelque chose est proposé
    if (user.role === "enseignant") {
        const ids = await modulesDuJoueur(user);
        const cours = ids.length ? await Cours.findAll({ where: { id_cours: ids }, attributes: ["id_cours", "code_cours", "nom_cours"] }) : [];
        cours.forEach((c) => module({ id_cours: c.id_cours, code: c.code_cours, nom: c.nom_cours }));
    }

    const fiches = new Map(jeux.jeux.map((j) => [j.code, j]));
    for (const m of jeux.modules) {
        const cible = module(m);
        for (const detail of m.details ?? []) {
            const fiche = fiches.get(detail.code);
            if (fiche) cible.jeux.push({ ...fiche, but: detail.but, notion: detail.notion });
        }
    }
    devoirs.forEach((d) => module(d.module)?.devoirs.push(d));
    quiz.forEach((q) => module(q.module)?.quiz.push({ ...q, but: "verifier" }));

    // À faire d'abord : quiz en cours, puis devoirs ouverts non rendus, puis l'ordre alphabétique
    const urgence = (m) => (m.quiz.length ? 0 : m.devoirs.some((d) => d.ouvert && !d.rendu) ? 1 : 2);
    const modules = [...parCode.values()].sort((a, b) => urgence(a) - urgence(b) || String(a.nom).localeCompare(String(b.nom), "fr"));
    return { profil: jeux.profil, modules };
};
