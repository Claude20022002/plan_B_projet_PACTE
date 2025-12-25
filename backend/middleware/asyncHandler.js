/**
 * Wrapper pour gérer les erreurs dans les fonctions async/await
 * Évite d'avoir à écrire try/catch dans chaque route
 *
 * @param {Function} fn - Fonction async à wrapper
 * @returns {Function} - Fonction wrapper qui gère les erreurs
 *
 * @example
 * router.get("/", asyncHandler(async (req, res) => {
 *     const users = await User.findAll();
 *     res.json(users);
 * }));
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
