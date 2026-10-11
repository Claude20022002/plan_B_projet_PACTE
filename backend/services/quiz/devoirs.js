import crypto from "crypto";
import { Appartenir, Cours, Devoir, DevoirRendu, Groupe, Users } from "../../models/index.js";
import { butEtNotion } from "../activites/but.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { groupesANotifier } from "../planning/seances.js";
import { groupesDeLEtudiant, inscritsDuModule, modulesDuJoueur, peutProposerDansModule } from "../jeux/jeux.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";
import { mesClasses, peutViserClasse } from "../planning/mesClasses.js";
import { idCompte } from "../oidc/provider.js";
import { appelerClassQuiz, cheminSigne, definirClientClassQuiz, signatureClassQuiz } from "./clientClassQuiz.js";

/**
 * Devoirs notés (phase Q). L'enseignant donne l'un de ses quiz ClassQuiz en devoir dans un module
 * (tous ses étudiants, ou un groupe), avec une date limite. Planner copie les questions par une
 * requête signée au fork de ClassQuiz, les sert sans les réponses, corrige lui-même et note sur
 * 20. Une seule copie par étudiant ; la correction n'est montrée qu'après la date limite.
 * Les devoirs « fichier » (dépôt de copie, note à la main) ont été retirés le 10 octobre 2026 :
 * à HESTIM, l'enseignant ne donne sur Planner que des quiz. Les anciens restent en base, masqués.
 */

const TYPES_NOTES = new Set(["ABCD", "CHECK", "TEXT", "RANGE", "ORDER"]);
const TYPES_ACCEPTES = new Set([...TYPES_NOTES, "VOTING", "SLIDE"]);
const DUREE_MAX_MS = 366 * 24 * 3600 * 1000;

// Le client signé du fork vit dans clientClassQuiz.js ; les tests le remplacent encore par ce module
export { definirClientClassQuiz, signatureClassQuiz };

/**
 * Crée un quiz privé dans ClassQuiz pour l'enseignant, sans qu'il ait à ouvrir ClassQuiz : son
 * compte y est créé au besoin, avec la même identité que sa connexion OpenID (services/oidc).
 * @param {{ titre: string, description?: string, questions: { question, time, type, answers: { answer, right }[] }[] }} quiz
 * @returns {Promise<{ id: string, titre: string, nb_questions: number }>}
 */
export const creerQuizClassQuiz = async (user, quiz) => {
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
    const cree = await appelerClassQuiz("/api/v1/hestim/quiz", {
        email: user.email,
        sub: idCompte(user.id_user),
        username: user.email.split("@")[0].slice(0, 100),
        titre: quiz.titre,
        description: quiz.description ?? "",
        questions: quiz.questions,
    });
    if (typeof cree?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(cree.id)) throw new ErreurMetier("Réponse inattendue du service de quiz", 502);
    return cree;
};

/** Quiz de l'enseignant dans ClassQuiz : [{ id, titre, nb_questions }] */
export const quizDisponibles = async (user) => {
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
    return (await appelerClassQuiz(cheminSigne("/api/v1/hestim/quizzes", { email: user.email }))) ?? [];
};

// ── Correction ────────────────────────────────────────────────────────────

const texteSimple = (v) => String(v ?? "").replace(/<[^>]*>/g, "").trim();

/**
 * Corrige une réponse. Formats attendus : ABCD → indice ; CHECK → liste d'indices ;
 * TEXT → texte ; RANGE → nombre ; ORDER → liste des réponses dans l'ordre choisi.
 * @returns {{ notee: boolean, juste: boolean }}
 */
