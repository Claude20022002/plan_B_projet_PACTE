import { Op, fn, col, literal } from "sequelize";
import sequelize from "../../config/db.js";
import {
    Annonce,
    AnnonceDestinataire,
    AnnoncePieceJointe,
    Appartenir,
    Campus,
    EnseignementEnseignant,
    EnseignementGroupe,
    Filiere,
    Groupe,
    Notification,
    ResponsableFiliere,
    Users,
} from "../../models/index.js";
import { PORTEES_EVENEMENT } from "../../config/referentiel.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { groupesANotifier } from "../planning/seances.js";
import { filieresDuResponsable } from "../planning/droits.js";
import { ancetres } from "../planning/groupes.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { TYPES_IMAGES_PDF, verifierFichier } from "../../utils/fichiers.js";

/**
 * Annonces ciblées (phase R1, remplace les e-mails d'information de l'école).
 *  - L'administration écrit à n'importe quelle portée (établissement, campus, filière, niveau, groupe).
 *  - Un responsable de filière écrit à sa filière, à l'un de ses niveaux ou à l'un de ses groupes.
 *  - Un enseignant écrit aux étudiants des groupes auxquels il fait cours.
 * Les destinataires sont figés à l'envoi : notification dans l'application (et push), e-mail
 * facultatif, accusé de lecture, relance des non-lus. Une pièce jointe PDF ou image.
 */

export const PUBLICS = ["etudiants", "enseignants", "tous"];
const TITRE_MAX = 200;
const CORPS_MAX = 10000;
const DELAI_RELANCE_MS = 12 * 3600 * 1000;
export const TAILLE_MAX_PIECE = 5 * 1024 * 1024;
export const TYPES_PIECE = TYPES_IMAGES_PDF;

const lienAnnonce = (id) => `/annonces/${id}`;
const unique = (valeurs) => [...new Set(valeurs.filter((v) => v !== null && v !== undefined))];

// ── Droits ───────────────────────────────────────────────────────────────

/** Groupes où l'enseignant fait cours, avec leurs sous-groupes (TD et TP d'une promotion). */
const groupesDeLEnseignant = async (idUser) => {
    const services = await EnseignementEnseignant.findAll({ where: { id_user: idUser, statut_service: { [Op.ne]: "refuse" } }, attributes: ["id_enseignement"] });
    if (!services.length) return [];
    const liens = await EnseignementGroupe.findAll({ where: { id_enseignement: unique(services.map((s) => s.id_enseignement)) }, attributes: ["id_groupe"] });
    return groupesANotifier(unique(liens.map((l) => l.id_groupe)));
};

/**
 * Ce que l'utilisateur peut viser. Administration : tout (`tout: true`). Enseignant : les filières
 * dont il est responsable (tous publics) et les groupes où il fait cours (étudiants seulement).
 */
const droitsDe = async (user) => {
    if (user.role === "admin") return { tout: true };
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé à l'administration et aux enseignants", 403);
    const [filieres, groupesCours] = await Promise.all([filieresDuResponsable(user.id_user), groupesDeLEnseignant(user.id_user)]);
    return { tout: false, filieres: new Set(filieres), groupesCours: new Set(groupesCours) };
};

