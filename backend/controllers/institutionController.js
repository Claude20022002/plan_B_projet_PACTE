import {
    Institution,
    InstitutionUser,
    Plan,
    Subscription,
    Users,
} from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { tenantWhere } from "../utils/tenantHelper.js";

export const getMyInstitutions = asyncHandler(async (req, res) => {
    const memberships = await InstitutionUser.findAll({
        where: {
            id_user: req.user.id_user,
            statut: "active",
        },
        include: [{ model: Institution, as: "institution" }],
        order: [["createdAt", "ASC"]],
    });

    res.json({
        institutions: memberships.map((membership) => ({
            id_institution: membership.id_institution,
            slug: membership.institution?.slug,
            nom: membership.institution?.nom,
            statut: membership.institution?.statut,
            role: membership.role,
        })),
        currentInstitution: req.tenant
            ? {
                  id_institution: req.tenant.id_institution,
                  slug: req.tenant.slug,
                  nom: req.tenant.nom,
                  role: req.membership?.role,
              }
            : null,
    });
});

export const getCurrentInstitution = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findOne({
        where: tenantWhere(req),
        include: [{ model: Plan, as: "plan" }],
        order: [["createdAt", "DESC"]],
    });

    res.json({
        institution: req.tenant,
        membership: req.membership,
        subscription,
    });
});

export const listMembers = asyncHandler(async (req, res) => {
    const members = await InstitutionUser.findAll({
        where: tenantWhere(req),
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        order: [["role", "ASC"], ["createdAt", "ASC"]],
    });

    res.json({ members });
});

export const updateMember = asyncHandler(async (req, res) => {
    const member = await InstitutionUser.findOne({
        where: tenantWhere(req, { id_institution_user: req.params.id }),
    });

    if (!member) {
        return res.status(404).json({ message: "Membre introuvable" });
    }

    const allowed = {};
    if (req.body.role) allowed.role = req.body.role;
    if (req.body.statut) allowed.statut = req.body.statut;
    if (req.body.permissions) allowed.permissions = req.body.permissions;

    await member.update(allowed);
    res.json({ message: "Membre mis à jour", member });
});

export const removeMember = asyncHandler(async (req, res) => {
    const member = await InstitutionUser.findOne({
        where: tenantWhere(req, { id_institution_user: req.params.id }),
    });

    if (!member) {
        return res.status(404).json({ message: "Membre introuvable" });
    }

    await member.update({ statut: "suspended" });
    res.json({ message: "Membre suspendu" });
});
