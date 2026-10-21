// Reprise pour la règle « les étudiants ne voient un mois qu'une fois publié » (21 octobre 2026) :
// marque comme déjà publiés, SANS notification ni e-mail, les mois qui ont des séances, du mois
// courant aux mois suivants, pour toutes les classes qui ont des étudiants. À lancer une fois à
// l'application de cette mise à jour, sinon les étudiants ne verraient plus rien jusqu'à la
// première publication. Les mois déjà publiés ne sont pas touchés. Journal sur la sortie d'erreur.
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
        if (await EnvoiEdt.findOne({ where: { id_groupe: groupe.id_groupe, mois: m } })) continue;
        const lignes = await lignesDuMois(groupe, m);
        await EnvoiEdt.create({ id_groupe: groupe.id_groupe, mois: m, seances: lignes, envoye_le: new Date(), nb_destinataires: 0 });
        marques += 1;
    }
}
log(`${marques} mois marqués comme publiés pour ${classes.length} classes (à partir de ${debut}).`);
await sequelize.close();
