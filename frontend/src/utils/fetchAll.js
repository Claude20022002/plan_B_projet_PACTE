/**
 * Charge toutes les pages d'une liste paginée de l'API (le serveur plafonne à 100 éléments
 * par page). `apiGetAll` est une fonction de services/api.js, ex. coursAPI.getAll.
 */
export async function fetchAll(apiGetAll, params = {}) {
    const resultats = [];
    let page = 1;
    for (;;) {
        const reponse = await apiGetAll({ ...params, page, limit: 100 });
        const lignes = reponse?.data ?? reponse ?? [];
        resultats.push(...lignes);
        if (!reponse?.pagination?.hasNext) return resultats;
        page += 1;
    }
}
