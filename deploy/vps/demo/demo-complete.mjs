// Démonstration complète (plan demo-et-activites.md, lot D-1) : une classe « DÉMO HESTIM » qui ne
// touche aucune vraie classe, pour montrer tout ce qui se passe entre un enseignant et ses étudiants :
//  - un super administrateur, un super enseignant et un super étudiant (SUPER_ADMIN, SUPER_PROF,
//    SUPER_ETUDIANT), à mots de passe aléatoires écrits sur la sortie standard (règle A-2 : aucun mot
//    de passe dans le code), sans obligation de les changer ;
//  - la classe et NOMBRE étudiants de test de plus (demo.classe1@hestim.ma…) ;
//  - trois modules (bases de données, réseaux, web) : la bibliothèque des étudiants les range par
//    module ; le super enseignant y a un service accepté de la période en cours ;
//  - une séance à CHAQUE créneau de chaque jour ouvré, d'aujourd'hui à JOURS jours, dans une salle
//    libre (aucun conflit avec le vrai planning) : pendant la journée, une séance est toujours en cours,
//    pour tester appel, quiz, jeux, dépôt de support et report à toute heure. Le rappel de l'appel
//    part à la fin de chaque séance sans appel validé, comme pour les vraies séances.
// Le script peut être relancé : il réutilise comptes, classe, modules, services et séances.
// RESET=1 remet à zéro l'appel des séances du jour (téléphones déliés, présences effacées) et retire
// les demandes de report en attente du super enseignant.
// Les identifiants vont sur la sortie standard (à garder pour soi), le journal sur la sortie d'erreur.
// Exécution (dans /opt/hestim) :
//   docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml \
//     exec -T backend node --input-type=module - < deploy/vps/demo/demo-complete.mjs >> /root/hestim-identifiants.txt
import crypto from "crypto";
import { Op } from "sequelize";
import sequelize from "/app/config/db.js";
import {
    Affectation,
    AppareilEtudiant,
    AppelSeance,
    Appartenir,
    Cours,
    CoursComposante,
    Creneau,
    DemandeReport,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    EnseignementGroupe,
    Etudiant,
    Filiere,
    Groupe,
    Periode,
    Presence,
    Salle,
    SignalementPresence,
    Users,
} from "/app/models/index.js";
import { hashPassword } from "/app/utils/passwordHelper.js";

const log = (m) => process.stderr.write(`${m}\n`);
const courriel = (variable, defaut) => (process.env[variable] || defaut).trim().toLowerCase();
const COMPTES = {
    admin: { email: courriel("SUPER_ADMIN", "super.admin@hestim.ma"), prenom: "Super", nom: "ADMIN", role: "admin" },
    prof: { email: courriel("SUPER_PROF", "super.prof@hestim.ma"), prenom: "Super", nom: "PROF", role: "enseignant" },
    etudiant: { email: courriel("SUPER_ETUDIANT", "super.etudiant@hestim.ma"), prenom: "Super", nom: "ÉTUDIANT", role: "etudiant" },
};
const NOM_GROUPE = process.env.DEMO_GROUPE || "DÉMO HESTIM";
const NOMBRE = Math.min(15, Math.max(0, Number(process.env.NOMBRE ?? 4)));
const JOURS = Math.min(31, Math.max(1, Number(process.env.JOURS || 14)));
const RESET = process.env.RESET === "1";
const FUSEAU = "Africa/Casablanca";
const JOURS_SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MODULES = [
    { code: "DEMO-BDD", nom: "Bases de données (démo)", specialite: "Bases de données" },
    { code: "DEMO-RES", nom: "Réseaux (démo)", specialite: "Réseaux" },
    { code: "DEMO-WEB", nom: "Développement web (démo)", specialite: "Développement web" },
];

const maintenant = new Date();
const aujourdhui = maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU });
const decaler = (date, jours) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
};
const jourDe = (date) => JOURS_SEMAINE[new Date(`${date}T12:00:00Z`).getUTCDay()];
// Mot de passe aléatoire conforme à la politique (12 caractères au moins, ni courant ni personnel)
const motDePasse = () => `${crypto.randomBytes(12).toString("base64url")}-Hq7`;
const identifiants = [`# Démonstration « ${NOM_GROUPE} » (${maintenant.toISOString()}) : à garder pour soi`];

