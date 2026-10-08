import crypto from "crypto";
import { UniqueConstraintError } from "sequelize";
import { Affectation, AppareilEtudiant, AppelSeance, Appartenir, Cours, Creneau, Enseignement, EnseignementEnseignant, Groupe, Presence, Salle, SignalementPresence, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { groupesANotifier } from "../planning/seances.js";

/**
 * Appel par QR code en séance (phase I1). L'enseignant ouvre l'appel le jour de la séance et
 * affiche un QR code qui change toutes les 30 secondes : « id.fenêtre.signature », signé par un
 * secret propre à l'appel (HMAC-SHA256). Un code reste valable une minute (fenêtre courante et
 * précédente) : une photo du QR envoyée à un absent ne sert plus longtemps. L'étudiant le scanne
 * depuis l'application (ou l'appareil photo du téléphone : le QR est une adresse du site). Seuls
 * les étudiants des groupes de la séance sont acceptés. L'enseignant peut cocher à la main ; en
 * fermant l'appel, la séance est marquée réalisée (suivi du réalisé, P7).
 *
 * Anti-fraude : le scan ne passe que par l'application (identifiant d'installation), et un même
 * téléphone ne pointe qu'un seul étudiant par séance (sinon refus et signalement des deux). Un
 * compte = un téléphone : au premier scan, le compte est lié au téléphone ; ensuite un scan depuis
 * un autre téléphone, ou depuis le téléphone lié à un autre compte, est refusé et signalé
 * (l'administration délie en cas de changement de téléphone). Si
 * l'enseignant le souhaite (facultatif), une vérification surprise tire quelques présents au
 * hasard : il les appelle, un absent perd sa présence et est signalé.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
export const FENETRE_MS = 30 * 1000;
const CODE = /^(\d{1,10})\.(\d{1,12})\.([A-Za-z0-9_-]{22})$/;
const STATUTS_FERMABLES = ["planifie", "confirme", "reporte"];
const APPAREIL = /^[A-Za-z0-9_-]{16,64}$/;
export const VERIFICATION_MAX = 5;

const aujourdhui = (maintenant = new Date()) => maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU });
const fenetreDe = (maintenant = new Date()) => Math.floor(maintenant.getTime() / FENETRE_MS);
const signature = (secret, idSeance, fenetre) => crypto.createHmac("sha256", secret).update(`${idSeance}.${fenetre}`).digest("base64url").slice(0, 22);
const egal = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const empreinteAppareil = (appareil) => crypto.createHash("sha256").update(appareil).digest("hex");
const nomComplet = (u) => (u ? `${u.prenom} ${u.nom}` : null);
export const adresseDuCode = (code) => `${(process.env.FRONTEND_URL || "").replace(/\/$/, "")}/presence?c=${encodeURIComponent(code)}`;

const seanceOuErreur = async (id) => {
    const n = Number(id);
    const seance = Number.isInteger(n) && n > 0
        ? await Affectation.findByPk(n, {
              include: [
                  { model: Cours, as: "cours", attributes: ["nom_cours"] },
                  { model: Creneau, as: "creneau", attributes: ["heure_debut", "heure_fin"] },
                  { model: Salle, as: "salle" },
                  { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe"] },
                  {
                      model: Enseignement,
                      as: "enseignement",
                      attributes: ["id_enseignement"],
                      include: [
                          { model: EnseignementEnseignant, as: "services", attributes: ["id_user", "role", "statut_service"], required: false },
                          { model: Groupe, as: "groupes", attributes: ["id_groupe"], through: { attributes: [] } },
                      ],
                  },
              ],
          })
        : null;
    if (!seance) throw new ErreurMetier("Séance introuvable", 404);
    return seance;
};

/** Enseignant principal ou co-enseignant de la séance, ou administration. */
const peutFaireAppel = (user, seance) =>
    user.role === "admin" ||
    (user.role === "enseignant" &&
        (seance.id_user_enseignant === user.id_user || (seance.enseignement?.services ?? []).some((s) => s.id_user === user.id_user && s.role === "co_enseignant" && s.statut_service !== "refuse")));

const seanceDeLEnseignant = async (user, id) => {
    const seance = await seanceOuErreur(id);
    if (!peutFaireAppel(user, seance)) throw new ErreurMetier("Réservé aux enseignants de la séance", 403);
    return seance;
};

/** Étudiants attendus : ceux des groupes de la séance (et des enseignements mutualisés) et de leurs sous-groupes. */
const etudiantsAttendus = async (seance) => {
    const racines = [seance.id_groupe, ...(seance.enseignement?.groupes ?? []).map((g) => g.id_groupe)].filter(Boolean);
    const groupes = await groupesANotifier([...new Set(racines)]);
    if (!groupes.length) return [];
    const ids = [...new Set((await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] })).map((a) => a.id_user_etudiant))];
    return ids.length ? Users.findAll({ where: { id_user: ids, actif: true, role: "etudiant" }, attributes: ["id_user", "nom", "prenom"], order: [["nom", "ASC"], ["prenom", "ASC"]] }) : [];
};

