import dotenv from 'dotenv';
import { pathToFileURL } from 'url';
import sequelize, { testConnection } from './config/db.js';
import './models/index.js';
import {
    Users, Enseignant, Etudiant, Filiere, Groupe, Salle, Cours, Creneau, Disponibilite, Appartenir, Campus,
    CoursComposante, AnneeUniversitaire, Periode, Evenement, Enseignement,
    CompetenceEnseignant, EnseignementEnseignant, ResponsableFiliere,
} from './models/index.js';
import { hashPassword } from './utils/passwordHelper.js';
import { runMigrations } from './migrations/migrator.js';
import { recalculerRangs } from './services/planning/referentiel.js';
import { genererEnseignements, fusionnerEnseignements } from './services/planning/enseignements.js';
import { evenementsCalendrierMaroc } from './utils/feriesMaroc.js';
import { creerNotification } from './utils/notificationHelper.js';

dotenv.config();

// ════════════════════════════════════════════════════════════════════════════
//  HESTIM_CONFIG — Modifier ici pour personnaliser l'école
//
//  Filières et modules : offre publiée sur hestim.ma (octobre 2026). Le site ne publie ni
//  la répartition par semestre ni les volumes horaires : semestres, volumes CM/TD/TP,
//  effectifs, campus de rattachement et salles sont des HYPOTHÈSES de démonstration, à
//  remplacer par les maquettes officielles (liste P10 du plan).
//  La 4A IIIA (S7) reprend les modules de l'emploi du temps réel d'octobre 2026
//  (docs/Planning) ; les enseignants sont fictifs (aucun nom réel).
// ════════════════════════════════════════════════════════════════════════════
const HESTIM_CONFIG = {

    admins: [
        { nom:'SCOLARITE', prenom:'Admin', email:'admin@hestim.ma',  telephone:'+212 522 000 001' },
        { nom:'ALAOUI',    prenom:'Leila', email:'admin2@hestim.ma', telephone:'+212 522 000 002' },
    ],

    // ── Campus et salles (inventaire fictif) ──────────────────────────────
    // Chaque groupe de salles : { type, noms:[], capacites: number|number[], etages:number[] }
    batiments: [
        {
            code: 'G',
            nom:  'Gandhi',
            salles: [
                { type:'Amphithéâtre',                noms:['AMPHI1','AMPHI2'],                               capacites:[200,150], etages:[0,1] },
                { type:'Salle de cours',              noms:['S01','S02','S03','S04','S05','S06','S07','S08'], capacites:38,        etages:[1,1,1,2,2,2,3,3] },
                // « HESTIM-GHANDI : Étage 4 - Salle Polyvalente » de l'emploi du temps réel
                { type:'Salle de cours',              noms:['POLY'],                                          capacites:60,        etages:[4] },
                { type:'Labo informatique',           noms:['LABO01','LABO02','LABO03'],                      capacites:28,        etages:[1,1,2] },
                { type:'Salle TD',                    noms:['TD01','TD02','TD03','TD04'],                     capacites:24,        etages:[1,1,2,2] },
                // Smart Factory Connected et laboratoires de l'Engineering School
                { type:'Labo génie industriel',       noms:['SMARTFACTORY'],                                  capacites:24,        etages:[0] },
                { type:'Labo génie civil',            noms:['LABGC'],                                         capacites:24,        etages:[0] },
                { type:'Labo électronique & réseaux', noms:['LABRES'],                                        capacites:24,        etages:[2] },
                { type:'Salle de réunion',            noms:['REU1'],                                          capacites:12,        etages:[4] },
            ],
        },
        {
            code: 'ST',
            nom:  'Stendhal',
            salles: [
                { type:'Amphithéâtre',      noms:['AMPHI1'],                                                capacites:[120], etages:[0] },
                { type:'Salle de cours',    noms:['S01','S02','S03','S04','S05','S06','S07'],               capacites:36,    etages:[1,1,2,2,2,3,3] },
                { type:'Labo informatique', noms:['LABO01','LABO02'],                                       capacites:28,    etages:[1,2] },
                { type:'Salle TD',          noms:['TD01','TD02','TD03','TD04','TD05','TD06','TD07','TD08'], capacites:24,    etages:[1,1,1,1,2,2,2,2] },
                { type:'Salle de réunion',  noms:['REU1'],                                                  capacites:10,    etages:[1] },
            ],
        },
    ],

    // ── Filières ──────────────────────────────────────────────────────────
    // niveaux : { label, semestre (semestre impair, période S1), effectif par groupe, nb_groupes }
    // campus : rattachement supposé (Engineering à Gandhi, Business à Stendhal) ; dept : département du responsable
    filieres: [
        // ── Engineering School ───────────────────────────────────────────
        {
            code:'CPI', nom:'Cycle préparatoire intégré', abrege:'CPI', cycle:'Préparatoire', campus:'G', dept:'Mathématiques',
            niveaux:[
                { label:'1ère année', semestre:'S1', effectif:30, nb_groupes:2 },
                { label:'2ème année', semestre:'S3', effectif:25, nb_groupes:2 },
            ],
        },
        {
            code:'IIIA', nom:'Ingénierie Informatique et Intelligence Artificielle', abrege:'IIIA', cycle:'Ingénieur', campus:'G', dept:'Informatique',
            niveaux:[
                { label:'3ème année', semestre:'S5', effectif:18, nb_groupes:2 },
                { label:'4ème année', semestre:'S7', effectif:28, nb_groupes:1 },
            ],
        },
        // Spécialités de dernière année de l'ingénierie informatique
        {
            code:'IIIA-IABD', nom:'Ingénierie Informatique — IA & Big Data', abrege:'IABD', cycle:'Ingénieur', campus:'G', dept:'IA & Data',
            niveaux:[ { label:'5ème année', semestre:'S9', effectif:18, nb_groupes:1 } ],
        },
        {
            code:'IIIA-CYB', nom:'Ingénierie Informatique — Cybersécurité', abrege:'CYB', cycle:'Ingénieur', campus:'G', dept:'Cybersécurité',
            niveaux:[ { label:'5ème année', semestre:'S9', effectif:16, nb_groupes:1 } ],
        },
        {
            code:'IIIA-GL', nom:'Ingénierie Informatique — Génie Logiciel', abrege:'GL', cycle:'Ingénieur', campus:'G', dept:'Informatique',
            niveaux:[ { label:'5ème année', semestre:'S9', effectif:16, nb_groupes:1 } ],
        },
        {
            code:'GIL', nom:'Génie Industriel et Logistique', abrege:'GIL', cycle:'Ingénieur', campus:'G', dept:'Génie industriel',
            partenaire:'ESTIA',
            niveaux:[
                { label:'3ème année', semestre:'S5', effectif:30, nb_groupes:1 },
                { label:'4ème année', semestre:'S7', effectif:26, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:22, nb_groupes:1 },
            ],
        },
        {
            code:'GCAU', nom:'Génie Civil, Architecture et Urbanisme', abrege:'GCAU', cycle:'Ingénieur', campus:'G', dept:'Génie civil',
            niveaux:[
                { label:'3ème année', semestre:'S5', effectif:30, nb_groupes:1 },
                { label:'4ème année', semestre:'S7', effectif:25, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:20, nb_groupes:1 },
            ],
        },
        // ── Business School ──────────────────────────────────────────────
        {
            code:'LMEO', nom:'Licence Management des Entreprises et des Organisations', abrege:'LMEO', cycle:'Licence', campus:'ST', dept:'Management',
            niveaux:[
                { label:'1ère année', semestre:'S1', effectif:35, nb_groupes:2 },
                { label:'2ème année', semestre:'S3', effectif:30, nb_groupes:2 },
                { label:'3ème année', semestre:'S5', effectif:25, nb_groupes:2 },
            ],
        },
        {
            code:'PGE-MDI', nom:'Programme Grande École — Marketing Digital et Innovation', abrege:'MDI', cycle:'PGE', campus:'ST', dept:'Marketing',
            niveaux:[
                { label:'4ème année', semestre:'S7', effectif:25, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:22, nb_groupes:1 },
            ],
        },
        {
            code:'MASC', nom:'Master Achats et Supply Chain', abrege:'MASC', cycle:'Master', campus:'ST', dept:'Management',
            niveaux:[
                { label:'4ème année', semestre:'S7', effectif:20, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:18, nb_groupes:1 },
            ],
        },
        {
            code:'MFAC', nom:'Master Finance, Audit et Contrôle', abrege:'MFAC', cycle:'Master', campus:'ST', dept:'Finance & Comptabilité',
            niveaux:[
                { label:'4ème année', semestre:'S7', effectif:22, nb_groupes:1 },
                { label:'5ème année', semestre:'S9', effectif:20, nb_groupes:1 },
            ],
        },
    ],

    // ── Modules du semestre impair (période S1) ───────────────────────────
    // [code, nom, composantes, département, options]
    // composantes : « CM21 TD12 TP9 PRJ30 » (heures par type) ; options : { modalite, mention, rythme:[sem. début, sem. fin, séances/sem.], co:true }
    cours: {
        'CPI|1ère année': [
            ['CPI-1-ANA1',  'Analyse 1',                                  'CM21 TD21', 'Mathématiques'],
            ['CPI-1-ALG1',  'Algèbre 1',                                  'CM21 TD21', 'Mathématiques'],
            ['CPI-1-MECA',  'Mécanique du point',                         'CM21 TD12', 'Sciences'],
            ['CPI-1-PY',    'Algorithmique et programmation Python',      'CM15 TP21', 'Informatique'],
            ['CPI-1-TEC',   "Techniques d'expression et de communication", 'TD21',     'Langues & Communication'],
            ['CPI-1-ANG',   'Anglais général',                            'TD21',      'Langues & Communication'],
        ],
        'CPI|2ème année': [
            ['CPI-2-ANA3',  'Analyse 3',                                  'CM21 TD21', 'Mathématiques'],
            ['CPI-2-PROBA', 'Probabilités et statistiques',               'CM21 TD12', 'Mathématiques'],
            ['CPI-2-ELEC',  'Électricité et électronique',                'CM21 TP12', 'Sciences'],
            ['CPI-2-THERMO','Thermodynamique',                            'CM21 TD12', 'Sciences'],
            ['CPI-2-POO',   'Programmation orientée objet (Java)',        'CM15 TP21', 'Informatique'],
            ['CPI-2-ANG',   'Anglais',                                    'TD21',      'Langues & Communication'],
        ],
        'IIIA|3ème année': [
            ['IIIA-3-ASD',   'Algorithmique avancée et structures de données', 'CM21 TP21', 'Informatique'],
            ['IIIA-3-SE',    "Systèmes d'exploitation",                        'CM15 TP15', 'Informatique'],
            ['IIIA-3-UML',   'Modélisation UML',                               'CM15 TD15', 'Informatique'],
            ['IIIA-3-ABD',   'Administration des bases de données',            'CM15 TP21', 'Informatique'],
            ['IIIA-3-RES',   'Réseaux informatiques',                          'CM21 TP12', 'Cybersécurité'],
            ['IIIA-3-MATH',  'Mathématiques appliquées',                       'CM21 TD15', 'Mathématiques'],
            ['IIIA-3-PACTE', 'Projet PACTE',                                   'PRJ42',     'Informatique', { co:true }],
            ['IIIA-3-ANG',   'Anglais',                                        'TD21',      'Langues & Communication'],
        ],
        // Modules de l'emploi du temps réel « 4A | IIIA (S7) », octobre 2026
        'IIIA|4ème année': [
            ['IIIA-4-TLC',   'Théorie des langages et compilation',                       'CM21 TD12', 'Informatique'],
            ['IIIA-4-ESP',   'English for Specific Purposes',                             'TD21',      'Langues & Communication'],
            ['IIIA-4-NOSQL', 'Bases de données NoSQL',                                    'CM12 TP15', 'Informatique'],
            ['IIIA-4-FDS',   'Fondamentaux de la Data Science',                           'CM15 TP15', 'IA & Data'],
            ['IIIA-4-NIS2',  'Introduction à la cybersécurité et la directive NIS2',      'CM30',      'Cybersécurité', { rythme:[2, 4, 5] }],
            ['IIIA-4-FSSI',  "Fondamentaux de la sécurité des systèmes d'information",    'CM21 TD9',  'Cybersécurité'],
            ['IIIA-4-IBMDS', 'IBM Data Science — certificat professionnel (cours 1 à 4)', 'CM24',      'IA & Data', { modalite:'distanciel', mention:'Blended Coursera' }],
            ['IIIA-4-PIC',   'Projet PIC',                                                'PRJ30',     'Informatique', { co:true }],
        ],
        'IIIA-IABD|5ème année': [
            ['IABD-5-AML',   'Advanced Machine Learning',      'CM15 TP21', 'IA & Data'],
            ['IABD-5-DL',    'Deep Learning',                  'CM15 TP21', 'IA & Data'],
            ['IABD-5-NLPCV', 'NLP et Computer Vision',         'CM15 TP15', 'IA & Data'],
            ['IABD-5-BDA',   'Big Data Analytics',             'CM15 TP21', 'IA & Data'],
            ['IABD-5-MLOPS', 'DevOps et MLOps',                'CM12 TP18', 'Informatique'],
            ['IABD-5-GOUV',  'Gouvernance des données',        'CM15',      'IA & Data'],
            ['IABD-5-PMI',   'Gestion de projet (PMI)',        'CM21',      'Management'],
        ],
        'IIIA-CYB|5ème année': [
            ['CYB-5-SECRES', 'Sécurité des réseaux',                         'CM15 TP21', 'Cybersécurité'],
            ['CYB-5-CRYPTO', 'Cryptographie avancée',                        'CM21 TD12', 'Cybersécurité'],
            ['CYB-5-SSI',    "Sécurité des systèmes d'information",          'CM15 TD15', 'Cybersécurité'],
            ['CYB-5-INCID',  'Cybercriminalité et gestion des incidents',    'CM15 TP15', 'Cybersécurité'],
            ['CYB-5-AUDIT',  'Audit et conformité',                          'CM21 TD9',  'Cybersécurité'],
            ['CYB-5-PMI',    'Gestion de projet (PMI)',                      'CM21',      'Management'],
        ],
        'IIIA-GL|5ème année': [
            ['GL-5-GLA',     'Génie logiciel avancé',          'CM15 TP21', 'Informatique'],
            ['GL-5-AGILE',   'Méthodes agiles',                'CM12 TD15', 'Informatique'],
            ['GL-5-DEVOPS',  'DevOps et MLOps',                'CM12 TP18', 'Informatique'],
            ['GL-5-MOBILE',  'Développement mobile',           'CM12 TP21', 'Informatique'],
            ['GL-5-ERP',     'Progiciels de gestion (ERP)',    'CM15 TP15', 'Informatique'],
            ['GL-5-ITGOV',   'IT Governance',                  'CM21',      'Informatique'],
            ['GL-5-PMI',     'Gestion de projet (PMI)',        'CM21',      'Management'],
        ],
        'GIL|3ème année': [
            ['GIL-3-PROD',   'Production Management',          'CM21 TD12', 'Génie industriel'],
            ['GIL-3-STOCK',  'Inventory Management',           'CM15 TD15', 'Génie industriel'],
            ['GIL-3-PROCUR', 'Procurement',                    'CM15 TD12', 'Génie industriel'],
            ['GIL-3-STAT',   'Statistiques industrielles',     'CM15 TD15', 'Mathématiques'],
            ['GIL-3-LEAN',   'Lean Manufacturing',             'CM15 TP12', 'Génie industriel'],
            ['GIL-3-PISTE',  'Projet PISTE',                   'PRJ30',     'Génie industriel'],
            ['GIL-3-ANG',    'Anglais',                        'TD21',      'Langues & Communication'],
        ],
        'GIL|4ème année': [
            ['GIL-4-DDMRP',  'DDMRP',                          'CM15 TP12', 'Génie industriel'],
            ['GIL-4-SAP',    'ERP SAP',                        'CM12 TP21', 'Génie industriel'],
            ['GIL-4-TRANS',  'Transport et distribution',      'CM21 TD9',  'Génie industriel'],
            ['GIL-4-6SIGMA', 'Six Sigma',                      'CM15 TD15', 'Génie industriel'],
            ['GIL-4-QUAL',   'Quality Management',             'CM21 TD9',  'Génie industriel'],
            ['GIL-4-PBI',    'Power BI',                       'TP21',      'IA & Data'],
            ['GIL-4-P40',    'Production 4.0',                 'CM12 TP15', 'Génie industriel'],
        ],
        'GIL|5ème année': [
            ['GIL-5-SCA',    'Supply Chain Analytics',                       'CM15 TP15', 'Génie industriel'],
            ['GIL-5-MAINT',  'Maintenance 4.0 et GMAO',                      'CM15 TP15', 'Génie industriel'],
            ['GIL-5-QHSE',   'QHSE',                                         'CM21 TD9',  'Génie industriel'],
            ['GIL-5-SCM',    'Management de la chaîne logistique globale',   'CM21 TD12', 'Génie industriel'],
            ['GIL-5-PMI',    'Gestion de projet (PMI)',                      'CM21',      'Management'],
        ],
        'GCAU|3ème année': [
            ['GCAU-3-SOLS',  'Mécanique des sols',             'CM21 TD12 TP9', 'Génie civil'],
            ['GCAU-3-TOPO',  'Topographie',                    'CM15 TP15',     'Génie civil'],
            ['GCAU-3-RDM',   'Résistance des matériaux',       'CM21 TD15',     'Génie civil'],
            ['GCAU-3-CAO',   'AutoCAD et Revit',               'TP21',          'Génie civil'],
            ['GCAU-3-HYDRO', 'Hydraulique',                    'CM15 TD12',     'Génie civil'],
            ['GCAU-3-PISTE', 'Projet PISTE',                   'PRJ30',         'Génie civil'],
            ['GCAU-3-ANG',   'Anglais',                        'TD21',          'Langues & Communication'],
        ],
        'GCAU|4ème année': [
            ['GCAU-4-GEOT',  'Géotechnique et fondations',     'CM21 TD12', 'Génie civil'],
            ['GCAU-4-BA',    'Béton armé',                     'CM21 TD15', 'Génie civil'],
            ['GCAU-4-REVIT', 'Revit Structure',                'TP21',      'Génie civil'],
            ['GCAU-4-VRD',   'Covadis et VRD',                 'CM9 TP15',  'Génie civil'],
            ['GCAU-4-MEP',   'BIM MEP',                        'CM12 TP15', 'Génie civil'],
            ['GCAU-4-LEAN',  'Lean Construction',              'CM15 TD9',  'Génie civil'],
            ['GCAU-4-PIC',   'Projet PIC',                     'PRJ30',     'Génie civil', { co:true }],
        ],
        'GCAU|5ème année': [
            ['GCAU-5-BIM',   'BIM Management',                 'CM15 TP15', 'Génie civil'],
            ['GCAU-5-4D5D',  'Planification 4D/5D',            'CM12 TP15', 'Génie civil'],
            ['GCAU-5-BP',    'Béton précontraint',             'CM21 TD12', 'Génie civil'],
            ['GCAU-5-CHANT', 'Gestion de chantier',            'CM21 TD9',  'Génie civil'],
            ['GCAU-5-PMI',   'Gestion de projet (PMI)',        'CM21',      'Management'],
        ],
        'LMEO|1ère année': [
            ['LMEO-1-MICRO', 'Microéconomie',                  'CM21 TD12', 'Management'],
            ['LMEO-1-MGT',   'Introduction au management',     'CM21 TD9',  'Management'],
            ['LMEO-1-CF1',   'Comptabilité financière',        'CM21 TD15', 'Finance & Comptabilité'],
            ['LMEO-1-MATH',  'Mathématiques générales',        'CM15 TD15', 'Mathématiques'],
            ['LMEO-1-DROIT', 'Introduction au droit',          'CM21',      'Management'],
            ['LMEO-1-TEC',   "Techniques d'expression",        'TD21',      'Langues & Communication'],
            ['LMEO-1-ANG',   'Anglais des affaires',           'TD21',      'Langues & Communication'],
        ],
        'LMEO|2ème année': [
            ['LMEO-2-MACRO', 'Macroéconomie',                  'CM21 TD12', 'Management'],
            ['LMEO-2-MKT',   'Marketing fondamental',          'CM21 TD9',  'Marketing'],
            ['LMEO-2-CG',    'Comptabilité de gestion',        'CM21 TD15', 'Finance & Comptabilité'],
            ['LMEO-2-STAT',  'Statistiques descriptives',      'CM15 TD15', 'Mathématiques'],
            ['LMEO-2-DSOC',  'Droit des sociétés',             'CM21',      'Management'],
            ['LMEO-2-NUM',   'Outils numériques et bureautique', 'TP21',    'Informatique'],
            ['LMEO-2-ANG',   'Anglais des affaires',           'TD21',      'Langues & Communication'],
        ],
        'LMEO|3ème année': [
            ['LMEO-3-STRAT', 'Management stratégique',         'CM21 TD9',  'Management'],
            ['LMEO-3-AF',    'Analyse financière',             'CM21 TD15', 'Finance & Comptabilité'],
            ['LMEO-3-FISC',  'Fiscalité',                      'CM21 TD9',  'Finance & Comptabilité'],
            ['LMEO-3-MFIN',  'Mathématiques financières',      'CM15 TD15', 'Finance & Comptabilité'],
            ['LMEO-3-CDG',   'Contrôle de gestion',            'CM21 TD12', 'Finance & Comptabilité'],
            ['LMEO-3-ERP',   'ERP',                            'CM9 TP15',  'Informatique'],
            ['LMEO-3-GRH',   'Gestion des ressources humaines', 'CM21',     'Management'],
        ],
        'PGE-MDI|4ème année': [
            ['MDI-4-SMD',    'Stratégie marketing digital',    'CM21 TD12', 'Marketing'],
            ['MDI-4-DATA',   'Data marketing et analytics',    'CM15 TP15', 'Marketing'],
            ['MDI-4-BRAND',  'Brand content et social media',  'CM15 TD15', 'Marketing'],
            ['MDI-4-ECOM',   'E-commerce et marketplaces',     'CM15 TD12', 'Marketing'],
            ['MDI-4-DT',     'Innovation et design thinking',  'TD21',      'Marketing'],
            ['MDI-4-DNUM',   'Droit du numérique',             'CM15',      'Management'],
            ['MDI-4-ANG',    'Anglais',                        'TD21',      'Langues & Communication'],
        ],
        'PGE-MDI|5ème année': [
            ['MDI-5-GROWTH', 'Growth marketing',                 'CM15 TP15', 'Marketing'],
            ['MDI-5-CRM',    'CRM et marketing automation',      'CM12 TP18', 'Marketing'],
            ['MDI-5-INNOV',  "Management de l'innovation",       'CM21 TD9',  'Management'],
            ['MDI-5-ENTR',   'Entrepreneuriat',                  'CM15 TD12', 'Management'],
            ['MDI-5-INTL',   'Marketing international',          'CM21',      'Marketing'],
        ],
        'MASC|4ème année': [
            ['MASC-4-STRAT', 'Stratégie achats',                       'CM21 TD12', 'Management'],
            ['MASC-4-SCM',   'Supply chain management',                'CM21 TD12', 'Génie industriel'],
            ['MASC-4-NEGO',  'Négociation achats',                     'TD21',      'Management'],
            ['MASC-4-APPRO', 'Gestion des approvisionnements',         'CM15 TD15', 'Génie industriel'],
            ['MASC-4-INCO',  'Logistique internationale et Incoterms', 'CM21 TD9',  'Management'],
            ['MASC-4-SAP',   'ERP SAP',                                'CM9 TP15',  'Génie industriel'],
        ],
        'MASC|5ème année': [
            ['MASC-5-SCA',   'Supply chain analytics',         'CM15 TP15', 'Génie industriel'],
            ['MASC-5-RSE',   'Achats responsables et RSE',     'CM15 TD9',  'Management'],
            ['MASC-5-RISK',  'Risk management supply chain',   'CM21 TD9',  'Management'],
            ['MASC-5-LEAN',  'Lean supply chain',              'CM15 TD12', 'Génie industriel'],
        ],
        'MFAC|4ème année': [
            ['MFAC-4-AUDIT', 'Audit financier',                         'CM21 TD12', 'Finance & Comptabilité'],
            ['MFAC-4-CDG',   'Contrôle de gestion avancé',              'CM21 TD12', 'Finance & Comptabilité'],
            ['MFAC-4-IFRS',  'Normes IFRS',                             'CM21 TD9',  'Finance & Comptabilité'],
            ['MFAC-4-FE',    "Finance d'entreprise",                    'CM21 TD15', 'Finance & Comptabilité'],
            ['MFAC-4-FISC',  'Fiscalité des entreprises',               'CM21 TD9',  'Finance & Comptabilité'],
            ['MFAC-4-XL',    'Excel avancé et modélisation financière', 'TP21',      'Finance & Comptabilité'],
        ],
        'MFAC|5ème année': [
            ['MFAC-5-AI',    'Audit interne et contrôle interne', 'CM21 TD9',  'Finance & Comptabilité'],
            ['MFAC-5-CONSO', 'Consolidation des comptes',         'CM21 TD12', 'Finance & Comptabilité'],
            ['MFAC-5-EVAL',  "Évaluation d'entreprise",           'CM15 TD12', 'Finance & Comptabilité'],
            ['MFAC-5-GOUV',  'Gouvernance et conformité',         'CM21',      'Management'],
            ['MFAC-5-DATA',  "Data analytics pour l'audit",       'CM9 TP15',  'IA & Data'],
        ],
    },

    // Module commun aux trois spécialités de 5A informatique : un seul enseignement mutualisé
    mutualisations: [['IABD-5-PMI', 'CYB-5-PMI', 'GL-5-PMI']],

    // ── Départements : permanents (service annuel dû) et vacataires (heures à la carte) ──
    departements: [
        { nom:'Informatique',             permanents:8, vacataires:4, grade:'Professeur' },
        { nom:'IA & Data',                permanents:2, vacataires:3, grade:'Professeur' },
        { nom:'Cybersécurité',            permanents:2, vacataires:3, grade:'Professeur' },
        { nom:'Mathématiques',            permanents:4, vacataires:2, grade:'Professeur' },
        { nom:'Sciences',                 permanents:1, vacataires:1, grade:'Professeur' },
        { nom:'Génie industriel',         permanents:5, vacataires:4, grade:'Professeur' },
        { nom:'Génie civil',              permanents:5, vacataires:4, grade:'Professeur' },
        { nom:'Management',               permanents:5, vacataires:4, grade:'Professeur' },
        { nom:'Finance & Comptabilité',   permanents:4, vacataires:4, grade:'Professeur' },
        { nom:'Marketing',                permanents:2, vacataires:3, grade:'Professeur' },
        { nom:'Langues & Communication',  permanents:3, vacataires:3, grade:'Maître de conférences' },
    ],
};

