import crypto from "crypto";
import { Op } from "sequelize";
import {
    AbonnementCalendrier,
    Affectation,
    Cours,
    CoursComposante,
    Creneau,
    Enseignement,
    EnseignementEnseignant,
    Groupe,
    Salle,
    SessionExamen,
    SessionExamenSalle,
    Surveillance,
    Users,
} from "../../models/index.js";
import { seancesDeLEtudiant } from "../planning/monEmploiDuTemps.js";
import { appliquerRamadan } from "../planning/ramadan.js";

/**
 * Abonnement calendrier personnel (phase R4) : une adresse secrète, à ajouter une fois dans Google
 * Agenda, Outlook ou le calendrier du téléphone, qui se met à jour seule (report, annulation,
 * salle changée). Étudiant : ses séances, examens publiés et jours de l'agenda (vacances, fériés).
 * Enseignant : ses séances (co-enseignement compris) et ses surveillances. Administration : ses
 * surveillances. Fenêtre : de 4 semaines en arrière à 5 mois en avant.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const JOURS_AVANT = 28;
const JOURS_APRES = 150;
const FENETRE_ETUDIANT = 60; // monEmploiDuTemps refuse plus de 62 jours d'un coup
const DOMAINE_UID = "hestim-planner";

// ── Format iCalendar (RFC 5545) ──────────────────────────────────────────

const aujourdhuiLocal = (maintenant = new Date()) => maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU });
const decaler = (iso, jours) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
};

/** Décalage du fuseau de l'école à un instant donné, en millisecondes (heure légale du Maroc, Ramadan compris). */
const decalage = (instant) => {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", { timeZone: FUSEAU, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
            .formatToParts(instant)
            .map((p) => [p.type, p.value])
    );
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - instant.getTime();
};

/** Date et heure locales de l'école → instant UTC. */
export const instantLocal = (date, heure) => {
    const [a, m, j] = String(date).slice(0, 10).split("-").map(Number);
    const [h, mi] = String(heure).split(":").map(Number);
    const naif = Date.UTC(a, m - 1, j, h, mi);
    const premier = naif - decalage(new Date(naif));
    return new Date(naif - decalage(new Date(premier)));
};

const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const jour = (iso) => String(iso).slice(0, 10).replace(/-/g, "");
const echapper = (texte) => String(texte ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Coupe une ligne à 75 octets (UTF-8) ; les suites commencent par une espace. */
const plier = (ligne) => {
    const morceaux = [];
    let courant = "";
    let octets = 0;
    for (const caractere of ligne) {
        const taille = Buffer.byteLength(caractere);
        if (octets + taille > (morceaux.length ? 74 : 75)) {
            morceaux.push(courant);
            courant = "";
            octets = 0;
        }
        courant += caractere;
        octets += taille;
    }
    morceaux.push(courant);
    return morceaux.join("\r\n ");
};

const vevent = ({ uid, debut, fin, journee = false, titre, lieu, description, annule = false, modifie }, stamp) =>
    [
        "BEGIN:VEVENT",
        `UID:${uid}@${DOMAINE_UID}`,
        `DTSTAMP:${stamp}`,
        journee ? `DTSTART;VALUE=DATE:${jour(debut)}` : `DTSTART:${utc(debut)}`,
        journee ? `DTEND;VALUE=DATE:${jour(fin)}` : `DTEND:${utc(fin)}`,
        // Les agendas ne remplacent un événement que si SEQUENCE augmente : la date de mise à jour en minutes
        `SEQUENCE:${modifie ? Math.floor(new Date(modifie).getTime() / 60000) % 2147483647 : 0}`,
        `SUMMARY:${echapper(titre)}`,
        lieu ? `LOCATION:${echapper(lieu)}` : null,
        description ? `DESCRIPTION:${echapper(description)}` : null,
        `STATUS:${annule ? "CANCELLED" : "CONFIRMED"}`,
        "TRANSP:OPAQUE",
        "END:VEVENT",
    ].filter(Boolean);

/** Texte iCalendar complet (lignes CRLF, pliées). */
export const calendrierIcs = (nom, evenements, maintenant = new Date()) => {
    const stamp = utc(maintenant);
    const lignes = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//HESTIM//HESTIM Planner//FR",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${echapper(nom)}`,
        `X-WR-TIMEZONE:${FUSEAU}`,
        "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
        "X-PUBLISHED-TTL:PT1H",
        ...evenements.flatMap((e) => vevent(e, stamp)),
        "END:VCALENDAR",
    ];
    return `${lignes.map(plier).join("\r\n")}\r\n`;
};