/** Compte du rôle voulu : créé avec un mot de passe aléatoire, ou réutilisé (mot de passe inchangé). */
const compte = async ({ email, prenom, nom, role }, profil) => {
    let user = await Users.findOne({ where: { email } });
    if (!user) {
        const mdp = motDePasse();
        user = await Users.create({ nom, prenom, email, role, actif: true, password_hash: await hashPassword(mdp), must_change_password: false });
        if (profil) await profil(user);
        identifiants.push(`${role.padEnd(10)} ${email}  ${mdp}`);
        log(`Compte ${role} créé : ${email}`);
    } else {
        if (user.role !== role) throw new Error(`${email} existe déjà avec le rôle ${user.role}`);
        if (!user.actif) await user.update({ actif: true });
        log(`Compte ${role} réutilisé : ${email} (mot de passe inchangé)`);
    }
    return user;
};

// ── Comptes ──
const superAdmin = await compte(COMPTES.admin);
const superProf = await compte(COMPTES.prof, (u) =>
    Enseignant.create({ id_user: u.id_user, specialite: "Démonstration", departement: "Informatique", statut: "permanent" })
);
const etudiantProfil = (numero) => (u) => Etudiant.create({ id_user: u.id_user, numero_etudiant: numero, niveau: "3A" });
const superEtudiant = await compte(COMPTES.etudiant, etudiantProfil("DEMO-SUPER"));

// ── Classe de démonstration et étudiants de test ──
const filiere = (await Filiere.findOne({ where: { code_filiere: "IIIA" } })) || (await Filiere.findOne({ order: [["id_filiere", "ASC"]] }));
if (!filiere) throw new Error("Aucune filière");
const [groupe] = await Groupe.findOrCreate({
    where: { nom_groupe: NOM_GROUPE },
    defaults: { niveau: "3A", effectif: NOMBRE + 1, annee_scolaire: "2026-2027", id_filiere: filiere.id_filiere, type_groupe: "promotion" },
});
const etudiants = [superEtudiant];
for (let i = 1; i <= NOMBRE; i += 1) {
    etudiants.push(await compte({ email: `demo.classe${i}@hestim.ma`, prenom: "Étudiant", nom: `DÉMO ${i}`, role: "etudiant" }, etudiantProfil(`DEMO-CLASSE-${i}`)));
}
for (const user of etudiants) await Appartenir.findOrCreate({ where: { id_user_etudiant: user.id_user, id_groupe: groupe.id_groupe } });

// ── Modules et services du super enseignant (période en cours) ──
const periode =
    (await Periode.findOne({ where: { date_debut: { [Op.lte]: aujourdhui }, date_fin: { [Op.gte]: aujourdhui } } })) ||
    (await Periode.findOne({ where: { date_debut: { [Op.lte]: aujourdhui } }, order: [["date_debut", "DESC"]] }));
const modules = [];
for (const m of MODULES) {
    const [cours] = await Cours.findOrCreate({
        where: { code_cours: m.code },
        defaults: { nom_cours: m.nom, niveau: "3A", volume_horaire: 30, type_cours: "CM", semestre: "S5", id_filiere: filiere.id_filiere },
    });
    const [composante] = await CoursComposante.findOrCreate({
        where: { id_cours: cours.id_cours, type: "CM" },
        defaults: { volume_heures: 30, niveau_groupe: "promotion" },
    });
    // Enseignement déjà créé pour cette classe et cette composante (relance du script)
    const liens = await EnseignementGroupe.findAll({ where: { id_groupe: groupe.id_groupe }, attributes: ["id_enseignement"] });
    let enseignement = liens.length ? await Enseignement.findOne({ where: { id_enseignement: liens.map((l) => l.id_enseignement), id_composante: composante.id_composante } }) : null;
    if (!enseignement) {
        enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode?.id_periode ?? null, libelle: "Démonstration", heures_prevues: 30 });
        await EnseignementGroupe.findOrCreate({ where: { id_enseignement: enseignement.id_enseignement, id_groupe: groupe.id_groupe } });
    }
    const [service] = await EnseignementEnseignant.findOrCreate({
        where: { id_enseignement: enseignement.id_enseignement, id_user: superProf.id_user },
        defaults: { role: "principal", statut_service: "accepte" },
    });
    if (service.statut_service !== "accepte") await service.update({ statut_service: "accepte" });
    modules.push({ cours, enseignement });
}

