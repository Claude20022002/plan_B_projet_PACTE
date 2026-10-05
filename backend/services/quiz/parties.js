import crypto from "crypto";
import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import { Affectation, Appartenir, Creneau, Cours, Groupe, QuizPartie, QuizResultat, Users } from "../../models/index.js";
import { groupesANotifier } from "../planning/seances.js";
import { descendants } from "../planning/groupes.js";
import { creerNotification, creerNotificationsMultiples } from "../../utils/notificationHelper.js";

/**
 * Parties ClassQuiz (phase Q). Le fork de ClassQuiz signale chaque partie lancée par un
 * enseignant (POST signé HMAC) ; Planner la rattache à la séance que l'enseignant donne à ce
 * moment-là, prévient les étudiants de ses groupes (notification + push) et la leur propose
 * dans l'application, avec le code déjà rempli.
 *
 * En fin de partie, le fork envoie les scores. Le lien de jeu de chaque étudiant porte un jeton
 * signé pour cette partie (hid) : il revient avec son score, qui est ainsi rattaché à
 * l'étudiant, donc à la séance et au module. Les groupes de TP de la séance s'affrontent
 * (classement par moyenne) et les réponses libres forment des nuages de mots.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const TOLERANCE_SIGNATURE_S = 300;
// Une partie se rejoint dans les premières minutes ; au-delà, elle n'est plus proposée
const DUREE_PROPOSEE_MIN = 120;
// Lancer le quiz un peu avant le début de la séance compte encore pour elle
const AVANCE_SEANCE_MIN = 15;

const ROLES_ENSEIGNANT = ["enseignant", "admin"];

export const urlQuiz = () => process.env.QUIZ_URL?.replace(/\/$/, "") || null;

const secret = () => {
    const valeur = process.env.QUIZ_WEBHOOK_SECRET || "";
    return valeur.length >= 32 ? valeur : null;
};

export const webhookActif = () => secret() !== null;

/**
 * Vérifie la signature du fork : HMAC-SHA256 de « <horodatage>.<corps brut> », en hexadécimal,
 * horodatage à 5 minutes près (rejeu). Comparaison en temps constant.
 */
export const signatureValide = (corpsBrut, horodatage, signature) => {
    const cle = secret();
    if (!cle || typeof horodatage !== "string" || typeof signature !== "string") return false;
    const ts = Number(horodatage);
    if (!Number.isInteger(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SIGNATURE_S) return false;
    const attendue = crypto.createHmac("sha256", cle).update(`${horodatage}.`).update(corpsBrut).digest("hex");
    const a = Buffer.from(attendue);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const maintenantLocal = () => {
    const now = new Date();
    return {
        date: now.toLocaleDateString("en-CA", { timeZone: FUSEAU }),
        minutes: (() => {
            const [h, m] = now.toLocaleTimeString("en-GB", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" }).split(":");
            return Number(h) * 60 + Number(m);
        })(),
    };
};
const enMinutes = (heure) => {
    const [h, m] = String(heure).split(":");
    return Number(h) * 60 + Number(m);
};

/** Séance que l'enseignant donne maintenant (ou commence dans moins de 15 minutes). */
export const seanceEnCours = async (idEnseignant) => {
    const { date, minutes } = maintenantLocal();
    const seances = await Affectation.findAll({
        where: { id_user_enseignant: idEnseignant, date_seance: date, statut: { [Op.in]: ["planifie", "confirme", "realise"] } },
        include: [{ model: Creneau, as: "creneau" }, { model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] }],
    });
    return seances.find((s) => s.creneau
        && enMinutes(s.creneau.heure_debut) - AVANCE_SEANCE_MIN <= minutes
        && minutes <= enMinutes(s.creneau.heure_fin)) ?? null;
};

/**
 * Enregistre une partie signalée par le fork. Idempotent sur game_id (le fork peut réessayer).
 * Retourne { partie, notifies } ; null si l'expéditeur n'est pas un enseignant de Planner.
 */
export const enregistrerPartie = async (evenement) => {
    const email = String(evenement.user_email ?? "").toLowerCase();
    const enseignant = email ? await Users.findOne({ where: { email } }) : null;
    if (!enseignant || !enseignant.actif || !ROLES_ENSEIGNANT.includes(enseignant.role)) return null;

    const existante = await QuizPartie.findOne({ where: { game_id: String(evenement.game_id) } });
    if (existante) return { partie: existante, notifies: 0 };

    const seance = await seanceEnCours(enseignant.id_user);
    const partie = await QuizPartie.create({
        game_id: String(evenement.game_id),
        pin: String(evenement.game_pin),
        titre: String(evenement.quiz_title ?? "Quiz").slice(0, 255),
        mode: evenement.game_mode ? String(evenement.game_mode).slice(0, 30) : null,
        id_user_enseignant: enseignant.id_user,
        id_affectation: seance?.id_affectation ?? null,
        demarree_le: new Date(),
    });

    let notifies = 0;
    if (seance) {
        const groupes = await groupesANotifier([seance.id_groupe]);
        const etudiants = [...new Set((await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] }))
            .map((a) => a.id_user_etudiant))];
        if (etudiants.length) {
            // Le push suit automatiquement chaque notification (services/push.js)
            await creerNotificationsMultiples({
                id_users: etudiants,
                titre: "Quiz en cours",
                message: `${partie.titre} — ${seance.cours?.nom_cours ?? "votre séance"}. Rejoignez la partie depuis l'application.`,
                type_notification: "info",
                lien: "/jeux",
            });
            notifies = etudiants.length;
        }
    }
    return { partie, notifies };
};

