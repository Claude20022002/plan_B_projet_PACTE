import { Appartenir, Cours, CoursComposante, Enseignement, EnseignementEnseignant, EnseignementGroupe, Groupe, JeuModule, JeuProfil, JeuProgression, Users } from "../../models/index.js";
import { ancetres } from "../planning/groupes.js";
import { peutGererFiliere } from "../planning/droits.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { JEUX, defiDuJeu, jeuParCode, pointsMax } from "../../../shared/jeux/catalogue.js";
import { AVATARS, avatarDe, avatarValide } from "../../../shared/jeux/avatars.js";
import { COMMANDES_MAX, LONGUEUR_COMMANDE_MAX, NIVEAU_REPONSE, pointsPour, rejouerDefi } from "../../../shared/terminal/jeu.js";

/**
 * Jeux intégrés à Planner (terminal Linux…). Le catalogue est commun au web et au mobile
 * (shared/jeux/catalogue.js) ; la base garde les jeux proposés dans chaque module et les défis
 * réussis par chaque joueur. Les points sont calculés ici à partir du catalogue et du nombre
 * d'indices : le client ne peut pas les fixer.
 */

const jeuOuErreur = (code) => {
    const jeu = jeuParCode(code);
    if (!jeu) throw new ErreurMetier("Jeu inconnu", 404);
    return jeu;
};

/** Identifiants des groupes de l'étudiant et de leurs groupes parents (TP → TD → promotion). */
const groupesDeLEtudiant = async (idUser) => {
    const directs = (await Appartenir.findAll({ where: { id_user_etudiant: idUser }, include: [{ model: Groupe, as: "groupe" }] }))
        .map((a) => a.groupe)
        .filter(Boolean);
    if (!directs.length) return [];
    const tous = await Groupe.findAll({ where: { id_filiere: [...new Set(directs.map((g) => g.id_filiere))] } });
    const parId = new Map(tous.map((g) => [g.id_groupe, g]));
    return [...new Set(directs.flatMap((g) => [g.id_groupe, ...ancetres(g, parId).map((a) => a.id_groupe)]))];
};

const coursDesEnseignements = async (idsEnseignements) => {
    if (!idsEnseignements.length) return [];
    const enseignements = await Enseignement.findAll({
        where: { id_enseignement: [...new Set(idsEnseignements)] },
        attributes: ["id_enseignement"],
        include: [{ model: CoursComposante, as: "composante", attributes: ["id_cours"], required: true }],
    });
    return [...new Set(enseignements.map((e) => e.composante.id_cours))];
};

/** Modules (cours) suivis par un étudiant ou enseignés par un enseignant ; [] pour l'administration. */
export const modulesDuJoueur = async (user) => {
    if (user.role === "etudiant") {
        const groupes = await groupesDeLEtudiant(user.id_user);
        if (!groupes.length) return [];
        const liens = await EnseignementGroupe.findAll({ where: { id_groupe: groupes }, attributes: ["id_enseignement"] });
        return coursDesEnseignements(liens.map((l) => l.id_enseignement));
    }
    if (user.role === "enseignant") {
        const services = await EnseignementEnseignant.findAll({ where: { id_user: user.id_user }, attributes: ["id_enseignement", "statut_service"] });
        return coursDesEnseignements(services.filter((s) => s.statut_service !== "refuse").map((s) => s.id_enseignement));
    }
    return [];
};

/** Proposer un jeu dans un module : administration, responsable de la filière ou enseignant du module. */
export const peutProposerDansModule = async (user, cours) => {
    if (user.role === "admin") return true;
    if (user.role !== "enseignant") return false;
    if (await peutGererFiliere(user, cours.id_filiere)) return true;
    return (await modulesDuJoueur(user)).includes(cours.id_cours);
};

const resumeProgression = (jeu, lignes) => {
    const reussis = lignes.filter((l) => l.code_jeu === jeu.code && defiDuJeu(jeu, l.id_defi));
    return { reussis: reussis.length, total: jeu.defis.length, points: reussis.reduce((t, l) => t + l.points, 0), pointsMax: pointsMax(jeu) };
};

/** Personnage du joueur (choisi, sinon tiré de son numéro) */
const profilDuJoueur = async (idUser) => ({ avatar: avatarDe(idUser, (await JeuProfil.findByPk(idUser))?.avatar) });

/** Choisir son personnage parmi ceux de shared/jeux/avatars.js */
export const choisirAvatar = async (user, avatar) => {
    if (!avatarValide(avatar)) throw new ErreurMetier(`avatar doit être l'un de : ${AVATARS.join(", ")}`, 400);
    await JeuProfil.upsert({ id_user: user.id_user, avatar });
    return { avatar };
};