// Service dû d'un permanent et plafonds hebdomadaires : hypothèses à confirmer par l'école
const SERVICE_PERMANENT = 192;
const MAX_SEMAINE = { permanent: 18, vacataire: 9 };
const ENTREPRISES_VACATAIRES = [
    'ESN casablancaise', "Cabinet d'audit", "Bureau d'études BTP", 'Industriel automobile',
    'Agence digitale', 'Banque', 'Consultant indépendant', 'Opérateur logistique',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const LETTERS = 'ABCDE';

// Extrait le premier chiffre du label de niveau (ex: "3ème année" → "3")
const niveauNum = (label) => label.match(/(\d)/)?.[1] ?? '1';
const slug = (s, sep = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, sep);

const TYPE_COMPOSANTE = { CM:'CM', TD:'TD', TP:'TP', PRJ:'Projet' };
/** « CM21 TD12 PRJ30 » → [{ type:'CM', heures:21 }, …] */
const lireComposantes = (texte) => texte.split(/\s+/).map((jeton) => {
    const [, code, heures] = jeton.match(/^([A-Z]+)(\d+)$/);
    return { type: TYPE_COMPOSANTE[code], heures: Number(heures) };
});

// Le CM et le projet s'adressent à la promotion, les TD et TP aux groupes de TD
const niveauGroupeDe = (type) => (type === 'CM' || type === 'Projet' ? 'promotion' : 'td');

// Salle requise pour les TP selon le département du module
const SALLE_TP = {
    'Génie industriel': 'Labo génie industriel',
    'Génie civil': 'Labo génie civil',
    'Cybersécurité': 'Labo électronique & réseaux',
};
const salleRequise = (type, dept) => (type === 'TP' ? SALLE_TP[dept] || 'Labo informatique' : null);

const ajouterJours = (iso, jours) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
};
const premierLundi = (iso) => {
    let jour = iso;
    while (new Date(`${jour}T00:00:00Z`).getUTCDay() !== 1) jour = ajouterJours(jour, 1);
    return jour;
};

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