// ── Contenu par rôle ─────────────────────────────────────────────────────

const hhmm = (h) => String(h ?? "").slice(0, 5);
const lieuDe = (s) => {
    const composante = s.enseignement?.composante;
    if (composante?.modalite === "distanciel") return ["Distanciel", composante.mention].filter(Boolean).join(" · ");
    if (!s.salle) return null;
    return [s.salle.nom_salle, s.salle.campus?.nom].filter(Boolean).join(" · ");
};
const typeDe = (s) => s.enseignement?.composante?.type ?? s.cours?.type_cours ?? null;

const depuisSeance = (s, { avecGroupe = false } = {}) => {
    const type = typeDe(s);
    const annule = s.statut === "annule";
    const nomCours = s.cours?.nom_cours ?? "Séance";
    return {
        uid: `seance-${s.id_affectation}`,
        debut: instantLocal(s.date_seance, s.creneau.heure_debut),
        fin: instantLocal(s.date_seance, s.creneau.heure_fin),
        titre: `${annule ? "Annulé : " : s.statut === "reporte" ? "Reporté : " : ""}${nomCours}${type ? ` (${type})` : ""}`,
        lieu: lieuDe(s),
        description: [
            s.enseignant ? `Enseignant : ${s.enseignant.prenom} ${s.enseignant.nom}` : null,
            avecGroupe && s.groupe ? `Groupe : ${s.groupe.nom_groupe}` : null,
            s.statut === "reporte" ? "Séance reportée : nouvel horaire." : null,
            annule ? "Séance annulée." : null,
        ]
            .filter(Boolean)
            .join("\n"),
        annule,
        modifie: s.updatedAt,
    };
};

const depuisExamen = (x, salles) => ({
    uid: `examen-${x.id}`,
    debut: instantLocal(x.date, x.heure_debut),
    fin: instantLocal(x.date, x.heure_fin),
    titre: x.titre,
    lieu: salles.join(", ") || null,
    description: x.cours ? `Module : ${x.cours.nom}` : null,
    modifie: x.modifie,
});

/** Étudiant : par fenêtres de 60 jours (limite de monEmploiDuTemps), sans doublons. */
const contenuEtudiant = async (user, du, au) => {
    const evenements = new Map();
    for (let debut = du; debut <= au; debut = decaler(debut, FENETRE_ETUDIANT)) {
        const fin = decaler(debut, FENETRE_ETUDIANT - 1) < au ? decaler(debut, FENETRE_ETUDIANT - 1) : au;
        const r = await seancesDeLEtudiant(user.id_user, { du: debut, au: fin });
        for (const s of r.seances) if (s.creneau) evenements.set(`s${s.id_affectation}`, depuisSeance(s));
        for (const x of r.examens) evenements.set(`x${x.id}`, depuisExamen(x, x.salles ?? []));
        for (const e of r.evenements) {
            const parHeure = e.heure_debut && e.heure_fin && e.date_debut === e.date_fin;
            evenements.set(`e${e.id}`, {
                uid: `evenement-${e.id}`,
                debut: parHeure ? instantLocal(e.date_debut, e.heure_debut) : e.date_debut,
                fin: parHeure ? instantLocal(e.date_debut, e.heure_fin) : decaler(e.date_fin, 1),
                journee: !parHeure,
                titre: e.date_confirmee === false ? `${e.titre} (date à confirmer)` : e.titre,
            });
        }
    }
    return [...evenements.values()];
};

