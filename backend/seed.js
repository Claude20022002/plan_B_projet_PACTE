import dotenv from 'dotenv';
import sequelize, { testConnection } from './config/db.js';
import './models/index.js'; // Import pour initialiser les relations
import { 
    Users, Enseignant, Etudiant, Filiere, Groupe, Salle, Cours, Creneau,
    Affectation, DemandeReport, Disponibilite, Notification, Conflit, Appartenir
} from './models/index.js';
import { hashPassword } from './utils/passwordHelper.js';

dotenv.config();

/**
 * Script de seed pour créer des données de test
 * Usage: node seed.js
 */
async function seed() {
    try {
        console.log('🌱 Démarrage du seed...');

        // Test de connexion
        await testConnection();
        console.log('✅ Connexion à la base de données réussie');

        // Créer les tables si elles n'existent pas (sans modifier les existantes)
        // Utiliser sync({ force: false }) pour créer sans modifier
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
            console.log('✅ Tables vérifiées/créées');
        } catch (error) {
            console.error('⚠️  Erreur lors de la vérification des tables:', error.message);
            console.log('💡 Astuce: Si les tables existent déjà, vous pouvez ignorer cette erreur');
        }

        // Hasher le mot de passe par défaut
        const defaultPassword = await hashPassword('password123');

        // 1. Créer des administrateurs
        const adminsData = [
            { nom: 'Admin', prenom: 'HESTIM', email: 'admin@hestim.ma', telephone: '+212 6XX XXX XXX' },
            { nom: 'Alami', prenom: 'Fatima', email: 'admin2@hestim.ma', telephone: '+212 6XX XXX XXX' },
        ];

        const admins = [];
        for (const adminData of adminsData) {
            const [admin, adminCreated] = await Users.findOrCreate({
                where: { email: adminData.email },
                defaults: {
                    ...adminData,
                    password_hash: defaultPassword,
                    role: 'admin',
                    actif: true,
                },
            });
            admins.push(admin);
            if (adminCreated) {
                console.log('✅ Administrateur créé:', admin.email);
            } else {
                console.log('ℹ️  Administrateur existe déjà:', admin.email);
            }
        }
        const admin = admins[0]; // Garder le premier admin pour les références

        // 2. Créer des enseignants (un enseignant pour chaque module/cours)
        const enseignantsData = [
            // Enseignants pour les cours de 3ème année
            { nom: 'Alaoui', prenom: 'Sanae', email: 'sanae.alaoui@hestim.ma', specialite: 'Base de données', departement: 'Génie Informatique' },
            { nom: 'Idrissi', prenom: 'Mohamed', email: 'mohamed.idrissi@hestim.ma', specialite: 'Développement Web', departement: 'Génie Informatique' },
            { nom: 'Bennani', prenom: 'Karim', email: 'karim.bennani@hestim.ma', specialite: 'Algorithmique', departement: 'Génie Informatique' },
            { nom: 'Benali', prenom: 'Ahmed', email: 'ahmed.benali@hestim.ma', specialite: 'Réseaux', departement: 'Génie Informatique' },
            { nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@hestim.ma', specialite: 'Programmation Orientée Objet', departement: 'Génie Informatique' },
            { nom: 'Lahlou', prenom: 'Fatima', email: 'fatima.lahlou@hestim.ma', specialite: 'Technologies Web Avancées', departement: 'Génie Informatique' },
            // Enseignants pour les cours de 4ème année
            { nom: 'El Fassi', prenom: 'Hassan', email: 'hassan.elfassi@hestim.ma', specialite: 'Systèmes d\'exploitation', departement: 'Génie Informatique' },
            { nom: 'Tazi', prenom: 'Fatima', email: 'fatima.tazi@hestim.ma', specialite: 'Intelligence Artificielle', departement: 'Génie Informatique' },
            { nom: 'Cherkaoui', prenom: 'Nadia', email: 'nadia.cherkaoui@hestim.ma', specialite: 'Sécurité Informatique', departement: 'Génie Informatique' },
            { nom: 'Amrani', prenom: 'Youssef', email: 'youssef.amrani@hestim.ma', specialite: 'Cloud Computing', departement: 'Génie Informatique' },
            { nom: 'Bouazza', prenom: 'Sara', email: 'sara.bouazza@hestim.ma', specialite: 'Big Data', departement: 'Génie Informatique' },
        ];

        const enseignants = [];
        for (const enseignantData of enseignantsData) {
            const [enseignantUser, enseignantCreated] = await Users.findOrCreate({
                where: { email: enseignantData.email },
                defaults: {
                    nom: enseignantData.nom,
                    prenom: enseignantData.prenom,
                    email: enseignantData.email,
                    password_hash: defaultPassword,
                    role: 'enseignant',
                    telephone: '+212 6XX XXX XXX',
                    actif: true,
                },
            });

            if (enseignantCreated) {
                const existingEnseignant = await Enseignant.findByPk(enseignantUser.id_user);
                if (!existingEnseignant) {
                    await Enseignant.create({
                        id_user: enseignantUser.id_user,
                        specialite: enseignantData.specialite,
                        departement: enseignantData.departement,
                    });
                }
                console.log('✅ Enseignant créé:', enseignantUser.email);
            } else {
                console.log('ℹ️  Enseignant existe déjà:', enseignantUser.email);
            }
            enseignants.push(enseignantUser);
        }
        const enseignantUser = enseignants[0]; // Garder le premier pour les références

        // 3. Créer des filières
        const filieresData = [
            { code_filiere: 'GI', nom_filiere: 'Génie Informatique', description: 'Filière de génie informatique' },
            { code_filiere: 'GE', nom_filiere: 'Génie Électrique', description: 'Filière de génie électrique' },
            { code_filiere: 'GC', nom_filiere: 'Génie Civil', description: 'Filière de génie civil' },
        ];

        const filieres = [];
        for (const filiereData of filieresData) {
            const [filiere, created] = await Filiere.findOrCreate({
                where: { nom_filiere: filiereData.nom_filiere },
                defaults: filiereData,
            });
            filieres.push(filiere);
            if (created) {
                console.log('✅ Filière créée:', filiere.nom_filiere);
            }
        }
        const filiereGI = filieres[0]; // Garder la première pour les références

        // 4. Créer des groupes
        const currentYear = new Date().getFullYear();
        const anneeScolaire = `${currentYear}-${currentYear + 1}`;
        const groupesData = [
            { nom_groupe: 'GI-3A', id_filiere: filiereGI.id_filiere, niveau: '3ème année', effectif: 30 },
            { nom_groupe: 'GI-3B', id_filiere: filiereGI.id_filiere, niveau: '3ème année', effectif: 28 },
            { nom_groupe: 'GI-4A', id_filiere: filiereGI.id_filiere, niveau: '4ème année', effectif: 25 },
            { nom_groupe: 'GI-4B', id_filiere: filiereGI.id_filiere, niveau: '4ème année', effectif: 22 },
        ];

        const groupes = [];
        for (const groupeData of groupesData) {
            const [groupe, created] = await Groupe.findOrCreate({
                where: { nom_groupe: groupeData.nom_groupe },
                defaults: {
                    ...groupeData,
                    annee_scolaire: anneeScolaire,
                },
            });
            groupes.push(groupe);
            if (created) {
                console.log('✅ Groupe créé:', groupe.nom_groupe);
            }
        }
        const groupeGI3A = groupes[0]; // Garder le premier pour les références

        // 5. Créer des étudiants (plus d'étudiants pour chaque groupe)
        const etudiantsData = [];
        const prenoms = ['Sophie', 'Youssef', 'Laila', 'Omar', 'Amina', 'Mehdi', 'Fatima', 'Hassan', 'Nadia', 'Karim', 'Sara', 'Ahmed', 'Imane', 'Yassine', 'Salma'];
        const noms = ['Martin', 'Benjelloun', 'Tazi', 'Bennani', 'Cherkaoui', 'Alaoui', 'Idrissi', 'El Fassi', 'Bensaid', 'Amrani', 'Lahlou', 'Bouazza', 'Tahiri', 'Mekouar', 'Bouhaddou'];
        
        let etudiantIndex = 1;
        for (let i = 0; i < groupes.length; i++) {
            const groupe = groupes[i];
            const nombreEtudiants = Math.min(groupe.effectif, 10); // Limiter à 10 étudiants par groupe pour le seed
            for (let j = 0; j < nombreEtudiants; j++) {
                const prenom = prenoms[(etudiantIndex - 1) % prenoms.length];
                const nom = noms[(etudiantIndex - 1) % noms.length];
                etudiantsData.push({
                    nom,
                    prenom,
                    email: `etudiant${etudiantIndex}@hestim.ma`,
                    numero_etudiant: `ETU${String(etudiantIndex).padStart(3, '0')}`,
                    id_groupe: groupe.id_groupe,
                });
                etudiantIndex++;
            }
        }

        const etudiants = [];
        for (const etudiantData of etudiantsData) {
            const [etudiantUser, etudiantCreated] = await Users.findOrCreate({
                where: { email: etudiantData.email },
                defaults: {
                    nom: etudiantData.nom,
                    prenom: etudiantData.prenom,
                    email: etudiantData.email,
                    password_hash: defaultPassword,
                    role: 'etudiant',
                    telephone: '+212 6XX XXX XXX',
                    actif: true,
                },
            });

            if (etudiantCreated) {
                const existingEtudiant = await Etudiant.findByPk(etudiantUser.id_user);
                if (!existingEtudiant) {
                    await Etudiant.create({
                        id_user: etudiantUser.id_user,
                        numero_etudiant: etudiantData.numero_etudiant,
                        id_groupe: etudiantData.id_groupe,
                        niveau: '3ème année',
                    });
                    // Créer l'appartenance au groupe
                    await Appartenir.findOrCreate({
                        where: {
                            id_user_etudiant: etudiantUser.id_user,
                            id_groupe: etudiantData.id_groupe,
                        },
                        defaults: {
                            id_user_etudiant: etudiantUser.id_user,
                            id_groupe: etudiantData.id_groupe,
                        },
                    });
                }
                console.log('✅ Étudiant créé:', etudiantUser.email);
            } else {
                console.log('ℹ️  Étudiant existe déjà:', etudiantUser.email);
            }
            etudiants.push(etudiantUser);
        }
        const etudiantUser = etudiants[0]; // Garder le premier pour les références

        // 6. Créer des salles
        const sallesData = [
            { nom_salle: 'Salle A101', type_salle: 'Amphithéâtre', capacite: 100, batiment: 'A', etage: 1 },
            { nom_salle: 'Salle A102', type_salle: 'Amphithéâtre', capacite: 80, batiment: 'A', etage: 1 },
            { nom_salle: 'Salle A201', type_salle: 'Amphithéâtre', capacite: 120, batiment: 'A', etage: 2 },
            { nom_salle: 'Salle B205', type_salle: 'Salle de cours', capacite: 30, batiment: 'B', etage: 2 },
            { nom_salle: 'Salle B206', type_salle: 'Salle de cours', capacite: 35, batiment: 'B', etage: 2 },
            { nom_salle: 'Salle B207', type_salle: 'Salle de cours', capacite: 32, batiment: 'B', etage: 2 },
            { nom_salle: 'Salle B208', type_salle: 'Salle de cours', capacite: 28, batiment: 'B', etage: 2 },
            { nom_salle: 'Labo Info 1', type_salle: 'Laboratoire', capacite: 25, batiment: 'C', etage: 1 },
            { nom_salle: 'Labo Info 2', type_salle: 'Laboratoire', capacite: 25, batiment: 'C', etage: 1 },
            { nom_salle: 'Labo Info 3', type_salle: 'Laboratoire', capacite: 30, batiment: 'C', etage: 1 },
            { nom_salle: 'Salle C301', type_salle: 'Salle de cours', capacite: 40, batiment: 'C', etage: 3 },
            { nom_salle: 'Salle C302', type_salle: 'Salle de cours', capacite: 38, batiment: 'C', etage: 3 },
            { nom_salle: 'Salle C303', type_salle: 'Salle de cours', capacite: 35, batiment: 'C', etage: 3 },
        ];

        const salles = [];
        for (const salleData of sallesData) {
            const [salle, created] = await Salle.findOrCreate({
                where: { nom_salle: salleData.nom_salle },
                defaults: {
                    ...salleData,
                    disponible: true,
                },
            });
            salles.push(salle);
            if (created) {
                console.log('✅ Salle créée:', salle.nom_salle);
            }
        }

        // 7. Créer des créneaux selon les horaires de l'école
        // Matin : 09h00-10h45, pause, 11h00-12h30
        // Après-midi : 13h30-17h00 (sauf vendredi : 14h00-17h30)
        // Vendredi spécial : pause 11h00-11h15
        const creneauxData = [
            // Lundi
            { jour_semaine: 'lundi', heure_debut: '09:00', heure_fin: '10:45', duree_minutes: 105 },
            { jour_semaine: 'lundi', heure_debut: '11:00', heure_fin: '12:30', duree_minutes: 90 },
            { jour_semaine: 'lundi', heure_debut: '13:30', heure_fin: '15:00', duree_minutes: 90 },
            { jour_semaine: 'lundi', heure_debut: '15:15', heure_fin: '17:00', duree_minutes: 105 },
            // Mardi
            { jour_semaine: 'mardi', heure_debut: '09:00', heure_fin: '10:45', duree_minutes: 105 },
            { jour_semaine: 'mardi', heure_debut: '11:00', heure_fin: '12:30', duree_minutes: 90 },
            { jour_semaine: 'mardi', heure_debut: '13:30', heure_fin: '15:00', duree_minutes: 90 },
            { jour_semaine: 'mardi', heure_debut: '15:15', heure_fin: '17:00', duree_minutes: 105 },
            // Mercredi
            { jour_semaine: 'mercredi', heure_debut: '09:00', heure_fin: '10:45', duree_minutes: 105 },
            { jour_semaine: 'mercredi', heure_debut: '11:00', heure_fin: '12:30', duree_minutes: 90 },
            { jour_semaine: 'mercredi', heure_debut: '13:30', heure_fin: '15:00', duree_minutes: 90 },
            { jour_semaine: 'mercredi', heure_debut: '15:15', heure_fin: '17:00', duree_minutes: 105 },
            // Jeudi
            { jour_semaine: 'jeudi', heure_debut: '09:00', heure_fin: '10:45', duree_minutes: 105 },
            { jour_semaine: 'jeudi', heure_debut: '11:00', heure_fin: '12:30', duree_minutes: 90 },
            { jour_semaine: 'jeudi', heure_debut: '13:30', heure_fin: '15:00', duree_minutes: 90 },
            { jour_semaine: 'jeudi', heure_debut: '15:15', heure_fin: '17:00', duree_minutes: 105 },
            // Vendredi (horaires spéciaux)
            { jour_semaine: 'vendredi', heure_debut: '09:00', heure_fin: '10:45', duree_minutes: 105 },
            { jour_semaine: 'vendredi', heure_debut: '11:15', heure_fin: '12:30', duree_minutes: 75 }, // Pause 11h00-11h15
            { jour_semaine: 'vendredi', heure_debut: '14:00', heure_fin: '15:30', duree_minutes: 90 },
            { jour_semaine: 'vendredi', heure_debut: '15:45', heure_fin: '17:30', duree_minutes: 105 },
        ];

        const creneaux = [];
        for (const creneauData of creneauxData) {
            // Calculer la durée en minutes si non fournie
            if (!creneauData.duree_minutes) {
                const [debutH, debutM] = creneauData.heure_debut.split(':').map(Number);
                const [finH, finM] = creneauData.heure_fin.split(':').map(Number);
                const debutMinutes = debutH * 60 + debutM;
                const finMinutes = finH * 60 + finM;
                creneauData.duree_minutes = finMinutes - debutMinutes;
            }

            const [creneau, created] = await Creneau.findOrCreate({
                where: {
                    jour_semaine: creneauData.jour_semaine,
                    heure_debut: creneauData.heure_debut,
                    heure_fin: creneauData.heure_fin,
                },
                defaults: creneauData,
            });
            creneaux.push(creneau);
            if (created) {
                console.log('✅ Créneau créé:', creneau.jour_semaine, creneau.heure_debut);
            }
        }

        // 8. Créer des cours (plus de cours pour chaque niveau)
        const coursData = [
            // Cours pour 3ème année
            {
                code_cours: 'BD001',
                nom_cours: 'Base de données',
                id_filiere: filiereGI.id_filiere,
                niveau: '3ème année',
                volume_horaire: 30,
                type_cours: 'Cours magistral',
                semestre: 'S5',
            },
            {
                code_cours: 'DW002',
                nom_cours: 'Développement Web',
                id_filiere: filiereGI.id_filiere,
                niveau: '3ème année',
                volume_horaire: 40,
                type_cours: 'TP',
                semestre: 'S5',
            },
            {
                code_cours: 'ALG003',
                nom_cours: 'Algorithmique',
                id_filiere: filiereGI.id_filiere,
                niveau: '3ème année',
                volume_horaire: 35,
                type_cours: 'Cours magistral',
                semestre: 'S5',
            },
            {
                code_cours: 'RES004',
                nom_cours: 'Réseaux',
                id_filiere: filiereGI.id_filiere,
                niveau: '3ème année',
                volume_horaire: 30,
                type_cours: 'Cours magistral',
                semestre: 'S5',
            },
            {
                code_cours: 'POO005',
                nom_cours: 'Programmation Orientée Objet',
                id_filiere: filiereGI.id_filiere,
                niveau: '3ème année',
                volume_horaire: 40,
                type_cours: 'TP',
                semestre: 'S5',
            },
            {
                code_cours: 'WEB006',
                nom_cours: 'Technologies Web Avancées',
                id_filiere: filiereGI.id_filiere,
                niveau: '3ème année',
                volume_horaire: 35,
                type_cours: 'Cours magistral',
                semestre: 'S5',
            },
            // Cours pour 4ème année
            {
                code_cours: 'SE005',
                nom_cours: 'Systèmes d\'exploitation',
                id_filiere: filiereGI.id_filiere,
                niveau: '4ème année',
                volume_horaire: 35,
                type_cours: 'Cours magistral',
                semestre: 'S7',
            },
            {
                code_cours: 'IA006',
                nom_cours: 'Intelligence Artificielle',
                id_filiere: filiereGI.id_filiere,
                niveau: '4ème année',
                volume_horaire: 40,
                type_cours: 'TP',
                semestre: 'S7',
            },
            {
                code_cours: 'SEC007',
                nom_cours: 'Sécurité Informatique',
                id_filiere: filiereGI.id_filiere,
                niveau: '4ème année',
                volume_horaire: 30,
                type_cours: 'Cours magistral',
                semestre: 'S7',
            },
            {
                code_cours: 'CLOUD008',
                nom_cours: 'Cloud Computing',
                id_filiere: filiereGI.id_filiere,
                niveau: '4ème année',
                volume_horaire: 35,
                type_cours: 'Cours magistral',
                semestre: 'S7',
            },
            {
                code_cours: 'BIGDATA009',
                nom_cours: 'Big Data',
                id_filiere: filiereGI.id_filiere,
                niveau: '4ème année',
                volume_horaire: 40,
                type_cours: 'TP',
                semestre: 'S7',
            },
        ];

        const cours = [];
        for (const coursItem of coursData) {
            const [coursItemCreated, created] = await Cours.findOrCreate({
                where: { code_cours: coursItem.code_cours },
                defaults: coursItem,
            });
            cours.push(coursItemCreated);
            if (created) {
                console.log('✅ Cours créé:', coursItemCreated.nom_cours);
            }
        }

        // 9. Créer des disponibilités pour les enseignants pour le mois de février
        // Définir les dates pour février (année en cours ou prochaine)
        const yearForFebruary = new Date().getFullYear();
        const februaryStart = new Date(yearForFebruary, 1, 1); // 1er février (mois 1 = février en JS)
        const februaryEnd = new Date(yearForFebruary, 1, 28); // 28 février (gère les années bissextiles)
        
        // Si février est déjà passé cette année, utiliser février de l'année prochaine
        const today = new Date();
        if (februaryStart < today) {
            februaryStart.setFullYear(yearForFebruary + 1);
            februaryEnd.setFullYear(yearForFebruary + 1);
        }
        
        const dateDebutFevrier = februaryStart.toISOString().split('T')[0];
        const dateFinFevrier = februaryEnd.toISOString().split('T')[0];
        
        console.log(`📅 Création des disponibilités pour février ${februaryStart.getFullYear()}: ${dateDebutFevrier} au ${dateFinFevrier}`);
        
        // Créer des disponibilités pour tous les enseignants sur tous les créneaux pour février
        const disponibilitesData = [];
        for (const enseignant of enseignants) {
            for (const creneau of creneaux) {
                disponibilitesData.push({
                    id_user_enseignant: enseignant.id_user,
                    id_creneau: creneau.id_creneau,
                    disponible: true,
                    date_debut: dateDebutFevrier,
                    date_fin: dateFinFevrier,
                });
            }
        }
        
        // Ajouter quelques indisponibilités pour rendre le test plus réaliste
        // Enseignant indisponible le mercredi après-midi (créneau 10) pendant la deuxième semaine
        const mercrediSemaine2 = new Date(februaryStart);
        mercrediSemaine2.setDate(februaryStart.getDate() + 7 + 2); // Mercredi de la 2ème semaine
        
        // Trouver le créneau du mercredi après-midi (14:00-16:00)
        const creneauMercrediApresMidi = creneaux.find(c => 
            c.jour_semaine === 'mercredi' && 
            c.heure_debut === '14:00' && 
            c.heure_fin === '16:00'
        );
        
        if (creneauMercrediApresMidi) {
            disponibilitesData.push({
                id_user_enseignant: enseignants[2].id_user, // Karim Bennani
                id_creneau: creneauMercrediApresMidi.id_creneau,
                disponible: false,
                raison_indisponibilite: 'Formation',
                date_debut: mercrediSemaine2.toISOString().split('T')[0],
                date_fin: mercrediSemaine2.toISOString().split('T')[0], // Un seul jour
            });
        }
        
        // Enseignant indisponible le vendredi matin (créneau 14) pendant la troisième semaine
        const vendrediSemaine3 = new Date(februaryStart);
        vendrediSemaine3.setDate(februaryStart.getDate() + 14 + 4); // Vendredi de la 3ème semaine
        
        // Trouver le créneau du vendredi matin (08:00-10:00)
        const creneauVendrediMatin = creneaux.find(c => 
            c.jour_semaine === 'vendredi' && 
            c.heure_debut === '08:00' && 
            c.heure_fin === '10:00'
        );
        
        if (creneauVendrediMatin) {
            disponibilitesData.push({
                id_user_enseignant: enseignants[5].id_user, // Fatima Lahlou
                id_creneau: creneauVendrediMatin.id_creneau,
                disponible: false,
                raison_indisponibilite: 'Congé personnel',
                date_debut: vendrediSemaine3.toISOString().split('T')[0],
                date_fin: vendrediSemaine3.toISOString().split('T')[0], // Un seul jour
            });
        }

        for (const dispoData of disponibilitesData) {
            const [dispo, created] = await Disponibilite.findOrCreate({
                where: {
                    id_user_enseignant: dispoData.id_user_enseignant,
                    id_creneau: dispoData.id_creneau,
                    date_debut: dispoData.date_debut,
                    date_fin: dispoData.date_fin,
                },
                defaults: dispoData,
            });
            if (created) {
                const enseignant = enseignants.find(e => e.id_user === dispo.id_user_enseignant);
                const creneau = creneaux.find(c => c.id_creneau === dispo.id_creneau);
                const status = dispo.disponible ? '✅ Disponible' : '❌ Indisponible';
                if (dispo.disponible) {
                    // Ne logger que les indisponibilités pour éviter trop de logs
                } else {
                    console.log(`${status} - ${enseignant?.prenom} ${enseignant?.nom}: ${creneau?.jour_semaine} ${creneau?.heure_debut}-${creneau?.heure_fin} (${dispo.date_debut} au ${dispo.date_fin})`);
                }
            }
        }
        
        console.log(`\n✅ ${disponibilitesData.filter(d => d.disponible).length} disponibilités créées pour ${enseignants.length} enseignants sur ${creneaux.length} créneaux pour février ${februaryStart.getFullYear()}`);
        console.log(`   ${disponibilitesData.filter(d => !d.disponible).length} indisponibilités ajoutées pour rendre les tests plus réalistes\n`);
        
        console.log(`\n✅ ${disponibilitesData.filter(d => d.disponible).length} disponibilités créées pour ${enseignants.length} enseignants sur ${creneaux.length} créneaux pour février ${februaryStart.getFullYear()}`);
        console.log(`   ${disponibilitesData.filter(d => !d.disponible).length} indisponibilités ajoutées pour rendre les tests plus réalistes\n`);

        // 10. Créer des affectations
        const nextMonday = new Date(today);
        const daysUntilMonday = (1 + 7 - nextMonday.getDay()) % 7;
        nextMonday.setDate(today.getDate() + (daysUntilMonday || 7));
        const nextTuesday = new Date(nextMonday);
        nextTuesday.setDate(nextMonday.getDate() + 1);
        const nextWednesday = new Date(nextMonday);
        nextWednesday.setDate(nextMonday.getDate() + 2);

        const affectationsData = [
            {
                date_seance: nextMonday.toISOString().split('T')[0],
                statut: 'planifie',
                id_cours: cours[0].id_cours,
                id_groupe: groupeGI3A.id_groupe,
                id_user_enseignant: enseignants[0].id_user,
                id_salle: salles[0].id_salle,
                id_creneau: creneaux[0].id_creneau,
                id_user_admin: admin.id_user,
                commentaire: 'Première séance du cours',
            },
            {
                date_seance: nextTuesday.toISOString().split('T')[0],
                statut: 'confirme',
                id_cours: cours[1].id_cours,
                id_groupe: groupeGI3A.id_groupe,
                id_user_enseignant: enseignants[1].id_user,
                id_salle: salles[2].id_salle,
                id_creneau: creneaux[3].id_creneau,
                id_user_admin: admin.id_user,
            },
            {
                date_seance: nextWednesday.toISOString().split('T')[0],
                statut: 'planifie',
                id_cours: cours[2].id_cours,
                id_groupe: groupes[1].id_groupe,
                id_user_enseignant: enseignants[2].id_user,
                id_salle: salles[4].id_salle,
                id_creneau: creneaux[6].id_creneau,
                id_user_admin: admin.id_user,
            },
            {
                date_seance: nextMonday.toISOString().split('T')[0],
                statut: 'planifie',
                id_cours: cours[3].id_cours,
                id_groupe: groupes[2].id_groupe,
                id_user_enseignant: enseignants[3].id_user,
                id_salle: salles[1].id_salle,
                id_creneau: creneaux[1].id_creneau,
                id_user_admin: admin.id_user,
            },
        ];

        const affectations = [];
        for (const affectationData of affectationsData) {
            const [affectation, created] = await Affectation.findOrCreate({
                where: {
                    date_seance: affectationData.date_seance,
                    id_cours: affectationData.id_cours,
                    id_groupe: affectationData.id_groupe,
                    id_creneau: affectationData.id_creneau,
                },
                defaults: affectationData,
            });
            affectations.push(affectation);
            if (created) {
                console.log('✅ Affectation créée pour le', affectation.date_seance);
            }
        }

        // 11. Créer des demandes de report
        const nouvelleDate = new Date(nextTuesday);
        nouvelleDate.setDate(nextTuesday.getDate() + 3);

        const demandesReportData = [
            {
                id_user_enseignant: enseignants[0].id_user,
                id_affectation: affectations[0].id_affectation,
                motif: 'Empêchement personnel',
                nouvelle_date: nouvelleDate.toISOString().split('T')[0],
                statut_demande: 'en_attente',
            },
            {
                id_user_enseignant: enseignants[2].id_user,
                id_affectation: affectations[2].id_affectation,
                motif: 'Formation',
                nouvelle_date: nouvelleDate.toISOString().split('T')[0],
                statut_demande: 'en_attente',
            },
        ];

        for (const demandeData of demandesReportData) {
            const [demande, created] = await DemandeReport.findOrCreate({
                where: {
                    id_user_enseignant: demandeData.id_user_enseignant,
                    id_affectation: demandeData.id_affectation,
                },
                defaults: demandeData,
            });
            if (created) {
                console.log('✅ Demande de report créée');
            }
        }

        // 12. Créer des notifications de test
        const notificationsData = [
            {
                id_user: enseignants[0].id_user,
                titre: 'Bienvenue sur HESTIM Planner',
                message: 'Votre compte a été créé avec succès. Vous pouvez maintenant consulter vos affectations.',
                type_notification: 'success',
                lue: false,
            },
            {
                id_user: etudiants[0].id_user,
                titre: 'Nouvelle affectation',
                message: 'Une nouvelle séance a été planifiée pour votre groupe.',
                type_notification: 'info',
                lue: false,
            },
            {
                id_user: admin.id_user,
                titre: 'Système opérationnel',
                message: 'Le système de gestion des emplois du temps est maintenant opérationnel.',
                type_notification: 'info',
                lue: true,
            },
        ];

        for (const notifData of notificationsData) {
            const [notif, created] = await Notification.findOrCreate({
                where: {
                    id_user: notifData.id_user,
                    titre: notifData.titre,
                },
                defaults: notifData,
            });
            if (created) {
                console.log('✅ Notification créée pour utilisateur:', notif.id_user);
            }
        }

        console.log('\n🎉 Seed terminé avec succès !\n');
        console.log('📋 Comptes de test créés :');
        console.log('   👨‍💼 Admins:');
        console.log('      Email: admin@hestim.ma / admin2@hestim.ma');
        console.log('      Mot de passe: password123');
        console.log('   👨‍🏫 Enseignants:');
        console.log('      Emails:');
        enseignants.forEach((ens, index) => {
            console.log(`         ${index + 1}. ${ens.email} (${ens.prenom} ${ens.nom}) - ${ens.specialite || 'Informatique'}`);
        });
        console.log('      Mot de passe: password123');
        console.log('   👨‍🎓 Étudiants:');
        console.log('      Email: etudiant@hestim.ma / etudiant2@hestim.ma / etudiant3@hestim.ma / etudiant4@hestim.ma / etudiant5@hestim.ma');
        console.log('      Mot de passe: password123');
        console.log('\n📊 Données créées :');
        console.log(`   - ${filieres.length} filière(s)`);
        console.log(`   - ${groupes.length} groupe(s)`);
        console.log(`   - ${salles.length} salle(s)`);
        console.log(`   - ${creneaux.length} créneau(x)`);
        console.log(`   - ${enseignants.length} enseignant(s)`);
        console.log(`   - ${cours.length} cours`);
        console.log(`   - ${affectations.length} affectation(s)`);
        console.log(`   - ${demandesReportData.length} demande(s) de report`);
        console.log(`   - ${notificationsData.length} notification(s)`);
        console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants !\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du seed:', error);
        process.exit(1);
    }
}

// Exécuter le seed
seed();