/** Vérifie la cible et le droit de l'auteur ; renvoie la cible normalisée. */
const verifierCible = async (user, { portee, id_cible, niveau, public: publicVise }) => {
    if (!PORTEES_EVENEMENT.includes(portee)) throw new ErreurMetier("Portée invalide");
    if (!PUBLICS.includes(publicVise)) throw new ErreurMetier("Public invalide");
    const cible = { portee, id_cible: null, niveau: null, public: publicVise };
    let idFiliere = null;
    if (portee !== "etablissement") {
        if (!Number.isInteger(id_cible)) throw new ErreurMetier("Cible requise pour cette portée");
        cible.id_cible = id_cible;
    }
    if (portee === "campus" && !(await Campus.findByPk(id_cible))) throw new ErreurMetier("Campus introuvable", 404);
    if (portee === "filiere" || portee === "niveau") {
        if (!(await Filiere.findByPk(id_cible))) throw new ErreurMetier("Filière introuvable", 404);
        idFiliere = id_cible;
    }
    if (portee === "niveau") {
        if (typeof niveau !== "string" || !niveau.trim()) throw new ErreurMetier("Niveau requis");
        cible.niveau = niveau.trim();
    }
    if (portee === "groupe") {
        const groupe = await Groupe.findByPk(id_cible);
        if (!groupe) throw new ErreurMetier("Groupe introuvable", 404);
        idFiliere = groupe.id_filiere;
    }

    const droits = await droitsDe(user);
    if (droits.tout) return cible;
    if (idFiliere && droits.filieres.has(idFiliere)) return cible;
    if (portee === "groupe" && droits.groupesCours.has(id_cible)) {
        if (publicVise !== "etudiants") throw new ErreurMetier("Un enseignant écrit aux étudiants de ses groupes", 403);
        return cible;
    }
    throw new ErreurMetier("Vous ne pouvez pas écrire à cette cible", 403);
};

// ── Destinataires ────────────────────────────────────────────────────────

/** Groupes couverts par la portée (avec leurs sous-groupes) ; null pour tout l'établissement. */
const groupesDeLaCible = async ({ portee, id_cible, niveau }) => {
    if (portee === "etablissement") return null;
    let racines;
    if (portee === "groupe") racines = [id_cible];
    else {
        const where = {};
        if (portee === "campus") where.id_filiere = (await Filiere.findAll({ where: { id_campus_prefere: id_cible }, attributes: ["id_filiere"] })).map((f) => f.id_filiere);
        else where.id_filiere = id_cible;
        if (portee === "niveau") where.niveau = niveau;
        racines = (await Groupe.findAll({ where, attributes: ["id_groupe"] })).map((g) => g.id_groupe);
    }
    return racines.length ? groupesANotifier(racines) : [];
};

/** Comptes actifs concernés par la cible, sans l'auteur. */
const destinatairesDe = async (cible, idAuteur) => {
    const groupes = await groupesDeLaCible(cible);
    const ids = [];
    const roles = cible.public === "tous" ? ["etudiant", "enseignant"] : [cible.public === "etudiants" ? "etudiant" : "enseignant"];

    if (groupes === null) {
        ids.push(...(await Users.findAll({ where: { role: roles, actif: true }, attributes: ["id_user"] })).map((u) => u.id_user));
    } else if (groupes.length) {
        if (roles.includes("etudiant")) {
            ids.push(...(await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] })).map((a) => a.id_user_etudiant));
        }
        if (roles.includes("enseignant")) {
            // Enseignants des groupes visés et de leurs groupes parents (le CM de la promotion d'un TD),
            // plus les responsables des filières concernées
            const tous = await Groupe.findAll({ where: { id_groupe: groupes }, attributes: ["id_groupe", "id_filiere"] });
            const famille = await Groupe.findAll({ where: { id_filiere: unique(tous.map((g) => g.id_filiere)) }, attributes: ["id_groupe", "id_groupe_parent", "id_filiere"] });
            const parId = new Map(famille.map((g) => [g.id_groupe, g]));
            const lignee = unique(tous.flatMap((g) => [g.id_groupe, ...ancetres(parId.get(g.id_groupe) ?? g, parId).map((a) => a.id_groupe)]));
            const liens = await EnseignementGroupe.findAll({ where: { id_groupe: lignee }, attributes: ["id_enseignement"] });
            if (liens.length) {
                const services = await EnseignementEnseignant.findAll({ where: { id_enseignement: unique(liens.map((l) => l.id_enseignement)), statut_service: { [Op.ne]: "refuse" } }, attributes: ["id_user"] });
                ids.push(...services.map((s) => s.id_user));
            }
            const responsables = await ResponsableFiliere.findAll({ where: { id_filiere: unique(tous.map((g) => g.id_filiere)) }, attributes: ["id_user"] });
            ids.push(...responsables.map((r) => r.id_user));
        }
    }
    const candidats = unique(ids).filter((id) => id !== idAuteur);
    if (!candidats.length) return [];
    return Users.findAll({ where: { id_user: candidats, actif: true, role: roles }, attributes: ["id_user", "email"] });
};