/** Surveillances d'épreuves publiées (enseignant ou personnel de l'administration). */
const surveillancesDe = async (idUser, du, au) => {
    const lignes = await Surveillance.findAll({ where: { id_user: idUser }, attributes: ["id_session", "id_salle"] });
    if (!lignes.length) return [];
    const sessions = await SessionExamen.findAll({
        where: { id_session: [...new Set(lignes.map((l) => l.id_session))], statut: "publiee", date: { [Op.between]: [du, au] } },
        include: [
            { model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] },
            { model: SessionExamenSalle, as: "salles", include: [{ model: Salle, as: "salle", attributes: ["id_salle", "nom_salle"] }] },
        ],
    });
    return sessions.map((x) => {
        const mesSalles = lignes.filter((l) => l.id_session === x.id_session).map((l) => x.salles.find((s) => s.id_salle === l.id_salle)?.salle?.nom_salle).filter(Boolean);
        return {
            ...depuisExamen({ id: x.id_session, titre: `Surveillance : ${x.titre}`, date: x.date, heure_debut: x.heure_debut, heure_fin: x.heure_fin, cours: x.cours ? { nom: x.cours.nom_cours } : null, modifie: x.updatedAt }, mesSalles),
            uid: `surveillance-${x.id_session}-${idUser}`,
        };
    });
};

/** Enseignant : ses séances, comme intervenant principal ou en co-enseignement. */
const contenuEnseignant = async (user, du, au) => {
    const co = await EnseignementEnseignant.findAll({ where: { id_user: user.id_user, role: "co_enseignant", statut_service: { [Op.ne]: "refuse" } }, attributes: ["id_enseignement"] });
    const seances = await Affectation.findAll({
        where: {
            date_seance: { [Op.between]: [du, au] },
            [Op.or]: [{ id_user_enseignant: user.id_user }, ...(co.length ? [{ id_enseignement: co.map((c) => c.id_enseignement) }] : [])],
        },
        include: [
            { model: Cours, as: "cours", attributes: ["id_cours", "nom_cours", "type_cours"] },
            { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe"] },
            { model: Users, as: "enseignant", attributes: ["id_user", "nom", "prenom"] },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
            { model: Enseignement, as: "enseignement", attributes: ["id_enseignement"], include: [{ model: CoursComposante, as: "composante", attributes: ["type", "modalite", "mention"] }] },
        ],
    });
    await appliquerRamadan(seances);
    return [...seances.filter((s) => s.creneau).map((s) => depuisSeance(s, { avecGroupe: true })), ...(await surveillancesDe(user.id_user, du, au))];
};

export const evenementsDuCompte = async (user, maintenant = new Date()) => {
    const aujourdhui = aujourdhuiLocal(maintenant);
    const du = decaler(aujourdhui, -JOURS_AVANT);
    const au = decaler(aujourdhui, JOURS_APRES);
    if (user.role === "etudiant") return contenuEtudiant(user, du, au);
    if (user.role === "enseignant") return contenuEnseignant(user, du, au);
    return surveillancesDe(user.id_user, du, au);
};

// ── Abonnement ───────────────────────────────────────────────────────────

const nouveauJeton = () => crypto.randomBytes(32).toString("base64url");
const JETON = /^[A-Za-z0-9_-]{43}$/;
export const cheminFlux = (jeton) => `/api/agenda/${jeton}.ics`;

/** Adresse de l'abonnement du compte (créée à la première demande). */
export const abonnementDe = async (user) => {
    const [abonnement] = await AbonnementCalendrier.findOrCreate({ where: { id_user: user.id_user }, defaults: { jeton: nouveauJeton() } });
    return { chemin: cheminFlux(abonnement.jeton), cree_le: abonnement.updatedAt };
};

/** Nouvelle adresse : l'ancienne cesse aussitôt de fonctionner (adresse partagée par erreur). */
export const renouvelerAbonnement = async (user) => {
    const jeton = nouveauJeton();
    const existant = await AbonnementCalendrier.findByPk(user.id_user);
    if (existant) await existant.update({ jeton });
    else await AbonnementCalendrier.create({ id_user: user.id_user, jeton });
    return abonnementDe(user);
};

/** Flux ICS d'une adresse secrète ; null si l'adresse est inconnue ou le compte désactivé. */
export const fluxIcs = async (jeton, maintenant = new Date()) => {
    if (!JETON.test(String(jeton ?? ""))) return null;
    const abonnement = await AbonnementCalendrier.findOne({ where: { jeton }, include: [{ model: Users, as: "user", attributes: ["id_user", "role", "prenom", "nom", "actif"] }] });
    if (!abonnement?.user?.actif) return null;
    const evenements = await evenementsDuCompte(abonnement.user, maintenant);
    return calendrierIcs(`HESTIM — ${abonnement.user.prenom} ${abonnement.user.nom}`, evenements, maintenant);
};
