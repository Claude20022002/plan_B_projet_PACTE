/**
 * Tests unitaires du gestionnaire global des erreurs (lot A-5) : format commun
 * { message, code, violations? } pour les erreurs connues — pas de DB.
 */
import { jest } from '@jest/globals';
import { errorHandler } from '../../middleware/errorHandler.js';
import { ErreurMetier } from '../../services/planning/enseignements.js';

const repondre = (err) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    errorHandler(err, {}, res, () => {});
    return { statut: res.status.mock.calls[0][0], corps: res.json.mock.calls[0][0] };
};

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('errorHandler : format commun des erreurs', () => {
    test('validation Sequelize : 400 VALIDATION, un champ par violation', () => {
        const { statut, corps } = repondre({ name: 'SequelizeValidationError', errors: [{ path: 'email', message: 'Validation isEmail on email failed' }] });
        expect(statut).toBe(400);
        expect(corps).toEqual({ message: 'Erreur de validation', code: 'VALIDATION', violations: [{ champ: 'email', message: 'Validation isEmail on email failed' }] });
    });

    test('valeur unique déjà prise : 409 DEJA_EXISTANT', () => {
        const { statut, corps } = repondre({ name: 'SequelizeUniqueConstraintError', errors: [{ path: 'nom_salle', message: 'nom_salle must be unique' }] });
        expect(statut).toBe(409);
        expect(corps).toMatchObject({ code: 'DEJA_EXISTANT', violations: [{ champ: 'nom_salle' }] });
    });

    test('erreur métier non interceptée : son statut et son code, plus de 500', () => {
        const { statut, corps } = repondre(new ErreurMetier('Module introuvable', 404));
        expect(statut).toBe(404);
        expect(corps).toEqual({ message: 'Module introuvable', code: 'INTROUVABLE' });
        expect(repondre(new ErreurMetier('Plafond atteint', 429, 'QUOTA_IA')).corps.code).toBe('QUOTA_IA');
    });

    test('erreur interne : le code d’une erreur système ne sort pas', () => {
        const err = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3306'), { code: 'ECONNREFUSED' });
        const { statut, corps } = repondre(err);
        expect(statut).toBe(500);
        expect(corps.code).toBe('ERREUR_SERVEUR');
        expect(Object.keys(corps).sort()).toEqual(['code', 'message']);
    });
});