// Groupes de TD : dérivés de filieres × niveaux × nb_groupes
const GROUPES_DEF = [];
for (const fil of HESTIM_CONFIG.filieres) {
    for (const niv of fil.niveaux) {
        for (let g = 0; g < niv.nb_groupes; g++) {
            GROUPES_DEF.push({
                nom_groupe:   `${fil.abrege}-${niveauNum(niv.label)}${LETTERS[g]}`,
                filiere_code: fil.code,
                niveau:       niv.label,
                effectif:     niv.effectif,
            });
        }
    }
}

// Noms fictifs (aucun enseignant réel de l'école)
const NOMS_ENS = [
    'BENKIRANE','OUAZZANI','SQUALLI','LAZRAK','BOUHLAL','TOUIMI','ZNIBER','GUESSOUS','SLAOUI','BELKHAYAT',
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
    'Préparatoire': { ecole:'engineering', cycle:'prepa',     intitule_cycle:'cycle préparatoire intégré', premiere_annee_cycle:1 },
    'Ingénieur':    { ecole:'engineering', cycle:'ingenieur', intitule_cycle:"cycle Ingénieur d'Etat",     premiere_annee_cycle:3 },
    'Licence':      { ecole:'business',    cycle:'licence',   intitule_cycle:"Licence d'Etat",             premiere_annee_cycle:1 },
    'PGE':          { ecole:'business',    cycle:'master',    intitule_cycle:'Programme Grande École',     premiere_annee_cycle:4 },
    'Master':       { ecole:'business',    cycle:'master',    intitule_cycle:"Master d'Etat",              premiere_annee_cycle:4 },
};