export const corriger = (question, reponse) => {
    const reponses = question.answers;
    switch (question.type) {
        case "ABCD": {
            const i = Number(reponse);
            return { notee: true, juste: Number.isInteger(i) && Boolean(reponses?.[i]?.right) };
        }
        case "CHECK": {
            const choisis = new Set((Array.isArray(reponse) ? reponse : []).map(Number));
            const attendus = new Set((reponses ?? []).map((r, i) => (r.right ? i : null)).filter((i) => i !== null));
            return { notee: true, juste: choisis.size === attendus.size && [...attendus].every((i) => choisis.has(i)) };
        }
        case "TEXT": {
            const donnee = texteSimple(reponse);
            return {
                notee: true,
                juste: Boolean(donnee) && (reponses ?? []).some((r) => (r.case_sensitive ? texteSimple(r.answer) === donnee : texteSimple(r.answer).toLowerCase() === donnee.toLowerCase())),
            };
        }
        case "RANGE": {
            const n = Number(reponse);
            return { notee: true, juste: Number.isFinite(n) && n >= reponses.min_correct && n <= reponses.max_correct };
        }
        case "ORDER": {
            const ordre = Array.isArray(reponse) ? reponse.map(texteSimple) : [];
            const attendu = (reponses ?? []).map((r) => texteSimple(r.answer));
            return { notee: true, juste: ordre.length === attendu.length && ordre.every((r, i) => r === attendu[i]) };
        }
        default:
            return { notee: false, juste: false };
    }
};

/** Mélange stable (même ordre pour un étudiant donné) */
const melanger = (liste, graine) => {
    const tries = liste.map((v, i) => ({ v, cle: crypto.createHash("sha256").update(`${graine}.${i}`).digest("hex") }));
    return tries.sort((a, b) => a.cle.localeCompare(b.cle)).map((t) => t.v);
};

/** Question telle que l'étudiant la voit : sans les réponses attendues */
const sujet = (question, index, graine) => {
    const base = { index, type: question.type, question: texteSimple(question.question), image: question.image ?? null, temps: Number(question.time) || null };
    switch (question.type) {
        case "ABCD":
        case "CHECK":
            return { ...base, choix: (question.answers ?? []).map((r) => texteSimple(r.answer)) };
        case "VOTING":
            return { ...base, choix: (question.answers ?? []).map((r) => texteSimple(r.answer)) };
        case "RANGE":
            return { ...base, min: question.answers.min, max: question.answers.max };
        case "ORDER":
            return { ...base, choix: melanger((question.answers ?? []).map((r) => texteSimple(r.answer)), graine) };
        case "SLIDE":
            return { ...base, question: texteSimple(question.question).slice(0, 2000) };
        default:
            return base;
    }
};

/** Réponse attendue, montrée après la date limite */
const attendue = (question) => {
    switch (question.type) {
        case "ABCD":
        case "CHECK":
            return (question.answers ?? []).map((r, i) => (r.right ? i : null)).filter((i) => i !== null);
        case "TEXT":
            return (question.answers ?? []).map((r) => texteSimple(r.answer));
        case "RANGE":
            return { min: question.answers.min_correct, max: question.answers.max_correct };
        case "ORDER":
            return (question.answers ?? []).map((r) => texteSimple(r.answer));
        default:
            return null;
    }
};

// ── Devoirs ───────────────────────────────────────────────────────────────

const coursOuErreur = async (idCours) => {
    const id = Number(idCours);
    const cours = Number.isInteger(id) && id > 0 ? await Cours.findByPk(id) : null;
    if (!cours) throw new ErreurMetier("Module introuvable", 404);
    return cours;
};

/** Étudiants visés par un devoir : le groupe choisi (et ses sous-groupes), sinon tout le module */
const etudiantsVises = async (devoir) => {
    if (devoir.id_groupe) {
        const groupes = await groupesANotifier([devoir.id_groupe]);
        return [...new Set((await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] })).map((a) => a.id_user_etudiant))];
    }
    return (await inscritsDuModule(devoir.id_cours)).etudiants;
};

const estVise = async (devoir, user) => {
    if (user.role !== "etudiant") return false;
    if (devoir.id_groupe) {
        const groupes = await groupesANotifier([devoir.id_groupe]);
        return (await groupesDeLEtudiant(user.id_user)).some((g) => groupes.includes(g));
    }
    return (await modulesDuJoueur(user)).includes(devoir.id_cours);
};

const peutGerer = async (user, devoir) =>
    devoir.id_user_enseignant === user.id_user || (user.role === "enseignant" && (await peutProposerDansModule(user, await Cours.findByPk(devoir.id_cours))));