// ── Jeton du joueur ───────────────────────────────────────────────────────

const signatureJoueur = (cle, gameId, idUser) =>
    crypto.createHmac("sha256", cle).update(`joueur.${gameId}.${idUser}`).digest("base64url").slice(0, 32);

/** Jeton d'un étudiant pour une partie : « <id_user>.<signature> », valable pour cette partie seulement. */
export const jetonJoueur = (gameId, idUser) => {
    const cle = secret();
    return cle ? `${idUser}.${signatureJoueur(cle, gameId, idUser)}` : null;
};

/** Étudiant désigné par un jeton revenu de ClassQuiz, ou null s'il n'a pas été signé pour cette partie. */
export const etudiantDuJeton = (gameId, jeton) => {
    const cle = secret();
    const m = /^(\d{1,10})\.([A-Za-z0-9_-]{32})$/.exec(String(jeton ?? ""));
    if (!cle || !m) return null;
    const attendue = Buffer.from(signatureJoueur(cle, gameId, m[1]));
    const recue = Buffer.from(m[2]);
    return attendue.length === recue.length && crypto.timingSafeEqual(attendue, recue) ? Number(m[1]) : null;
};

const enVue = (partie, user) => {
    const base = urlQuiz();
    const etudiant = user.role === "etudiant";
    const nom = etudiant ? `${user.prenom ?? ""} ${(user.nom ?? "").slice(0, 1)}.`.trim() : null;
    const hid = etudiant ? jetonJoueur(partie.game_id, user.id_user) : null;
    const params = new URLSearchParams({ pin: partie.pin, ...(nom ? { name: nom } : {}), ...(hid ? { hid } : {}) });
    return {
        id: partie.id_quiz_partie,
        titre: partie.titre,
        pin: partie.pin,
        mode: partie.mode,
        demarree_le: partie.demarree_le,
        module: partie.affectation?.cours ? { code: partie.affectation.cours.code_cours, nom: partie.affectation.cours.nom_cours } : null,
        url: base ? `${base}/play?${params}` : null,
    };
};

/**
 * Parties encore proposées : pour un étudiant, celles des séances de ses groupes (et de leurs
 * groupes parents) ; pour un enseignant, les siennes.
 */