/** Libellé lisible de la cible : « Tout l'établissement », « IIIA · 4A », « Groupe TD1 »… */
const libellesCibles = async (annonces) => {
    const ids = (portee) => unique(annonces.filter((a) => a.portee === portee || (portee === "filiere" && a.portee === "niveau")).map((a) => a.id_cible));
    const [campus, filieres, groupes] = await Promise.all([
        Campus.findAll({ where: { id_campus: ids("campus") }, attributes: ["id_campus", "nom"] }),
        Filiere.findAll({ where: { id_filiere: ids("filiere") }, attributes: ["id_filiere", "code_filiere"] }),
        Groupe.findAll({ where: { id_groupe: ids("groupe") }, attributes: ["id_groupe", "nom_groupe"] }),
    ]);
    const nomCampus = new Map(campus.map((c) => [c.id_campus, c.nom]));
    const codeFiliere = new Map(filieres.map((f) => [f.id_filiere, f.code_filiere]));
    const nomGroupe = new Map(groupes.map((g) => [g.id_groupe, g.nom_groupe]));
    return (a) => {
        if (a.portee === "etablissement") return "Tout l'établissement";
        if (a.portee === "campus") return `Campus ${nomCampus.get(a.id_cible) ?? ""}`.trim();
        if (a.portee === "filiere") return codeFiliere.get(a.id_cible) ?? "Filière";
        if (a.portee === "niveau") return `${codeFiliere.get(a.id_cible) ?? "Filière"} · ${a.niveau}`;
        return `Groupe ${nomGroupe.get(a.id_cible) ?? ""}`.trim();
    };
};

// ── Envoi ────────────────────────────────────────────────────────────────

const apercu = (texte) => (texte.length > 200 ? `${texte.slice(0, 197)}…` : texte);

/** E-mails après validation, un par un, sans jamais bloquer ni faire échouer l'envoi. */
const envoyerEmails = (destinataires, annonce, auteur) => {
    const sujet = `[HESTIM] ${annonce.titre}`;
    const texte = `${annonce.corps}\n\n${auteur.prenom} ${auteur.nom}\nÀ retrouver dans HESTIM Planner, rubrique Annonces.`;
    (async () => {
        for (const d of destinataires) {
            if (!d.email) continue;
            try {
                await sendEmail({ to: d.email, subject: sujet, text: texte });
            } catch (error) {
                console.error("E-mail d'annonce impossible :", error.message);
            }
        }
    })();
};

/** Cibles proposées dans le formulaire, selon les droits de l'utilisateur. */
export const ciblesPossibles = async (user) => {
    const droits = await droitsDe(user);
    const groupesVisibles = droits.tout
        ? await Groupe.findAll({ attributes: ["id_groupe", "nom_groupe", "niveau", "id_filiere", "type_groupe"], order: [["nom_groupe", "ASC"]] })
        : await Groupe.findAll({
              where: { [Op.or]: [{ id_filiere: [...droits.filieres] }, { id_groupe: [...droits.groupesCours] }] },
              attributes: ["id_groupe", "nom_groupe", "niveau", "id_filiere", "type_groupe"],
              order: [["nom_groupe", "ASC"]],
          });
    const filieres = await Filiere.findAll({
        where: droits.tout ? {} : { id_filiere: [...droits.filieres] },
        attributes: ["id_filiere", "code_filiere", "nom_filiere"],
        order: [["code_filiere", "ASC"]],
    });
    const niveauxParFiliere = new Map();
    for (const g of groupesVisibles) {
        if (!g.niveau) continue;
        if (!niveauxParFiliere.has(g.id_filiere)) niveauxParFiliere.set(g.id_filiere, new Set());
        niveauxParFiliere.get(g.id_filiere).add(g.niveau);
    }
    const responsable = droits.tout || droits.filieres.size > 0;
    return {
        portees: droits.tout ? PORTEES_EVENEMENT : responsable ? ["filiere", "niveau", "groupe"] : ["groupe"],
        publics: responsable ? PUBLICS : ["etudiants"],
        campus: droits.tout ? (await Campus.findAll({ where: { actif: true }, attributes: ["id_campus", "nom"] })).map((c) => ({ id: c.id_campus, nom: c.nom })) : [],
        filieres: filieres.map((f) => ({ id: f.id_filiere, code: f.code_filiere, nom: f.nom_filiere, niveaux: [...(niveauxParFiliere.get(f.id_filiere) ?? [])].sort() })),
        groupes: groupesVisibles.map((g) => ({ id: g.id_groupe, nom: g.nom_groupe, niveau: g.niveau, id_filiere: g.id_filiere, type: g.type_groupe })),
    };
};