// ── Séances : chaque créneau de chaque jour ouvré, dans une salle libre ──
const chevauche = (a, b) => String(a.heure_debut) < String(b.heure_fin) && String(b.heure_debut) < String(a.heure_fin);
/** Une salle sans séance qui chevauche ce créneau ce jour-là (grilles différentes comprises). */
const salleLibre = async (date, creneau) => {
    const occupees = await Affectation.findAll({ where: { date_seance: date, statut: { [Op.ne]: "annule" }, id_salle: { [Op.ne]: null } }, include: [{ model: Creneau, as: "creneau" }] });
    const prises = new Set(occupees.filter((s) => s.creneau && chevauche(s.creneau, creneau)).map((s) => s.id_salle));
    return Salle.findOne({ where: { disponible: true, ...(prises.size ? { id_salle: { [Op.notIn]: [...prises] } } : {}) }, order: [["capacite", "ASC"], ["id_salle", "ASC"]] });
};

let creees = 0;
let sansSalle = 0;
const seancesDuJour = [];
for (let ecart = 0; ecart < JOURS; ecart += 1) {
    const date = decaler(aujourdhui, ecart);
    const jour = jourDe(date);
    if (jour === "dimanche") continue;
    const creneaux = await Creneau.findAll({ where: { jour_semaine: jour, variante: "normale" }, order: [["heure_debut", "ASC"]] });
    for (const [rang, creneau] of creneaux.entries()) {
        let seance = await Affectation.findOne({ where: { id_groupe: groupe.id_groupe, date_seance: date, id_creneau: creneau.id_creneau, statut: { [Op.ne]: "annule" } } });
        if (!seance) {
            const salle = await salleLibre(date, creneau);
            if (!salle) {
                sansSalle += 1;
                continue;
            }
            // Les modules tournent d'un créneau à l'autre et d'un jour à l'autre
            const { cours, enseignement } = modules[(rang + ecart) % modules.length];
            seance = await Affectation.create({
                date_seance: date,
                statut: date === aujourdhui ? "confirme" : "planifie",
                id_cours: cours.id_cours,
                id_groupe: groupe.id_groupe,
                id_user_enseignant: superProf.id_user,
                id_salle: salle.id_salle,
                id_creneau: creneau.id_creneau,
                id_enseignement: enseignement.id_enseignement,
                id_user_admin: superAdmin.id_user,
            });
            creees += 1;
        }
        if (date === aujourdhui) seancesDuJour.push(seance);
    }
}
log(`Séances : ${creees} créée(s) sur ${JOURS} jour(s)${sansSalle ? `, ${sansSalle} créneau(x) sans salle libre laissé(s) vide(s)` : ""}`);

if (RESET) {
    const ids = seancesDuJour.map((s) => s.id_affectation);
    const liens = await AppareilEtudiant.destroy({ where: { id_user: etudiants.map((u) => u.id_user) } });
    const presences = await Presence.destroy({ where: { id_affectation: ids } });
    await SignalementPresence.destroy({ where: { id_affectation: ids } });
    await AppelSeance.destroy({ where: { id_affectation: ids } });
    await Affectation.update({ statut: "confirme" }, { where: { id_affectation: ids, statut: "realise" } });
    const reports = await DemandeReport.destroy({ where: { id_user_enseignant: superProf.id_user, statut_demande: "en_attente" } });
    log(`Remise à zéro : ${liens} téléphone(s) délié(s), ${presences} présence(s) effacée(s), ${reports} demande(s) de report retirée(s)`);
}

log(`Classe « ${NOM_GROUPE} » : ${etudiants.length} étudiant(s) dont ${COMPTES.etudiant.email} ; modules ${MODULES.map((m) => m.code).join(", ")}`);
log(`Super enseignant ${COMPTES.prof.email} ; super administrateur ${COMPTES.admin.email}`);
log("Quiz : se connecter une fois à PlannerQuiz avec le super enseignant, puis lancer un quiz depuis le tableau de bord de Planner");
if (identifiants.length > 1) process.stdout.write(`${identifiants.join("\n")}\n`);
else log("Aucun nouveau compte : mots de passe inchangés (voir le fichier des identifiants)");
await sequelize.close();