const devoirOuErreur = async (id) => {
    const n = Number(id);
    const devoir = Number.isInteger(n) && n > 0 ? await Devoir.findByPk(n, { include: [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }, { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe"] }] }) : null;
    // Ancien devoir « fichier » : masqué
    if (!devoir || devoir.type === "fichier") throw new ErreurMetier("Devoir introuvable", 404);
    return devoir;
};

const enTete = (d) => ({
    id: d.id_devoir,
    titre: d.titre,
    type: d.type ?? "quiz",
    date_limite: d.date_limite,
    module: d.cours ? { id_cours: d.cours.id_cours, code: d.cours.code_cours, nom: d.cours.nom_cours } : null,
    groupe: d.groupe ? { id_groupe: d.groupe.id_groupe, nom: d.groupe.nom_groupe } : null,
    but: d.but ?? "verifier",
    notion: d.notion ?? null,
    nb_questions: d.questions?.length ?? 0,
    nb_notees: (d.questions ?? []).filter((q) => TYPES_NOTES.has(q.type)).length,
    ouvert: new Date(d.date_limite) > new Date(),
});

/**
 * Donner un quiz en devoir dans un module : { quiz_id, id_cours, id_groupe?, date_limite } ; les
 * questions sont copiées depuis ClassQuiz et les étudiants visés sont prévenus.
 */
export const creerDevoir = async (user, donnees = {}) => {
    const { quiz_id: quizId, id_cours: idCours, id_groupe: idGroupe = null, date_limite: dateLimite, type = "quiz" } = donnees;
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
    const cours = await coursOuErreur(idCours);
    // Module de ses services, ou dont il a une classe à son emploi du temps (remplacement)
    const classes = await mesClasses(user);
    if (!(await peutProposerDansModule(user, cours)) && !classes.some((c) => c.id_cours === cours.id_cours)) {
        throw new ErreurMetier("Vous ne pouvez donner un devoir que dans vos modules", 403);
    }
    const limite = new Date(dateLimite);
    if (Number.isNaN(limite.getTime()) || limite <= new Date() || limite - new Date() > DUREE_MAX_MS) {
        throw new ErreurMetier("date_limite doit être une date à venir (un an au plus)", 400);
    }
    // La classe visée doit être l'une des siennes (service ou emploi du temps) : un module partagé
    // entre plusieurs enseignants ne permet pas d'écrire aux groupes des autres
    let groupe = null;
    const groupesDuModule = (await inscritsDuModule(cours.id_cours)).groupes;
    if (idGroupe !== null && idGroupe !== undefined && idGroupe !== "") {
        groupe = await Groupe.findByPk(Number(idGroupe));
        if (!groupe || !groupesDuModule.includes(groupe.id_groupe)) throw new ErreurMetier("Ce groupe ne suit pas ce module", 400);
        if (!(await peutViserClasse(user, cours, groupe.id_groupe, { classes }))) throw new ErreurMetier("Ce groupe n'est pas l'une de vos classes dans ce module", 403);
    } else if (!(await peutViserClasse(user, cours, null, { classes, groupesDuModule }))) {
        throw new ErreurMetier("D'autres enseignants ont des classes dans ce module : choisissez l'une de vos classes", 400);
    }
    if (type !== "quiz") throw new ErreurMetier("Seuls les quiz se donnent en devoir", 400);
    if (typeof quizId !== "string" || !/^[0-9a-f-]{36}$/i.test(quizId)) throw new ErreurMetier("quiz_id invalide", 400);
    const quiz = await appelerClassQuiz(cheminSigne(`/api/v1/hestim/quiz/${quizId}`, { email: user.email }));
    if (!quiz) throw new ErreurMetier("Quiz introuvable dans vos quiz", 404);
    const questions = (Array.isArray(quiz.questions) ? quiz.questions : []).filter((q) => TYPES_ACCEPTES.has(q?.type));
    if (!questions.some((q) => TYPES_NOTES.has(q.type))) throw new ErreurMetier("Ce quiz n'a aucune question notable", 400);
    const champs = { type: "quiz", titre: String(quiz.titre ?? "Devoir").slice(0, 255), quiz_id: quizId, questions };

    const devoir = await Devoir.create({
        ...champs,
        ...butEtNotion(donnees, "verifier"),
        id_cours: cours.id_cours,
        id_groupe: groupe?.id_groupe ?? null,
        id_user_enseignant: user.id_user,
        date_limite: limite,
    });
    const etudiants = await etudiantsVises(devoir);
    if (etudiants.length) {
        await creerNotificationsMultiples({
            id_users: etudiants,
            titre: "Nouveau devoir",
            message: `${devoir.titre} (${cours.nom_cours}). À rendre avant le ${limite.toLocaleString("fr-FR", { timeZone: process.env.APP_TIMEZONE || "Africa/Casablanca", dateStyle: "short", timeStyle: "short" })}.`,
            type_notification: "info",
            lien: "/jeux",
        });
    }
    return { devoir: enTete(await devoirOuErreur(devoir.id_devoir)), notifies: etudiants.length };
};

/** Devoirs d'un utilisateur : à rendre et rendus (étudiant), donnés avec leurs statistiques (enseignant) */
export const devoirsDe = async (user) => {
    const include = [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }, { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe"] }];
    if (user.role === "admin") return [];
    if (user.role === "enseignant") {
        const devoirs = await Devoir.findAll({ where: { id_user_enseignant: user.id_user, type: "quiz" }, include, order: [["date_limite", "DESC"]], limit: 50 });
        const rendus = devoirs.length ? await DevoirRendu.findAll({ where: { id_devoir: devoirs.map((d) => d.id_devoir) }, attributes: ["id_devoir", "note"] }) : [];
        return devoirs.map((d) => {
            const copies = rendus.filter((r) => r.id_devoir === d.id_devoir);
            const notes = copies.filter((r) => r.note !== null).map((r) => Number(r.note));
            return {
                ...enTete(d),
                donne_le: d.createdAt,
                rendus: copies.length,
                moyenne: notes.length ? Math.round((100 * notes.reduce((a, b) => a + b, 0)) / notes.length) / 100 : null,
            };
        });
    }
    const modules = await modulesDuJoueur(user);
    if (!modules.length) return [];
    const candidats = await Devoir.findAll({ where: { id_cours: modules, type: "quiz" }, include, order: [["date_limite", "ASC"]] });
    // Devoir d'un groupe : visible si l'un de mes groupes est ce groupe ou l'un de ses descendants.
    // Mes groupes comprennent tous leurs ancêtres : cela revient à « son groupe est parmi les miens »
    // (sans lire la descendance de chaque devoir)
    const mesGroupes = new Set(await groupesDeLEtudiant(user.id_user));
    const visibles = candidats.filter((d) => !d.id_groupe || mesGroupes.has(d.id_groupe));
    const mesRendus = visibles.length ? await DevoirRendu.findAll({ where: { id_devoir: visibles.map((d) => d.id_devoir), id_user: user.id_user } }) : [];
    return visibles.map((d) => {
        const r = mesRendus.find((x) => x.id_devoir === d.id_devoir);
        return { ...enTete(d), rendu: r ? renduVu(r) : null };
    });
};

/**
 * Sujet d'un devoir pour un étudiant visé : les questions sans les réponses ; après la date
 * limite, s'il a rendu sa copie, la correction question par question.
 */
export const sujetDuDevoir = async (user, id) => {
    const devoir = await devoirOuErreur(id);
    if (!(await estVise(devoir, user))) throw new ErreurMetier("Devoir introuvable", 404);
    const rendu = await DevoirRendu.findOne({ where: { id_devoir: devoir.id_devoir, id_user: user.id_user } });
    const enTeteDevoir = enTete(devoir);
    const correction = rendu && !enTeteDevoir.ouvert;
    return {
        devoir: enTeteDevoir,
        questions: devoir.questions.map((q, i) => ({
            ...sujet(q, i, `${devoir.id_devoir}.${user.id_user}`),
            ...(rendu ? { ma_reponse: rendu.reponses[i] ?? null } : {}),
            ...(correction ? { attendue: attendue(q), juste: corriger(q, rendu.reponses[i]).juste } : {}),
        })),
        rendu: rendu ? renduVu(rendu) : null,
    };
};

/** Rendre sa copie (une seule fois, avant la date limite) : { reponses: [une par question] } */
export const rendreDevoir = async (user, id, reponses) => {
    const devoir = await devoirOuErreur(id);
    if (!(await estVise(devoir, user))) throw new ErreurMetier("Devoir introuvable", 404);
    if (new Date(devoir.date_limite) <= new Date()) throw new ErreurMetier("La date limite est passée", 409);
    if (!Array.isArray(reponses) || reponses.length !== devoir.questions.length) {
        throw new ErreurMetier(`reponses doit contenir une réponse par question (${devoir.questions.length})`, 400);
    }
    // Réponses bornées : indices, nombres, textes courts ou listes courtes
    const propres = reponses.map((r) => {
        if (Array.isArray(r)) return r.slice(0, 20).map((v) => (typeof v === "number" ? v : String(v).slice(0, 200)));
        if (typeof r === "number" || r === null) return r;
        return String(r).slice(0, 200);
    });
    let bonnes = 0;
    let notees = 0;
    devoir.questions.forEach((q, i) => {
        const c = corriger(q, propres[i]);
        if (c.notee) notees += 1;
        if (c.juste) bonnes += 1;
    });
    const note = notees ? Math.round((2000 * bonnes) / notees) / 100 : 0;
    const [rendu, cree] = await DevoirRendu.findOrCreate({
        where: { id_devoir: devoir.id_devoir, id_user: user.id_user },
        defaults: { reponses: propres, bonnes, notees, note, rendu_le: new Date() },
    });
    if (!cree) throw new ErreurMetier("Copie déjà rendue", 409);
    return { note: Number(rendu.note), bonnes, notees };
};

/** Résultats d'un devoir (enseignant du module) : notes, non rendus, moyennes par groupe */
export const resultatsDuDevoir = async (user, id) => {
    const devoir = await devoirOuErreur(id);
    if (!(await peutGerer(user, devoir))) throw new ErreurMetier("Résultats réservés aux enseignants du module", 403);
    const ids = await etudiantsVises(devoir);
    const [etudiants, rendus] = await Promise.all([
        ids.length ? Users.findAll({ where: { id_user: ids, actif: true }, attributes: ["id_user", "nom", "prenom"] }) : [],
        DevoirRendu.findAll({ where: { id_devoir: devoir.id_devoir } }),
    ]);
    const parEtudiant = new Map(rendus.map((r) => [r.id_user, r]));
    // Par note décroissante, puis les non-rendus
    const rang = (l) => (l.rendu_le ? 0 : 1);
    const lignes = etudiants
        .map((e) => {
            const r = parEtudiant.get(e.id_user);
            return {
                id_user: e.id_user,
                nom: e.nom,
                prenom: e.prenom,
                note: r && r.note !== null ? Number(r.note) : null,
                bonnes: r?.bonnes ?? null,
                rendu_le: r?.rendu_le ?? null,
            };
        })
        .sort((a, b) => rang(a) - rang(b) || (b.note ?? -1) - (a.note ?? -1) || a.nom.localeCompare(b.nom));
    const notes = lignes.filter((l) => l.note !== null).map((l) => l.note);
    const rendusCompte = lignes.filter((l) => l.rendu_le).length;
    return {
        devoir: { ...enTete(devoir), nb_vises: lignes.length },
        moyenne: notes.length ? Math.round((100 * notes.reduce((a, b) => a + b, 0)) / notes.length) / 100 : null,
        rendus: rendusCompte,
        etudiants: lignes,
    };
};

/** Copie vue par l'étudiant : note sur 20 et nombre de bonnes réponses. */
const renduVu = (r) => ({
    note: r.note === null ? null : Number(r.note),
    bonnes: r.bonnes,
    notees: r.notees,
    rendu_le: r.rendu_le,
});

/** Supprimer un devoir (et ses copies) */
export const supprimerDevoir = async (user, id) => {
    const devoir = await devoirOuErreur(id);
    if (!(await peutGerer(user, devoir))) throw new ErreurMetier("Suppression réservée aux enseignants du module", 403);
    await devoir.destroy();
    return { supprime: true };
};
