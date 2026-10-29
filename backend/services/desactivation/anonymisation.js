import { AbonnementCalendrier, AppareilEtudiant, Desactivation, Enseignant, Etudiant, MfaCodeSecours, Users } from "../../models/index.js";
import sequelize from "../../config/db.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { empreinteInutilisable } from "../comptes.js";
import { journaliser } from "../journalSecurite.js";
import { compteOuErreur } from "./regles.js";

/**
 * Anonymisation d'un compte désactivé (loi 09-08 : fin de la durée de conservation, ou demande
 * d'effacement fondée). L'identité part, l'historique reste sans nom : séances données, présences
 * et résultats gardent leur compte, qui ne désigne plus personne. Irréversible.
 */

/** Efface l'identité d'un compte déjà désactivé. */
export const anonymiser = async (acteur, idUser, contexte = null) => {
    const user = await compteOuErreur(idUser);
    if (user.actif) throw new ErreurMetier("Désactivez le compte avant de l'anonymiser", 409, "COMPTE_ACTIF");
    if (user.anonymise_le) throw new ErreurMetier("Ce compte est déjà anonymisé", 409, "ANONYMISE");
    const empreinte = await empreinteInutilisable();
    await sequelize.transaction(async (transaction) => {
        await Users.update(
            {
                nom: "Ancien compte",
                prenom: `n° ${user.id_user}`,
                email: `anonyme-${user.id_user}@invalide.local`,
                telephone: null,
                avatar_url: null,
                password_hash: empreinte,
                must_change_password: false,
                mfa_secret: null,
                mfa_active: false,
                mfa_dernier_pas: null,
                desactivation_prevue_le: null,
                anonymise_le: new Date(),
            },
            { where: { id_user: user.id_user }, transaction }
        );
        await Etudiant.update({ numero_etudiant: `ANON-${user.id_user}` }, { where: { id_user: user.id_user }, transaction });
        await Enseignant.update({ bureau: null, entreprise: null }, { where: { id_user: user.id_user }, transaction });
        await MfaCodeSecours.destroy({ where: { id_user: user.id_user }, transaction });
        await AppareilEtudiant.destroy({ where: { id_user: user.id_user }, transaction });
        await AbonnementCalendrier.destroy({ where: { id_user: user.id_user }, transaction });
        await Desactivation.create({ id_user: user.id_user, action: "anonymisation", id_auteur: acteur?.id_user ?? null }, { transaction });
    });
    // Le journal ne garde pas l'ancienne adresse dans ce nouvel événement
    await journaliser(contexte, { evenement: "compte_anonymise", id_user: user.id_user, acteur });
    return { statut: "anonymise" };
};
