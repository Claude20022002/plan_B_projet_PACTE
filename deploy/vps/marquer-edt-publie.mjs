// Reprise pour la règle « les étudiants ne voient un mois qu'une fois publié » (21 octobre 2026) :
// marque comme déjà publiés, SANS notification ni e-mail, les mois qui ont des séances, du mois
// courant aux mois suivants, pour toutes les classes qui ont des étudiants. À lancer une fois à
// l'application de cette mise à jour, sinon les étudiants ne verraient plus rien jusqu'à la
// première publication. Journal sur la sortie d'erreur.
// Les mois déjà publiés avant cette mise à jour gardent leur envoi, mais leurs lignes sont réécrites
// au nouveau format (créneau, salle, enseignant, statut) d'après les séances actuelles : c'est ce que
// les étudiants voyaient jusque-là, puisque le planning publié se mettait à jour tout seul.
// Pour ne reprendre que les mois à venir, passer le premier mois : MOIS_DEBUT=2026-11
// Exécution : docker compose exec -T backend node --input-type=module - < deploy/vps/marquer-edt-publie.mjs
import { Op } from "sequelize";
import sequelize from "/app/config/db.js";
import { Affectation, Appartenir, EnvoiEdt, Groupe } from "/app/models/index.js";
import { lignesDuMois, moisCourant } from "/app/services/calendrier/envoiEdt.js";

const log = (m) => process.stderr.write(`${m}\n`);
const debut = process.env.MOIS_DEBUT || moisCourant();

const classes = await Groupe.findAll({ include: [{ model: Appartenir, as: "appartenances", required: true, attributes: [] }] });
let marques = 0;
let misAJour = 0;
for (const groupe of classes) {
    const mois = (
        await Affectation.findAll({
            where: { id_groupe: groupe.id_groupe, date_seance: { [Op.gte]: `${debut}-01` } },
            attributes: [[sequelize.fn("DATE_FORMAT", sequelize.col("date_seance"), "%Y-%m"), "mois"]],
            group: ["mois"],
            raw: true,
        })
    ).map((l) => l.mois);
    for (const m of mois) {
        const existant = await EnvoiEdt.findOne({ where: { id_groupe: groupe.id_groupe, mois: m } });
        const lignes = await lignesDuMois(groupe, m);
        if (existant) {
            if ((existant.seances ?? []).some((l) => l.id_creneau === undefined)) {
                await existant.update({ seances: lignes });
                misAJour += 1;
            }
            continue;
        }
        await EnvoiEdt.create({ id_groupe: groupe.id_groupe, mois: m, seances: lignes, envoye_le: new Date(), nb_destinataires: 0 });
        marques += 1;
    }
}
log(`${marques} mois marqués comme publiés, ${misAJour} envoi(s) déjà publiés remis au nouveau format, pour ${classes.length} classes (à partir de ${debut}).`);
await sequelize.close();