const codeCourant = (appel, maintenant = new Date()) => {
    const fenetre = fenetreDe(maintenant);
    return {
        code: `${appel.id_affectation}.${fenetre}.${signature(appel.secret, appel.id_affectation, fenetre)}`,
        expire_dans_ms: (fenetre + 1) * FENETRE_MS - maintenant.getTime(),
    };
};

const resume = (seance) => ({
    id: seance.id_affectation,
    cours: seance.cours?.nom_cours ?? "Séance",
    date: String(seance.date_seance).slice(0, 10),
    heure_debut: String(seance.creneau?.heure_debut ?? "").slice(0, 5),
    heure_fin: String(seance.creneau?.heure_fin ?? "").slice(0, 5),
    salle: seance.salle?.nom_salle ?? null,
    groupe: seance.groupe?.nom_groupe ?? null,
});

// ── Enseignant ───────────────────────────────────────────────────────────

/** Ouvrir (ou rouvrir) l'appel, le jour de la séance seulement. */
export const ouvrirAppel = async (user, id, maintenant = new Date()) => {
    const seance = await seanceDeLEnseignant(user, id);
    if (seance.statut === "annule") throw new ErreurMetier("Séance annulée", 409);
    if (String(seance.date_seance).slice(0, 10) !== aujourdhui(maintenant)) throw new ErreurMetier("L'appel se fait le jour de la séance", 409);
    const existant = await AppelSeance.findByPk(seance.id_affectation);
    const appel = existant
        ? await existant.update({ ferme_le: null })
        : await AppelSeance.create({ id_affectation: seance.id_affectation, secret: crypto.randomBytes(32).toString("base64url"), ouvert_le: maintenant, id_user_ouverture: user.id_user });
    return { seance: resume(seance), ...codeCourant(appel, maintenant), url: adresseDuCode(codeCourant(appel, maintenant).code) };
};

/** Code à afficher maintenant (l'écran de l'enseignant le redemande avant expiration), avec le nombre de présents. */
export const codeDeLAppel = async (user, id, maintenant = new Date()) => {
    const seance = await seanceDeLEnseignant(user, id);
    const appel = await AppelSeance.findByPk(seance.id_affectation);
    if (!appel || appel.ferme_le) throw new ErreurMetier("L'appel n'est pas ouvert", 409);
    const courant = codeCourant(appel, maintenant);
    const presents = await Presence.count({ where: { id_affectation: seance.id_affectation } });
    return { ...courant, url: adresseDuCode(courant.code), presents };
};