export const partiesEnCours = async (user) => {
    const depuis = new Date(Date.now() - DUREE_PROPOSEE_MIN * 60 * 1000);
    const include = [{ model: Affectation, as: "affectation", required: false, include: [{ model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] }] }];

    if (ROLES_ENSEIGNANT.includes(user.role)) {
        const parties = await QuizPartie.findAll({ where: { id_user_enseignant: user.id_user, demarree_le: { [Op.gte]: depuis } }, include, order: [["demarree_le", "DESC"]] });
        return parties.map((p) => enVue(p, user));
    }

    const parties = await QuizPartie.findAll({
        where: { demarree_le: { [Op.gte]: depuis }, id_affectation: { [Op.ne]: null } },
        include,
        order: [["demarree_le", "DESC"]],
    });
    if (!parties.length) return [];
    const mesGroupes = new Set((await Appartenir.findAll({ where: { id_user_etudiant: user.id_user }, attributes: ["id_groupe"] })).map((a) => a.id_groupe));
    const visibles = [];
    for (const partie of parties) {
        // La séance vise un groupe ; ses sous-groupes (où l'étudiant est inscrit) en font partie
        const groupes = await groupesANotifier([partie.affectation.id_groupe]);
        if (groupes.some((g) => mesGroupes.has(g))) visibles.push(enVue(partie, user));
    }
    return visibles;
};

// ── Fin de partie et résultats ─────────────────────────────────────────────

const JOUEURS_MAX = 300;
const MOTS_PAR_NUAGE = 60;

const entierPositif = (valeur) => {
    const n = Math.round(Number(valeur));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 10_000_000) : 0;
};

const cleMot = (texte) =>
    String(texte ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

/** Réponses libres d'une question regroupées (casse, accents et espaces ignorés), les plus fréquentes d'abord */
export const nuageDeMots = (reponses) => {
    const groupes = new Map();
    for (const r of Array.isArray(reponses) ? reponses : []) {
        const texte = String(r ?? "").trim().slice(0, 100);
        const cle = cleMot(texte);
        if (!cle) continue;
        const g = groupes.get(cle) ?? { texte, nombre: 0 };
        g.nombre += 1;
        groupes.set(cle, g);
    }
    return [...groupes.values()].sort((a, b) => b.nombre - a.nombre || a.texte.localeCompare(b.texte)).slice(0, MOTS_PAR_NUAGE);
};

/** Rangs avec ex aequo (1, 2, 2, 4), du meilleur score au moins bon */
export const classer = (joueurs) => {
    const tries = [...joueurs].sort((a, b) => b.score - a.score || a.pseudo.localeCompare(b.pseudo));
    let rang = 0;
    return tries.map((j, i) => {
        if (i === 0 || tries[i - 1].score !== j.score) rang = i + 1;
        return { ...j, rang };
    });
};

const includeSeance = [{ model: Affectation, as: "affectation", required: false, include: [{ model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] }] }];

/**
 * Enregistre la fin d'une partie signalée par le fork (idempotent) et prévient chaque étudiant
 * reconnu de son score. Retourne { partie, resultats } ; null si la partie est inconnue.
 */
export const enregistrerFinPartie = async (evenement) => {
    const partie = await QuizPartie.findOne({ where: { game_id: String(evenement.game_id ?? "") }, include: includeSeance });
    if (!partie) return null;
    if (partie.terminee_le) return { partie, resultats: await QuizResultat.count({ where: { id_quiz_partie: partie.id_quiz_partie } }), deja: true };

    const pseudos = new Set();
    const etudiantsVus = new Set();
    const joueurs = [];
    for (const j of (Array.isArray(evenement.joueurs) ? evenement.joueurs : []).slice(0, JOUEURS_MAX)) {
        const pseudo = String(j?.pseudo ?? "").trim().slice(0, 60);
        if (!pseudo || pseudos.has(pseudo)) continue;
        pseudos.add(pseudo);
        let idUser = etudiantDuJeton(partie.game_id, j.hid);
        // Un même étudiant ne compte qu'une fois (lien partagé : seul le premier pseudo est rattaché)
        if (idUser !== null && etudiantsVus.has(idUser)) idUser = null;
        if (idUser !== null) etudiantsVus.add(idUser);
        joueurs.push({ pseudo, score: entierPositif(j.score), bonnes: entierPositif(j.bonnes), id_user: idUser });
    }
    // Un jeton ne vaut que pour un compte étudiant actif : sinon le score reste anonyme
    const ids = joueurs.map((j) => j.id_user).filter((id) => id !== null);
    const valides = new Set(ids.length ? (await Users.findAll({ where: { id_user: ids, role: "etudiant", actif: true }, attributes: ["id_user"] })).map((u) => u.id_user) : []);
    for (const j of joueurs) if (j.id_user !== null && !valides.has(j.id_user)) j.id_user = null;

    const nuages = (Array.isArray(evenement.questions) ? evenement.questions : [])
        .filter((q) => q?.type === "TEXT")
        .map((q) => ({ index: entierPositif(q.index), question: String(q.question ?? "").slice(0, 300), mots: nuageDeMots(q.reponses_libres) }))
        .filter((q) => q.mots.length);

    const classes = classer(joueurs);
    await sequelize.transaction(async (transaction) => {
        await QuizResultat.bulkCreate(classes.map((j) => ({ ...j, id_quiz_partie: partie.id_quiz_partie })), { transaction });
        await partie.update({ terminee_le: new Date(), nb_questions: entierPositif(evenement.nb_questions), nb_joueurs: classes.length, nuages }, { transaction });
    });

    // Chaque étudiant reconnu reçoit son score (le push suit la notification)
    for (const j of classes.filter((c) => c.id_user !== null)) {
        await creerNotification({
            id_user: j.id_user,
            titre: "Résultats du quiz",
            message: `${partie.titre} : ${j.score} pts, ${j.rang}${j.rang === 1 ? "er" : "e"} sur ${classes.length}.`,
            type_notification: "info",
            lien: "/jeux",
        }).catch(() => {});
    }
    return { partie, resultats: classes.length };
};

