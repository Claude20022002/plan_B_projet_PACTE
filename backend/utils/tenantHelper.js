import {
    Institution,
    InstitutionUser,
    Plan,
    Subscription,
} from "../models/index.js";

export const DEFAULT_INSTITUTION_SLUG = process.env.DEFAULT_INSTITUTION_SLUG || "default";

export const TENANT_MODELS = [
    "Filieres",
    "Groupes",
    "Cours",
    "Salles",
    "Creneaux",
    "Affectations",
    "Disponibilites",
    "Notifications",
    "Conflits",
    "DemandesReport",
    "Evenements",
    "GenerationSessions",
    "PlanningSnapshots",
    "AuthSessions",
];

export const getDefaultInstitution = async () => {
    const [institution] = await Institution.findOrCreate({
        where: { slug: DEFAULT_INSTITUTION_SLUG },
        defaults: {
            nom: process.env.DEFAULT_INSTITUTION_NAME || "Institution par défaut",
            slug: DEFAULT_INSTITUTION_SLUG,
            statut: "active",
            timezone: process.env.DEFAULT_TIMEZONE || "Africa/Lagos",
        },
    });

    const [plan] = await Plan.findOrCreate({
        where: { code: "starter" },
        defaults: {
            code: "starter",
            nom: "Starter",
            price_monthly: 0,
            max_users: 1000,
            max_students: 10000,
            max_teachers: 1000,
            max_rooms: 1000,
            features: {
                automatic_generation: true,
                exports: true,
                advanced_statistics: true,
            },
        },
    });

    await Subscription.findOrCreate({
        where: { id_institution: institution.id_institution },
        defaults: {
            id_institution: institution.id_institution,
            id_plan: plan.id_plan,
            status: "active",
            current_period_start: new Date(),
        },
    });

    return institution;
};

export const ensureUserMembership = async (user, institution = null) => {
    const tenant = institution || await getDefaultInstitution();
    const role = user.role === "admin" ? "admin" : user.role;

    const [membership] = await InstitutionUser.findOrCreate({
        where: {
            id_institution: tenant.id_institution,
            id_user: user.id_user,
        },
        defaults: {
            id_institution: tenant.id_institution,
            id_user: user.id_user,
            role,
            statut: "active",
        },
    });

    return membership;
};

export const resolveTenantForUser = async (req, user) => {
    const requestedSlug =
        req.get("X-Institution-Slug") ||
        req.body?.institutionSlug ||
        req.query?.institution ||
        null;

    let institution = null;
    if (requestedSlug) {
        institution = await Institution.findOne({
            where: {
                slug: requestedSlug,
                statut: "active",
            },
        });

        if (!institution) {
            const error = new Error("Institution introuvable ou inactive");
            error.status = 404;
            error.code = "TENANT_NOT_FOUND";
            throw error;
        }
    } else {
        const existingMembership = await InstitutionUser.findOne({
            where: {
                id_user: user.id_user,
                statut: "active",
            },
            include: [{ model: Institution, as: "institution" }],
            order: [["createdAt", "ASC"]],
        });

        if (existingMembership?.institution) {
            institution = existingMembership.institution;
        } else {
            institution = await getDefaultInstitution();
        }
    }

    const membership = await InstitutionUser.findOne({
        where: {
            id_institution: institution.id_institution,
            id_user: user.id_user,
            statut: "active",
        },
    });

    if (!membership) {
        if (institution.slug === DEFAULT_INSTITUTION_SLUG) {
            const created = await ensureUserMembership(user, institution);
            return { institution, membership: created };
        }

        const error = new Error("Accès refusé à cette institution");
        error.status = 403;
        error.code = "TENANT_ACCESS_DENIED";
        throw error;
    }

    return { institution, membership };
};

export const tenantWhere = (req, extra = {}) => {
    if (!req.tenant?.id_institution) {
        throw new Error("Tenant manquant dans la requête");
    }
    return {
        ...extra,
        id_institution: req.tenant.id_institution,
    };
};

export const withTenant = (req, data = {}) => {
    const clean = { ...data };
    delete clean.id_institution;
    return {
        ...clean,
        id_institution: req.tenant.id_institution,
    };
};