/** Liste d'appel : attendus, présents (et comment), état de l'appel. */
export const listeDAppel = async (user, id) => {
    const seance = await seanceDeLEnseignant(user, id);
    const [attendus, presences, appel, signalements] = await Promise.all([
        etudiantsAttendus(seance),
        Presence.findAll({ where: { id_affectation: seance.id_affectation } }),
        AppelSeance.findByPk(seance.id_affectation),
        SignalementPresence.findAll({
            where: { id_affectation: seance.id_affectation },
            include: [{ model: Users, as: "lie", attributes: ["nom", "prenom"] }],
            order: [["createdAt", "ASC"], ["id_signalement", "ASC"]],
        }),
    ]);
    const parEtudiant = new Map(presences.map((p) => [p.id_user, p]));
    const signalesDe = (idUser) => signalements.filter((s) => s.id_user === idUser).map((s) => ({ motif: s.motif, lie: nomComplet(s.lie) }));
    return {
        seance: resume(seance),
        appel: appel ? { ouvert: !appel.ferme_le, ouvert_le: appel.ouvert_le, ferme_le: appel.ferme_le } : null,
        presents: presences.length,
        etudiants: attendus.map((e) => ({
            id_user: e.id_user,
            nom: e.nom,
            prenom: e.prenom,
            present: parEtudiant.has(e.id_user),
            source: parEtudiant.get(e.id_user)?.source ?? null,
            marque_le: parEtudiant.get(e.id_user)?.marque_le ?? null,
            verifie: Boolean(parEtudiant.get(e.id_user)?.verifie_le),
            signalements: signalesDe(e.id_user),
        })),
    };
};

/** Cocher ou décocher un étudiant attendu (enseignant). */
export const marquerPresence = async (user, id, idEtudiant, present) => {
    const seance = await seanceDeLEnseignant(user, id);
    if (!(await etudiantsAttendus(seance)).some((e) => e.id_user === idEtudiant)) throw new ErreurMetier("Cet étudiant n'est pas attendu à cette séance", 404);
    if (present) {
        await Presence.findOrCreate({ where: { id_affectation: seance.id_affectation, id_user: idEtudiant }, defaults: { source: "manuel", marque_le: new Date() } });
    } else {
        await Presence.destroy({ where: { id_affectation: seance.id_affectation, id_user: idEtudiant } });
    }
    return { present: Boolean(present) };
};

/**
 * Vérification surprise, facultative (l'enseignant la lance s'il le souhaite) : tire au hasard des
 * étudiants présents par scan et pas encore vérifiés, qu'il appelle à voix haute.
 */
export const tirerVerification = async (user, id, nombre = 3) => {
    const seance = await seanceDeLEnseignant(user, id);
    const n = Math.min(VERIFICATION_MAX, Math.max(1, Number.parseInt(nombre, 10) || 3));
    const candidats = await Presence.findAll({
        where: { id_affectation: seance.id_affectation, source: "qr", verifie_le: null },
        include: [{ model: Users, as: "etudiant", attributes: ["id_user", "nom", "prenom"] }],
    });
    // Mélange de Fisher-Yates avec un hasard non prévisible
    for (let i = candidats.length - 1; i > 0; i -= 1) {
        const j = crypto.randomInt(i + 1);
        [candidats[i], candidats[j]] = [candidats[j], candidats[i]];
    }
    return {
        etudiants: candidats.slice(0, n).map((p) => ({ id_user: p.id_user, nom: p.etudiant?.nom, prenom: p.etudiant?.prenom })),
        restants: Math.max(0, candidats.length - n),
    };
};

/** Résultat de la vérification : vu dans la salle (présence confirmée) ou absent (présence retirée, signalement). */
export const verifierEtudiant = async (user, id, idEtudiant, present, maintenant = new Date()) => {
    const seance = await seanceDeLEnseignant(user, id);
    const presence = await Presence.findOne({ where: { id_affectation: seance.id_affectation, id_user: idEtudiant } });
    if (!presence) throw new ErreurMetier("Cet étudiant n'est pas marqué présent", 404);
    if (present) {
        await presence.update({ verifie_le: maintenant });
        return { present: true };
    }
    await presence.destroy();
    await SignalementPresence.create({ id_affectation: seance.id_affectation, id_user: idEtudiant, motif: "absent_verification", id_user_auteur: user.id_user });
    return { present: false };
};

/** Fermer l'appel : les codes ne passent plus, la séance est marquée réalisée. */
export const fermerAppel = async (user, id, maintenant = new Date()) => {
    const seance = await seanceDeLEnseignant(user, id);
    const appel = await AppelSeance.findByPk(seance.id_affectation);
    if (!appel) throw new ErreurMetier("Aucun appel pour cette séance", 404);
    await appel.update({ ferme_le: maintenant });
    if (STATUTS_FERMABLES.includes(seance.statut)) await seance.update({ statut: "realise" });
    return { presents: await Presence.count({ where: { id_affectation: seance.id_affectation } }), statut: seance.statut };
};

