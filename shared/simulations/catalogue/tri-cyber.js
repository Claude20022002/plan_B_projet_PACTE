/** Simulation « Tri Cyber » : classement d'incidents de sécurité par criticité (mécanique triage). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'tri-cyber', type: 'simulation', discipline: 'cybersecurite', moteur: 'triage',
    titre: texte('Tri Cyber', 'Cyber Triage'),
    resume: texte('Classer quatre incidents de sécurité par criticité selon portée, sensibilité des données et statut de confinement.', 'Classify four security incidents by severity using scope, data sensitivity, and containment status.'),
    objectif: texte('Appliquer une grille de criticité pour prioriser les réponses d\u2019un SOC.', 'Apply a severity matrix to prioritise SOC incident response.'),
    source: null,
    curriculum: { url: SOURCE.cyber, titre: texte('Génie Informatique : Cybersécurité', 'Computer Engineering: Cybersecurity'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'triage-01', niveau: 1, xp: 100,
            titre: texte('Incidents évidents', 'Clear-cut incidents'),
            consigne: texte('Classer les 4 incidents (1=Critique 2=Élevé 3=Moyen 4=Faible). Score = portée × sensibilité (publ 1/conf 2/secret 3) × statut (contenu 1/actif 2). Critique ≥ 30, Élevé ≥ 12, Moyen ≥ 4.', 'Classify the 4 incidents (1=Critical 2=High 3=Medium 4=Low). Score = scope × sensitivity (public 1/conf 2/secret 3) × status (contained 1/active 2). Critical ≥ 30, High ≥ 12, Medium ≥ 4.'),
            indice: texte('Ransomware : 8 postes secrets actifs → 8×3×2 = 48 → Critique.', 'Ransomware: 8 active secret hosts → 8×3×2 = 48 → Critical.'),
            bilan: texte('La criticité combine portée, sensibilité et urgence, pas l\u2019âge de la faille.', 'Severity combines scope, sensitivity, and urgency — not the age of the vulnerability.'),
            evenements: [
                { id: 'E1', titre: texte('Ransomware actif sur 8 postes secrets', 'Active ransomware on 8 secret hosts'), portee: 8, donnees: 'secret', statut: 'actif' },
                { id: 'E2', titre: texte('Article publié sur un blogue public', 'Article published on a public blog'), portee: 1, donnees: 'public', statut: 'contenu' },
                { id: 'E3', titre: texte('Accès non autorisé, 3 machines confidentielles, actif', 'Unauthorised access, 3 confidential machines, active'), portee: 3, donnees: 'confidentiel', statut: 'actif' },
                { id: 'E4', titre: texte('Clé USB chiffrée perdue et localisée, 4 postes, contenu', 'Lost encrypted USB, located, 4 hosts, contained'), portee: 4, donnees: 'confidentiel', statut: 'contenu' },
            ],
        },
        {
            id: 'triage-02', niveau: 2, xp: 150,
            titre: texte('Zones grises', 'Grey areas'),
            consigne: texte('Un incident contenu mais avec données secrètes, un DDoS actif sur des sites publics. Appliquer la grille sans sur-réagir.', 'A contained incident with secret data, an active DDoS on public sites. Apply the matrix without overreacting.'),
            indice: texte('Fuite : 2 postes secrets, contenu → 2×3×1 = 6 → Moyen, pas Critique.', 'Leak: 2 secret hosts, contained → 2×3×1 = 6 → Medium, not Critical.'),
            bilan: texte('Un incident « secret » mais contenu peut être Moyen ; un incident « public » actif peut être Élevé.', 'A secret but contained incident can be Medium; an active public one can be High.'),
            evenements: [
                { id: 'E1', titre: texte('Fuite limitée, 2 postes secrets, contenu en 2 min', 'Limited leak, 2 secret hosts, contained in 2 min'), portee: 2, donnees: 'secret', statut: 'contenu' },
                { id: 'E2', titre: texte('DDoS actif, 6 sites publics indisponibles', 'Active DDoS, 6 public sites unavailable'), portee: 6, donnees: 'public', statut: 'actif' },
                { id: 'E3', titre: texte('Credential stuffing actif, 5 comptes admin secrets', 'Active credential stuffing, 5 secret admin accounts'), portee: 5, donnees: 'secret', statut: 'actif' },
                { id: 'E4', titre: texte('Scan DMZ détecté, 1 poste public, contenu', 'DMZ scan detected, 1 public host, contained'), portee: 1, donnees: 'public', statut: 'contenu' },
            ],
        },
        {
            id: 'triage-03', niveau: 3, xp: 200,
            titre: texte('Zero-day et RH', 'Zero-day and HR data'),
            consigne: texte('Un zero-day actif sur 7 serveurs secrets, une fuite RH sur 4 postes… Appliquer la grille, pas la panique.', 'Active zero-day on 7 secret servers, an HR leak on 4 hosts… Apply the matrix, not panic.'),
            indice: texte('Zero-day : 7×3×2 = 42 → Critique. Fuite RH : 4×2×2 = 16 → Élevé.', 'Zero-day: 7×3×2 = 42 → Critical. HR leak: 4×2×2 = 16 → High.'),
            bilan: texte('Ce tri illustre une logique de priorisation — il ne constitue pas une norme ISO 27035 ni une procédure certifiée.', 'This triage illustrates prioritisation logic — it is not ISO 27035 or a certified procedure.'),
            evenements: [
                { id: 'E1', titre: texte('Accès RH non autorisé, 4 postes, confidentiel, actif', 'Unauthorised HR access, 4 hosts, confidential, active'), portee: 4, donnees: 'confidentiel', statut: 'actif' },
                { id: 'E2', titre: texte('Virus retiré, 3 postes publics', 'Malware removed, 3 public hosts'), portee: 3, donnees: 'public', statut: 'contenu' },
                { id: 'E3', titre: texte('Zero-day actif, 7 serveurs secrets', 'Active zero-day, 7 secret servers'), portee: 7, donnees: 'secret', statut: 'actif' },
                { id: 'E4', titre: texte('Fuite confidentielle, 5 postes, confinement rapide', 'Confidential leak, 5 hosts, quickly contained'), portee: 5, donnees: 'confidentiel', statut: 'contenu' },
            ],
        },
    ],
};
