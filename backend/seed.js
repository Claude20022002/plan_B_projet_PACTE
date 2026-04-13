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
 * Seed HESTIM-STENDHAL — 3A IIIA (S6) — 2025/2026
 * Données en adéquation avec le planning YAML weekly_blocks (W1-W4 / S1-S4)
 */
async function seed() {
    try {
        console.log('🌱 Démarrage du seed HESTIM-STENDHAL S6...');
        await testConnection();
        console.log('✅ Connexion à la base de données réussie');

        console.log('🔄 Vérification des tables...');
        try {
            await Users.sync({ force: false });
            await Filiere.sync({ force: false });
            await Salle.sync({ force: false });
            await Creneau.sync({ force: false });
            await Groupe.sync({ force: false });
            await Cours.sync({ force: false });
            await Enseignant.sync({ force: false });
            await Etudiant.sync({ force: false });
            await Affectation.sync({ force: false });
            await DemandeReport.sync({ force: false });
            await Disponibilite.sync({ force: false });
            await Notification.sync({ force: false });
            await Conflit.sync({ force: false });
            await Appartenir.sync({ force: false });
            console.log('✅ Tables vérifiées');
        } catch (err) {
            console.warn('⚠️  Erreur tables (ignorée):', err.message);
        }

        const defaultPassword = await hashPassword('password123');

        // ── 1. Administrateurs ────────────────────────────────────────────────
        const adminsRaw = [
            { nom: 'HAIDRAR', prenom: 'Admin', email: 'admin@hestim.ma', telephone: '+212 522 000 001' },
            { nom: 'ALAOUI',  prenom: 'Leila', email: 'admin2@hestim.ma', telephone: '+212 522 000 002' },
        ];
        const admins = [];
        for (const d of adminsRaw) {
            const [u] = await Users.findOrCreate({
                where: { email: d.email },
                defaults: { ...d, password_hash: defaultPassword, role: 'admin', actif: true },
            });
            admins.push(u);
        }
        const admin = admins[0];
        console.log(`✅ ${admins.length} administrateurs`);

        // ── 2. Enseignants (correspondant exactement au YAML) ─────────────────
        const enseignantsRaw = [
            { nom: 'BENNIS',      prenom: 'D.',        email: 'd.bennis@hestim.ma',      specialite: 'Mathématiques appliquées',       departement: 'Sciences et Techniques', grade: 'Professeur' },
            { nom: 'MOUSTAKIM',   prenom: 'M.',        email: 'm.moustakim@hestim.ma',   specialite: 'Langues et Communication',       departement: 'Langues',                grade: 'Professeur' },
            { nom: 'AYAD',        prenom: 'Samira',    email: 's.ayad@hestim.ma',        specialite: 'Recherche Opérationnelle',       departement: 'Mathématiques',           grade: 'Professeur' },
            { nom: 'BOUBEKRAOUI', prenom: 'Houda',     email: 'h.boubekraoui@hestim.ma', specialite: 'Algorithmique et Graphes',       departement: 'Génie Informatique',      grade: 'Professeur' },
            { nom: 'HAIDRAR',     prenom: 'Nadia',     email: 'n.haidrar@hestim.ma',     specialite: 'Développement Web Full-stack',   departement: 'Génie Informatique',      grade: 'Professeur' },
            { nom: 'HANBALI',     prenom: 'Imane',     email: 'i.hanbali@hestim.ma',     specialite: 'Développement Web Full-stack',   departement: 'Génie Informatique',      grade: 'Professeur' },
            { nom: 'KHIAT',       prenom: 'Mehdi',     email: 'm.khiat@hestim.ma',       specialite: 'Réseaux et Systèmes Distribués', departement: 'Génie Informatique',      grade: 'Professeur' },
            { nom: 'EL KARI',     prenom: 'Fatima',    email: 'f.elkari@hestim.ma',      specialite: 'Finance et Développement Personnel', departement: 'Sciences de Gestion', grade: 'Professeur' },
            { nom: 'ELOTMANI',    prenom: 'Salma',     email: 's.elotmani@hestim.ma',    specialite: 'Entrepreneuriat et Innovation',  departement: 'Management',              grade: 'Professeur' },
            { nom: 'BENIRZIK',    prenom: 'Youssef',   email: 'y.benirzik@hestim.ma',    specialite: 'Automatisation No-Code',         departement: 'Innovation Digitale',     grade: 'Intervenant' },
        ];

        const enseignants = [];
        for (const d of enseignantsRaw) {
            const [user, created] = await Users.findOrCreate({
                where: { email: d.email },
                defaults: { nom: d.nom, prenom: d.prenom, email: d.email, password_hash: defaultPassword, role: 'enseignant', telephone: '+212 6XX XXX XXX', actif: true },
            });
            if (created) {
                await Enseignant.create({ id_user: user.id_user, specialite: d.specialite, departement: d.departement, grade: d.grade });
            }
            enseignants.push({ user, nom: d.nom });
        }
        const findEns = (nom) => enseignants.find(e => e.nom === nom)?.user;
        console.log(`✅ ${enseignants.length} enseignants`);

        // ── 3. Filières ───────────────────────────────────────────────────────
        const filieres = [];
        for (const d of [
            { code_filiere: 'IIIA', nom_filiere: 'Ingénierie Informatique et Intelligence Artificielle', description: 'Filière IIIA — 3 ans' },
            { code_filiere: 'IID',  nom_filiere: 'Ingénierie et Innovation Digitale',                   description: 'Filière IID — 3 ans' },
            { code_filiere: 'GC',   nom_filiere: 'Génie Civil',                                         description: 'Filière GC — 3 ans' },
        ]) {
            const [f] = await Filiere.findOrCreate({ where: { code_filiere: d.code_filiere }, defaults: d });
            filieres.push(f);
        }
        const filiereIIIA = filieres[0];
        console.log(`✅ ${filieres.length} filières`);

        // ── 4. Groupes ────────────────────────────────────────────────────────
        const groupes = [];
        for (const d of [
            { nom_groupe: '3A IIIA', id_filiere: filiereIIIA.id_filiere, niveau: '3ème année', effectif: 25, annee_scolaire: '2025/2026' },
            { nom_groupe: '3B IIIA', id_filiere: filiereIIIA.id_filiere, niveau: '3ème année', effectif: 22, annee_scolaire: '2025/2026' },
        ]) {
            const [g] = await Groupe.findOrCreate({ where: { nom_groupe: d.nom_groupe }, defaults: d });
            groupes.push(g);
        }
        const groupe3A = groupes[0];
        const groupe3B = groupes[1];
        console.log(`✅ ${groupes.length} groupes`);

        // ── 5. Étudiants ──────────────────────────────────────────────────────
        const etudiantsRaw = [
            // Groupe 3A IIIA (15 étudiants)
            { nom: 'BENALI',      prenom: 'Aya',          email: 'aya.benali@hestim.ma',       num: 'ETU3A001', grp: groupe3A },
            { nom: 'TAZI',        prenom: 'Hamza',        email: 'hamza.tazi@hestim.ma',       num: 'ETU3A002', grp: groupe3A },
            { nom: 'CHERKAOUI',   prenom: 'Meryem',       email: 'meryem.cherkaoui@hestim.ma', num: 'ETU3A003', grp: groupe3A },
            { nom: 'OUALI',       prenom: 'Yassine',      email: 'yassine.ouali@hestim.ma',    num: 'ETU3A004', grp: groupe3A },
            { nom: 'HAJJI',       prenom: 'Salma',        email: 'salma.hajji@hestim.ma',      num: 'ETU3A005', grp: groupe3A },
            { nom: 'IDRISSI',     prenom: 'Karim',        email: 'karim.idrissi@hestim.ma',    num: 'ETU3A006', grp: groupe3A },
            { nom: 'ALAMI',       prenom: 'Zineb',        email: 'zineb.alami@hestim.ma',      num: 'ETU3A007', grp: groupe3A },
            { nom: 'BENALI',      prenom: 'Omar',         email: 'omar.benali@hestim.ma',      num: 'ETU3A008', grp: groupe3A },
            { nom: 'BENSAID',     prenom: 'Nora',         email: 'nora.bensaid@hestim.ma',     num: 'ETU3A009', grp: groupe3A },
            { nom: 'ZAHIR',       prenom: 'Mehdi',        email: 'mehdi.zahir@hestim.ma',      num: 'ETU3A010', grp: groupe3A },
            { nom: 'BOUKHRISS',   prenom: 'Fatima Zahra', email: 'fz.boukhriss@hestim.ma',     num: 'ETU3A011', grp: groupe3A },
            { nom: 'TAHIRI',      prenom: 'Anas',         email: 'anas.tahiri@hestim.ma',      num: 'ETU3A012', grp: groupe3A },
            { nom: 'MEKOUAR',     prenom: 'Rania',        email: 'rania.mekouar@hestim.ma',    num: 'ETU3A013', grp: groupe3A },
            { nom: 'LACHGAR',     prenom: 'Ibrahim',      email: 'ibrahim.lachgar@hestim.ma',  num: 'ETU3A014', grp: groupe3A },
            { nom: 'AMRANI',      prenom: 'Hana',         email: 'hana.amrani@hestim.ma',      num: 'ETU3A015', grp: groupe3A },
            // Groupe 3B IIIA (12 étudiants)
            { nom: 'BERRADA',     prenom: 'Khalid',       email: 'khalid.berrada@hestim.ma',   num: 'ETU3B001', grp: groupe3B },
            { nom: 'KETTANI',     prenom: 'Lamia',        email: 'lamia.kettani@hestim.ma',    num: 'ETU3B002', grp: groupe3B },
            { nom: 'FASSI',       prenom: 'Younes',       email: 'younes.fassi@hestim.ma',     num: 'ETU3B003', grp: groupe3B },
            { nom: 'NACIRI',      prenom: 'Sara',         email: 'sara.naciri@hestim.ma',      num: 'ETU3B004', grp: groupe3B },
            { nom: 'BENOMAR',     prenom: 'Amine',        email: 'amine.benomar@hestim.ma',    num: 'ETU3B005', grp: groupe3B },
            { nom: 'DRISSI',      prenom: 'Ghita',        email: 'ghita.drissi@hestim.ma',     num: 'ETU3B006', grp: groupe3B },
            { nom: 'ELFILALI',    prenom: 'Nabil',        email: 'nabil.elfilali@hestim.ma',   num: 'ETU3B007', grp: groupe3B },
            { nom: 'ZOUHEIR',     prenom: 'Asmaa',        email: 'asmaa.zouheir@hestim.ma',    num: 'ETU3B008', grp: groupe3B },
            { nom: 'BAKKALI',     prenom: 'Rachid',       email: 'rachid.bakkali@hestim.ma',   num: 'ETU3B009', grp: groupe3B },
            { nom: 'BENALI',      prenom: 'Imane',        email: 'imane.benali3b@hestim.ma',   num: 'ETU3B010', grp: groupe3B },
            { nom: 'AKJOUT',      prenom: 'Tariq',        email: 'tariq.akjout@hestim.ma',     num: 'ETU3B011', grp: groupe3B },
            { nom: 'SEBTI',       prenom: 'Hajar',        email: 'hajar.sebti@hestim.ma',      num: 'ETU3B012', grp: groupe3B },
        ];

        const etudiants = [];
        for (const d of etudiantsRaw) {
            const [user, created] = await Users.findOrCreate({
                where: { email: d.email },
                defaults: { nom: d.nom, prenom: d.prenom, email: d.email, password_hash: defaultPassword, role: 'etudiant', telephone: '+212 6XX XXX XXX', actif: true },
            });
            if (created) {
                const exists = await Etudiant.findByPk(user.id_user);
                if (!exists) {
                    await Etudiant.create({ id_user: user.id_user, numero_etudiant: d.num, niveau: '3ème année' });
                    await Appartenir.findOrCreate({
                        where: { id_user_etudiant: user.id_user, id_groupe: d.grp.id_groupe },
                        defaults: { id_user_etudiant: user.id_user, id_groupe: d.grp.id_groupe },
                    });
                }
            }
            etudiants.push(user);
        }
        console.log(`✅ ${etudiants.length} étudiants`);

        // ── 6. Salles (correspondant exactement au YAML) ──────────────────────
        const salles = [];
        for (const d of [
            { nom_salle: 'Etage 1 - Salle Info', type_salle: 'Laboratoire informatique', capacite: 35,  batiment: 'Principal', etage: 1 },
            { nom_salle: 'Etage 3 - Amphi C',    type_salle: 'Amphithéâtre',             capacite: 80,  batiment: 'Principal', etage: 3 },
            { nom_salle: 'Etage 4 - Amphi G',    type_salle: 'Amphithéâtre',             capacite: 120, batiment: 'Principal', etage: 4 },
            { nom_salle: 'Distanciel',            type_salle: 'Distanciel',               capacite: 999, batiment: 'Virtuel',   etage: 0 },
        ]) {
            const [s] = await Salle.findOrCreate({ where: { nom_salle: d.nom_salle }, defaults: { ...d, disponible: true } });
            salles.push(s);
        }
        const [salleInfo, amphi3, amphi4, distanciel] = salles;
        console.log(`✅ ${salles.length} salles`);

        // ── 7. Créneaux S1-S4 × 6 jours (correspondant au YAML time_slots) ───
        const JOURS_6 = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const SLOTS_DEF = [
            { heure_debut: '09:00', heure_fin: '10:45', duree_minutes: 105 }, // S1
            { heure_debut: '11:00', heure_fin: '12:30', duree_minutes: 90  }, // S2
            { heure_debut: '13:30', heure_fin: '15:15', duree_minutes: 105 }, // S3
            { heure_debut: '15:30', heure_fin: '17:00', duree_minutes: 90  }, // S4
        ];

        const creneaux = [];
        for (const jour of JOURS_6) {
            for (const slot of SLOTS_DEF) {
                const [c] = await Creneau.findOrCreate({
                    where: { jour_semaine: jour, heure_debut: slot.heure_debut, heure_fin: slot.heure_fin },
                    defaults: { jour_semaine: jour, ...slot },
                });
                creneaux.push(c);
            }
        }
        const getCreneau = (jour, debut) => creneaux.find(c => c.jour_semaine === jour && c.heure_debut === debut);
        console.log(`✅ ${creneaux.length} créneaux (S1-S4 × 6 jours)`);

        // ── 8. Cours S6 — 3A IIIA ─────────────────────────────────────────────
        const coursRaw = [
            { code: 'S6-ANNUM',  nom: 'Analyse numérique',                                  type: 'CM',     vh: 30, coef: 2 },
            { code: 'S6-BENG',   nom: 'Business English',                                   type: 'TD',     vh: 20, coef: 1 },
            { code: 'S6-RO',     nom: 'Recherche Opérationnelle',                            type: 'CM',     vh: 30, coef: 3 },
            { code: 'S6-ALGP',   nom: 'Algorithmes efficaces de graphes avec Python',        type: 'TP',     vh: 30, coef: 2 },
            { code: 'S6-DWFS',   nom: 'Développement Web Full-stack',                        type: 'TP',     vh: 40, coef: 3 },
            { code: 'S6-RESINF', nom: 'Réseaux informatiques',                               type: 'CM',     vh: 30, coef: 2 },
            { code: 'S6-FINI',   nom: "La finance pour l'ingénieur",                         type: 'CM',     vh: 20, coef: 1 },
            { code: 'S6-PACTE',  nom: 'Projet PACTE',                                        type: 'Projet', vh: 40, coef: 4 },
            { code: 'S6-RESIL',  nom: 'Développer sa résilience et son mindset positif',     type: 'TD',     vh: 20, coef: 1 },
            { code: 'S6-ENT2',   nom: 'Entrepreneuriat 2 - Business Model',                  type: 'CM',     vh: 20, coef: 2 },
            { code: 'S6-N8N',    nom: 'Atelier N8N',                                         type: 'TP',     vh: 20, coef: 1 },
            { code: 'S6-CULT',   nom: 'Journée culturelle',                                  type: 'Autre',  vh:  8, coef: 0 },
        ];

        const cours = [];
        for (const d of coursRaw) {
            const [c] = await Cours.findOrCreate({
                where: { code_cours: d.code },
                defaults: { code_cours: d.code, nom_cours: d.nom, id_filiere: filiereIIIA.id_filiere, niveau: '3ème année', volume_horaire: d.vh, type_cours: d.type, semestre: 'S6', coefficient: d.coef },
            });
            cours.push(c);
        }
        const findCours = (code) => cours.find(c => c.code_cours === code);
        console.log(`✅ ${cours.length} cours S6`);

        // ── 9. Disponibilités (tous enseignants × tous créneaux × W1-W4) ──────
        const DISPO_START = '2026-03-30';
        const DISPO_END   = '2026-04-25';
        let dispoCount = 0;
        for (const ens of enseignants) {
            for (const cr of creneaux) {
                const [, created] = await Disponibilite.findOrCreate({
                    where: { id_user_enseignant: ens.user.id_user, id_creneau: cr.id_creneau, date_debut: DISPO_START, date_fin: DISPO_END },
                    defaults: { id_user_enseignant: ens.user.id_user, id_creneau: cr.id_creneau, disponible: true, date_debut: DISPO_START, date_fin: DISPO_END },
                });
                if (created) dispoCount++;
            }
        }
        console.log(`✅ ${dispoCount} disponibilités (W1-W4)`);

        // ── 10. Affectations — Planning W1-W4 (selon schéma YAML) ────────────
        // Format: [date, cours_code, slot_debut, jour, ens_nom, salle, statut, commentaire]
        const affSpec = [
            // ── W1 : 2026-03-30 → 2026-04-04 ────────────────────────────────
            // Lundi 30/03 : Analyse numérique (S1+S2) + Résilience DS (S3+S4)
            ['2026-03-30', 'S6-ANNUM',  '09:00', 'lundi',    'BENNIS',      salleInfo,  'planifie', ''],
            ['2026-03-30', 'S6-ANNUM',  '11:00', 'lundi',    'BENNIS',      salleInfo,  'planifie', ''],
            ['2026-03-30', 'S6-RESIL',  '13:30', 'lundi',    'EL KARI',     amphi3,     'confirme', 'DS | Evaluation'],
            ['2026-03-30', 'S6-RESIL',  '15:30', 'lundi',    'EL KARI',     amphi3,     'confirme', 'DS | Evaluation'],
            // Mardi 31/03 : Dev Web (S1+S2) + Recherche Op (S3+S4)
            ['2026-03-31', 'S6-DWFS',   '09:00', 'mardi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            ['2026-03-31', 'S6-DWFS',   '11:00', 'mardi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            ['2026-03-31', 'S6-RO',     '13:30', 'mardi',    'AYAD',        amphi4,     'planifie', ''],
            ['2026-03-31', 'S6-RO',     '15:30', 'mardi',    'AYAD',        amphi4,     'planifie', ''],
            // Mercredi 01/04 : Business English (S1+S2) + Algo graphes (S3+S4)
            ['2026-04-01', 'S6-BENG',   '09:00', 'mercredi', 'MOUSTAKIM',   amphi3,     'planifie', ''],
            ['2026-04-01', 'S6-BENG',   '11:00', 'mercredi', 'MOUSTAKIM',   amphi3,     'planifie', ''],
            ['2026-04-01', 'S6-ALGP',   '13:30', 'mercredi', 'BOUBEKRAOUI', salleInfo,  'planifie', ''],
            ['2026-04-01', 'S6-ALGP',   '15:30', 'mercredi', 'BOUBEKRAOUI', salleInfo,  'planifie', ''],
            // Jeudi 02/04 : Réseaux (S1+S2) + Entrepreneuriat (S3+S4)
            ['2026-04-02', 'S6-RESINF', '09:00', 'jeudi',    'KHIAT',       salleInfo,  'planifie', ''],
            ['2026-04-02', 'S6-RESINF', '11:00', 'jeudi',    'KHIAT',       salleInfo,  'planifie', ''],
            ['2026-04-02', 'S6-ENT2',   '13:30', 'jeudi',    'ELOTMANI',    amphi4,     'planifie', ''],
            ['2026-04-02', 'S6-ENT2',   '15:30', 'jeudi',    'ELOTMANI',    amphi4,     'planifie', ''],
            // Vendredi 03/04 : Projet PACTE (S1+S2+S3+S4)
            ['2026-04-03', 'S6-PACTE',  '09:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-03', 'S6-PACTE',  '11:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-03', 'S6-PACTE',  '13:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-03', 'S6-PACTE',  '15:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            // Samedi 04/04 : Finance (S1+S2) + Atelier N8N (S3+S4)
            ['2026-04-04', 'S6-FINI',   '09:00', 'samedi',   'EL KARI',     amphi3,     'planifie', ''],
            ['2026-04-04', 'S6-FINI',   '11:00', 'samedi',   'EL KARI',     amphi3,     'planifie', ''],
            ['2026-04-04', 'S6-N8N',    '13:30', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],
            ['2026-04-04', 'S6-N8N',    '15:30', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],

            // ── W2 : 2026-04-06 → 2026-04-11 ────────────────────────────────
            // Lundi 06/04 : Algo graphes (S1+S2) + Dev Web (S3+S4)
            ['2026-04-06', 'S6-ALGP',   '09:00', 'lundi',    'BOUBEKRAOUI', salleInfo,  'planifie', ''],
            ['2026-04-06', 'S6-ALGP',   '11:00', 'lundi',    'BOUBEKRAOUI', salleInfo,  'planifie', ''],
            ['2026-04-06', 'S6-DWFS',   '13:30', 'lundi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            ['2026-04-06', 'S6-DWFS',   '15:30', 'lundi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            // Mardi 07/04 : Business English (S1+S2) + Entrepreneuriat (S3+S4)
            ['2026-04-07', 'S6-BENG',   '09:00', 'mardi',    'MOUSTAKIM',   amphi3,     'planifie', ''],
            ['2026-04-07', 'S6-BENG',   '11:00', 'mardi',    'MOUSTAKIM',   amphi3,     'planifie', ''],
            ['2026-04-07', 'S6-ENT2',   '13:30', 'mardi',    'ELOTMANI',    amphi4,     'planifie', ''],
            ['2026-04-07', 'S6-ENT2',   '15:30', 'mardi',    'ELOTMANI',    amphi4,     'planifie', ''],
            // Mercredi 08/04 : Analyse numérique (S1+S2) + Recherche Op (S3+S4)
            ['2026-04-08', 'S6-ANNUM',  '09:00', 'mercredi', 'BENNIS',      salleInfo,  'planifie', ''],
            ['2026-04-08', 'S6-ANNUM',  '11:00', 'mercredi', 'BENNIS',      salleInfo,  'planifie', ''],
            ['2026-04-08', 'S6-RO',     '13:30', 'mercredi', 'AYAD',        amphi4,     'planifie', ''],
            ['2026-04-08', 'S6-RO',     '15:30', 'mercredi', 'AYAD',        amphi4,     'planifie', ''],
            // Jeudi 09/04 : Réseaux Blended (S1+S2) + Finance (S3+S4)
            ['2026-04-09', 'S6-RESINF', '09:00', 'jeudi',    'KHIAT',       distanciel, 'planifie', 'Blended | Distanciel'],
            ['2026-04-09', 'S6-RESINF', '11:00', 'jeudi',    'KHIAT',       distanciel, 'planifie', 'Blended | Distanciel'],
            ['2026-04-09', 'S6-FINI',   '13:30', 'jeudi',    'EL KARI',     amphi3,     'planifie', ''],
            ['2026-04-09', 'S6-FINI',   '15:30', 'jeudi',    'EL KARI',     amphi3,     'planifie', ''],
            // Vendredi 10/04 : Projet PACTE (S1+S2+S3+S4)
            ['2026-04-10', 'S6-PACTE',  '09:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-10', 'S6-PACTE',  '11:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-10', 'S6-PACTE',  '13:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-10', 'S6-PACTE',  '15:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            // Samedi 11/04 : Atelier N8N (S1+S2) + Journée culturelle (S3+S4)
            ['2026-04-11', 'S6-N8N',    '09:00', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],
            ['2026-04-11', 'S6-N8N',    '11:00', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],
            ['2026-04-11', 'S6-CULT',   '13:30', 'samedi',   null,           amphi4,     'planifie', 'Journée culturelle'],
            ['2026-04-11', 'S6-CULT',   '15:30', 'samedi',   null,           amphi4,     'planifie', 'Journée culturelle'],

            // ── W3 : 2026-04-13 → 2026-04-18 ────────────────────────────────
            // Lundi 13/04 : Analyse numérique (S1+S2) + Dev Web (S3+S4)
            ['2026-04-13', 'S6-ANNUM',  '09:00', 'lundi',    'BENNIS',      salleInfo,  'planifie', ''],
            ['2026-04-13', 'S6-ANNUM',  '11:00', 'lundi',    'BENNIS',      salleInfo,  'planifie', ''],
            ['2026-04-13', 'S6-DWFS',   '13:30', 'lundi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            ['2026-04-13', 'S6-DWFS',   '15:30', 'lundi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            // Mardi 14/04 : Recherche Op DS (S1+S2) + Algo graphes (S3+S4)
            ['2026-04-14', 'S6-RO',     '09:00', 'mardi',    'AYAD',        amphi4,     'confirme', 'DS | Evaluation'],
            ['2026-04-14', 'S6-RO',     '11:00', 'mardi',    'AYAD',        amphi4,     'confirme', 'DS | Evaluation'],
            ['2026-04-14', 'S6-ALGP',   '13:30', 'mardi',    'BOUBEKRAOUI', salleInfo,  'planifie', ''],
            ['2026-04-14', 'S6-ALGP',   '15:30', 'mardi',    'BOUBEKRAOUI', salleInfo,  'planifie', ''],
            // Mercredi 15/04 : Business English (S1+S2) + Réseaux (S3+S4)
            ['2026-04-15', 'S6-BENG',   '09:00', 'mercredi', 'MOUSTAKIM',   amphi3,     'planifie', ''],
            ['2026-04-15', 'S6-BENG',   '11:00', 'mercredi', 'MOUSTAKIM',   amphi3,     'planifie', ''],
            ['2026-04-15', 'S6-RESINF', '13:30', 'mercredi', 'KHIAT',       salleInfo,  'planifie', ''],
            ['2026-04-15', 'S6-RESINF', '15:30', 'mercredi', 'KHIAT',       salleInfo,  'planifie', ''],
            // Jeudi 16/04 : Entrepreneuriat (S1+S2) + Finance (S3+S4)
            ['2026-04-16', 'S6-ENT2',   '09:00', 'jeudi',    'ELOTMANI',    amphi4,     'planifie', ''],
            ['2026-04-16', 'S6-ENT2',   '11:00', 'jeudi',    'ELOTMANI',    amphi4,     'planifie', ''],
            ['2026-04-16', 'S6-FINI',   '13:30', 'jeudi',    'EL KARI',     amphi3,     'planifie', ''],
            ['2026-04-16', 'S6-FINI',   '15:30', 'jeudi',    'EL KARI',     amphi3,     'planifie', ''],
            // Vendredi 17/04 : Projet PACTE (S1+S2+S3+S4)
            ['2026-04-17', 'S6-PACTE',  '09:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-17', 'S6-PACTE',  '11:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-17', 'S6-PACTE',  '13:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-17', 'S6-PACTE',  '15:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            // Samedi 18/04 : Atelier N8N (S1+S2)
            ['2026-04-18', 'S6-N8N',    '09:00', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],
            ['2026-04-18', 'S6-N8N',    '11:00', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],

            // ── W4 : 2026-04-20 → 2026-04-25 ────────────────────────────────
            // Lundi 20/04 : Business English DS (S1+S2) + Algo graphes DS (S3+S4)
            ['2026-04-20', 'S6-BENG',   '09:00', 'lundi',    'MOUSTAKIM',   amphi3,     'confirme', 'DS | Evaluation'],
            ['2026-04-20', 'S6-BENG',   '11:00', 'lundi',    'MOUSTAKIM',   amphi3,     'confirme', 'DS | Evaluation'],
            ['2026-04-20', 'S6-ALGP',   '13:30', 'lundi',    'BOUBEKRAOUI', amphi4,     'confirme', 'DS | Evaluation'],
            ['2026-04-20', 'S6-ALGP',   '15:30', 'lundi',    'BOUBEKRAOUI', amphi4,     'confirme', 'DS | Evaluation'],
            // Mardi 21/04 : Dev Web (S1+S2) + Recherche Op Blended (S3+S4)
            ['2026-04-21', 'S6-DWFS',   '09:00', 'mardi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            ['2026-04-21', 'S6-DWFS',   '11:00', 'mardi',    'HAIDRAR',     salleInfo,  'planifie', ''],
            ['2026-04-21', 'S6-RO',     '13:30', 'mardi',    'AYAD',        distanciel, 'planifie', 'Blended | Distanciel'],
            ['2026-04-21', 'S6-RO',     '15:30', 'mardi',    'AYAD',        distanciel, 'planifie', 'Blended | Distanciel'],
            // Mercredi 22/04 : Réseaux DS (S1+S2) + Entrepreneuriat (S3+S4)
            ['2026-04-22', 'S6-RESINF', '09:00', 'mercredi', 'KHIAT',       amphi4,     'confirme', 'DS | Evaluation'],
            ['2026-04-22', 'S6-RESINF', '11:00', 'mercredi', 'KHIAT',       amphi4,     'confirme', 'DS | Evaluation'],
            ['2026-04-22', 'S6-ENT2',   '13:30', 'mercredi', 'ELOTMANI',    amphi4,     'planifie', ''],
            ['2026-04-22', 'S6-ENT2',   '15:30', 'mercredi', 'ELOTMANI',    amphi4,     'planifie', ''],
            // Jeudi 23/04 : Analyse num Blended (S1+S2) + Finance DS (S3+S4)
            ['2026-04-23', 'S6-ANNUM',  '09:00', 'jeudi',    'BENNIS',      distanciel, 'planifie', 'Blended | Distanciel'],
            ['2026-04-23', 'S6-ANNUM',  '11:00', 'jeudi',    'BENNIS',      distanciel, 'planifie', 'Blended | Distanciel'],
            ['2026-04-23', 'S6-FINI',   '13:30', 'jeudi',    'EL KARI',     amphi3,     'confirme', 'DS | Evaluation'],
            ['2026-04-23', 'S6-FINI',   '15:30', 'jeudi',    'EL KARI',     amphi3,     'confirme', 'DS | Evaluation'],
            // Vendredi 24/04 : Projet PACTE (S1+S2+S3+S4)
            ['2026-04-24', 'S6-PACTE',  '09:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-24', 'S6-PACTE',  '11:00', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-24', 'S6-PACTE',  '13:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            ['2026-04-24', 'S6-PACTE',  '15:30', 'vendredi', 'HAIDRAR',     salleInfo,  'planifie', 'Projet'],
            // Samedi 25/04 : Atelier N8N (S1+S2)
            ['2026-04-25', 'S6-N8N',    '09:00', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],
            ['2026-04-25', 'S6-N8N',    '11:00', 'samedi',   'BENIRZIK',    salleInfo,  'planifie', ''],
        ];

        let affCount = 0;
        for (const [date, code, heure, jour, ensNom, salle, statut, commentaire] of affSpec) {
            const coursObj = findCours(code);
            const cr      = getCreneau(jour, heure);
            const ensUser = ensNom ? findEns(ensNom) : null;
            if (!coursObj || !cr) {
                console.warn(`⚠️  Données manquantes pour ${code} ${jour} ${heure}`);
                continue;
            }
            const [, created] = await Affectation.findOrCreate({
                where: { date_seance: date, id_cours: coursObj.id_cours, id_groupe: groupe3A.id_groupe, id_creneau: cr.id_creneau },
                defaults: {
                    date_seance: date,
                    statut,
                    id_cours: coursObj.id_cours,
                    id_groupe: groupe3A.id_groupe,
                    id_user_enseignant: ensUser?.id_user || admin.id_user,
                    id_salle: salle.id_salle,
                    id_creneau: cr.id_creneau,
                    id_user_admin: admin.id_user,
                    commentaire: commentaire || null,
                },
            });
            if (created) affCount++;
        }
        console.log(`✅ ${affCount} affectations créées (W1-W4)`);

        // ── 11. Conflits (exemples réalistes) ────────────────────────────────
        const conflitsRaw = [
            { type_conflit: 'chevauchement_salle',       description: 'Salle Info réservée deux fois le 2026-04-01 à 13h30',              resolu: false },
            { type_conflit: 'chevauchement_enseignant',  description: 'Mme EL KARI : 2 séances simultanées le 2026-04-23',                resolu: false },
            { type_conflit: 'chevauchement_groupe',      description: 'Groupe 3A IIIA : 2 affectations au même créneau le 2026-04-09',    resolu: true  },
        ];
        for (const d of conflitsRaw) {
            await Conflit.findOrCreate({
                where: { description: d.description },
                defaults: { ...d, date_detection: new Date(), date_resolution: d.resolu ? new Date() : null },
            });
        }
        console.log('✅ Conflits créés');

        // ── 12. Demandes de report ────────────────────────────────────────────
        const firstAff = await Affectation.findOne({ where: { id_user_enseignant: findEns('BENNIS')?.id_user } });
        if (firstAff) {
            await DemandeReport.findOrCreate({
                where: { id_user_enseignant: findEns('BENNIS').id_user, id_affectation: firstAff.id_affectation },
                defaults: {
                    id_user_enseignant: findEns('BENNIS').id_user,
                    id_affectation: firstAff.id_affectation,
                    motif: 'Participation au jury de soutenance',
                    nouvelle_date: '2026-04-06',
                    statut_demande: 'en_attente',
                },
            });
            console.log('✅ Demande de report créée');
        }

        // ── 13. Notifications ─────────────────────────────────────────────────
        const notifsRaw = [
            { id_user: admin.id_user,              titre: 'HESTIM Planner S6 opérationnel',   message: 'Le planning S6 2025-2026 est disponible.',                       type_notification: 'success', lue: true  },
            { id_user: admin.id_user,              titre: 'Conflit détecté',                   message: 'Double réservation Salle Info le 01/04/2026 à 13h30.',           type_notification: 'warning', lue: false },
            { id_user: findEns('BENNIS')?.id_user, titre: 'Planning disponible',               message: 'Votre emploi du temps S6 est consultable sur HESTIM Planner.',  type_notification: 'info',    lue: false },
            { id_user: findEns('HAIDRAR')?.id_user,titre: 'Projet PACTE — rappel',             message: 'Les séances Projet PACTE sont planifiées chaque vendredi.',      type_notification: 'info',    lue: false },
            { id_user: findEns('EL KARI')?.id_user,titre: 'DS planifiés',                      message: 'Vos séances DS (S6-RESIL et S6-FINI) sont confirmées.',         type_notification: 'success', lue: false },
            { id_user: etudiants[0]?.id_user,      titre: 'Emploi du temps S6',                message: 'Consultez votre emploi du temps du semestre 6 sur Planner.',    type_notification: 'info',    lue: false },
            { id_user: etudiants[1]?.id_user,      titre: 'DS Résilience — 30/03',             message: 'Devoir surveillé programmé le lundi 30/03 à 13h30 — Amphi C.',  type_notification: 'warning', lue: false },
        ].filter(n => n.id_user);

        for (const d of notifsRaw) {
            await Notification.findOrCreate({ where: { id_user: d.id_user, titre: d.titre }, defaults: d });
        }
        console.log(`✅ ${notifsRaw.length} notifications créées`);

        // ── Résumé final ──────────────────────────────────────────────────────
        console.log('\n🎉 Seed HESTIM-STENDHAL — 3A IIIA (S6) terminé !\n');
        console.log('📋 Comptes de test :');
        console.log('   👨‍💼 Admins      :  admin@hestim.ma  |  admin2@hestim.ma        (password123)');
        console.log('   👨‍🏫 Enseignants :  d.bennis@hestim.ma  |  n.haidrar@hestim.ma  (password123)');
        console.log('                    m.moustakim@hestim.ma  |  s.ayad@hestim.ma');
        console.log('                    h.boubekraoui@hestim.ma  |  m.khiat@hestim.ma');
        console.log('                    f.elkari@hestim.ma  |  s.elotmani@hestim.ma');
        console.log('                    i.hanbali@hestim.ma  |  y.benirzik@hestim.ma');
        console.log('   👨‍🎓 Étudiants  :  aya.benali@hestim.ma ... hamza.tazi@hestim.ma  (password123)');
        console.log('\n📊 Données créées :');
        console.log(`   Filières     : ${filieres.length}   Groupes      : ${groupes.length}   Étudiants  : ${etudiants.length}`);
        console.log(`   Enseignants  : ${enseignants.length}  Cours S6     : ${cours.length}   Salles     : ${salles.length}`);
        console.log(`   Créneaux     : ${creneaux.length}  Affectations : ${affCount}   Semaines   : W1-W4`);
        console.log(`   Période      : 2026-03-30 → 2026-04-25`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du seed:', error);
        process.exit(1);
    }
}

seed();