/** Publie une annonce : destinataires figés, notifications (et push) après validation, e-mails facultatifs. */
export const publierAnnonce = async (user, donnees) => {
    const titre = typeof donnees.titre === "string" ? donnees.titre.trim() : "";
    const corps = typeof donnees.corps === "string" ? donnees.corps.trim() : "";
    if (!titre || titre.length > TITRE_MAX) throw new ErreurMetier(`Titre requis (${TITRE_MAX} caractères au plus)`);
    if (!corps || corps.length > CORPS_MAX) throw new ErreurMetier(`Message requis (${CORPS_MAX} caractères au plus)`);
    const cible = await verifierCible(user, { ...donnees, public: donnees.public ?? "etudiants" });
    const destinataires = await destinatairesDe(cible, user.id_user);
    if (!destinataires.length) throw new ErreurMetier("Personne n'est concerné par cette cible", 422);

    const annonce = await sequelize.transaction(async (transaction) => {
        const creee = await Annonce.create({ titre, corps, ...cible, envoyer_email: donnees.envoyer_email === true, id_user_auteur: user.id_user }, { transaction });
        await AnnonceDestinataire.bulkCreate(destinataires.map((d) => ({ id_annonce: creee.id_annonce, id_user: d.id_user })), { transaction });
        await Notification.bulkCreate(
            destinataires.map((d) => ({ id_user: d.id_user, titre: `Annonce : ${titre}`, message: apercu(corps), type_notification: "info", lue: false, lien: lienAnnonce(creee.id_annonce) })),
            { transaction, individualHooks: true }
        );
        return creee;
    });
    if (annonce.envoyer_email) envoyerEmails(destinataires, annonce, user);
    return { id: annonce.id_annonce, destinataires: destinataires.length };
};

// ── Lecture ──────────────────────────────────────────────────────────────

const ATTRIBUTS_AUTEUR = ["id_user", "prenom", "nom", "role"];
const ATTRIBUTS_PIECE = ["nom", "type_mime", "taille"];
const pieceVue = (p) => (p ? { nom: p.nom, type: p.type_mime, taille: p.taille } : null);

/** Annonces reçues, de la plus récente à la plus ancienne, avec le nombre de non-lues. */
export const annoncesRecues = async (user, { limite = 50 } = {}) => {
    const liens = await AnnonceDestinataire.findAll({
        where: { id_user: user.id_user },
        include: [{
            model: Annonce,
            as: "annonce",
            required: true,
            include: [
                { model: Users, as: "auteur", attributes: ATTRIBUTS_AUTEUR },
                { model: AnnoncePieceJointe, as: "pieceJointe", attributes: ATTRIBUTS_PIECE },
            ],
        }],
        order: [[{ model: Annonce, as: "annonce" }, "createdAt", "DESC"]],
        limit: Math.min(Math.max(Number(limite) || 50, 1), 200),
    });
    const libelle = await libellesCibles(liens.map((l) => l.annonce));
    const nonLues = await AnnonceDestinataire.count({ where: { id_user: user.id_user, lu_le: null } });
    return {
        non_lues: nonLues,
        annonces: liens.map(({ annonce: a, lu_le }) => ({
            id: a.id_annonce,
            titre: a.titre,
            corps: a.corps,
            cible: libelle(a),
            auteur: a.auteur ? { prenom: a.auteur.prenom, nom: a.auteur.nom, role: a.auteur.role } : null,
            date: a.createdAt,
            lu_le,
            piece_jointe: pieceVue(a.pieceJointe),
        })),
    };
};