/**
 * Accueil des jeux d'un utilisateur : son personnage, le catalogue avec sa progression, et ses
 * modules qui proposent un jeu (avec les codes des jeux proposés).
 */
export const accueilJeux = async (user) => {
    const [lignes, idsModules, profil] = await Promise.all([
        JeuProgression.findAll({ where: { id_user: user.id_user }, attributes: ["code_jeu", "id_defi", "points"] }),
        modulesDuJoueur(user),
        profilDuJoueur(user.id_user),
    ]);
    const propositions = idsModules.length
        ? await JeuModule.findAll({ where: { id_cours: idsModules }, include: [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }], order: [["id_cours", "ASC"]] })
        : [];
    const modules = new Map();
    // L'enseignant voit tous ses modules, pour y proposer un jeu ; l'étudiant, ceux qui en ont un
    if (user.role === "enseignant" && idsModules.length) {
        const cours = await Cours.findAll({ where: { id_cours: idsModules }, attributes: ["id_cours", "code_cours", "nom_cours"], order: [["code_cours", "ASC"]] });
        for (const c of cours) modules.set(c.id_cours, { id_cours: c.id_cours, code: c.code_cours, nom: c.nom_cours, jeux: [] });
    }
    for (const p of propositions) {
        if (!jeuParCode(p.code_jeu)) continue;
        if (!modules.has(p.id_cours)) modules.set(p.id_cours, { id_cours: p.id_cours, code: p.cours.code_cours, nom: p.cours.nom_cours, jeux: [] });
        modules.get(p.id_cours).jeux.push(p.code_jeu);
    }
    return {
        profil,
        jeux: JEUX.map((jeu) => ({ code: jeu.code, type: jeu.type, discipline: jeu.discipline, titre: jeu.titre, resume: jeu.resume, source: jeu.source, progression: resumeProgression(jeu, lignes) })),
        modules: [...modules.values()],
    };
};

/** Défis réussis par l'utilisateur dans un jeu. */
export const progressionDuJeu = async (user, code) => {
    const jeu = jeuOuErreur(code);
    const lignes = await JeuProgression.findAll({ where: { id_user: user.id_user, code_jeu: jeu.code }, order: [["reussi_le", "ASC"], ["id_jeu_progression", "ASC"]] });
    return {
        ...resumeProgression(jeu, lignes),
        defis: lignes.filter((l) => defiDuJeu(jeu, l.id_defi)).map((l) => ({ id: l.id_defi, indices: l.indices, points: l.points, reussi_le: l.reussi_le })),
    };
};

/** Commandes tapées pendant la partie : tableau de chaînes, borné en nombre et en longueur. */
const commandesOuErreur = (commandes) => {
    const valides =
        Array.isArray(commandes) &&
        commandes.length > 0 &&
        commandes.length <= COMMANDES_MAX &&
        commandes.every((c) => typeof c === "string" && c.length <= LONGUEUR_COMMANDE_MAX);
    if (!valides) throw new ErreurMetier(`commandes doit être une liste de 1 à ${COMMANDES_MAX} lignes`, 400);
    return commandes;
};

/**
 * Enregistre la réussite d'un défi. Le serveur rejoue les commandes de la partie depuis l'état
 * initial du défi : sans objectif atteint, rien n'est enregistré. La première réussite compte
 * (rejouer ne rapporte rien de plus) ; les points dépendent des indices utilisés (0 à 3,
 * 4 = réponse affichée), que seul le joueur connaît (les indices sont dans le code client).
 * @returns {{ cree: boolean, points: number, progression }}
 */
export const enregistrerReussite = async (user, code, idDefi, indices, commandes) => {
    const jeu = jeuOuErreur(code);
    const defi = defiDuJeu(jeu, String(idDefi ?? ""));
    if (!defi) throw new ErreurMetier("Défi inconnu", 404);
    const n = Number(indices ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > NIVEAU_REPONSE) throw new ErreurMetier(`indices doit être un entier de 0 à ${NIVEAU_REPONSE}`, 400);
    // Même nom de joueur que l'écran de jeu (invite et dossier personnel du terminal simulé)
    if (!rejouerDefi(defi.id, commandesOuErreur(commandes), { joueur: user.prenom || "etudiant" })) {
        throw new ErreurMetier("Objectif du défi non atteint", 422);
    }

    const [ligne, cree] = await JeuProgression.findOrCreate({
        where: { id_user: user.id_user, code_jeu: jeu.code, id_defi: defi.id },
        defaults: { indices: n, points: pointsPour(defi.xp, n), reussi_le: new Date() },
    });
    const lignes = await JeuProgression.findAll({ where: { id_user: user.id_user, code_jeu: jeu.code }, attributes: ["code_jeu", "id_defi", "points"] });
    return { cree, points: ligne.points, progression: resumeProgression(jeu, lignes) };
};

