import {
    CompetenceEnseignant,
    Cours,
    CoursComposante,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Filiere,
    Groupe,
    Periode,
    Users,
} from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { creerNotification } from "../utils/notificationHelper.js";
import { chargesEnseignants } from "../services/planning/enseignants.js";

/**
 * Services d'enseignement : le responsable de filière (ou l'administration) propose un
 * enseignant sur un enseignement, en principal ou en co-enseignant ; l'enseignant accepte
 * ou refuse depuis son espace.
 */

const introuvable = (res, quoi, id) => res.status(404).json({ message: `${quoi} non trouvé`, error: `Aucun ${quoi.toLowerCase()} avec l'ID ${id}` });

const nomModule = async (enseignement) => {
    const composante = await CoursComposante.findByPk(enseignement.id_composante, { include: [{ model: Cours, as: "cours" }] });
    return `${composante.cours.nom_cours} (${composante.type})`;
};

// 🧭 Candidats pour un enseignement : ceux qui ont la compétence d'abord, puis les moins chargés
export const getCandidats = asyncHandler(async (req, res) => {
    const enseignement = await Enseignement.findByPk(req.params.id, {
        include: [
            { model: CoursComposante, as: "composante" },
            { model: EnseignementEnseignant, as: "services", attributes: ["id_user"] },
        ],
    });
    if (!enseignement) return introuvable(res, "Enseignement", req.params.id);

    const [{ charges }, competences] = await Promise.all([
        chargesEnseignants(),
        CompetenceEnseignant.findAll({ where: { id_cours: enseignement.composante.id_cours }, attributes: ["id_user"] }),
    ]);
    const competents = new Set(competences.map((c) => c.id_user));
    const dejaLa = new Set(enseignement.services.map((s) => s.id_user));
    const candidats = charges
        .filter((c) => c.actif && !dejaLa.has(c.id_user))
        .map((c) => ({ ...c, competent: competents.has(c.id_user) }))
        .sort((a, b) => Number(b.competent) - Number(a.competent) || a.heures_prevues - b.heures_prevues || (a.nom || "").localeCompare(b.nom || ""));
    res.json(candidats);
});

// ➕ Proposer un enseignant sur un enseignement
export const ajouterEnseignant = asyncHandler(async (req, res) => {
    const enseignement = await Enseignement.findByPk(req.params.id);
    if (!enseignement) return introuvable(res, "Enseignement", req.params.id);

    const idUser = Number(req.body.id_user);
    const enseignant = await Enseignant.findByPk(idUser, { include: [{ model: Users, as: "user" }] });
    if (!enseignant || !enseignant.user?.actif) {
        return res.status(400).json({ message: "Erreur de validation", error: "Enseignant introuvable ou inactif" });
    }
    if (await EnseignementEnseignant.findOne({ where: { id_enseignement: enseignement.id_enseignement, id_user: idUser } })) {
        return res.status(409).json({ message: "Déjà proposé", error: "Cet enseignant est déjà sur cet enseignement" });
    }

    const role = req.body.role || "principal";
    if (role === "principal") {
        const principal = await EnseignementEnseignant.findOne({
            where: { id_enseignement: enseignement.id_enseignement, role: "principal", statut_service: ["propose", "accepte"] },
        });
        if (principal) {
            return res.status(409).json({
                message: "Principal déjà désigné",
                error: "Cet enseignement a déjà un enseignant principal : ajoutez celui-ci comme co-enseignant",
            });
        }
    }

    const service = await EnseignementEnseignant.create({
        id_enseignement: enseignement.id_enseignement,
        id_user: idUser,
        role,
        heures: req.body.heures ?? null,
        statut_service: "propose",
    });

    // L'enseignant n'a pas la compétence enregistrée : on l'avertit sans bloquer
    const composante = await CoursComposante.findByPk(enseignement.id_composante);
    const competent = Boolean(await CompetenceEnseignant.findOne({ where: { id_user: idUser, id_cours: composante.id_cours } }));

    await creerNotification({
        id_user: idUser,
        titre: "Nouveau service proposé",
        message: `On vous propose d'assurer ${await nomModule(enseignement)}. Acceptez ou refusez-le depuis « Mes services ».`,
        type_notification: "info",
        lien: "/mes-services",
    });

    res.status(201).json({ message: "Enseignant proposé", service, avertissement: competent ? null : "Ce module ne figure pas dans ses compétences" });
});

// ✏️ Modifier le rôle ou la part d'heures d'un service
export const modifierService = asyncHandler(async (req, res) => {
    const service = await EnseignementEnseignant.findOne({ where: { id_enseignement: req.params.id, id_user: req.params.idUser } });
    if (!service) return introuvable(res, "Service", `${req.params.id}/${req.params.idUser}`);
    const data = {};
    if (req.body.role) data.role = req.body.role;
    if (req.body.heures !== undefined) data.heures = req.body.heures;
    await service.update(data);
    res.json({ message: "Service mis à jour", service });
});

// 🗑️ Retirer un enseignant d'un enseignement
export const retirerEnseignant = asyncHandler(async (req, res) => {
    const service = await EnseignementEnseignant.findOne({ where: { id_enseignement: req.params.id, id_user: req.params.idUser } });
    if (!service) return introuvable(res, "Service", `${req.params.id}/${req.params.idUser}`);
    await service.destroy();
    res.json({ message: "Enseignant retiré de l'enseignement" });
});

// 📋 Mes services (enseignant connecté), avec module, groupes et période
export const getMesServices = asyncHandler(async (req, res) => {
    const services = await EnseignementEnseignant.findAll({
        where: { id_user: req.user.id_user, ...(req.query.statut ? { statut_service: req.query.statut } : {}) },
        include: [
            {
                model: Enseignement,
                as: "enseignement",
                include: [
                    {
                        model: CoursComposante,
                        as: "composante",
                        include: [{ model: Cours, as: "cours", include: [{ model: Filiere, as: "filiere", attributes: ["id_filiere", "code_filiere", "nom_filiere"] }] }],
                    },
                    { model: Groupe, as: "groupes", attributes: ["id_groupe", "nom_groupe", "effectif"], through: { attributes: [] } },
                    { model: Periode, as: "periode", attributes: ["id_periode", "code", "date_debut", "date_fin"] },
                ],
            },
        ],
        order: [["createdAt", "DESC"]],
    });
    res.json(services);
});

// ✅ Accepter ou refuser un service qui m'est proposé
export const repondreService = asyncHandler(async (req, res) => {
    const service = await EnseignementEnseignant.findOne({ where: { id_enseignement: req.params.id, id_user: req.user.id_user } });
    if (!service) return introuvable(res, "Service", req.params.id);

    const { statut, motif } = req.body;
    if (!["accepte", "refuse"].includes(statut)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Statut : accepte ou refuse" });
    }
    if (statut === "refuse" && !String(motif || "").trim()) {
        return res.status(400).json({ message: "Erreur de validation", error: "Indiquez le motif du refus" });
    }
    await service.update({ statut_service: statut, motif_refus: statut === "refuse" ? String(motif).trim() : null });
    res.json({ message: statut === "accepte" ? "Service accepté" : "Service refusé", service });
});