/**
 * Défi par équipes : chaque étudiant reconnu compte pour son groupe le plus fin parmi ceux de la
 * séance (TP, sinon TD…) ; les équipes sont classées par score moyen.
 */
const equipesDeLaPartie = async (partie, resultats) => {
    const reconnus = resultats.filter((r) => r.id_user !== null);
    if (!partie.affectation || !reconnus.length) return [];
    const groupe = await Groupe.findByPk(partie.affectation.id_groupe);
    if (!groupe) return [];
    const famille = await Groupe.findAll({ where: { id_filiere: groupe.id_filiere } });
    const parId = new Map([groupe, ...descendants(groupe, famille)].map((g) => [g.id_groupe, g]));
    // Profondeur sous le groupe de la séance : le plus profond est le plus fin
    const profondeur = (g) => {
        let n = 0;
        for (let p = g; p && p.id_groupe !== groupe.id_groupe; p = parId.get(p.id_groupe_parent)) n += 1;
        return n;
    };
    const appartenances = await Appartenir.findAll({ where: { id_user_etudiant: reconnus.map((r) => r.id_user), id_groupe: [...parId.keys()] }, attributes: ["id_user_etudiant", "id_groupe"] });
    const groupeDe = new Map();
    for (const a of appartenances) {
        const actuel = groupeDe.get(a.id_user_etudiant);
        const candidat = parId.get(a.id_groupe);
        if (!actuel || profondeur(candidat) > profondeur(actuel)) groupeDe.set(a.id_user_etudiant, candidat);
    }
    const equipes = new Map();
    for (const r of reconnus) {
        const g = groupeDe.get(r.id_user);
        if (!g) continue;
        const e = equipes.get(g.id_groupe) ?? { id_groupe: g.id_groupe, nom: g.nom_groupe, joueurs: 0, total: 0, meilleur: 0 };
        e.joueurs += 1;
        e.total += r.score;
        e.meilleur = Math.max(e.meilleur, r.score);
        equipes.set(g.id_groupe, e);
    }
    return [...equipes.values()]
        .map((e) => ({ ...e, moyenne: Math.round(e.total / e.joueurs) }))
        .sort((a, b) => b.moyenne - a.moyenne || a.nom.localeCompare(b.nom))
        .map((e, i) => ({ ...e, rang: i + 1 }));
};

const moduleDe = (partie) => (partie.affectation?.cours ? { code: partie.affectation.cours.code_cours, nom: partie.affectation.cours.nom_cours } : null);

/**
 * Résultats d'une partie. L'enseignant qui l'a lancée (et l'administration) voit le classement
 * complet avec les étudiants ; un étudiant de la séance voit son score, le podium (affiché en
 * classe), les équipes et les nuages de mots.
 * @returns {object|null} null si la partie n'existe pas ou ne le concerne pas
 */