/** L'annonce si l'utilisateur en est destinataire, auteur ou administrateur ; sinon 404. */
const annonceVisible = async (user, id) => {
    const annonce = await Annonce.findByPk(id, { include: [{ model: Users, as: "auteur", attributes: ATTRIBUTS_AUTEUR }, { model: AnnoncePieceJointe, as: "pieceJointe", attributes: ATTRIBUTS_PIECE }] });
    if (!annonce) throw new ErreurMetier("Annonce introuvable", 404);
    const auteur = user.role === "admin" || annonce.id_user_auteur === user.id_user;
    const lien = auteur ? null : await AnnonceDestinataire.findOne({ where: { id_annonce: annonce.id_annonce, id_user: user.id_user } });
    if (!auteur && !lien) throw new ErreurMetier("Annonce introuvable", 404);
    return { annonce, auteur, lien };
};

export const detailAnnonce = async (user, id) => {
    const { annonce: a, auteur, lien } = await annonceVisible(user, id);
    const libelle = await libellesCibles([a]);
    return {
        id: a.id_annonce,
        titre: a.titre,
        corps: a.corps,
        cible: libelle(a),
        public: a.public,
        auteur: a.auteur ? { prenom: a.auteur.prenom, nom: a.auteur.nom, role: a.auteur.role } : null,
        date: a.createdAt,
        lu_le: lien?.lu_le ?? null,
        piece_jointe: pieceVue(a.pieceJointe),
        est_auteur: auteur,
    };
};

/** Accusé de lecture : la première lecture compte ; la notification de l'annonce passe en lue. */
export const marquerLue = async (user, id) => {
    const lien = await AnnonceDestinataire.findOne({ where: { id_annonce: id, id_user: user.id_user } });
    if (!lien) throw new ErreurMetier("Annonce introuvable", 404);
    if (!lien.lu_le) await lien.update({ lu_le: new Date() });
    await Notification.update({ lue: true }, { where: { id_user: user.id_user, lien: lienAnnonce(id), lue: false } });
    return { lu_le: lien.lu_le };
};

// ── Suivi par l'auteur ───────────────────────────────────────────────────

/** Annonces envoyées (toutes pour l'administration), avec le nombre de lus. */
export const annoncesEnvoyees = async (user) => {
    await droitsDe(user);
    const annonces = await Annonce.findAll({
        where: user.role === "admin" ? {} : { id_user_auteur: user.id_user },
        include: [{ model: Users, as: "auteur", attributes: ATTRIBUTS_AUTEUR }, { model: AnnoncePieceJointe, as: "pieceJointe", attributes: ATTRIBUTS_PIECE }],
        order: [["createdAt", "DESC"]],
        limit: 200,
    });
    if (!annonces.length) return [];
    const stats = await AnnonceDestinataire.findAll({
        where: { id_annonce: annonces.map((a) => a.id_annonce) },
        attributes: ["id_annonce", [fn("COUNT", col("id_user")), "total"], [fn("SUM", literal("lu_le IS NOT NULL")), "lus"]],
        group: ["id_annonce"],
        raw: true,
    });
    const parAnnonce = new Map(stats.map((s) => [s.id_annonce, { total: Number(s.total), lus: Number(s.lus) }]));
    const libelle = await libellesCibles(annonces);
    return annonces.map((a) => ({
        id: a.id_annonce,
        titre: a.titre,
        corps: a.corps,
        cible: libelle(a),
        public: a.public,
        envoyer_email: a.envoyer_email,
        auteur: a.auteur ? { prenom: a.auteur.prenom, nom: a.auteur.nom, role: a.auteur.role } : null,
        date: a.createdAt,
        relancee_le: a.relancee_le,
        piece_jointe: pieceVue(a.pieceJointe),
        destinataires: parAnnonce.get(a.id_annonce)?.total ?? 0,
        lus: parAnnonce.get(a.id_annonce)?.lus ?? 0,
    }));
};