// ── Étudiant ─────────────────────────────────────────────────────────────

const signalerAppareilPartage = async (idSeance, a, b) => {
    for (const [id_user, id_user_lie] of [[a, b], [b, a]]) {
        await SignalementPresence.findOrCreate({ where: { id_affectation: idSeance, id_user, id_user_lie, motif: "appareil_partage" } });
    }
};

const refusAppareilPartage = () =>
    new ErreurMetier("Ce téléphone a déjà servi à l'appel d'un autre étudiant pour cette séance : chacun scanne avec son propre téléphone. L'enseignant en est averti.", 409);

/**
 * Un compte = un téléphone. Premier scan : le compte est lié à ce téléphone. Ensuite, refus et
 * signalement si le compte est lié à un autre téléphone, ou si ce téléphone est lié à un autre compte.
 */
const verifierTelephoneDuCompte = async (idSeance, idUser, empreinte, maintenant) => {
    const [duCompte, duTelephone] = await Promise.all([AppareilEtudiant.findByPk(idUser), AppareilEtudiant.findOne({ where: { appareil: empreinte } })]);
    if (duCompte?.appareil === empreinte) return;
    if (duCompte) {
        await SignalementPresence.findOrCreate({ where: { id_affectation: idSeance, id_user: idUser, motif: "autre_telephone" } });
        throw new ErreurMetier("Votre compte est lié à un autre téléphone. Pointez avec votre téléphone habituel ; si vous en avez changé, demandez à l'administration de délier l'ancien. L'enseignant en est averti.", 409);
    }
    const refusTelephoneDUnAutre = async (proprietaire) => {
        await SignalementPresence.findOrCreate({ where: { id_affectation: idSeance, id_user: idUser, id_user_lie: proprietaire, motif: "telephone_d_un_autre" } });
        return new ErreurMetier("Ce téléphone est lié au compte d'un autre étudiant : chacun pointe avec son propre téléphone. L'enseignant en est averti.", 409);
    };
    if (duTelephone) throw await refusTelephoneDUnAutre(duTelephone.id_user);
    try {
        await AppareilEtudiant.create({ id_user: idUser, appareil: empreinte, lie_le: maintenant });
    } catch (erreur) {
        if (!(erreur instanceof UniqueConstraintError)) throw erreur;
        // Deux premiers scans simultanés : on relit qui a gagné
        const gagnant = await AppareilEtudiant.findOne({ where: { appareil: empreinte } });
        if (gagnant?.id_user === idUser) return;
        if (gagnant) throw await refusTelephoneDUnAutre(gagnant.id_user);
        return verifierTelephoneDuCompte(idSeance, idUser, empreinte, maintenant);
    }
};

/**
 * Scan d'un code (ou de l'adresse du QR) depuis l'application : présence enregistrée une fois.
 * `appareil` est l'identifiant d'installation de l'application ; seule son empreinte est conservée.
 */
