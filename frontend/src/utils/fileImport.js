import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Parse un fichier Excel ou CSV et retourne les données
 * @param {File} file - Le fichier à parser
 * @returns {Promise<Array>} - Les données parsées
 */
export const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();

        if (fileExtension === 'csv') {
            // Parser CSV avec PapaParse
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error(`Erreurs lors du parsing CSV: ${results.errors.map(e => e.message).join(', ')}`));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error) => {
                    reject(new Error(`Erreur lors du parsing CSV: ${error.message}`));
                },
            });
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            // Parser Excel avec XLSX
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Erreur lors du parsing Excel: ${error.message}`));
                }
            };
            reader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du fichier'));
            };
            reader.readAsArrayBuffer(file);
        } else {
            reject(new Error('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)'));
        }
    });
};

/**
 * Valide les données importées pour les utilisateurs
 * @param {Array} data - Les données à valider
 * @param {Array} requiredFields - Les champs requis
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateUserData = (data, requiredFields = ['nom', 'prenom', 'email', 'role']) => {
    const errors = [];
    
    if (!Array.isArray(data) || data.length === 0) {
        errors.push('Le fichier est vide ou invalide');
        return { valid: false, errors };
    }

    data.forEach((row, index) => {
        const rowNum = index + 2; // +2 car index commence à 0 et on compte l'en-tête
        
        requiredFields.forEach((field) => {
            if (!row[field] || row[field].toString().trim() === '') {
                errors.push(`Ligne ${rowNum}: Le champ "${field}" est requis`);
            }
        });

        // Validation email
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(`Ligne ${rowNum}: Email invalide (${row.email})`);
        }

        // Validation rôle
        if (row.role && !['admin', 'enseignant', 'etudiant'].includes(row.role.toLowerCase())) {
            errors.push(`Ligne ${rowNum}: Rôle invalide (${row.role}). Doit être: admin, enseignant ou etudiant`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Valide les données importées pour les enseignants
 * @param {Array} data - Les données à valider
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateEnseignantData = (data) => {
    const errors = [];
    
    if (!Array.isArray(data) || data.length === 0) {
        errors.push('Le fichier est vide ou invalide');
        return { valid: false, errors };
    }

    const requiredFields = ['email', 'specialite', 'departement'];
    
    data.forEach((row, index) => {
        const rowNum = index + 2;
        
        requiredFields.forEach((field) => {
            if (!row[field] || row[field].toString().trim() === '') {
                errors.push(`Ligne ${rowNum}: Le champ "${field}" est requis`);
            }
        });

        // Validation email
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(`Ligne ${rowNum}: Email invalide (${row.email})`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Valide les données importées pour les étudiants
 * @param {Array} data - Les données à valider
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateEtudiantData = (data) => {
    const errors = [];
    
    if (!Array.isArray(data) || data.length === 0) {
        errors.push('Le fichier est vide ou invalide');
        return { valid: false, errors };
    }

    const requiredFields = ['email', 'numero_etudiant', 'niveau'];
    
    data.forEach((row, index) => {
        const rowNum = index + 2;
        
        requiredFields.forEach((field) => {
            if (!row[field] || row[field].toString().trim() === '') {
                errors.push(`Ligne ${rowNum}: Le champ "${field}" est requis`);
            }
        });

        // Validation email
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(`Ligne ${rowNum}: Email invalide (${row.email})`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
};