const annonceDeLAuteur = async (user, id) => {
    const annonce = await Annonce.findByPk(id);
    if (!annonce) throw new ErreurMetier("Annonce introuvable", 404);
    if (user.role !== "admin" && annonce.id_user_auteur !== user.id_user) throw new ErreurMetier("Réservé à l'auteur de l'annonce", 403);
    return annonce;
};

/** Qui a lu, qui n'a pas lu (les non-lus d'abord). */
export const lecteurs = async (user, id) => {
    await annonceDeLAuteur(user, id);
    const liens = await AnnonceDestinataire.findAll({ where: { id_annonce: id }, include: [{ model: Users, as: "user", attributes: ["prenom", "nom", "role"] }] });
    return liens
        .map((l) => ({ id_user: l.id_user, prenom: l.user?.prenom, nom: l.user?.nom, role: l.user?.role, lu_le: l.lu_le }))
        .sort((a, b) => Number(Boolean(a.lu_le)) - Number(Boolean(b.lu_le)) || `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"));
};

/** Relance les non-lus (une fois toutes les 12 heures au plus). */
export const relancer = async (user, id) => {
    const annonce = await annonceDeLAuteur(user, id);
    const derniere = annonce.relancee_le ?? annonce.createdAt;
    if (annonce.relancee_le && Date.now() - new Date(derniere).getTime() < DELAI_RELANCE_MS) {
        throw new ErreurMetier("Déjà relancée il y a moins de 12 heures", 429);
    }
    const nonLus = await AnnonceDestinataire.findAll({ where: { id_annonce: id, lu_le: null }, attributes: ["id_user"] });
    if (!nonLus.length) return { relances: 0 };
    await sequelize.transaction(async (transaction) => {
        await Notification.bulkCreate(
            nonLus.map((d) => ({ id_user: d.id_user, titre: `Rappel : ${annonce.titre}`, message: apercu(annonce.corps), type_notification: "warning", lue: false, lien: lienAnnonce(id) })),
            { transaction, individualHooks: true }
        );
        await annonce.update({ relancee_le: new Date() }, { transaction });
    });
    return { relances: nonLus.length };
};

export const supprimerAnnonce = async (user, id) => {
    const annonce = await annonceDeLAuteur(user, id);
    await sequelize.transaction(async (transaction) => {
        await Notification.destroy({ where: { lien: lienAnnonce(id) }, transaction });
        await annonce.destroy({ transaction });
    });
};

// ── Pièce jointe ─────────────────────────────────────────────────────────

/** Ajoute ou remplace la pièce jointe (l'auteur seulement). */
export const deposerPieceJointe = async (user, id, { contenu, type, nom }) => {
    await annonceDeLAuteur(user, id);
    const donnees = { id_annonce: id, ...verifierFichier({ contenu, type, nom }, { types: TYPES_PIECE, tailleMax: TAILLE_MAX_PIECE, libelleTypes: "PDF, PNG, JPEG ou WebP" }) };
    await AnnoncePieceJointe.upsert(donnees);
    return pieceVue(donnees);
};

/** Pièce jointe pour un destinataire, l'auteur ou l'administration. */
export const lirePieceJointe = async (user, id) => {
    await annonceVisible(user, id);
    const piece = await AnnoncePieceJointe.findByPk(id);
    if (!piece) throw new ErreurMetier("Pas de pièce jointe", 404);
    return piece;
};