// Année universitaire en cours : de septembre à août
const DEBUT_ANNEE = (() => {
    const d = new Date();
    return d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
})();
const ANNEE_SCOLAIRE = `${DEBUT_ANNEE}-${DEBUT_ANNEE + 1}`;

// Semestres (hypothèse) : la rentrée a lieu la semaine du premier lundi d'octobre (accueil et
// activités d'intégration sur l'emploi du temps réel), 16 semaines de cours + 2 d'examens.
const S1_DEBUT = premierLundi(`${DEBUT_ANNEE}-10-01`);
const PERIODES_DEF = [
    { code:'S1', libelle:'Semestre impair', date_debut:S1_DEBUT, date_fin:ajouterJours(S1_DEBUT, 18 * 7 - 2), nb_semaines:16 },
    { code:'S2', libelle:'Semestre pair',   date_debut:ajouterJours(S1_DEBUT, 19 * 7), date_fin:ajouterJours(S1_DEBUT, 39 * 7 - 2), nb_semaines:16 },
];

// Activités d'intégration de la 4A IIIA la semaine de rentrée (blocs d'une demi-journée)
const ACTIVITES_INTEGRATION = ['Accueil & Découverte', 'Savoir & Innovation', 'Épanouissement & Défi', 'Détente & Engagement'];