export const resultatsPartie = async (user, idPartie) => {
    const id = Number(idPartie);
    if (!Number.isInteger(id) || id <= 0) return null;
    const partie = await QuizPartie.findByPk(id, { include: includeSeance });
    if (!partie) return null;
    const resultats = await QuizResultat.findAll({
        where: { id_quiz_partie: partie.id_quiz_partie },
        include: [{ model: Users, as: "joueur", attributes: ["id_user", "nom", "prenom"], required: false }],
        order: [["rang", "ASC"], ["pseudo", "ASC"]],
    });

    const complet = partie.id_user_enseignant === user.id_user || user.role === "admin";
    let moi = null;
    if (!complet) {
        if (user.role !== "etudiant") return null;
        moi = resultats.find((r) => r.id_user === user.id_user) ?? null;
        // Sans score, l'étudiant doit appartenir à un groupe de la séance
        if (!moi) {
            if (!partie.affectation) return null;
            const groupes = await groupesANotifier([partie.affectation.id_groupe]);
            if (!(await Appartenir.count({ where: { id_user_etudiant: user.id_user, id_groupe: groupes } }))) return null;
        }
    }

    const ligne = (r) => ({
        pseudo: r.pseudo,
        score: r.score,
        bonnes: r.bonnes,
        rang: r.rang,
        ...(complet ? { etudiant: r.joueur ? { id_user: r.joueur.id_user, nom: r.joueur.nom, prenom: r.joueur.prenom } : null } : {}),
    });
    return {
        partie: {
            id: partie.id_quiz_partie,
            titre: partie.titre,
            demarree_le: partie.demarree_le,
            terminee_le: partie.terminee_le,
            nb_questions: partie.nb_questions,
            nb_joueurs: partie.nb_joueurs,
            module: moduleDe(partie),
            date_seance: partie.affectation?.date_seance ?? null,
        },
        classement: (complet ? resultats : resultats.filter((r) => r.rang <= 3)).map(ligne),
        moi: moi ? ligne(moi) : null,
        equipes: await equipesDeLaPartie(partie, resultats),
        nuages: partie.nuages ?? [],
    };
};

/**
 * Historique : pour l'enseignant, ses dernières parties terminées (participants, moyenne) ; pour
 * l'étudiant, ses derniers scores.
 */
export const historiqueQuiz = async (user, limite = 20) => {
    if (ROLES_ENSEIGNANT.includes(user.role)) {
        const parties = await QuizPartie.findAll({ where: { id_user_enseignant: user.id_user, terminee_le: { [Op.ne]: null } }, include: includeSeance, order: [["terminee_le", "DESC"]], limit: limite });
        const moyennes = parties.length
            ? await QuizResultat.findAll({
                  where: { id_quiz_partie: parties.map((p) => p.id_quiz_partie) },
                  attributes: ["id_quiz_partie", [sequelize.fn("AVG", sequelize.col("score")), "moyenne"]],
                  group: ["id_quiz_partie"],
                  raw: true,
              })
            : [];
        const parPartie = new Map(moyennes.map((m) => [m.id_quiz_partie, Math.round(Number(m.moyenne))]));
        return parties.map((p) => ({ id: p.id_quiz_partie, titre: p.titre, terminee_le: p.terminee_le, nb_joueurs: p.nb_joueurs, moyenne: parPartie.get(p.id_quiz_partie) ?? 0, module: moduleDe(p) }));
    }
    const resultats = await QuizResultat.findAll({ where: { id_user: user.id_user }, include: [{ model: QuizPartie, as: "partie", include: includeSeance }], order: [["createdAt", "DESC"]], limit: limite });
    return resultats.map((r) => ({
        id: r.partie.id_quiz_partie,
        titre: r.partie.titre,
        terminee_le: r.partie.terminee_le,
        nb_joueurs: r.partie.nb_joueurs,
        nb_questions: r.partie.nb_questions,
        score: r.score,
        rang: r.rang,
        bonnes: r.bonnes,
        module: moduleDe(r.partie),
    }));
};
