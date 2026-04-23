import dotenv from 'dotenv';
import sequelize, { testConnection } from './config/db.js';
import './models/index.js';
import {
    Users, Enseignant, Etudiant, Filiere, Groupe, Salle, Cours, Creneau,
    Affectation, DemandeReport, Disponibilite, Notification, Conflit, Appartenir
} from './models/index.js';
import { hashPassword } from './utils/passwordHelper.js';

dotenv.config();

/**
 * Seed HESTIM-PACTE v2 — Dataset réaliste aligné sur l'analyse KPI (notebook)
 *
 * Cibles (source : hestim_analyse_kpis.ipynb) :
 *   - 35 salles · 100 enseignants · ~380 étudiants · 14 groupes · 50 cours
 *   - Filières : IIA, CYB, BD  (3 filières, 5 niveaux)
 *   - ~4 500 affectations  sur Sep 2025 → Jan 2026
 *   - Taux occupation salles : ~55 %
 *   - Taux conflits          : ~13.7 %
 *   - Vendredi 14h30         : créneau dominant (~17 % des confirmées)
 *   - Durées : 90 min (41 %) · 105 min (42 %) · 210 min (17 %)
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function getMondays(startStr, endStr) {
    const mondays = [];
    const d = new Date(startStr);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    const end = new Date(endStr);
    while (d <= end) {
        mondays.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 7);
    }
    return mondays;
}

const JOUR_OFF = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5 };
const weekDate = (mondayStr, jour) => {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + JOUR_OFF[jour]);
    return d.toISOString().slice(0, 10);
};

// ── Constantes dataset ────────────────────────────────────────────────────────

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// 5 créneaux — correspond aux 5 heure_debut uniques du notebook
const SLOTS_DEF = [
    { heure_debut: '09:00', heure_fin: '10:45', duree_minutes: 105 }, // S1
    { heure_debut: '11:00', heure_fin: '12:30', duree_minutes: 90  }, // S2
    { heure_debut: '13:30', heure_fin: '15:15', duree_minutes: 105 }, // S3
    { heure_debut: '14:30', heure_fin: '18:00', duree_minutes: 210 }, // S4 — Vendredi 14h30 dominant (17 %)
    { heure_debut: '15:30', heure_fin: '17:00', duree_minutes: 90  }, // S5
];

// Statuts : ~75 % CONFIRMEE, ~15 % ANNULEE, ~10 % REPORTEE (source KPI notebook)
const STATUTS_POOL = [
    'CONFIRMEE','CONFIRMEE','CONFIRMEE','CONFIRMEE','CONFIRMEE','CONFIRMEE','CONFIRMEE','CONFIRMEE',
    'ANNULEE','ANNULEE',
    'REPORTEE',
];

// 35 salles — nommage A-S01/B-LABO01 comme dans le notebook
const SALLES_DEF = [
    // Amphithéâtres (3)
    { nom_salle: 'A-AMPHI1', type_salle: 'Amphithéâtre',             capacite: 200, batiment: 'A', etage: 0 },
    { nom_salle: 'A-AMPHI2', type_salle: 'Amphithéâtre',             capacite: 150, batiment: 'A', etage: 1 },
    { nom_salle: 'A-AMPHI3', type_salle: 'Amphithéâtre',             capacite: 100, batiment: 'A', etage: 2 },
    // Salles standard A-S01 à A-S15 (15)
    { nom_salle: 'A-S01',  type_salle: 'Salle de cours', capacite: 38, batiment: 'A', etage: 1 },
    { nom_salle: 'A-S02',  type_salle: 'Salle de cours', capacite: 36, batiment: 'A', etage: 1 },
    { nom_salle: 'A-S03',  type_salle: 'Salle de cours', capacite: 40, batiment: 'A', etage: 1 },
    { nom_salle: 'A-S04',  type_salle: 'Salle de cours', capacite: 35, batiment: 'A', etage: 1 },
    { nom_salle: 'A-S05',  type_salle: 'Salle de cours', capacite: 38, batiment: 'A', etage: 1 },
    { nom_salle: 'A-S06',  type_salle: 'Salle de cours', capacite: 36, batiment: 'A', etage: 2 },
    { nom_salle: 'A-S07',  type_salle: 'Salle de cours', capacite: 40, batiment: 'A', etage: 2 },
    { nom_salle: 'A-S08',  type_salle: 'Salle de cours', capacite: 35, batiment: 'A', etage: 2 },
    { nom_salle: 'A-S09',  type_salle: 'Salle de cours', capacite: 38, batiment: 'A', etage: 2 },
    { nom_salle: 'A-S10',  type_salle: 'Salle de cours', capacite: 36, batiment: 'A', etage: 2 },
    { nom_salle: 'A-S11',  type_salle: 'Salle de cours', capacite: 40, batiment: 'A', etage: 3 },
    { nom_salle: 'A-S12',  type_salle: 'Salle de cours', capacite: 35, batiment: 'A', etage: 3 },
    { nom_salle: 'A-S13',  type_salle: 'Salle de cours', capacite: 38, batiment: 'A', etage: 3 },
    { nom_salle: 'A-S14',  type_salle: 'Salle de cours', capacite: 36, batiment: 'A', etage: 3 },
    { nom_salle: 'A-S15',  type_salle: 'Salle de cours', capacite: 40, batiment: 'A', etage: 3 },
    // Labos informatique B-LABO01 à B-LABO05 (5)
    { nom_salle: 'B-LABO01', type_salle: 'Laboratoire informatique', capacite: 28, batiment: 'B', etage: 1 },
    { nom_salle: 'B-LABO02', type_salle: 'Laboratoire informatique', capacite: 28, batiment: 'B', etage: 1 },
    { nom_salle: 'B-LABO03', type_salle: 'Laboratoire informatique', capacite: 28, batiment: 'B', etage: 1 },
    { nom_salle: 'B-LABO04', type_salle: 'Laboratoire informatique', capacite: 28, batiment: 'B', etage: 2 },
    { nom_salle: 'B-LABO05', type_salle: 'Laboratoire informatique', capacite: 28, batiment: 'B', etage: 2 },
    // Salles TD C-TD01 à C-TD12 (12)
    { nom_salle: 'C-TD01',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 1 },
    { nom_salle: 'C-TD02',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 1 },
    { nom_salle: 'C-TD03',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 1 },
    { nom_salle: 'C-TD04',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 1 },
    { nom_salle: 'C-TD05',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 2 },
    { nom_salle: 'C-TD06',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 2 },
    { nom_salle: 'C-TD07',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 2 },
    { nom_salle: 'C-TD08',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 2 },
    { nom_salle: 'C-TD09',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 3 },
    { nom_salle: 'C-TD10',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 3 },
    { nom_salle: 'C-TD11',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 3 },
    { nom_salle: 'C-TD12',  type_salle: 'Salle TD', capacite: 24, batiment: 'C', etage: 3 },
]; // Total : 3 + 15 + 5 + 12 = 35 ✓

// 14 groupes — 3 filières × 5 niveaux (certains niveaux manquants selon filière)
// Total effectifs : 30+28+27+25+22 + 28+26+24+22 + 30+28+26+25+23 = 364 ≈ 380 ✓
const GROUPES_DEF = [
    { nom_groupe: 'IIA-1A', filiere: 'IIA', niveau: '1ère année', effectif: 30 },
    { nom_groupe: 'IIA-2A', filiere: 'IIA', niveau: '2ème année', effectif: 28 },
    { nom_groupe: 'IIA-2B', filiere: 'IIA', niveau: '2ème année', effectif: 27 },
    { nom_groupe: 'IIA-3A', filiere: 'IIA', niveau: '3ème année', effectif: 25 },
    { nom_groupe: 'IIA-3B', filiere: 'IIA', niveau: '3ème année', effectif: 22 },
    { nom_groupe: 'CYB-1A', filiere: 'CYB', niveau: '1ère année', effectif: 28 },
    { nom_groupe: 'CYB-2A', filiere: 'CYB', niveau: '2ème année', effectif: 26 },
    { nom_groupe: 'CYB-4A', filiere: 'CYB', niveau: '4ème année', effectif: 24 },
    { nom_groupe: 'CYB-5A', filiere: 'CYB', niveau: '5ème année', effectif: 22 },
    { nom_groupe: 'BD-1A',  filiere: 'BD',  niveau: '1ère année', effectif: 30 },
    { nom_groupe: 'BD-2A',  filiere: 'BD',  niveau: '2ème année', effectif: 28 },
    { nom_groupe: 'BD-3A',  filiere: 'BD',  niveau: '3ème année', effectif: 26 },
    { nom_groupe: 'BD-4A',  filiere: 'BD',  niveau: '4ème année', effectif: 25 },
    { nom_groupe: 'BD-5A',  filiere: 'BD',  niveau: '5ème année', effectif: 23 },
]; // Total : 14 ✓

// 50 cours — 3 filières × 5 niveaux (17 IIA + 17 CYB + 16 BD)
const COURS_DEF = [
    // ── IIA — Ingénierie Informatique et IA (17) ──────────────────────────────
    { code: 'IIA-1-ALGO',   nom: 'Algorithmique et Structures de données', filiere: 'IIA', niveau: '1ère année', type: 'CM', vh: 30, coef: 3 },
    { code: 'IIA-1-PROG',   nom: 'Programmation C/C++',                    filiere: 'IIA', niveau: '1ère année', type: 'TP', vh: 30, coef: 3 },
    { code: 'IIA-1-MATH',   nom: "Mathématiques pour l'informatique",      filiere: 'IIA', niveau: '1ère année', type: 'CM', vh: 30, coef: 3 },
    { code: 'IIA-1-SYS',    nom: "Systèmes d'exploitation",                filiere: 'IIA', niveau: '1ère année', type: 'TP', vh: 20, coef: 2 },
    { code: 'IIA-1-BENG',   nom: 'Business English',                       filiere: 'IIA', niveau: '1ère année', type: 'TD', vh: 20, coef: 1 },
    { code: 'IIA-1-RESX',   nom: 'Introduction aux Réseaux',               filiere: 'IIA', niveau: '1ère année', type: 'CM', vh: 20, coef: 2 },
    { code: 'IIA-2-POO',    nom: 'Programmation Orientée Objet (Java)',    filiere: 'IIA', niveau: '2ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'IIA-2-BDD',    nom: 'Bases de Données Avancées',              filiere: 'IIA', niveau: '2ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'IIA-2-PROBA',  nom: 'Probabilités et Statistiques',           filiere: 'IIA', niveau: '2ème année', type: 'CM', vh: 30, coef: 2 },
    { code: 'IIA-2-WEB',    nom: 'Développement Web',                      filiere: 'IIA', niveau: '2ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'IIA-2-RESINF', nom: 'Réseaux informatiques',                  filiere: 'IIA', niveau: '2ème année', type: 'CM', vh: 30, coef: 2 },
    { code: 'IIA-3-ANNUM',  nom: 'Analyse numérique',                      filiere: 'IIA', niveau: '3ème année', type: 'CM', vh: 30, coef: 2 },
    { code: 'IIA-3-RO',     nom: 'Recherche Opérationnelle',               filiere: 'IIA', niveau: '3ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'IIA-3-ALGP',   nom: 'Algorithmes de graphes avec Python',     filiere: 'IIA', niveau: '3ème année', type: 'TP', vh: 30, coef: 2 },
    { code: 'IIA-3-DWFS',   nom: 'Développement Web Full-stack',           filiere: 'IIA', niveau: '3ème année', type: 'TP', vh: 40, coef: 3 },
    { code: 'IIA-3-PACTE',  nom: 'Projet PACTE',                           filiere: 'IIA', niveau: '3ème année', type: 'Projet', vh: 40, coef: 4 },
    { code: 'IIA-3-ENT',    nom: 'Entrepreneuriat 2 — Business Model',     filiere: 'IIA', niveau: '3ème année', type: 'CM', vh: 20, coef: 2 },
    // ── CYB — Cybersécurité (17) ──────────────────────────────────────────────
    { code: 'CYB-1-INTRO',   nom: 'Introduction à la Cybersécurité',       filiere: 'CYB', niveau: '1ère année', type: 'CM', vh: 30, coef: 3 },
    { code: 'CYB-1-PROG',    nom: 'Programmation Python',                  filiere: 'CYB', niveau: '1ère année', type: 'TP', vh: 30, coef: 3 },
    { code: 'CYB-1-MATH',    nom: 'Mathématiques Discrètes',               filiere: 'CYB', niveau: '1ère année', type: 'CM', vh: 30, coef: 3 },
    { code: 'CYB-1-OS',      nom: "Systèmes d'exploitation avancés",       filiere: 'CYB', niveau: '1ère année', type: 'TP', vh: 30, coef: 2 },
    { code: 'CYB-2-CRYPTO',  nom: 'Cryptographie',                         filiere: 'CYB', niveau: '2ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'CYB-2-RESX',    nom: 'Sécurité des Réseaux',                  filiere: 'CYB', niveau: '2ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'CYB-2-PENTEST', nom: "Pentest et Tests d'intrusion",          filiere: 'CYB', niveau: '2ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'CYB-4-SOC',     nom: 'Security Operations Center (SOC)',      filiere: 'CYB', niveau: '4ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'CYB-4-FORENSI', nom: 'Forensics Numériques',                  filiere: 'CYB', niveau: '4ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'CYB-4-CLOUD',   nom: 'Sécurité Cloud',                        filiere: 'CYB', niveau: '4ème année', type: 'CM', vh: 20, coef: 2 },
    { code: 'CYB-5-AUDIT',   nom: 'Audit et Conformité SI',                filiere: 'CYB', niveau: '5ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'CYB-5-MALWARE', nom: 'Analyse de Malwares',                   filiere: 'CYB', niveau: '5ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'CYB-5-MGMT',    nom: 'Management de la Sécurité (CISO)',      filiere: 'CYB', niveau: '5ème année', type: 'CM', vh: 20, coef: 2 },
    { code: 'CYB-5-RISK',    nom: 'Gestion des Risques Informatiques',     filiere: 'CYB', niveau: '5ème année', type: 'CM', vh: 20, coef: 2 },
    { code: 'CYB-5-THESE',   nom: "Mémoire de fin d'études",               filiere: 'CYB', niveau: '5ème année', type: 'Projet', vh: 60, coef: 6 },
    { code: 'CYB-5-VULN',    nom: 'Gestion des Vulnérabilités',            filiere: 'CYB', niveau: '5ème année', type: 'CM', vh: 20, coef: 2 },
    { code: 'CYB-4-IDPS',    nom: 'Systèmes IDS/IPS',                     filiere: 'CYB', niveau: '4ème année', type: 'TP', vh: 20, coef: 2 },
    { code: 'CYB-2-LINUX',   nom: 'Administration Linux Sécurisée',        filiere: 'CYB', niveau: '2ème année', type: 'TP', vh: 20, coef: 2 },
    // ── BD — Big Data & Analytics (16) ───────────────────────────────────────
    { code: 'BD-1-PYTHON',   nom: 'Python pour la Data Science',           filiere: 'BD', niveau: '1ère année', type: 'TP', vh: 30, coef: 3 },
    { code: 'BD-1-STATS',    nom: 'Statistiques Descriptives',             filiere: 'BD', niveau: '1ère année', type: 'CM', vh: 30, coef: 3 },
    { code: 'BD-1-BDD',      nom: 'Bases de Données Relationnelles',       filiere: 'BD', niveau: '1ère année', type: 'CM', vh: 30, coef: 3 },
    { code: 'BD-2-ML',       nom: 'Machine Learning Fondamentaux',         filiere: 'BD', niveau: '2ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'BD-2-NOSQL',    nom: 'Bases de Données NoSQL',                filiere: 'BD', niveau: '2ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'BD-2-SPARK',    nom: 'Apache Spark & Hadoop',                 filiere: 'BD', niveau: '2ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'BD-3-DL',       nom: 'Deep Learning',                         filiere: 'BD', niveau: '3ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'BD-3-VIZ',      nom: 'Data Visualisation',                    filiere: 'BD', niveau: '3ème année', type: 'TP', vh: 20, coef: 2 },
    { code: 'BD-3-MLOPS',    nom: 'MLOps et Déploiement',                  filiere: 'BD', niveau: '3ème année', type: 'TP', vh: 30, coef: 3 },
    { code: 'BD-4-NLP',      nom: 'NLP — Traitement du Langage Naturel',  filiere: 'BD', niveau: '4ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'BD-4-KAFKA',    nom: 'Streaming avec Kafka',                  filiere: 'BD', niveau: '4ème année', type: 'TP', vh: 20, coef: 2 },
    { code: 'BD-5-LLM',      nom: 'Large Language Models & Agents IA',    filiere: 'BD', niveau: '5ème année', type: 'CM', vh: 30, coef: 3 },
    { code: 'BD-5-THESE',    nom: 'Projet de Recherche / PFE',             filiere: 'BD', niveau: '5ème année', type: 'Projet', vh: 60, coef: 6 },
    { code: 'BD-5-ETHICS',   nom: "Éthique et IA Responsable",             filiere: 'BD', niveau: '5ème année', type: 'CM', vh: 20, coef: 2 },
    { code: 'BD-4-GRAPH',    nom: 'Graph Analytics',                       filiere: 'BD', niveau: '4ème année', type: 'TP', vh: 20, coef: 2 },
    { code: 'BD-5-CLOUD',    nom: 'Cloud pour le Big Data',                filiere: 'BD', niveau: '5ème année', type: 'CM', vh: 20, coef: 2 },
]; // Total : 17 + 17 + 16 = 50 ✓

// 100 enseignants — 4 départements (source KPI 2 notebook)
const ENSEIGNANTS_DEF = [
    // Mathématiques (25) — surchargés identifiés dans le notebook
    { nom: 'BENNIS',     prenom: 'Driss',     dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'AYAD',       prenom: 'Samira',    dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'BONNET',     prenom: 'Jean',      dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'MERCIER',    prenom: 'Arnaud',    dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'GUYON',      prenom: 'Eric',      dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'DANIEL',     prenom: 'Antoine',   dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'DURAND',     prenom: 'Marc',      dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'MARTIN',     prenom: 'Pierre',    dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'BERNARD',    prenom: 'Sophie',    dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'THOMAS',     prenom: 'Claire',    dept: 'Mathématiques',  grade: 'Professeur'   },
    { nom: 'PETIT',      prenom: 'Laurent',   dept: 'Mathématiques',  grade: 'Maître de conférences' },
    { nom: 'ROBERT',     prenom: 'François',  dept: 'Mathématiques',  grade: 'Maître de conférences' },
    { nom: 'RICHARD',    prenom: 'Nicolas',   dept: 'Mathématiques',  grade: 'Maître de conférences' },
    { nom: 'SIMON',      prenom: 'Isabelle',  dept: 'Mathématiques',  grade: 'Maître de conférences' },
    { nom: 'MICHEL',     prenom: 'Patrick',   dept: 'Mathématiques',  grade: 'Maître de conférences' },
    { nom: 'LEBLANC',    prenom: 'Nathalie',  dept: 'Mathématiques',  grade: 'Maître de conférences' },
    { nom: 'ROUSSEAU',   prenom: 'Philippe',  dept: 'Mathématiques',  grade: 'Maître de conférences' },
    { nom: 'FONTAINE',   prenom: 'Marie',     dept: 'Mathématiques',  grade: 'Intervenant'  },
    { nom: 'MOREAU',     prenom: 'Alain',     dept: 'Mathématiques',  grade: 'Intervenant'  },
    { nom: 'LEROY',      prenom: 'Sylvie',    dept: 'Mathématiques',  grade: 'Intervenant'  },
    { nom: 'ROUX',       prenom: 'Thomas',    dept: 'Mathématiques',  grade: 'Intervenant'  },
    { nom: 'DUPONT',     prenom: 'Lucie',     dept: 'Mathématiques',  grade: 'Intervenant'  },
    { nom: 'FAURE',      prenom: 'Denis',     dept: 'Mathématiques',  grade: 'Intervenant'  },
    { nom: 'GIRARD',     prenom: 'Camille',   dept: 'Mathématiques',  grade: 'Intervenant'  },
    { nom: 'MOREL',      prenom: 'Xavier',    dept: 'Mathématiques',  grade: 'Intervenant'  },
    // Informatique (30) — département le plus représenté
    { nom: 'HAIDRAR',    prenom: 'Nadia',     dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'HANBALI',    prenom: 'Imane',     dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'BOUBEKRAOUI',prenom: 'Houda',     dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'KHIAT',      prenom: 'Mehdi',     dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'LEMONNIER',  prenom: 'Céline',    dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'PERROT',     prenom: 'Luc',       dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'BENOIT',     prenom: 'Anne',      dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'NORMAND',    prenom: 'Antoine',   dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'CHARLES',    prenom: 'Nathan',    dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'BOURGEOIS',  prenom: 'Stéphane',  dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'LEFEBVRE',   prenom: 'Valérie',   dept: 'Informatique',   grade: 'Professeur'   },
    { nom: 'HENRY',      prenom: 'Julien',    dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'MASSON',     prenom: 'Mélanie',   dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'CHEVALIER',  prenom: 'Romain',    dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'MARCHAND',   prenom: 'Elodie',    dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'BLANC',      prenom: 'Olivier',   dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'GUERIN',     prenom: 'Charlotte', dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'BOULANGER',  prenom: 'Maxime',    dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'RENAUD',     prenom: 'Laura',     dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'GIRAUD',     prenom: 'Hugo',      dept: 'Informatique',   grade: 'Maître de conférences' },
    { nom: 'ADAM',       prenom: 'Anaïs',     dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'LUCAS',      prenom: 'Baptiste',  dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'GARNIER',    prenom: 'Manon',     dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'AUBERT',     prenom: 'Kevin',     dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'CLEMENT',    prenom: 'Pauline',   dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'GAUTHIER',   prenom: 'Tristan',   dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'PICARD',     prenom: 'Lucie',     dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'BERTRAND',   prenom: 'Robin',     dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'MOULIN',     prenom: 'Sarah',     dept: 'Informatique',   grade: 'Intervenant'  },
    { nom: 'BARBIER',    prenom: 'Clément',   dept: 'Informatique',   grade: 'Intervenant'  },
    // IA & Data (25)
    { nom: 'LEDOUX',     prenom: 'Laure',     dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'MOUSTAKIM',  prenom: 'Mehdi',     dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'ARNAUD',     prenom: 'Eric',      dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'LEGRAND',    prenom: 'Julie',     dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'MALLET',     prenom: 'François',  dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'NOEL',       prenom: 'Céline',    dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'GROS',       prenom: 'Pierre',    dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'ROGER',      prenom: 'Marie',     dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'GUILLAUME',  prenom: 'Alexis',    dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'BARON',      prenom: 'Léa',       dept: 'IA & Data',      grade: 'Professeur'   },
    { nom: 'COLLET',     prenom: 'Romain',    dept: 'IA & Data',      grade: 'Maître de conférences' },
    { nom: 'MARTEL',     prenom: 'Alice',     dept: 'IA & Data',      grade: 'Maître de conférences' },
    { nom: 'CARON',      prenom: 'Tom',       dept: 'IA & Data',      grade: 'Maître de conférences' },
    { nom: 'FLEURY',     prenom: 'Eva',       dept: 'IA & Data',      grade: 'Maître de conférences' },
    { nom: 'MULLER',     prenom: 'Nathan',    dept: 'IA & Data',      grade: 'Maître de conférences' },
    { nom: 'VIDAL',      prenom: 'Clara',     dept: 'IA & Data',      grade: 'Maître de conférences' },
    { nom: 'GALLET',     prenom: 'Théo',      dept: 'IA & Data',      grade: 'Maître de conférences' },
    { nom: 'MARY',       prenom: 'Inès',      dept: 'IA & Data',      grade: 'Intervenant'  },
    { nom: 'BRIAND',     prenom: 'Axel',      dept: 'IA & Data',      grade: 'Intervenant'  },
    { nom: 'PICHON',     prenom: 'Chloé',     dept: 'IA & Data',      grade: 'Intervenant'  },
    { nom: 'CARLIER',    prenom: 'Émile',     dept: 'IA & Data',      grade: 'Intervenant'  },
    { nom: 'LECOMTE',    prenom: 'Zoé',       dept: 'IA & Data',      grade: 'Intervenant'  },
    { nom: 'DELMAS',     prenom: 'Valentin',  dept: 'IA & Data',      grade: 'Intervenant'  },
    { nom: 'MEUNIER',    prenom: 'Jade',      dept: 'IA & Data',      grade: 'Intervenant'  },
    { nom: 'GRONDIN',    prenom: 'Dylan',     dept: 'IA & Data',      grade: 'Intervenant'  },
    // Cybersécurité (20)
    { nom: 'LAMBERT',    prenom: 'Guillaume', dept: 'Cybersécurité',  grade: 'Professeur'   },
    { nom: 'BENIRZIK',   prenom: 'Youssef',   dept: 'Cybersécurité',  grade: 'Professeur'   },
    { nom: 'ELOTMANI',   prenom: 'Salma',     dept: 'Cybersécurité',  grade: 'Professeur'   },
    { nom: 'EL KARI',    prenom: 'Fatima',    dept: 'Cybersécurité',  grade: 'Professeur'   },
    { nom: 'BAUDRY',     prenom: 'Marc',      dept: 'Cybersécurité',  grade: 'Professeur'   },
    { nom: 'FERRAND',    prenom: 'Gaël',      dept: 'Cybersécurité',  grade: 'Professeur'   },
    { nom: 'MICHAUD',    prenom: 'Pauline',   dept: 'Cybersécurité',  grade: 'Maître de conférences' },
    { nom: 'LECLERCQ',   prenom: 'Sébastien', dept: 'Cybersécurité',  grade: 'Maître de conférences' },
    { nom: 'RENARD',     prenom: 'Hélène',    dept: 'Cybersécurité',  grade: 'Maître de conférences' },
    { nom: 'VALETTE',    prenom: 'Nicolas',   dept: 'Cybersécurité',  grade: 'Maître de conférences' },
    { nom: 'JOUBERT',    prenom: 'Marion',    dept: 'Cybersécurité',  grade: 'Maître de conférences' },
    { nom: 'LACROIX',    prenom: 'Antoine',   dept: 'Cybersécurité',  grade: 'Maître de conférences' },
    { nom: 'DELATTRE',   prenom: 'Sophie',    dept: 'Cybersécurité',  grade: 'Intervenant'  },
    { nom: 'BLONDEL',    prenom: 'Rémi',      dept: 'Cybersécurité',  grade: 'Intervenant'  },
    { nom: 'BERGER',     prenom: 'Julie',     dept: 'Cybersécurité',  grade: 'Intervenant'  },
    { nom: 'CORDIER',    prenom: 'Maxime',    dept: 'Cybersécurité',  grade: 'Intervenant'  },
    { nom: 'HERVE',      prenom: 'Laura',     dept: 'Cybersécurité',  grade: 'Intervenant'  },
    { nom: 'BLANCHARD',  prenom: 'Florian',   dept: 'Cybersécurité',  grade: 'Intervenant'  },
    { nom: 'DUMONT',     prenom: 'Elisa',     dept: 'Cybersécurité',  grade: 'Intervenant'  },
    { nom: 'GRONDIN',    prenom: 'Kevin',     dept: 'Cybersécurité',  grade: 'Intervenant'  },
]; // Total : 25 + 30 + 25 + 20 = 100 ✓

// Prénoms étudiants marocains (source dataset HESTIM)
const PRENOMS_M = ['Hamza','Yassine','Karim','Omar','Mehdi','Anas','Ibrahim','Khalid','Younes','Amine','Nabil','Rachid','Tariq','Ayoub','Zakaria'];
const PRENOMS_F = ['Aya','Meryem','Salma','Zineb','Nora','Fatima','Rania','Hana','Lamia','Sara','Ghita','Asmaa','Hajar','Imane','Kenza'];
const NOMS_ETU  = ['BENALI','TAZI','CHERKAOUI','OUALI','HAJJI','IDRISSI','ALAMI','BENSAID','ZAHIR','BOUKHRISS','TAHIRI','MEKOUAR','LACHGAR','AMRANI','BERRADA','KETTANI','FASSI','NACIRI','BENOMAR','DRISSI','ELFILALI','ZOUHEIR','BAKKALI','AKJOUT','SEBTI','CHRAIBI','LAHLOU','HASSANI','BENNANI','MRANI','SEKKAT','FILALI','BARGACH'];

// ── seed() ────────────────────────────────────────────────────────────────────
async function seed() {
    try {
        console.log('🌱 Démarrage du seed HESTIM-PACTE v2 (dataset réaliste KPI)...');
        await testConnection();
        console.log('✅ Connexion DB');

        const models = [Users, Filiere, Salle, Creneau, Groupe, Cours, Enseignant,
                        Etudiant, Affectation, DemandeReport, Disponibilite,
                        Notification, Conflit, Appartenir];
        for (const M of models) {
            try { await M.sync({ force: false }); } catch (e) { console.warn('⚠️ sync:', e.message); }
        }

        const defaultPassword = await hashPassword('password123');

        // ── 1. Admins ─────────────────────────────────────────────────────────
        const [admin] = await Users.findOrCreate({
            where: { email: 'admin@hestim.ma' },
            defaults: { nom: 'HAIDRAR', prenom: 'Admin', email: 'admin@hestim.ma',
                        password_hash: defaultPassword, role: 'admin', telephone: '+212 522 000 001', actif: true },
        });
        await Users.findOrCreate({
            where: { email: 'admin2@hestim.ma' },
            defaults: { nom: 'ALAOUI', prenom: 'Leila', email: 'admin2@hestim.ma',
                        password_hash: defaultPassword, role: 'admin', telephone: '+212 522 000 002', actif: true },
        });
        console.log('✅ 2 admins');

        // ── 2. Filières (3 : IIA, CYB, BD) ───────────────────────────────────
        const filieresMap = {};
        for (const d of [
            { code_filiere: 'IIA', nom_filiere: 'Ingénierie Informatique et Intelligence Artificielle', description: 'Filière IIA' },
            { code_filiere: 'CYB', nom_filiere: 'Cybersécurité',                                        description: 'Filière CYB' },
            { code_filiere: 'BD',  nom_filiere: 'Big Data & Analytics',                                 description: 'Filière BD'  },
        ]) {
            const [f] = await Filiere.findOrCreate({ where: { code_filiere: d.code_filiere }, defaults: d });
            filieresMap[d.code_filiere] = f;
        }
        console.log('✅ 3 filières (IIA, CYB, BD)');

        // ── 3. Groupes (14) ───────────────────────────────────────────────────
        const groupesMap = {};
        for (const d of GROUPES_DEF) {
            const [g] = await Groupe.findOrCreate({
                where: { nom_groupe: d.nom_groupe },
                defaults: { nom_groupe: d.nom_groupe, id_filiere: filieresMap[d.filiere].id_filiere,
                            niveau: d.niveau, effectif: d.effectif, annee_scolaire: '2025/2026' },
            });
            groupesMap[d.nom_groupe] = g;
        }
        console.log(`✅ ${GROUPES_DEF.length} groupes`);

        // ── 4. Enseignants (100) ──────────────────────────────────────────────
        const enseignantsList = [];
        const ensByDept = { 'Mathématiques': [], 'Informatique': [], 'IA & Data': [], 'Cybersécurité': [] };
        for (let i = 0; i < ENSEIGNANTS_DEF.length; i++) {
            const d = ENSEIGNANTS_DEF[i];
            const email = `${d.prenom.toLowerCase()
                .normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/\s+/g, '.')}.${d.nom.toLowerCase()
                .replace(/\s+/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '')}${i}@hestim.ma`;
            const [user, created] = await Users.findOrCreate({
                where: { email },
                defaults: { nom: d.nom, prenom: d.prenom, email,
                            password_hash: defaultPassword, role: 'enseignant',
                            telephone: `+212 6${String(i).padStart(8, '0')}`, actif: true },
            });
            if (created) {
                await Enseignant.create({ id_user: user.id_user, specialite: d.dept, departement: d.dept, grade: d.grade });
            }
            enseignantsList.push({ user, dept: d.dept, nom: d.nom });
            ensByDept[d.dept].push(user);
        }
        console.log(`✅ ${enseignantsList.length} enseignants`);

        // ── 5. Étudiants (~364) ───────────────────────────────────────────────
        let etuCount = 0;
        const firstEtu = [];
        for (const d of GROUPES_DEF) {
            const groupe = groupesMap[d.nom_groupe];
            for (let i = 0; i < d.effectif; i++) {
                const isMale = Math.random() > 0.45;
                const prenom = isMale ? PRENOMS_M[i % PRENOMS_M.length] : PRENOMS_F[i % PRENOMS_F.length];
                const nom    = NOMS_ETU[etuCount % NOMS_ETU.length];
                const num    = `ETU-${d.nom_groupe}-${String(i + 1).padStart(3, '0')}`;
                const email  = `${prenom.toLowerCase()
                    .normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .replace(/\s+/g, '.')}.${nom.toLowerCase()}${etuCount}@hestim.ma`;
                const [user, created] = await Users.findOrCreate({
                    where: { email },
                    defaults: { nom, prenom, email, password_hash: defaultPassword, role: 'etudiant',
                                telephone: `+212 6${String(etuCount).padStart(8, '0')}`, actif: true },
                });
                if (created) {
                    const exists = await Etudiant.findByPk(user.id_user);
                    if (!exists) {
                        await Etudiant.create({ id_user: user.id_user, numero_etudiant: num, niveau: d.niveau });
                        await Appartenir.findOrCreate({
                            where: { id_user_etudiant: user.id_user, id_groupe: groupe.id_groupe },
                            defaults: { id_user_etudiant: user.id_user, id_groupe: groupe.id_groupe },
                        });
                    }
                }
                if (firstEtu.length < 5) firstEtu.push(user);
                etuCount++;
            }
        }
        console.log(`✅ ${etuCount} étudiants`);

        // ── 6. Salles (35) ────────────────────────────────────────────────────
        const sallesList = [];
        for (const d of SALLES_DEF) {
            const [s] = await Salle.findOrCreate({
                where: { nom_salle: d.nom_salle },
                defaults: { ...d, disponible: true },
            });
            sallesList.push(s);
        }
        console.log(`✅ ${sallesList.length} salles`);

        // ── 7. Créneaux (5 × 6 = 30) ─────────────────────────────────────────
        const creneauxList = [];
        const creneauxMap  = {};
        for (const jour of JOURS) {
            for (const slot of SLOTS_DEF) {
                const [c] = await Creneau.findOrCreate({
                    where: { jour_semaine: jour, heure_debut: slot.heure_debut, heure_fin: slot.heure_fin },
                    defaults: { jour_semaine: jour, ...slot },
                });
                creneauxList.push(c);
                creneauxMap[`${jour}_${slot.heure_debut}`] = c;
            }
        }
        console.log(`✅ ${creneauxList.length} créneaux (5 slots × 6 jours)`);

        // ── 8. Cours (50) ─────────────────────────────────────────────────────
        const coursMap = {};
        for (const d of COURS_DEF) {
            const semestre = d.niveau === '1ère année' ? 'S1'
                           : d.niveau === '2ème année' ? 'S3'
                           : d.niveau === '3ème année' ? 'S5'
                           : d.niveau === '4ème année' ? 'S7' : 'S9';
            const [c] = await Cours.findOrCreate({
                where: { code_cours: d.code },
                defaults: { code_cours: d.code, nom_cours: d.nom,
                            id_filiere: filieresMap[d.filiere].id_filiere,
                            niveau: d.niveau, volume_horaire: d.vh, type_cours: d.type,
                            semestre, coefficient: d.coef },
            });
            coursMap[d.code] = c;
        }
        console.log(`✅ ${COURS_DEF.length} cours`);

        // ── 9. Disponibilités (100 ens × 30 créneaux) ────────────────────────
        let dispoCount = 0;
        for (const { user } of enseignantsList) {
            for (const cr of creneauxList) {
                const [, created] = await Disponibilite.findOrCreate({
                    where: { id_user_enseignant: user.id_user, id_creneau: cr.id_creneau,
                             date_debut: '2025-09-01', date_fin: '2026-01-31' },
                    defaults: { id_user_enseignant: user.id_user, id_creneau: cr.id_creneau,
                                disponible: true, date_debut: '2025-09-01', date_fin: '2026-01-31' },
                });
                if (created) dispoCount++;
            }
        }
        console.log(`✅ ${dispoCount} disponibilités`);

        // ── 10. Affectations — génération Sep 2025 → Jan 2026 (~4 500) ───────
        // Mapping groupe → codes cours disponibles
        const coursByGroupe = {};
        for (const gDef of GROUPES_DEF) {
            coursByGroupe[gDef.nom_groupe] = COURS_DEF
                .filter(c => c.filiere === gDef.filiere && c.niveau === gDef.niveau)
                .map(c => c.code);
        }

        // Mapping cours → enseignant selon département
        const ensForCours = (code) => {
            if (/MATH|PROBA|ANNUM|STATS|RO|STATS/.test(code)) return pick(ensByDept['Mathématiques']);
            if (/CYB|CRYPTO|FORENSI|MALWARE|SOC|AUDIT|RISK|MGMT|PENTEST|IDPS|VULN|LINUX/.test(code)) return pick(ensByDept['Cybersécurité']);
            if (/ML|DL|NLP|LLM|SPARK|NOSQL|KAFKA|VIZ|MLOPS|ETHICS|GRAPH|CLOUD|BD-/.test(code)) return pick(ensByDept['IA & Data']);
            return pick(ensByDept['Informatique']);
        };

        // Génération hebdomadaire — p=0.48 pour atteindre ~55 % taux d'occupation
        // Vendredi 14h30 boosté à p=0.90 → créneau dominant (KPI 4)
        const mondays = getMondays('2025-09-01', '2026-01-31');
        let affCount  = 0;

        for (const monday of mondays) {
            for (const [gNom, groupe] of Object.entries(groupesMap)) {
                const gCours = coursByGroupe[gNom] || [];
                if (!gCours.length) continue;

                for (const jour of JOURS) {
                    for (const slot of SLOTS_DEF) {
                        // Créneau Vendredi 14h30 : très chargé (source KPI 4 notebook)
                        const isVendredi1430 = jour === 'vendredi' && slot.heure_debut === '14:30';
                        const p = isVendredi1430 ? 0.90 : 0.48;
                        if (Math.random() > p) continue;

                        const cr = creneauxMap[`${jour}_${slot.heure_debut}`];
                        if (!cr) continue;

                        const code    = pick(gCours);
                        const cours   = coursMap[code];
                        if (!cours) continue;

                        const salle   = pick(sallesList); // aléatoire → génère des conflits réalistes (~13 %)
                        const ensUser = ensForCours(code);
                        const statut  = pick(STATUTS_POOL);
                        const dateSeance = weekDate(monday, jour);

                        const [, created] = await Affectation.findOrCreate({
                            where: { date_seance: dateSeance, id_cours: cours.id_cours,
                                     id_groupe: groupe.id_groupe, id_creneau: cr.id_creneau },
                            defaults: {
                                date_seance: dateSeance, statut,
                                id_cours:    cours.id_cours,
                                id_groupe:   groupe.id_groupe,
                                id_user_enseignant: ensUser.id_user,
                                id_salle:    salle.id_salle,
                                id_creneau:  cr.id_creneau,
                                id_user_admin: admin.id_user,
                                commentaire: null,
                            },
                        });
                        if (created) affCount++;
                    }
                }
            }
        }
        console.log(`✅ ${affCount} affectations (Sep 2025 → Jan 2026)`);

        // ── 11. Conflits réalistes (source KPI 5 notebook) ───────────────────
        // Notebook : 464 conflits salle + 195 conflits enseignant = 659 total (13.7 %)
        const conflitsRaw = [
            { type_conflit: 'chevauchement_salle',      description: 'A-S01 doublement réservée le 2025-10-13 à 13h30',                resolu: false },
            { type_conflit: 'chevauchement_salle',      description: 'B-LABO01 doublement réservée le 2025-11-03 à 09h00',             resolu: true  },
            { type_conflit: 'chevauchement_salle',      description: 'C-TD04 doublement réservée le 2025-12-08 à 11h00',               resolu: false },
            { type_conflit: 'chevauchement_salle',      description: 'A-AMPHI2 doublement réservée le 2025-12-17 à 14h30 (Vendredi)',  resolu: false },
            { type_conflit: 'chevauchement_salle',      description: 'A-S07 doublement réservée le 2026-01-14 à 13h30',                resolu: true  },
            { type_conflit: 'chevauchement_enseignant', description: 'Enseignant doublement affecté le 2025-10-21 à 09h00',            resolu: false },
            { type_conflit: 'chevauchement_enseignant', description: 'Enseignant doublement affecté le 2025-11-18 à 14h30 (Vendredi)', resolu: true  },
            { type_conflit: 'chevauchement_enseignant', description: 'Enseignant doublement affecté le 2025-12-09 à 11h00',            resolu: false },
            { type_conflit: 'chevauchement_groupe',     description: 'Groupe IIA-2A : 2 affectations au même créneau le 2025-10-06',   resolu: true  },
            { type_conflit: 'chevauchement_groupe',     description: 'Groupe BD-3A : 2 affectations au même créneau le 2025-11-24',    resolu: false },
        ];
        for (const d of conflitsRaw) {
            await Conflit.findOrCreate({
                where: { description: d.description },
                defaults: { ...d, date_detection: new Date(), date_resolution: d.resolu ? new Date() : null },
            });
        }
        console.log(`✅ ${conflitsRaw.length} conflits`);

        // ── 12. Demandes de report ────────────────────────────────────────────
        const premierEns = enseignantsList[0].user;
        const premAff    = await Affectation.findOne({ where: { id_user_enseignant: premierEns.id_user } });
        if (premAff) {
            await DemandeReport.findOrCreate({
                where: { id_user_enseignant: premierEns.id_user, id_affectation: premAff.id_affectation },
                defaults: {
                    id_user_enseignant: premierEns.id_user,
                    id_affectation:     premAff.id_affectation,
                    motif:              'Participation au jury de soutenance',
                    nouvelle_date:      '2025-11-10',
                    statut_demande:     'en_attente',
                },
            });
            console.log('✅ Demande de report créée');
        }

        // ── 13. Notifications ─────────────────────────────────────────────────
        const notifsRaw = [
            { id_user: admin.id_user,
              titre: 'HESTIM Planner 2025-2026 opérationnel',
              message: 'Le planning Sep 2025 → Jan 2026 est disponible.',
              type_notification: 'success', lue: true },
            { id_user: admin.id_user,
              titre: 'Taux de conflits élevé (13.7 %)',
              message: '659 conflits détectés (464 salle + 195 enseignant). Corriger l\'algorithme.',
              type_notification: 'warning', lue: false },
            { id_user: admin.id_user,
              titre: 'Créneau surchargé — Vendredi 14h30',
              message: 'Ce créneau concentre 17 % des réservations. Redistribuer les cours.',
              type_notification: 'warning', lue: false },
            { id_user: admin.id_user,
              titre: '12 enseignants surchargés détectés',
              message: 'Charge > 77 h (seuil). Écart min/max : 53 h. Équilibrer la planification.',
              type_notification: 'warning', lue: false },
            { id_user: enseignantsList[0].user.id_user,
              titre: 'Planning disponible',
              message: 'Votre emploi du temps 2025-2026 est consultable sur HESTIM Planner.',
              type_notification: 'info', lue: false },
            { id_user: enseignantsList[1].user.id_user,
              titre: 'Charge horaire excessive',
              message: 'Votre volume dépasse le seuil recommandé de 77 h.',
              type_notification: 'warning', lue: false },
            { id_user: firstEtu[0]?.id_user,
              titre: 'Emploi du temps disponible',
              message: 'Consultez votre emploi du temps sur HESTIM Planner.',
              type_notification: 'info', lue: false },
            { id_user: firstEtu[1]?.id_user,
              titre: 'DS planifié',
              message: 'Un devoir surveillé est programmé cette semaine. Consultez le planning.',
              type_notification: 'warning', lue: false },
        ].filter(n => n.id_user);

        for (const d of notifsRaw) {
            await Notification.findOrCreate({ where: { id_user: d.id_user, titre: d.titre }, defaults: d });
        }
        console.log(`✅ ${notifsRaw.length} notifications`);

        // ── Résumé final ──────────────────────────────────────────────────────
        console.log('\n🎉 Seed HESTIM-PACTE v2 terminé !\n');
        console.log('📊 KPIs cibles (source : hestim_analyse_kpis.ipynb) :');
        console.log('   KPI 1 — Taux occupation salles  : ~55.4 %   (35 salles × 6 jours × 5 créneaux)');
        console.log('   KPI 2 — Moy. heures/enseignant  : ~66 h     (σ = 11.5 h, 12 surchargés > 77 h)');
        console.log('   KPI 3 — Moy. heures/étudiant    : ~17.4 h');
        console.log('   KPI 4 — Créneau dominant        : Vendredi 14h30 (~17 % des confirmées, 210 min)');
        console.log('   KPI 5 — Taux de conflits        : ~13.7 %   (464 salle + 195 enseignant)');
        console.log('   KPI 6 — Durée moy. des cours    : ~116.8 min (90/105/210 min)');
        console.log('   KPI 7 — Filière dominante       : BD — Big Data (~38.5 % des séances)');
        console.log('\n📋 Comptes de test :');
        console.log('   👨‍💼 Admin       : admin@hestim.ma  (password123)');
        console.log(`   👨‍🏫 Enseignants : ${enseignantsList[0].user.email}  (password123)`);
        console.log(`   👨‍🎓 Étudiants   : ${firstEtu[0]?.email}  (password123)`);
        console.log('\n📦 Volumes créés :');
        console.log(`   Filières : 3    Groupes : ${GROUPES_DEF.length}    Salles : ${sallesList.length}    Créneaux : ${creneauxList.length}`);
        console.log(`   Enseignants : ${enseignantsList.length}    Étudiants : ${etuCount}    Cours : ${COURS_DEF.length}`);
        console.log(`   Affectations : ${affCount}    Période : Sep 2025 → Jan 2026`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur seed:', error);
        process.exit(1);
    }
}

seed();
