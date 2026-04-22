/**
 * Tests unitaires pour roleMiddleware.js
 * Fonctions pures de vérification de rôle — pas de DB.
 */

// En mode ESM, jest n'est pas injecté globalement — import explicite requis
import { jest } from '@jest/globals';
import {
    requireRole,
    requireAdmin,
    requireEnseignant,
    requireEtudiant,
    requireOwnResourceOrAdmin,
} from '../../middleware/roleMiddleware.js';

// Helpers pour simuler req/res/next Express
const makeReq = (user = null, params = {}, body = {}) => ({ user, params, body });
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const makeNext = () => jest.fn();

describe('requireRole', () => {
    test('appelle next() si le rôle correspond', () => {
        const middleware = requireRole('admin');
        const req = makeReq({ role: 'admin', id_user: 1 });
        const res = makeRes();
        const next = makeNext();

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('retourne 401 si pas d\'utilisateur authentifié', () => {
        const middleware = requireRole('admin');
        const req = makeReq(null);
        const res = makeRes();
        const next = makeNext();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('retourne 403 si le rôle ne correspond pas', () => {
        const middleware = requireRole('admin');
        const req = makeReq({ role: 'etudiant', id_user: 5 });
        const res = makeRes();
        const next = makeNext();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('accepte plusieurs rôles', () => {
        const middleware = requireRole('admin', 'enseignant');
        const next = makeNext();
        const res = makeRes();

        middleware(makeReq({ role: 'enseignant', id_user: 2 }), res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
});

describe('requireAdmin', () => {
    test('passe si admin', () => {
        const next = makeNext();
        requireAdmin(makeReq({ role: 'admin', id_user: 1 }), makeRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('bloque si enseignant', () => {
        const res = makeRes();
        requireAdmin(makeReq({ role: 'enseignant', id_user: 2 }), res, makeNext());
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('requireEnseignant', () => {
    test('passe si enseignant', () => {
        const next = makeNext();
        requireEnseignant(makeReq({ role: 'enseignant', id_user: 2 }), makeRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('passe si admin (admin peut tout)', () => {
        const next = makeNext();
        requireEnseignant(makeReq({ role: 'admin', id_user: 1 }), makeRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('bloque si étudiant', () => {
        const res = makeRes();
        requireEnseignant(makeReq({ role: 'etudiant', id_user: 3 }), res, makeNext());
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('requireEtudiant', () => {
    test('passe si étudiant', () => {
        const next = makeNext();
        requireEtudiant(makeReq({ role: 'etudiant', id_user: 3 }), makeRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('passe si admin', () => {
        const next = makeNext();
        requireEtudiant(makeReq({ role: 'admin', id_user: 1 }), makeRes(), next);
        expect(next).toHaveBeenCalled();
    });
});

describe('requireOwnResourceOrAdmin', () => {
    test('passe si admin (peu importe la ressource)', () => {
        const middleware = requireOwnResourceOrAdmin('id');
        const next = makeNext();
        const req = makeReq({ role: 'admin', id_user: 1 }, { id: '99' });
        middleware(req, makeRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('passe si l\'utilisateur accède à sa propre ressource', () => {
        const middleware = requireOwnResourceOrAdmin('id');
        const next = makeNext();
        const req = makeReq({ role: 'enseignant', id_user: 5 }, { id: '5' });
        middleware(req, makeRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('bloque si l\'utilisateur accède à une ressource d\'un autre', () => {
        const middleware = requireOwnResourceOrAdmin('id');
        const res = makeRes();
        const req = makeReq({ role: 'enseignant', id_user: 5 }, { id: '7' });
        middleware(req, res, makeNext());
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('retourne 401 si pas d\'utilisateur', () => {
        const middleware = requireOwnResourceOrAdmin('id');
        const res = makeRes();
        middleware(makeReq(null, { id: '1' }), res, makeNext());
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