export const scannerCode = async (user, brut, maintenant = new Date(), appareil = null) => {
    if (user.role !== "etudiant") throw new ErreurMetier("Réservé aux étudiants", 403);
    if (typeof appareil !== "string" || !APPAREIL.test(appareil)) throw new ErreurMetier("Scannez le QR code avec l'application HESTIM à jour (icône QR de l'accueil)", 403);
    let texte = String(brut ?? "").trim();
    // Le QR contient une adresse « …/presence?c=CODE » : on en extrait le code
    const dansAdresse = /[?&]c=([^&#]+)/.exec(texte);
    if (dansAdresse) texte = decodeURIComponent(dansAdresse[1]);
    const morceaux = CODE.exec(texte);
    if (!morceaux) throw new ErreurMetier("Ce QR code n'est pas un appel HESTIM", 400);
    const [, idTexte, fenetreTexte, sig] = morceaux;
    const appel = await AppelSeance.findByPk(Number(idTexte));
    if (!appel || appel.ferme_le) throw new ErreurMetier("L'appel de cette séance est fermé", 409);
    const fenetre = Number(fenetreTexte);
    const courante = fenetreDe(maintenant);
    if (fenetre !== courante && fenetre !== courante - 1) throw new ErreurMetier("Code expiré : scannez le QR affiché maintenant", 410);
    if (!egal(sig, signature(appel.secret, appel.id_affectation, fenetre))) throw new ErreurMetier("Code invalide", 400);

    const seance = await seanceOuErreur(appel.id_affectation);
    if (!(await etudiantsAttendus(seance)).some((e) => e.id_user === user.id_user)) throw new ErreurMetier("Vous n'êtes pas inscrit dans un groupe de cette séance", 403);
    if (await Presence.findOne({ where: { id_affectation: seance.id_affectation, id_user: user.id_user } })) return { seance: resume(seance), deja: true };

    // Un téléphone = un étudiant par séance
    const empreinte = empreinteAppareil(appareil);
    const dejaPointe = await Presence.findOne({ where: { id_affectation: seance.id_affectation, appareil: empreinte } });
    if (dejaPointe) {
        await signalerAppareilPartage(seance.id_affectation, user.id_user, dejaPointe.id_user);
        throw refusAppareilPartage();
    }
    // Un compte = un téléphone (au-delà de cette séance)
    await verifierTelephoneDuCompte(seance.id_affectation, user.id_user, empreinte, maintenant);
    try {
        await Presence.create({ id_affectation: seance.id_affectation, id_user: user.id_user, source: "qr", marque_le: maintenant, appareil: empreinte });
    } catch (erreur) {
        if (!(erreur instanceof UniqueConstraintError)) throw erreur;
        // Deux scans simultanés : même étudiant (déjà présent) ou même téléphone (partagé)
        const gagnant = await Presence.findOne({ where: { id_affectation: seance.id_affectation, appareil: empreinte } });
        if (gagnant && gagnant.id_user !== user.id_user) {
            await signalerAppareilPartage(seance.id_affectation, user.id_user, gagnant.id_user);
            throw refusAppareilPartage();
        }
        return { seance: resume(seance), deja: true };
    }
    return { seance: resume(seance), deja: false };
};

/** Mes présences récentes (étudiant) : séances passées de mes groupes, présent ou non. */
export const mesPresences = async (user) => {
    if (user.role !== "etudiant") throw new ErreurMetier("Réservé aux étudiants", 403);
    const presences = await Presence.findAll({ where: { id_user: user.id_user }, attributes: ["id_affectation", "marque_le"], order: [["marque_le", "DESC"]], limit: 100 });
    return presences.map((p) => ({ id_affectation: p.id_affectation, marque_le: p.marque_le }));
};

// ── Administration ───────────────────────────────────────────────────────

/** Signalements récents (administration) : téléphones partagés et absents à une vérification. */
export const signalementsRecents = async (user, limite = 200) => {
    if (user.role !== "admin") throw new ErreurMetier("Réservé à l'administration", 403);
    const lignes = await SignalementPresence.findAll({
        include: [
            { model: Users, as: "etudiant", attributes: ["nom", "prenom"] },
            { model: Users, as: "lie", attributes: ["nom", "prenom"] },
            {
                model: Affectation,
                as: "seance",
                attributes: ["id_affectation", "date_seance"],
                include: [
                    { model: Cours, as: "cours", attributes: ["nom_cours"] },
                    { model: Groupe, as: "groupe", attributes: ["nom_groupe"] },
                ],
            },
        ],
        order: [["createdAt", "DESC"], ["id_signalement", "DESC"]],
        limit: limite,
    });
    return lignes.map((l) => ({
        id: l.id_signalement,
        motif: l.motif,
        le: l.createdAt,
        etudiant: nomComplet(l.etudiant),
        lie: nomComplet(l.lie),
        seance: { id: l.id_affectation, date: String(l.seance?.date_seance ?? "").slice(0, 10), cours: l.seance?.cours?.nom_cours ?? null, groupe: l.seance?.groupe?.nom_groupe ?? null },
    }));
};
