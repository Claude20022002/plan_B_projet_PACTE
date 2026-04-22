/**
 * Tests unitaires pour paginationHelper.js
 * Fonctions pures — aucune dépendance externe.
 */

import {
    getPaginationParams,
    createPaginationResponse,
} from '../../utils/paginationHelper.js';

describe('getPaginationParams', () => {
    const makeReq = (query = {}) => ({ query });

    test('retourne les valeurs par défaut si pas de query', () => {
        const result = getPaginationParams(makeReq());
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(0);
    });

    test('parse correctement page et limit', () => {
        const result = getPaginationParams(makeReq({ page: '3', limit: '20' }));
        expect(result.page).toBe(3);
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(40); // (3-1) * 20
    });

    test('limite la valeur max de limit à 100', () => {
        const result = getPaginationParams(makeReq({ limit: '500' }));
        expect(result.limit).toBe(100);
    });

    test('retombe sur defaultLimit si limit vaut 0 (falsy)', () => {
        // parseInt('0') = 0 (falsy) → || defaultLimit s'active, donc limit = 10
        const result = getPaginationParams(makeReq({ limit: '0' }));
        expect(result.limit).toBe(10);
    });

    test('force page à minimum 1', () => {
        const result = getPaginationParams(makeReq({ page: '-5' }));
        expect(result.page).toBe(1);
        expect(result.offset).toBe(0);
    });

    test('utilise le defaultLimit fourni', () => {
        const result = getPaginationParams(makeReq(), 25);
        expect(result.limit).toBe(25);
    });

    test('gère les valeurs non numériques (NaN → 1)', () => {
        const result = getPaginationParams(makeReq({ page: 'abc', limit: 'xyz' }));
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
    });
});

describe('createPaginationResponse', () => {
    const data = [1, 2, 3];

    test('retourne la structure correcte', () => {
        const response = createPaginationResponse(data, 30, 1, 10);
        expect(response).toHaveProperty('data', data);
        expect(response).toHaveProperty('pagination');
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.limit).toBe(10);
        expect(response.pagination.total).toBe(30);
        expect(response.pagination.totalPages).toBe(3);
    });

    test('calcule hasNext et hasPrev correctement', () => {
        const firstPage = createPaginationResponse(data, 30, 1, 10);
        expect(firstPage.pagination.hasNext).toBe(true);
        expect(firstPage.pagination.hasPrev).toBe(false);

        const lastPage = createPaginationResponse(data, 30, 3, 10);
        expect(lastPage.pagination.hasNext).toBe(false);
        expect(lastPage.pagination.hasPrev).toBe(true);

        const middlePage = createPaginationResponse(data, 30, 2, 10);
        expect(middlePage.pagination.hasNext).toBe(true);
        expect(middlePage.pagination.hasPrev).toBe(true);
    });

    test('calcule totalPages avec des données incomplètes', () => {
        // 21 éléments avec limit 10 → 3 pages
        const response = createPaginationResponse(data, 21, 1, 10);
        expect(response.pagination.totalPages).toBe(3);
    });

    test('retourne 0 pages si aucune donnée', () => {
        const response = createPaginationResponse([], 0, 1, 10);
        expect(response.pagination.totalPages).toBe(0);
        expect(response.pagination.hasNext).toBe(false);
        expect(response.pagination.hasPrev).toBe(false);
    });
});