const coursOuErreur = async (idCours) => {
    const id = Number(idCours);
    const cours = Number.isInteger(id) && id > 0 ? await Cours.findByPk(id, { attributes: ["id_cours", "code_cours", "nom_cours", "id_filiere"] }) : null;
    if (!cours) throw new ErreurMetier("Module introuvable", 404);
    return cours;
};

/** Modules où un jeu est proposé (vue de l'administration et des enseignants). */
export const modulesDuJeu = async (code) => {
    const jeu = jeuOuErreur(code);
    const propositions = await JeuModule.findAll({ where: { code_jeu: jeu.code }, include: [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }] });
    return propositions.map((p) => ({ id_cours: p.id_cours, code: p.cours?.code_cours, nom: p.cours?.nom_cours }));
};

export const proposerDansModule = async (user, code, idCours) => {
    const jeu = jeuOuErreur(code);
    const cours = await coursOuErreur(idCours);
    if (!(await peutProposerDansModule(user, cours))) throw new ErreurMetier("Vous ne pouvez proposer un jeu que dans vos modules", 403);
    const [, cree] = await JeuModule.findOrCreate({ where: { code_jeu: jeu.code, id_cours: cours.id_cours }, defaults: { id_user_auteur: user.id_user } });
    return { cree, module: { id_cours: cours.id_cours, code: cours.code_cours, nom: cours.nom_cours } };
};

export const retirerDuModule = async (user, code, idCours) => {
    const jeu = jeuOuErreur(code);
    const cours = await coursOuErreur(idCours);
    if (!(await peutProposerDansModule(user, cours))) throw new ErreurMetier("Vous ne pouvez retirer un jeu que de vos modules", 403);
    return JeuModule.destroy({ where: { code_jeu: jeu.code, id_cours: cours.id_cours } });
};

/**
 * Suivi d'un module par son enseignant : progression des étudiants qui suivent ce module
 * (nom, prénom, personnage et points seulement), du plus avancé au moins avancé.
 */
export const suiviDuModule = async (user, code, idCours) => {
    const jeu = jeuOuErreur(code);
    const cours = await coursOuErreur(idCours);
    if (!(await peutProposerDansModule(user, cours))) throw new ErreurMetier("Suivi réservé aux enseignants du module", 403);

    const enseignements = await Enseignement.findAll({
        attributes: ["id_enseignement"],
        include: [
            { model: CoursComposante, as: "composante", attributes: [], where: { id_cours: cours.id_cours }, required: true },
            { model: Groupe, as: "groupes", attributes: ["id_groupe"], through: { attributes: [] } },
        ],
    });
    // Groupes du module et leurs sous-groupes : les étudiants sont inscrits dans les plus fins
    const vises = new Set(enseignements.flatMap((e) => e.groupes.map((g) => g.id_groupe)));
    if (!vises.size) return { module: { id_cours: cours.id_cours, code: cours.code_cours, nom: cours.nom_cours }, etudiants: [] };
    const tous = await Groupe.findAll({ attributes: ["id_groupe", "id_groupe_parent", "id_filiere"] });
    const parId = new Map(tous.map((g) => [g.id_groupe, g]));
    const groupes = tous.filter((g) => vises.has(g.id_groupe) || ancetres(g, parId).some((a) => vises.has(a.id_groupe))).map((g) => g.id_groupe);

    const inscrits = await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] });
    const ids = [...new Set(inscrits.map((a) => a.id_user_etudiant))];
    if (!ids.length) return { module: { id_cours: cours.id_cours, code: cours.code_cours, nom: cours.nom_cours }, etudiants: [] };

    const [etudiants, lignes, profils] = await Promise.all([
        Users.findAll({ where: { id_user: ids, actif: true }, attributes: ["id_user", "nom", "prenom"] }),
        JeuProgression.findAll({ where: { id_user: ids, code_jeu: jeu.code }, attributes: ["id_user", "code_jeu", "id_defi", "points"] }),
        JeuProfil.findAll({ where: { id_user: ids } }),
    ]);
    const avatars = new Map(profils.map((p) => [p.id_user, p.avatar]));
    const parEtudiant = (id) => resumeProgression(jeu, lignes.filter((l) => l.id_user === id));
    return {
        module: { id_cours: cours.id_cours, code: cours.code_cours, nom: cours.nom_cours },
        etudiants: etudiants
            .map((e) => ({ id_user: e.id_user, nom: e.nom, prenom: e.prenom, avatar: avatarDe(e.id_user, avatars.get(e.id_user)), ...parEtudiant(e.id_user) }))
            .sort((a, b) => b.points - a.points || a.nom.localeCompare(b.nom)),
    };
};
