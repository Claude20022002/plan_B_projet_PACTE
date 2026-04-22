/**
 * Tests unitaires pour passwordHelper.js
 * Ces tests n'ont pas besoin d'une base de données.
 */

import {
    hashPassword,
    comparePassword,
    generateRandomPassword,
    validatePasswordStrength,
} from '../../utils/passwordHelper.js';

describe('validatePasswordStrength', () => {
    test('accepte un mot de passe fort', () => {
        const result = validatePasswordStrength('Secure@123');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('rejette un mot de passe trop court', () => {
        const result = validatePasswordStrength('Ab@1');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Le mot de passe doit contenir au moins 8 caractères');
    });

    test('rejette un mot de passe sans majuscule', () => {
        const result = validatePasswordStrength('secure@123');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('majuscule'))).toBe(true);
    });

    test('rejette un mot de passe sans minuscule', () => {
        const result = validatePasswordStrength('SECURE@123');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('minuscule'))).toBe(true);
    });

    test('rejette un mot de passe sans chiffre', () => {
        const result = validatePasswordStrength('Secure@abc');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('chiffre'))).toBe(true);
    });

    test('rejette un mot de passe sans caractère spécial', () => {
        const result = validatePasswordStrength('Secure1234');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('spécial'))).toBe(true);
    });

    test('retourne toutes les erreurs en même temps', () => {
        const result = validatePasswordStrength('abc');
        expect(result.valid).toBe(false);
        // Trop court, sans majuscule, sans chiffre, sans spécial
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
});

describe('generateRandomPassword', () => {
    test('génère un mot de passe de 12 caractères par défaut', () => {
        const password = generateRandomPassword();
        expect(password).toHaveLength(12);
    });

    test('génère un mot de passe de la longueur demandée', () => {
        const password = generateRandomPassword(20);
        expect(password).toHaveLength(20);
    });

    test('génère des mots de passe différents à chaque appel', () => {
        const p1 = generateRandomPassword();
        const p2 = generateRandomPassword();
        // Probabilité infime que deux passwords de 12 chars soient identiques
        expect(p1).not.toBe(p2);
    });
});

describe('hashPassword et comparePassword', () => {
    test('hash un mot de passe et le compare avec succès', async () => {
        const plain = 'TestPassword@1';
        const hashed = await hashPassword(plain);

        expect(hashed).toBeDefined();
        expect(hashed).not.toBe(plain);
        expect(hashed.startsWith('$2')).toBe(true); // Préfixe bcrypt

        const isMatch = await comparePassword(plain, hashed);
        expect(isMatch).toBe(true);
    });

    test('comparePassword retourne false pour un mauvais mot de passe', async () => {
        const hashed = await hashPassword('CorrectPass@1');
        const isMatch = await comparePassword('WrongPass@1', hashed);
        expect(isMatch).toBe(false);
    });

    test('deux hash du même mot de passe sont différents (sel aléatoire)', async () => {
        const plain = 'SamePassword@1';
        const hash1 = await hashPassword(plain);
        const hash2 = await hashPassword(plain);
        expect(hash1).not.toBe(hash2);
        // Les deux doivent quand même valider
        expect(await comparePassword(plain, hash1)).toBe(true);
        expect(await comparePassword(plain, hash2)).toBe(true);
    });
});
