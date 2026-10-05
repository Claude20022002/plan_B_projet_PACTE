import { Op } from "sequelize";
import { OidcPayload } from "../../models/index.js";

/**
 * Adaptateur de stockage d'oidc-provider sur MySQL (table OidcPayloads), au lieu de l'adaptateur
 * en mémoire : les connexions en cours et les autorisations survivent à un redémarrage.
 * Contrat : https://github.com/panva/node-oidc-provider/blob/main/example/my_adapter.js
 */
export default class SequelizeAdapter {
    constructor(model) {
        this.model = model;
    }

    async upsert(id, payload, expiresIn) {
        await OidcPayload.upsert({
            id,
            model: this.model,
            payload,
            grant_id: payload.grantId ?? null,
            user_code: payload.userCode ?? null,
            uid: payload.uid ?? null,
            expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        });
    }

    async #trouver(where) {
        const ligne = await OidcPayload.findOne({ where: { model: this.model, ...where } });
        if (!ligne || (ligne.expires_at && ligne.expires_at <= new Date())) return undefined;
        return { ...ligne.payload, ...(ligne.consumed_at ? { consumed: true } : {}) };
    }

    find(id) {
        return this.#trouver({ id });
    }

    findByUid(uid) {
        return this.#trouver({ uid });
    }

    findByUserCode(userCode) {
        return this.#trouver({ user_code: userCode });
    }

    async consume(id) {
        await OidcPayload.update({ consumed_at: new Date() }, { where: { model: this.model, id } });
    }

    async destroy(id) {
        await OidcPayload.destroy({ where: { model: this.model, id } });
    }

    /** Révocation d'une autorisation : tous les codes et jetons qui en découlent, quel que soit le modèle. */
    async revokeByGrantId(grantId) {
        await OidcPayload.destroy({ where: { grant_id: grantId } });
    }

    /** Ménage des enregistrements expirés (appelé périodiquement par le fournisseur). */
    static async purger() {
        return OidcPayload.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
    }
}
