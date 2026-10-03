import dotenv from 'dotenv';
import { pathToFileURL } from 'url';
import sequelize, { testConnection } from './config/db.js';
import './models/index.js';
import {
    Users, Enseignant, Etudiant, Filiere, Groupe, Salle, Cours, Creneau,
    Affectation, DemandeReport, Disponibilite, Notification, Conflit, Appartenir, Campus, CoursComposante,
} from './models/index.js';
import { normaliserTypeComposante } from './config/referentiel.js';
import { hashPassword } from './utils/passwordHelper.js';
import { runMigrations } from './migrations/migrator.js';
import { recalculerRangs } from './services/planning/referentiel.js';

dotenv.config();

// ════════════════════════════════════════════════════════════════════════════
//  HESTIM_CONFIG — Modifier ici pour personnaliser l'école
//  Bâtiments, filières, cours, départements — tout est ici.
// ════════════════════════════════════════════════════════════════════════════
const HESTIM_CONFIG = {

    admins: [
        { nom:'HAIDRAR', prenom:'Admin', email:'admin@hestim.ma',  telephone:'+212 522 000 001' },
        { nom:'ALAOUI',  prenom:'Leila', email:'admin2@hestim.ma', telephone:'+212 522 000 002' },
    ],

    // ── Bâtiments ─────────────────────────────────────────────────────
    // Ajouter un bâtiment : copier un bloc { code, nom, salles:[...] }
    // Chaque groupe de salles : { type, noms:[], capacites: number|number[], etages:number[] }
    batiments: [
        {
            code: 'G',
            nom:  'Gandhi',
            salles: [
                { type:'Amphithéâtre',            noms:['AMPHI1','AMPHI2'],                                       capacites:[200,150], etages:[0,1] },
                { type:'Salle de cours',           noms:['S01','S02','S03','S04','S05','S06','S07','S08'],         capacites:38,        etages:[1,1,1,2,2,2,3,3] },
                { type:'Labo informatique', noms:['LABO01','LABO02','LABO03'],                              capacites:28,        etages:[1,1,2] },
                { type:'Salle TD',                 noms:['TD01','TD02','TD03','TD04'],                             capacites:24,        etages:[1,1,2,2] },
            ],
        },
        {
            code: 'ST',
            nom:  'Stendhal',
            salles: [
                { type:'Amphithéâtre',            noms:['AMPHI1'],                                                capacites:[120],     etages:[0] },
                { type:'Salle de cours',           noms:['S01','S02','S03','S04','S05','S06','S07'],               capacites:36,        etages:[1,1,2,2,2,3,3] },
                { type:'Labo informatique', noms:['LABO01','LABO02'],                                       capacites:28,        etages:[1,2] },
                { type:'Salle TD',                 noms:['TD01','TD02','TD03','TD04','TD05','TD06','TD07','TD08'], capacites:24,        etages:[1,1,1,1,2,2,2,2] },
            ],
        },
    ],

    // ── Filières ──────────────────────────────────────────────────────
    // Ajouter une filière : copier un bloc { code, nom, abrege, cycle, niveaux:[...] }
    // niveaux : { label, semestre, effectif, nb_groupes }
    filieres: [
        // ── Cycle Préparatoire ────────────────────────────────────────────────
        // ── IIIA — Informatique & IA (1ère → 5ème année) ─────────────────────
        {
            code:'IIIA', nom:'Ingénierie Informatique et Intelligence Artificielle',
            abrege:'IIIA', cycle:'Ingénieur',
            niveaux:[
                { label:'1ère année', semestre:'S1', effectif:30, nb_groupes:2 },
                { label:'2ème année', semestre:'S3', effectif:28, nb_groupes:2 },
                { label:'3ème année', semestre:'S5', effectif:25, nb_groupes:2 },
                { label:'4ème année', semestre:'S7', effectif:22, nb_groupes:2 },
                { label:'5ème année', semestre:'S9', effectif:20, nb_groupes:1 },
            ],
        },
        {
            code:'PREPA-GI', nom:'Prépa Général Intégré',
            abrege:'GI', cycle:'Préparatoire',
            niveaux:[
                { label:'1ère année Prépa', semestre:'S1', effectif:32, nb_groupes:2 },
                { label:'2ème année Prépa', semestre:'S3', effectif:30, nb_groupes:2 },
            ],
        },
        // ── Cycle Ingénieur ───────────────────────────────────────────────────
        {
            code:'CYB', nom:'Cybersécurité',
            abrege:'CYB', cycle:'Ingénieur',
            niveaux:[
                { label:'3ème année', semestre:'S5', effectif:24, nb_groupes:1 },
                { label:'4ème année', semestre:'S7', effectif:22, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:20, nb_groupes:1 },
            ],
        },
        {
            code:'BD', nom:'Big Data & Analytics',
            abrege:'BD', cycle:'Ingénieur',
            niveaux:[
                { label:'3ème année', semestre:'S5', effectif:26, nb_groupes:2 },
                { label:'4ème année', semestre:'S7', effectif:24, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:22, nb_groupes:1 },
            ],
        },
        // ── Management ────────────────────────────────────────────────────────
        {
            code:'MGT', nom:'Management',
            abrege:'MGT', cycle:'Management',
            niveaux:[
                { label:'1ère année', semestre:'S1', effectif:30, nb_groupes:2 },
                { label:'2ème année', semestre:'S3', effectif:28, nb_groupes:2 },
                { label:'3ème année', semestre:'S5', effectif:25, nb_groupes:1 },
                { label:'4ème année', semestre:'S7', effectif:22, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:20, nb_groupes:1 },
            ],
        },
    ],

    // ── Cours ─────────────────────────────────────────────────────────────────
    // Ajouter un cours : { code, nom, filiere, niveau, type, vh, coef, dept }
    // dept doit correspondre à un HESTIM_CONFIG.departements[].nom
    cours: [
        // ── IIIA — 1ère année ─────────────────────────────────────────────────
        { code:'IIIA-1-ALGO',   nom:'Algorithmique et Structures de données', filiere:'IIIA', niveau:'1ère année', type:'CM', vh:30, coef:3, dept:'Informatique' },
        { code:'IIIA-1-PROG',   nom:'Programmation C/C++',                    filiere:'IIIA', niveau:'1ère année', type:'TP', vh:30, coef:3, dept:'Informatique' },
        { code:'IIIA-1-MATH',   nom:'Mathématiques 1',                        filiere:'IIIA', niveau:'1ère année', type:'CM', vh:30, coef:3, dept:'Mathématiques' },
        { code:'IIIA-1-PHYS',   nom:'Physique',                               filiere:'IIIA', niveau:'1ère année', type:'CM', vh:30, coef:2, dept:'Sciences' },
        { code:'IIIA-1-ANG',    nom:'Anglais Technique',                      filiere:'IIIA', niveau:'1ère année', type:'TD', vh:20, coef:1, dept:'Langues' },
        // ── IIIA — 2ème année ─────────────────────────────────────────────────
        { code:'IIIA-2-ALGO2',  nom:'Algorithmique Avancée',                  filiere:'IIIA', niveau:'2ème année', type:'CM', vh:30, coef:3, dept:'Informatique' },
        { code:'IIIA-2-POO',    nom:'Programmation Orientée Objet (Java)',    filiere:'IIIA', niveau:'2ème année', type:'TP', vh:30, coef:3, dept:'Informatique' },
        { code:'IIIA-2-MATH2',  nom:'Mathématiques 2',                        filiere:'IIIA', niveau:'2ème année', type:'CM', vh:30, coef:3, dept:'Mathématiques' },
        { code:'IIIA-2-SYS',    nom:"Systèmes d'information",                 filiere:'IIIA', niveau:'2ème année', type:'CM', vh:20, coef:2, dept:'Informatique' },
        // ── PREPA-GI — 1ère année Prépa ──────────────────────────────────────
        { code:'GI-1-MATH',     nom:'Mathématiques Générales 1',              filiere:'PREPA-GI', niveau:'1ère année Prépa', type:'CM', vh:30, coef:3, dept:'Mathématiques' },
        { code:'GI-1-PHYS',     nom:'Physique Générale',                      filiere:'PREPA-GI', niveau:'1ère année Prépa', type:'CM', vh:30, coef:3, dept:'Sciences' },
        { code:'GI-1-CHIM',     nom:'Chimie Générale',                        filiere:'PREPA-GI', niveau:'1ère année Prépa', type:'CM', vh:20, coef:2, dept:'Sciences' },
        { code:'GI-1-INFO',     nom:'Informatique Générale',                  filiere:'PREPA-GI', niveau:'1ère année Prépa', type:'TP', vh:20, coef:2, dept:'Informatique' },
        { code:'GI-1-ANG',      nom:'Anglais',                                filiere:'PREPA-GI', niveau:'1ère année Prépa', type:'TD', vh:20, coef:1, dept:'Langues' },
        // ── PREPA-GI — 2ème année Prépa ──────────────────────────────────────
        { code:'GI-2-MATH2',    nom:'Mathématiques Générales 2',              filiere:'PREPA-GI', niveau:'2ème année Prépa', type:'CM', vh:30, coef:3, dept:'Mathématiques' },
        { code:'GI-2-ELEC',     nom:'Électronique',                           filiere:'PREPA-GI', niveau:'2ème année Prépa', type:'CM', vh:30, coef:3, dept:'Sciences' },
        { code:'GI-2-PROG',     nom:'Programmation Python',                   filiere:'PREPA-GI', niveau:'2ème année Prépa', type:'TP', vh:30, coef:2, dept:'Informatique' },
        // ── IIIA — 3ème année ─────────────────────────────────────────────────
        { code:'IIIA-3-ANNUM',  nom:'Analyse Numérique',                      filiere:'IIIA', niveau:'3ème année', type:'CM', vh:30, coef:2, dept:'Mathématiques' },
        { code:'IIIA-3-RO',     nom:'Recherche Opérationnelle',               filiere:'IIIA', niveau:'3ème année', type:'CM', vh:30, coef:3, dept:'Mathématiques' },
        { code:'IIIA-3-ALGP',   nom:'Algorithmes de Graphes avec Python',     filiere:'IIIA', niveau:'3ème année', type:'TP', vh:30, coef:2, dept:'Informatique' },
        { code:'IIIA-3-DWFS',   nom:'Développement Web Full-stack',           filiere:'IIIA', niveau:'3ème année', type:'TP', vh:40, coef:3, dept:'Informatique' },
        { code:'IIIA-3-RESINF', nom:'Réseaux Informatiques',                  filiere:'IIIA', niveau:'3ème année', type:'CM', vh:30, coef:2, dept:'Informatique' },
        { code:'IIIA-3-PACTE',  nom:'Projet PACTE',                           filiere:'IIIA', niveau:'3ème année', type:'Projet', vh:40, coef:4, dept:'Informatique' },
        // ── IIIA — 4ème année ─────────────────────────────────────────────────
        { code:'IIIA-4-ML',     nom:'Machine Learning',                       filiere:'IIIA', niveau:'4ème année', type:'CM', vh:30, coef:3, dept:'IA & Data' },
        { code:'IIIA-4-DL',     nom:'Deep Learning',                          filiere:'IIIA', niveau:'4ème année', type:'CM', vh:30, coef:3, dept:'IA & Data' },
        { code:'IIIA-4-CLOUD',  nom:'Cloud Computing',                        filiere:'IIIA', niveau:'4ème année', type:'CM', vh:20, coef:2, dept:'Informatique' },
        { code:'IIIA-4-ENT',    nom:'Entrepreneuriat',                        filiere:'IIIA', niveau:'4ème année', type:'CM', vh:20, coef:2, dept:'Management' },
        // ── IIIA — 5ème année ─────────────────────────────────────────────────
        { code:'IIIA-5-LLM',    nom:'LLMs & Agents IA',                      filiere:'IIIA', niveau:'5ème année', type:'CM', vh:30, coef:3, dept:'IA & Data' },
        { code:'IIIA-5-MLOPS',  nom:'MLOps & Déploiement',                   filiere:'IIIA', niveau:'5ème année', type:'TP', vh:20, coef:2, dept:'IA & Data' },
        { code:'IIIA-5-PFE',    nom:"Projet de Fin d'Études",                filiere:'IIIA', niveau:'5ème année', type:'Projet', vh:60, coef:6, dept:'Informatique' },
        // ── CYB — 3ème année ──────────────────────────────────────────────────
        { code:'CYB-3-CRYPTO',  nom:'Cryptographie',                          filiere:'CYB', niveau:'3ème année', type:'CM', vh:30, coef:3, dept:'Cybersécurité' },
        { code:'CYB-3-RESX',    nom:'Sécurité des Réseaux',                  filiere:'CYB', niveau:'3ème année', type:'CM', vh:30, coef:3, dept:'Cybersécurité' },
        { code:'CYB-3-PENTEST', nom:"Pentest et Tests d'intrusion",           filiere:'CYB', niveau:'3ème année', type:'TP', vh:30, coef:3, dept:'Cybersécurité' },
        // ── CYB — 4ème année ──────────────────────────────────────────────────
        { code:'CYB-4-SOC',     nom:'Security Operations Center',             filiere:'CYB', niveau:'4ème année', type:'CM', vh:30, coef:3, dept:'Cybersécurité' },
        { code:'CYB-4-FORENSI', nom:'Forensics Numériques',                   filiere:'CYB', niveau:'4ème année', type:'TP', vh:30, coef:3, dept:'Cybersécurité' },
        { code:'CYB-4-IDPS',    nom:'Systèmes IDS/IPS',                      filiere:'CYB', niveau:'4ème année', type:'TP', vh:20, coef:2, dept:'Cybersécurité' },
        // ── CYB — 5ème année ──────────────────────────────────────────────────
        { code:'CYB-5-AUDIT',   nom:'Audit et Conformité SI',                 filiere:'CYB', niveau:'5ème année', type:'CM', vh:30, coef:3, dept:'Cybersécurité' },
        { code:'CYB-5-MALWARE', nom:'Analyse de Malwares',                    filiere:'CYB', niveau:'5ème année', type:'TP', vh:30, coef:3, dept:'Cybersécurité' },
        { code:'CYB-5-PFE',     nom:"Projet de Fin d'Études",                filiere:'CYB', niveau:'5ème année', type:'Projet', vh:60, coef:6, dept:'Cybersécurité' },
        // ── BD — 3ème année ───────────────────────────────────────────────────
        { code:'BD-3-DL',       nom:'Deep Learning',                          filiere:'BD', niveau:'3ème année', type:'CM', vh:30, coef:3, dept:'IA & Data' },
        { code:'BD-3-SPARK',    nom:'Apache Spark & Hadoop',                  filiere:'BD', niveau:'3ème année', type:'TP', vh:30, coef:3, dept:'IA & Data' },
        { code:'BD-3-VIZ',      nom:'Data Visualisation',                     filiere:'BD', niveau:'3ème année', type:'TP', vh:20, coef:2, dept:'IA & Data' },
        // ── BD — 4ème année ───────────────────────────────────────────────────
        { code:'BD-4-NLP',      nom:'NLP — Traitement du Langage',           filiere:'BD', niveau:'4ème année', type:'CM', vh:30, coef:3, dept:'IA & Data' },
        { code:'BD-4-KAFKA',    nom:'Streaming avec Kafka',                   filiere:'BD', niveau:'4ème année', type:'TP', vh:20, coef:2, dept:'IA & Data' },
        // ── BD — 5ème année ───────────────────────────────────────────────────
        { code:'BD-5-LLM',      nom:'Large Language Models',                  filiere:'BD', niveau:'5ème année', type:'CM', vh:30, coef:3, dept:'IA & Data' },
        { code:'BD-5-CLOUD',    nom:'Cloud pour le Big Data',                 filiere:'BD', niveau:'5ème année', type:'CM', vh:20, coef:2, dept:'IA & Data' },
        { code:'BD-5-PFE',      nom:"Projet de Fin d'Études",                filiere:'BD', niveau:'5ème année', type:'Projet', vh:60, coef:6, dept:'IA & Data' },
        // ── MGT — 1ère année ──────────────────────────────────────────────────
        { code:'MGT-1-ECO',     nom:'Économie Générale',                      filiere:'MGT', niveau:'1ère année', type:'CM', vh:30, coef:3, dept:'Management' },
        { code:'MGT-1-COMPTA',  nom:'Comptabilité Générale',                  filiere:'MGT', niveau:'1ère année', type:'CM', vh:30, coef:3, dept:'Management' },
        { code:'MGT-1-DROIT',   nom:'Droit des Affaires',                     filiere:'MGT', niveau:'1ère année', type:'CM', vh:20, coef:2, dept:'Management' },
        { code:'MGT-1-ANG',     nom:'Business English',                       filiere:'MGT', niveau:'1ère année', type:'TD', vh:20, coef:1, dept:'Langues' },
        // ── MGT — 2ème année ──────────────────────────────────────────────────
        { code:'MGT-2-MKTG',    nom:'Marketing Fondamentaux',                 filiere:'MGT', niveau:'2ème année', type:'CM', vh:30, coef:3, dept:'Management' },
        { code:'MGT-2-FIN',     nom:"Finance d'Entreprise",                   filiere:'MGT', niveau:'2ème année', type:'CM', vh:30, coef:3, dept:'Management' },
        { code:'MGT-2-STAT',    nom:'Statistiques Appliquées',                filiere:'MGT', niveau:'2ème année', type:'CM', vh:20, coef:2, dept:'Mathématiques' },
        // ── MGT — 3ème année ──────────────────────────────────────────────────
        { code:'MGT-3-RH',      nom:'Ressources Humaines',                    filiere:'MGT', niveau:'3ème année', type:'CM', vh:30, coef:3, dept:'Management' },
        { code:'MGT-3-STRAT',   nom:"Stratégie d'Entreprise",                filiere:'MGT', niveau:'3ème année', type:'CM', vh:30, coef:3, dept:'Management' },
        // ── MGT — 4ème année ──────────────────────────────────────────────────
        { code:'MGT-4-AUDIT',   nom:'Audit et Contrôle de Gestion',          filiere:'MGT', niveau:'4ème année', type:'CM', vh:30, coef:3, dept:'Management' },
        { code:'MGT-4-PROJ',    nom:'Gestion de Projet',                      filiere:'MGT', niveau:'4ème année', type:'CM', vh:20, coef:2, dept:'Management' },
        // ── MGT — 5ème année ──────────────────────────────────────────────────
        { code:'MGT-5-STRAT2',  nom:'Stratégie Internationale',               filiere:'MGT', niveau:'5ème année', type:'CM', vh:30, coef:3, dept:'Management' },
        { code:'MGT-5-PFE',     nom:"Mémoire de Fin d'Études",               filiere:'MGT', niveau:'5ème année', type:'Projet', vh:60, coef:6, dept:'Management' },
    ],

    // ── Départements enseignants ──────────────────────────────────────────────
    // Modifier nb pour changer le nombre d'enseignants par département
    departements: [
        { nom:'Mathématiques',  nb:15, grade:'Professeur' },
        { nom:'Informatique',   nb:20, grade:'Professeur' },
        { nom:'IA & Data',      nb:15, grade:'Professeur' },
        { nom:'Cybersécurité',  nb:12, grade:'Professeur' },
        { nom:'Sciences',       nb: 8, grade:'Professeur' },
        { nom:'Management',     nb:15, grade:'Professeur' },
        { nom:'Langues',        nb: 5, grade:'Maître de conférences' },
    ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const LETTERS = 'ABCDE';

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

const JOUR_OFF = { lundi:0, mardi:1, mercredi:2, jeudi:3, vendredi:4, samedi:5 };
const weekDate = (mondayStr, jour) => {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + JOUR_OFF[jour]);
    return d.toISOString().slice(0, 10);
};

// Extrait le premier chiffre du label de niveau (ex: "3ème année" → "3")
const niveauNum = (label) => label.match(/(\d)/)?.[1] ?? '1';

// ── Données dérivées automatiquement du config ────────────────────────────────

// Salles : dérivées de batiments
const SALLES_DEF = [];
for (const bat of HESTIM_CONFIG.batiments) {
    for (const grp of bat.salles) {
        grp.noms.forEach((suffix, i) => {
            SALLES_DEF.push({
                nom_salle:  `${bat.code}-${suffix}`,
                type_salle: grp.type,
                capacite:   Array.isArray(grp.capacites) ? grp.capacites[i] : grp.capacites,
                code_campus: bat.code,
                etage:      grp.etages[i],
            });
        });
    }
}

// Groupes : dérivés de filieres × niveaux × nb_groupes
const GROUPES_DEF = [];
for (const fil of HESTIM_CONFIG.filieres) {
    for (const niv of fil.niveaux) {
        for (let g = 0; g < niv.nb_groupes; g++) {
            GROUPES_DEF.push({
                nom_groupe:     `${fil.abrege}-${niveauNum(niv.label)}${LETTERS[g]}`,
                filiere_code:   fil.code,
                niveau:         niv.label,
                semestre:       niv.semestre,
                effectif:       niv.effectif,
                annee_scolaire: '2025/2026',
            });
        }
    }
}

// Noms pour génération de comptes
const NOMS_ENS = [
    'BENNIS','MOUSTAKIM','AYAD','BOUBEKRAOUI','HAIDRAR','HANBALI','KHIAT','EL KARI','ELOTMANI','BENIRZIK',
    'BONNET','LAMBERT','LEDOUX','MERCIER','LEMONNIER','GUYON','PERROT','DANIEL','BENOIT','NORMAND',
    'DURAND','CHARLES','MARTIN','BERNARD','THOMAS','PETIT','ROBERT','RICHARD','SIMON','MICHEL',
    'LEBLANC','GARCIA','ROUSSEAU','FONTAINE','MOREAU','LEROY','ROUX','DUPONT','FAURE','GIRARD',
    'MOREL','BOURGEOIS','LEFEBVRE','HENRY','MASSON','CHEVALIER','MARCHAND','BLANC','GUERIN','BOULANGER',
    'RENAUD','GIRAUD','ADAM','LUCAS','GARNIER','AUBERT','CLEMENT','GAUTHIER','PICARD','BERTRAND',
    'MOULIN','BARBIER','ARNAUD','LEGRAND','MALLET','NOEL','GROS','ROGER','GUILLAUME','BARON',
    'COLLET','MARTEL','CARON','FLEURY','MULLER','VIDAL','GALLET','MARY','BRIAND','PICHON',
    'CARLIER','LECOMTE','DELMAS','MEUNIER','GRONDIN','BAUDRY','FERRAND','MICHAUD','LECLERCQ','RENARD',
];
const PRENOMS_ENS = [
    'Alain','Nadia','Samira','Houda','Mohamed','Fatima','Mehdi','Leila','Younes','Omar',
    'Jean','Pierre','Marie','Sophie','François','Claire','Thomas','Nicolas','Isabelle','Laurent',
    'Éric','Sylvie','Patrick','Nathalie','Philippe','Céline','Luc','Anne','Charlotte','Maxime',
];
const NOMS_ETU = [
    'BENALI','TAZI','CHERKAOUI','OUALI','HAJJI','IDRISSI','ALAMI','BENSAID','ZAHIR','BOUKHRISS',
    'TAHIRI','MEKOUAR','LACHGAR','AMRANI','BERRADA','KETTANI','FASSI','NACIRI','BENOMAR','DRISSI',
    'ELFILALI','ZOUHEIR','BAKKALI','AKJOUT','SEBTI','CHRAIBI','LAHLOU','HASSANI','BENNANI','MRANI',
    'SEKKAT','FILALI','BARGACH','CHEKKOURI','BENJELLOUN','BELHAJ','MOUSSAOUI','SAIDI','KABBAJ','BOUZID',
];
const PRENOMS_M = ['Hamza','Yassine','Karim','Omar','Mehdi','Anas','Ibrahim','Khalid','Younes','Amine','Nabil','Rachid','Tariq','Ayoub','Zakaria'];
const PRENOMS_F = ['Aya','Meryem','Salma','Zineb','Nora','Fatima','Rania','Hana','Lamia','Sara','Ghita','Asmaa','Hajar','Imane','Kenza'];

// Grille officielle de la formation initiale, relevée sur l'emploi du temps HESTIM d'octobre 2026
// (docs/Planning) : 4 créneaux par jour, vendredi après-midi décalé après la pause de midi,
// samedi matin seulement. Mêmes rangs partout : une séance garde son rang d'un jour à l'autre.
const MATIN = [
    { heure_debut:'09:00', heure_fin:'10:45', duree_minutes:105 },
    { heure_debut:'11:00', heure_fin:'12:30', duree_minutes:90  },
];
const APRES_MIDI = [
    { heure_debut:'13:30', heure_fin:'15:15', duree_minutes:105 },
    { heure_debut:'15:30', heure_fin:'17:00', duree_minutes:90  },
];
const APRES_MIDI_VENDREDI = [
    { heure_debut:'14:30', heure_fin:'16:15', duree_minutes:105 },
    { heure_debut:'16:30', heure_fin:'18:00', duree_minutes:90  },
];
const GRILLE_HESTIM = {
    lundi:    [...MATIN, ...APRES_MIDI],
    mardi:    [...MATIN, ...APRES_MIDI],
    mercredi: [...MATIN, ...APRES_MIDI],
    jeudi:    [...MATIN, ...APRES_MIDI],
    vendredi: [...MATIN, ...APRES_MIDI_VENDREDI],
    samedi:   [...MATIN],
};

// Structure des cycles : sert à écrire « 2ème année du cycle Ingénieur d'Etat en … »
const CYCLES_SEED = {
    'Ingénieur':    { ecole:'engineering', cycle:'ingenieur', intitule_cycle:"cycle Ingénieur d'Etat", premiere_annee_cycle:3 },
    'Préparatoire': { ecole:'engineering', cycle:'prepa',     intitule_cycle:'cycle préparatoire intégré', premiere_annee_cycle:1 },
    'Management':   { ecole:'business',    cycle:'master',    intitule_cycle:'Programme Grande École', premiere_annee_cycle:1 },
};

// Année universitaire en cours : de septembre à août
const ANNEE_SCOLAIRE = (() => {
    const d = new Date();
    const debut = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return `${debut}-${debut + 1}`;
})();

// Composante initiale d'un module : le CM s'adresse à la promotion, le reste aux groupes de TD
const niveauGroupeDe = (type) => (type === 'CM' ? 'promotion' : 'td');

// Statuts conformes à l'ENUM du modèle (lowercase)
const STATUTS_POOL = [
    'confirme','confirme','confirme','confirme','confirme','confirme','confirme','confirme',
    'annule','annule','reporte',
];

// ── seed() ────────────────────────────────────────────────────────────────────
async function seed() {
    // Le seed crée des comptes de démonstration au mot de passe connu : interdit en production.
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Seed interdit en production (NODE_ENV=production)');
    }
    try {
        console.log('🌱 Seed HESTIM (config-driven) FINAL...');
        await testConnection();

        // Le schéma vient des migrations versionnées (jamais de sync() implicite)
        await runMigrations();

        const pwd = await hashPassword('password123');

        // Dates dynamiques : 1er jour du mois courant → dernier jour du mois prochain
        const _now   = new Date();
        const _y     = _now.getFullYear();
        const _m     = _now.getMonth();
        const DISPO_START  = new Date(_y, _m,     1).toISOString().slice(0, 10);
        const DISPO_END    = new Date(_y, _m + 2, 0).toISOString().slice(0, 10);
        const PERIOD_START = DISPO_START;
        const PERIOD_END   = DISPO_END;

        // ── 1. Admins ─────────────────────────────────────────────────────────
        const admins = [];
        for (const d of HESTIM_CONFIG.admins) {
            const [u] = await Users.findOrCreate({
                where: { email: d.email },
                defaults: { 
                    nom:d.nom, 
                    prenom:d.prenom, 
                    email:d.email, 
                    password_hash:pwd, 
                    role:'admin', 
                    telephone:d.telephone, 
                    actif:true 
                },
            });
            admins.push(u);
        }
        const admin = admins[0];
        console.log(`✅ ${admins.length} admins`);

        // ── 2. Filières ───────────────────────────────────────────────────────
        const filieresMap = {};
        for (const f of HESTIM_CONFIG.filieres) {
            const [rec] = await Filiere.findOrCreate({
                where: { code_filiere: f.code },
                defaults: {
                    code_filiere:f.code,
                    nom_filiere:f.nom,
                    description:`${f.cycle} — ${f.nom}`,
                    ...(CYCLES_SEED[f.cycle] || {}),
                },
            });
            filieresMap[f.code] = rec;
        }
        console.log(`✅ ${Object.keys(filieresMap).length} filières`);

        // ── 3. Groupes : une promotion par (filière, année), ses groupes de TD dessous ──
        const groupesMap = {};
        const promotionsMap = {};
        for (const gDef of GROUPES_DEF) {
            const fil = HESTIM_CONFIG.filieres.find(f => f.code === gDef.filiere_code);
            const annee = Number(niveauNum(gDef.niveau));
            const clePromo = `${gDef.filiere_code}|${gDef.niveau}`;
            if (!promotionsMap[clePromo]) {
                const effectifPromo = GROUPES_DEF
                    .filter(x => x.filiere_code === gDef.filiere_code && x.niveau === gDef.niveau)
                    .reduce((total, x) => total + x.effectif, 0);
                const [promo] = await Groupe.findOrCreate({
                    where: { nom_groupe: `${annee}A ${fil.abrege}`, annee_scolaire: ANNEE_SCOLAIRE },
                    defaults: {
                        nom_groupe:     `${annee}A ${fil.abrege}`,
                        id_filiere:     filieresMap[gDef.filiere_code].id_filiere,
                        niveau:         gDef.niveau,
                        effectif:       effectifPromo,
                        annee_scolaire: ANNEE_SCOLAIRE,
                        type_groupe:    'promotion',
                        annee,
                    },
                });
                promotionsMap[clePromo] = promo;
            }
            const [g] = await Groupe.findOrCreate({
                where: { nom_groupe: gDef.nom_groupe, annee_scolaire: ANNEE_SCOLAIRE },
                defaults: {
                    nom_groupe:       gDef.nom_groupe,
                    id_filiere:       filieresMap[gDef.filiere_code].id_filiere,
                    niveau:           gDef.niveau,
                    effectif:         gDef.effectif,
                    annee_scolaire:   ANNEE_SCOLAIRE,
                    type_groupe:      'td',
                    id_groupe_parent: promotionsMap[clePromo].id_groupe,
                    annee,
                },
            });
            groupesMap[gDef.nom_groupe] = g;
        }
        console.log(`✅ ${Object.keys(promotionsMap).length} promotions, ${GROUPES_DEF.length} groupes de TD (${ANNEE_SCOLAIRE})`);

        // ── 4. Enseignants ────────────────────────────────────────────────────
        const enseignantsList = [];
        const ensByDept = {};
        for (const d of HESTIM_CONFIG.departements) ensByDept[d.nom] = [];

        let ensIdx = 0;
        for (const dCfg of HESTIM_CONFIG.departements) {
            for (let i = 0; i < dCfg.nb; i++, ensIdx++) {
                const nom    = NOMS_ENS[ensIdx % NOMS_ENS.length];
                const prenom = PRENOMS_ENS[ensIdx % PRENOMS_ENS.length];
                const slug   = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'');
                const email  = `${slug(prenom)}.${slug(nom)}${ensIdx}@hestim.ma`;
                const [user, created] = await Users.findOrCreate({
                    where: { email },
                    defaults: { 
                        nom, 
                        prenom, 
                        email, 
                        password_hash:pwd, 
                        role:'enseignant', 
                        telephone:`+212 6${String(ensIdx).padStart(8,'0')}`, 
                        actif:true 
                    },
                });
                
                if (created) {
                    await Enseignant.create({ id_user:user.id_user, specialite:dCfg.nom, departement:dCfg.nom, grade:dCfg.grade });
                }
                enseignantsList.push({ user, dept:dCfg.nom });
                ensByDept[dCfg.nom].push(user);
            }
        }
        // Fallback si un dept n'a pas d'enseignants
        const fallbackPool = ensByDept['Informatique']?.length ? ensByDept['Informatique'] : enseignantsList.map(e => e.user);
        for (const k of Object.keys(ensByDept)) {
            if (!ensByDept[k].length) ensByDept[k] = fallbackPool;
        }
        console.log(`✅ ${enseignantsList.length} enseignants`);

        // ── 5. Étudiants ──────────────────────────────────────────────────────
        let etuCount = 0;
        const firstEtu = [];
        for (const gDef of GROUPES_DEF) {
            const groupe = groupesMap[gDef.nom_groupe];
            for (let i = 0; i < gDef.effectif; i++) {
                // Déterministe : alternance M/F basée sur la position (pas Math.random)
                const isMale = (etuCount % 2) === 0;
                const prenom = isMale ? PRENOMS_M[i % PRENOMS_M.length] : PRENOMS_F[i % PRENOMS_F.length];
                const nom    = NOMS_ETU[etuCount % NOMS_ETU.length];
                const slug   = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'.');
                const email  = `${slug(prenom)}.${nom.toLowerCase().replace(/\s/g,'')}${etuCount}@hestim.ma`;
                const num    = `ETU-${gDef.nom_groupe}-${String(i+1).padStart(3,'0')}`;
                const [user] = await Users.findOrCreate({
                    where: { email },
                    defaults: { 
                        nom, 
                        prenom, 
                        email, 
                        password_hash:pwd, 
                        role:'etudiant', 
                        telephone:`+212 6${String(etuCount).padStart(8,'0')}`, 
                        actif:true 
                    },
                });
                
                // Idempotent — findOrCreate sur id_user (PK) évite le conflit numero_etudiant
                const [, etuCreated] = await Etudiant.findOrCreate({
                    where: { id_user: user.id_user },
                    defaults: { id_user: user.id_user, numero_etudiant: num, niveau: gDef.niveau },
                });
                await Appartenir.findOrCreate({
                    where: { id_user_etudiant:user.id_user, id_groupe:groupe.id_groupe },
                    defaults: { id_user_etudiant:user.id_user, id_groupe:groupe.id_groupe },
                });
                if (firstEtu.length < 5) firstEtu.push(user);
                etuCount++;
            }
        }
        console.log(`✅ ${etuCount} étudiants`);

        // ── 6. Salles ─────────────────────────────────────────────────────────
        const sallesList = [];
        const campusParCode = Object.fromEntries((await Campus.findAll()).map(c => [c.code, c.id_campus]));
        for (const { code_campus, ...d } of SALLES_DEF) {
            const [s] = await Salle.findOrCreate({
                where: { nom_salle: d.nom_salle },
                defaults: { ...d, id_campus: campusParCode[code_campus], capacite_examen: Math.floor(d.capacite / 2), disponible:true },
            });
            sallesList.push(s);
        }
        console.log(`✅ ${sallesList.length} salles (${HESTIM_CONFIG.batiments.map(b => b.nom).join(' + ')})`);

        // ── 7. Créneaux ───────────────────────────────────────────────────────
        const creneauxList = [];
        const creneauxMap  = {};
        for (const [jour, slots] of Object.entries(GRILLE_HESTIM)) {
            for (const slot of slots) {
                const [c] = await Creneau.findOrCreate({
                    where: { jour_semaine:jour, heure_debut:slot.heure_debut, heure_fin:slot.heure_fin },
                    defaults: { jour_semaine:jour, ...slot },
                });
                creneauxList.push(c);
                creneauxMap[`${jour}_${slot.heure_debut}`] = c;
            }
            await recalculerRangs({ jour_semaine: jour, regime: 'initiale', variante: 'normale' });
        }
        console.log(`✅ ${creneauxList.length} créneaux`);

        // ── 8. Cours ──────────────────────────────────────────────────────────
        const coursMap = {};
        for (const d of HESTIM_CONFIG.cours) {
            const filObj = filieresMap[d.filiere];
            if (!filObj) { console.warn(`⚠️  Filière "${d.filiere}" introuvable pour cours ${d.code}`); continue; }
            const semestre = HESTIM_CONFIG.filieres
                .find(f => f.code === d.filiere)?.niveaux
                .find(n => n.label === d.niveau)?.semestre || 'S1';
            const [c] = await Cours.findOrCreate({
                where: { code_cours: d.code },
                defaults: {
                    code_cours:     d.code,
                    nom_cours:      d.nom,
                    id_filiere:     filObj.id_filiere,
                    niveau:         d.niveau,
                    volume_horaire: d.vh,
                    type_cours:     d.type,
                    semestre,
                    coefficient:    d.coef,
                },
            });
            // Composante initiale : à HESTIM une séance occupe deux créneaux (une demi-journée)
            const type = normaliserTypeComposante(d.type);
            await CoursComposante.findOrCreate({
                where: { id_cours: c.id_cours, type },
                defaults: {
                    id_cours: c.id_cours,
                    type,
                    volume_heures: d.vh,
                    niveau_groupe: niveauGroupeDe(type),
                    creneaux_par_seance: 2,
                    type_salle_requis: type === 'TP' ? 'Labo informatique' : null,
                },
            });
            coursMap[d.code] = c;
        }
        console.log(`✅ ${HESTIM_CONFIG.cours.length} cours`);

        console.log('\n🏫 Structure école :né !');
        console.log(`   ${HESTIM_CONFIG.filieres.map(f => `[${f.cycle.padEnd(12)}] ${f.code.padEnd(8)} ${f.niveaux.map(n => n.label).join(', ')}`).join('\n   ')}`);
        console.log(`\n🏢 Bâtiments :`);
        console.log(`   ${HESTIM_CONFIG.batiments.map(b => `${b.nom.padEnd(12)} — ${b.salles.reduce((sum, s) => sum + s.noms.length, 0)} salles (${b.code}-*)`).join('\n   ')}`);
        
        console.log('\n📦 Volumes :');
        console.log(`   Filières: ${Object.keys(filieresMap).length}  |  Groupes: ${GROUPES_DEF.length}  |  Salles: ${sallesList.length}  |  Créneaux: ${creneauxList.length}`);
        console.log(`   Enseignants: ${enseignantsList.length}  |  Étudiants: ${etuCount}  |  Cours: ${HESTIM_CONFIG.cours.length}`);
        console.log(`   Affectations: (non générées dans cette version finale)  |  Période: ${PERIOD_START} → ${PERIOD_END}`);
        
        console.log('\n📋 Comptes de test :');
        console.log(`   👨‍💼 Admin : ${HESTIM_CONFIG.admins[0].email}  (password123)`);
        console.log(`   👨‍🏫 Prof  : ${enseignantsList[0]?.user?.email || 'N/A'}  (password123)`);
        console.log(`   👨‍🎓 Étud  : ${firstEtu[0]?.email || 'N/A'}  (password123)`);
        
        console.log('\n💡 Pour modifier l\'école : éditer HESTIM_CONFIG en haut du fichier.');
        console.log('✅ Seed terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors du seed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Exécuter le seed si ce fichier est appelé directement
// (pathToFileURL : sous Windows l'URL est file:///C:/..., une concaténation naïve ne correspond jamais)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    seed().catch((error) => {
        console.error('❌', error.message);
        process.exit(1);
    });
}

export default seed;