// Créneaux déclarés par les vacataires (opt-in) : jour, heure de début, vœu
const DISPONIBILITES_VACATAIRES = [
    [['vendredi','14:30','prefere'], ['vendredi','16:30','prefere'], ['samedi','09:00','neutre'], ['samedi','11:00','neutre']],
    [['lundi','13:30','neutre'], ['lundi','15:30','neutre'], ['mercredi','13:30','prefere'], ['mercredi','15:30','prefere']],
    [['mardi','09:00','prefere'], ['mardi','11:00','prefere'], ['jeudi','09:00','neutre'], ['jeudi','11:00','neutre'], ['samedi','09:00','eviter']],
];

// ── seed() ────────────────────────────────────────────────────────────────────
async function seed() {
    // Le seed crée des comptes de démonstration au mot de passe connu : interdit en production.
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Seed interdit en production (NODE_ENV=production)');
    }
    try {
        console.log('🌱 Seed HESTIM (filières et modules publiés sur hestim.ma)...');
        await testConnection();

        // Le schéma vient des migrations versionnées (jamais de sync() implicite)
        await runMigrations();

        const pwd = await hashPassword('password123');

        // ── 1. Admins ─────────────────────────────────────────────────────────
        const admins = [];
        for (const d of HESTIM_CONFIG.admins) {
            const [u] = await Users.findOrCreate({
                where: { email: d.email },
                defaults: { nom:d.nom, prenom:d.prenom, email:d.email, password_hash:pwd, role:'admin', telephone:d.telephone, actif:true },
            });
            admins.push(u);
        }
        const admin = admins[0];
        console.log(`✅ ${admins.length} admins`);

        // ── 2. Calendrier : année, semestres, fériés marocains, Ramadan ──────
        const [annee] = await AnneeUniversitaire.findOrCreate({
            where: { libelle: ANNEE_SCOLAIRE },
            defaults: { libelle: ANNEE_SCOLAIRE, date_debut: `${DEBUT_ANNEE}-09-01`, date_fin: `${DEBUT_ANNEE + 1}-07-31`, active: true },
        });
        const periodes = {};
        for (const p of PERIODES_DEF) {
            const [periode] = await Periode.findOrCreate({
                where: { id_annee: annee.id_annee, code: p.code },
                defaults: { ...p, id_annee: annee.id_annee },
            });
            periodes[p.code] = periode;
        }
        let evenementsCrees = 0;
        for (const e of evenementsCalendrierMaroc(annee.date_debut, annee.date_fin)) {
            const [, cree] = await Evenement.findOrCreate({
                where: { titre: e.titre, type_evenement: e.type_evenement, date_debut: e.date_debut },
                defaults: { ...e, id_user_createur: admin.id_user },
            });
            if (cree) evenementsCrees++;
        }
        console.log(`✅ Année ${ANNEE_SCOLAIRE} : S1 ${periodes.S1.date_debut} → ${periodes.S1.date_fin}, S2 ${periodes.S2.date_debut} → ${periodes.S2.date_fin}, ${evenementsCrees} fériés/événements`);

        // ── 3. Salles ─────────────────────────────────────────────────────────
        const campusParCode = Object.fromEntries((await Campus.findAll()).map(c => [c.code, c.id_campus]));
        const sallesList = [];
        for (const { code_campus, ...d } of SALLES_DEF) {
            const [s] = await Salle.findOrCreate({
                where: { nom_salle: d.nom_salle },
                defaults: { ...d, id_campus: campusParCode[code_campus], capacite_examen: Math.floor(d.capacite / 2), disponible:true },
            });
            sallesList.push(s);
        }
        console.log(`✅ ${sallesList.length} salles (${HESTIM_CONFIG.batiments.map(b => b.nom).join(' + ')})`);

        // ── 4. Filières ───────────────────────────────────────────────────────
        const filieresMap = {};
        for (const f of HESTIM_CONFIG.filieres) {
            const [rec] = await Filiere.findOrCreate({
                where: { code_filiere: f.code },
                defaults: {
                    code_filiere: f.code,
                    nom_filiere: f.nom,
                    description: `${f.cycle} — ${f.nom}`,
                    ...(CYCLES_SEED[f.cycle] || {}),
                    id_campus_prefere: campusParCode[f.campus] ?? null,
                    partenaire: f.partenaire ?? null,
                },
            });
            filieresMap[f.code] = rec;
        }
        console.log(`✅ ${Object.keys(filieresMap).length} filières`);

        // ── 5. Groupes : une promotion par (filière, année), ses groupes de TD dessous ──
        const groupesMap = {};
        const promotionsMap = {};
        for (const gDef of GROUPES_DEF) {
            const fil = HESTIM_CONFIG.filieres.find(f => f.code === gDef.filiere_code);
            const anneeEtude = Number(niveauNum(gDef.niveau));
            const clePromo = `${gDef.filiere_code}|${gDef.niveau}`;
            if (!promotionsMap[clePromo]) {
                const effectifPromo = GROUPES_DEF
                    .filter(x => x.filiere_code === gDef.filiere_code && x.niveau === gDef.niveau)
                    .reduce((total, x) => total + x.effectif, 0);
                const [promo] = await Groupe.findOrCreate({
                    where: { nom_groupe: `${anneeEtude}A ${fil.abrege}`, annee_scolaire: ANNEE_SCOLAIRE },
                    defaults: {
                        nom_groupe: `${anneeEtude}A ${fil.abrege}`, id_filiere: filieresMap[gDef.filiere_code].id_filiere,
                        niveau: gDef.niveau, effectif: effectifPromo, annee_scolaire: ANNEE_SCOLAIRE, type_groupe: 'promotion', annee: anneeEtude,
                    },
                });
                promotionsMap[clePromo] = promo;
            }
            const [g] = await Groupe.findOrCreate({
                where: { nom_groupe: gDef.nom_groupe, annee_scolaire: ANNEE_SCOLAIRE },
                defaults: {
                    nom_groupe: gDef.nom_groupe, id_filiere: filieresMap[gDef.filiere_code].id_filiere, niveau: gDef.niveau,
                    effectif: gDef.effectif, annee_scolaire: ANNEE_SCOLAIRE, type_groupe: 'td',
                    id_groupe_parent: promotionsMap[clePromo].id_groupe, annee: anneeEtude,
                },
            });
            groupesMap[gDef.nom_groupe] = g;
        }
        console.log(`✅ ${Object.keys(promotionsMap).length} promotions, ${GROUPES_DEF.length} groupes de TD (${ANNEE_SCOLAIRE})`);

        // Activités d'intégration de la 4A IIIA : après-midi de la semaine de rentrée
        const promo4IIIA = promotionsMap['IIIA|4ème année'];
        for (const [i, activite] of ACTIVITES_INTEGRATION.entries()) {
            const jour = ajouterJours(periodes.S1.date_debut, i);
            await Evenement.findOrCreate({
                where: { titre: `Activités d'intégration : ${activite}`, date_debut: jour },
                defaults: {
                    titre: `Activités d'intégration : ${activite}`, date_debut: jour, date_fin: jour, heure_debut: '13:30', heure_fin: '17:00',
                    type_evenement: 'autre', portee: 'groupe', id_cible: promo4IIIA.id_groupe, bloque_affectations: true, id_user_createur: admin.id_user,
                },
            });
        }

        // ── 6. Enseignants : permanents et vacataires par département ────────
        const enseignantsList = [];
        const ensByDept = {};
        let ensIdx = 0;
        for (const dCfg of HESTIM_CONFIG.departements) {
            ensByDept[dCfg.nom] = [];
            const statuts = [...Array(dCfg.permanents).fill('permanent'), ...Array(dCfg.vacataires).fill('vacataire')];
            for (const statut of statuts) {
                const nom    = NOMS_ENS[ensIdx % NOMS_ENS.length];
                const prenom = PRENOMS_ENS[ensIdx % PRENOMS_ENS.length];
                const email  = `${slug(prenom)}.${slug(nom)}${ensIdx}@hestim.ma`;
                const [user] = await Users.findOrCreate({
                    where: { email },
                    defaults: { nom, prenom, email, password_hash:pwd, role:'enseignant', telephone:`+212 6${String(ensIdx).padStart(8,'0')}`, actif:true },
                });
                const vacataire = statut === 'vacataire';
                await Enseignant.findOrCreate({
                    where: { id_user: user.id_user },
                    defaults: {
                        id_user: user.id_user, specialite: dCfg.nom, departement: dCfg.nom, grade: vacataire ? 'Vacataire' : dCfg.grade,
                        statut, service_annuel_heures: vacataire ? null : SERVICE_PERMANENT, max_heures_semaine: MAX_SEMAINE[statut],
                        id_campus_prefere: campusParCode[['Management', 'Finance & Comptabilité', 'Marketing'].includes(dCfg.nom) ? 'ST' : 'G'],
                        entreprise: vacataire ? ENTREPRISES_VACATAIRES[ensIdx % ENTREPRISES_VACATAIRES.length] : null,
                    },
                });
                const ens = { user, dept: dCfg.nom, statut, heures: 0, service: vacataire ? 45 : SERVICE_PERMANENT, cours: new Set() };
                enseignantsList.push(ens);
                ensByDept[dCfg.nom].push(ens);
                ensIdx++;
            }
        }
        const nbVacataires = enseignantsList.filter(e => e.statut === 'vacataire').length;
        console.log(`✅ ${enseignantsList.length} enseignants (${enseignantsList.length - nbVacataires} permanents, ${nbVacataires} vacataires)`);

        // ── 7. Étudiants ──────────────────────────────────────────────────────
        let etuCount = 0;
        const firstEtu = [];
        for (const gDef of GROUPES_DEF) {
            const groupe = groupesMap[gDef.nom_groupe];
            for (let i = 0; i < gDef.effectif; i++) {
                // Déterministe : alternance M/F basée sur la position (pas Math.random)
                const isMale = (etuCount % 2) === 0;
                const prenom = isMale ? PRENOMS_M[i % PRENOMS_M.length] : PRENOMS_F[i % PRENOMS_F.length];
                const nom    = NOMS_ETU[etuCount % NOMS_ETU.length];
                const email  = `${slug(prenom, '.')}.${nom.toLowerCase().replace(/\s/g,'')}${etuCount}@hestim.ma`;
                const num    = `ETU-${gDef.nom_groupe}-${String(i+1).padStart(3,'0')}`;
                const [user] = await Users.findOrCreate({
                    where: { email },
                    defaults: { nom, prenom, email, password_hash:pwd, role:'etudiant', telephone:`+212 7${String(etuCount).padStart(8,'0')}`, actif:true },
                });
                // Idempotent — findOrCreate sur id_user (PK) évite le conflit numero_etudiant
                await Etudiant.findOrCreate({
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

        // ── 8. Créneaux ───────────────────────────────────────────────────────
        const creneauxMap = {};
        for (const [jour, slots] of Object.entries(GRILLE_HESTIM)) {
            for (const slot of slots) {
                const [c] = await Creneau.findOrCreate({
                    where: { jour_semaine:jour, heure_debut:slot.heure_debut, heure_fin:slot.heure_fin },
                    defaults: { jour_semaine:jour, ...slot },
                });
                creneauxMap[`${jour}_${slot.heure_debut}`] = c;
            }
            await recalculerRangs({ jour_semaine: jour, regime: 'initiale', variante: 'normale' });
        }
        console.log(`✅ ${Object.keys(creneauxMap).length} créneaux`);

        // ── 9. Maquette : modules et composantes ──────────────────────────────
        const coursMap = {};
        const deptDuCours = {};
        const optionsDuCours = {};
        for (const [cle, modules] of Object.entries(HESTIM_CONFIG.cours)) {
            const [codeFiliere, niveau] = cle.split('|');
            const filObj = filieresMap[codeFiliere];
            const semestre = HESTIM_CONFIG.filieres.find(f => f.code === codeFiliere).niveaux.find(n => n.label === niveau).semestre;
            for (const [code, nom, texteComposantes, dept, options = {}] of modules) {
                const composantes = lireComposantes(texteComposantes);
                const [c] = await Cours.findOrCreate({
                    where: { code_cours: code },
                    defaults: {
                        code_cours: code, nom_cours: nom, id_filiere: filObj.id_filiere, niveau, semestre,
                        volume_horaire: composantes.reduce((total, x) => total + x.heures, 0),
                        type_cours: composantes[0].type, coefficient: Math.max(1, Math.round(composantes.reduce((t, x) => t + x.heures, 0) / 15)),
                    },
                });
                for (const { type, heures } of composantes) {
                    const [semaine_debut, semaine_fin, seances_par_semaine] = options.rythme ?? [];
                    await CoursComposante.findOrCreate({
                        where: { id_cours: c.id_cours, type },
                        defaults: {
                            id_cours: c.id_cours, type, volume_heures: heures, niveau_groupe: niveauGroupeDe(type),
                            // À HESTIM une séance occupe deux créneaux (une demi-journée)
                            creneaux_par_seance: 2, type_salle_requis: salleRequise(type, dept),
                            modalite: options.modalite ?? 'presentiel', mention: options.mention ?? null,
                            semaine_debut: semaine_debut ?? null, semaine_fin: semaine_fin ?? null, seances_par_semaine: seances_par_semaine ?? null,
                        },
                    });
                }
                coursMap[code] = c;
                deptDuCours[c.id_cours] = dept;
                optionsDuCours[c.id_cours] = options;
            }
        }
        console.log(`✅ ${Object.keys(coursMap).length} modules (semestres impairs)`);

        // ── 10. Enseignements du S1, puis mutualisations ─────────────────────
        const rapport = await genererEnseignements({ id_periode: periodes.S1.id_periode });
        for (const codes of HESTIM_CONFIG.mutualisations) {
            const aFusionner = await Enseignement.findAll({
                where: { id_periode: periodes.S1.id_periode },
                include: [{ model: CoursComposante, as: 'composante', where: { id_cours: codes.map(code => coursMap[code].id_cours) } }],
            });
            if (aFusionner.length > 1) await fusionnerEnseignements(aFusionner.map(e => e.id_enseignement));
        }
        console.log(`✅ Enseignements S1 : ${rapport.crees} créés, ${HESTIM_CONFIG.mutualisations.length} mutualisation(s)`);

        // ── 11. Services : un principal par enseignement, co-enseignement des projets ──
        // Celui qui assure déjà une autre composante du module (CM et TD par le même enseignant), sinon
        // le moins chargé du département : les permanents d'abord, jusqu'à 40 % de leur service dû
        // sur ce semestre (le reste va au S2), puis les vacataires, recrutés pour les heures restantes.
        const PART_SEMESTRE = 0.4;
        const plafond = (e) => (e.statut === 'permanent' ? e.service * PART_SEMESTRE : e.service);
        const sousPlafond = (e) => e.heures < plafond(e);
        const choisir = (dept, idCours, exclus = []) => {
            const pool = (ensByDept[dept] || enseignantsList).filter(e => !exclus.includes(e));
            const dejaLa = pool.find(e => e.cours.has(idCours) && sousPlafond(e));
            if (dejaLa) return dejaLa;
            const sousService = pool.filter(e => e.statut === 'permanent' && sousPlafond(e));
            const candidats = sousService.length ? sousService : pool;
            const charge = (e) => e.heures / plafond(e);
            return candidats.reduce((min, e) => (charge(e) < charge(min) ? e : min));
        };
        const enseignements = await Enseignement.findAll({
            where: { id_periode: periodes.S1.id_periode },
            include: [
                { model: CoursComposante, as: 'composante' },
                { model: EnseignementEnseignant, as: 'services' },
            ],
            order: [['id_enseignement', 'ASC']],
        });
        const parUser = new Map(enseignantsList.map(e => [e.user.id_user, e]));
        const servir = (ens, enseignement, statut) => {
            if (statut !== 'refuse') ens.heures += enseignement.heures_prevues;
            ens.cours.add(enseignement.composante.id_cours);
        };
        let nbServices = 0;
        const proposes = [];
        for (const [i, enseignement] of enseignements.entries()) {
            const idCours = enseignement.composante.id_cours;
            // Seed relancé : les services déjà en place sont comptés, jamais réattribués
            if (enseignement.services.length) {
                enseignement.services.forEach(s => parUser.has(s.id_user) && servir(parUser.get(s.id_user), enseignement, s.statut_service));
                continue;
            }
            const dept = deptDuCours[idCours];
            const principal = choisir(dept, idCours);
            // Quelques services restent à accepter, un est refusé (motif obligatoire)
            const statut = i % 9 === 4 ? 'propose' : i === 7 ? 'refuse' : 'accepte';
            await EnseignementEnseignant.create({
                id_enseignement: enseignement.id_enseignement, id_user: principal.user.id_user, role: 'principal', statut_service: statut,
                motif_refus: statut === 'refuse' ? 'Indisponible sur les créneaux de ce module ce semestre' : null,
            });
            servir(principal, enseignement, statut);
            nbServices++;
            if (statut === 'propose') proposes.push({ principal, enseignement });

            if (optionsDuCours[idCours].co) {
                const co = choisir(dept, idCours, [principal]);
                await EnseignementEnseignant.create({
                    id_enseignement: enseignement.id_enseignement, id_user: co.user.id_user, role: 'co_enseignant', statut_service: 'accepte',
                });
                servir(co, enseignement, 'accepte');
                nbServices++;
            }
        }
        for (const { principal, enseignement } of proposes) {
            const cours = Object.values(coursMap).find(c => c.id_cours === enseignement.composante.id_cours);
            await creerNotification({
                id_user: principal.user.id_user,
                titre: 'Nouveau service proposé',
                message: `On vous propose d'assurer ${cours.nom_cours} (${enseignement.composante.type}). Acceptez ou refusez-le depuis « Mes services ».`,
                type_notification: 'info',
                lien: '/mes-services',
            });
        }
        console.log(`✅ ${nbServices} services (${proposes.length} à accepter)`);

        // ── 12. Compétences : modules du département pour un permanent, modules assurés pour un vacataire ──
        let nbCompetences = 0;
        for (const ens of enseignantsList) {
            const ids = ens.statut === 'permanent'
                ? Object.keys(deptDuCours).filter(id => deptDuCours[id] === ens.dept).map(Number)
                : [...ens.cours];
            for (const id_cours of ids) {
                const [, cree] = await CompetenceEnseignant.findOrCreate({ where: { id_user: ens.user.id_user, id_cours } });
                if (cree) nbCompetences++;
            }
        }
        console.log(`✅ ${nbCompetences} compétences`);

        // ── 13. Responsables de filière : un permanent du département, différent pour chaque filière ──
        const responsables = new Set();
        const responsablesParFiliere = {};
        for (const f of HESTIM_CONFIG.filieres) {
            const pool = ensByDept[f.dept].filter(e => e.statut === 'permanent');
            const responsable = pool.find(e => !responsables.has(e) && e !== enseignantsList[0]) ?? pool[1] ?? pool[0];
            responsables.add(responsable);
            responsablesParFiliere[f.code] = responsable;
            await ResponsableFiliere.findOrCreate({ where: { id_user: responsable.user.id_user, id_filiere: filieresMap[f.code].id_filiere } });
        }
        console.log(`✅ ${HESTIM_CONFIG.filieres.length} responsables de filière`);

        // ── 14. Disponibilités : vacataires en opt-in (avec vœux), quelques indisponibilités de permanents ──
        const debutS1 = periodes.S1.date_debut;
        const finS1 = periodes.S1.date_fin;
        let nbDispos = 0;
        const declarer = async (ens, valeurs) => {
            const [, cree] = await Disponibilite.findOrCreate({
                where: { id_user_enseignant: ens.user.id_user, id_creneau: valeurs.id_creneau, date_debut: valeurs.date_debut },
                defaults: { id_user_enseignant: ens.user.id_user, ...valeurs },
            });
            if (cree) nbDispos++;
        };
        const vacataires = enseignantsList.filter(e => e.statut === 'vacataire');
        // Le dernier vacataire n'a rien déclaré : il apparaît « indisponible partout » (relance à faire)
        for (const [i, ens] of vacataires.slice(0, -1).entries()) {
            for (const [jour, heure, preference] of DISPONIBILITES_VACATAIRES[i % DISPONIBILITES_VACATAIRES.length]) {
                await declarer(ens, { id_creneau: creneauxMap[`${jour}_${heure}`].id_creneau, date_debut: debutS1, date_fin: finS1, disponible: true, preference });
            }
        }
        const permanents = enseignantsList.filter(e => e.statut === 'permanent');
        for (const [i, ens] of permanents.filter((_, idx) => idx % 6 === 0).entries()) {
            // Un jury externe ponctuel, et le vœu d'éviter le samedi matin
            const jury = ajouterJours(debutS1, 7 * (3 + i % 8) + 2);
            await declarer(ens, { id_creneau: creneauxMap['mercredi_09:00'].id_creneau, date_debut: jury, date_fin: jury, disponible: false, raison_indisponibilite: 'Jury externe' });
            await declarer(ens, { id_creneau: creneauxMap['samedi_09:00'].id_creneau, date_debut: debutS1, date_fin: finS1, disponible: true, preference: 'eviter' });
        }
        console.log(`✅ ${nbDispos} disponibilités et vœux déclarés`);

        // ── Récapitulatif ─────────────────────────────────────────────────────
        const profDemo = proposes[0]?.principal ?? enseignantsList[0];
        const respDemo = responsablesParFiliere['IIIA'];
        console.log('\n🏫 Offre de formation :');
        console.log(`   ${HESTIM_CONFIG.filieres.map(f => `[${f.cycle.padEnd(12)}] ${f.code.padEnd(10)} ${f.niveaux.map(n => n.label).join(', ')}`).join('\n   ')}`);
        console.log('\n📦 Volumes :');
        console.log(`   Filières: ${Object.keys(filieresMap).length}  |  Groupes de TD: ${GROUPES_DEF.length}  |  Salles: ${sallesList.length}  |  Modules: ${Object.keys(coursMap).length}`);
        console.log(`   Enseignants: ${enseignantsList.length}  |  Étudiants: ${etuCount}  |  Séances: à générer (phase E)`);
        console.log('\n📋 Comptes de test (password123) :');
        console.log(`   👨‍💼 Admin                  : ${HESTIM_CONFIG.admins[0].email}`);
        console.log(`   👨‍🏫 Enseignant             : ${enseignantsList[0].user.email}`);
        console.log(`   👨‍🏫 Service à accepter     : ${profDemo.user.email}`);
        console.log(`   🧭 Responsable IIIA       : ${respDemo.user.email}`);
        console.log(`   👨‍🎓 Étudiant               : ${firstEtu[0]?.email || 'N/A'}`);
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
    seed()
        .then(() => sequelize.close())
        .catch((error) => {
            console.error('❌', error.message);
            process.exit(1);
        });
}

export default seed;
