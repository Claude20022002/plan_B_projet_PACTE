// Reprise pour la règle « les étudiants ne voient un mois qu'une fois publié » (21 octobre 2026) :
// marque comme déjà publiés, SANS notification ni e-mail, les mois qui ont des séances, du mois
// courant aux mois suivants, pour toutes les classes qui ont des étudiants. À lancer une fois à
// l'application de cette mise à jour, sinon les étudiants ne verraient plus rien jusqu'à la
// première publication. Journal sur la sortie d'erreur.
// Les mois déjà publiés avant cette mise à jour gardent leur envoi, mais leurs lignes sont réécrites
// au nouveau format (créneau, salle, enseignant, statut) d'après les séances actuelles : c'est ce que
// les étudiants voyaient jusque-là, puisque le planning publié se mettait à jour tout seul.
// Pour ne reprendre que les mois à venir, passer le premier mois : MOIS_DEBUT=2026-11
// Pour voir ce qu'il ferait sans rien écrire : SIMULATION=1
// Les mois d'une classe sont ceux de toutes les séances qu'elle suit (lignesDuMois) : les siennes,
// celles de ses groupes parents (promotion) et les enseignements mutualisés, pas seulement celles
// posées sur la classe elle-même (première version du script, qui oubliait ces mois).
// Exécution : docker compose exec -T backend node --input-type=module - < deploy/vps/marquer-edt-publie.mjs
// (avec une variable : docker compose exec -T -e SIMULATION=1 backend node …)
import { Op } from "sequelize";
import sequelize from "/app/config/db.js";
import { Affectation, Appartenir, EnvoiEdt, Groupe } from "/app/models/index.js";
import { lignesDuMois, moisCourant } from "/app/services/calendrier/envoiEdt.js";

const log = (m) => process.stderr.write(`${m}\n`);
const debut = process.env.MOIS_DEBUT || moisCourant();
const simulation = Boolean(process.env.SIMULATION);

// Les mois qui ont des séances, à partir du premier mois repris (toutes classes confondues)
const moisAvecSeances = (
    await Affectation.findAll({
        where: { date_seance: { [Op.gte]: `${debut}-01` } },
        attributes: [[sequelize.fn("DATE_FORMAT", sequelize.col("date_seance"), "%Y-%m"), "mois"]],
        group: ["mois"],
        raw: true,
    })
)
    .map((l) => l.mois)
    .sort();

const classes = await Groupe.findAll({ include: [{ model: Appartenir, as: "appartenances", required: true, attributes: [] }] });
let marques = 0;
let misAJour = 0;
for (const groupe of classes) {
    for (const m of moisAvecSeances) {
        const lignes = await lignesDuMois(groupe, m);
        if (!lignes.length) continue;
        const existant = await EnvoiEdt.findOne({ where: { id_groupe: groupe.id_groupe, mois: m } });
        if (existant) {
            if ((existant.seances ?? []).some((l) => l.id_creneau === undefined)) {
                log(`${groupe.nom_groupe} ${m} : remis au nouveau format (${lignes.length} séances)`);
                if (!simulation) await existant.update({ seances: lignes });
                misAJour += 1;
            }
            continue;
        }
        log(`${groupe.nom_groupe} ${m} : marqué comme publié (${lignes.length} séances)`);
        if (!simulation) await EnvoiEdt.create({ id_groupe: groupe.id_groupe, mois: m, seances: lignes, envoye_le: new Date(), nb_destinataires: 0 });
        marques += 1;
    }
}
log(`${simulation ? "SIMULATION, rien n'est écrit : " : ""}${marques} mois marqués comme publiés, ${misAJour} envoi(s) déjà publiés remis au nouveau format, pour ${classes.length} classes (à partir de ${debut}).`);
await sequelize.close();
