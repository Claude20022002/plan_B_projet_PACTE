import dotenv from 'dotenv';
import sequelize, { testConnection } from './config/db.js';
import './models/index.js'; // Import pour initialiser les relations
import { Users, Enseignant, Etudiant, Filiere, Groupe, Salle, Cours, Creneau } from './models/index.js';
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
            console.log('✅ Tables vérifiées/créées');
        } catch (error) {
            console.error('⚠️  Erreur lors de la vérification des tables:', error.message);
            console.log('💡 Astuce: Si les tables existent déjà, vous pouvez ignorer cette erreur');
        }

        // Hasher le mot de passe par défaut
        const defaultPassword = await hashPassword('password123');

        // 1. Créer un administrateur
        const [admin, adminCreated] = await Users.findOrCreate({
            where: { email: 'admin@hestim.ma' },
            defaults: {
                nom: 'Admin',
                prenom: 'HESTIM',
                email: 'admin@hestim.ma',
                password_hash: defaultPassword,
                role: 'admin',
                telephone: '+212 6XX XXX XXX',
                actif: true,
            },
        });

        if (adminCreated) {
            console.log('✅ Administrateur créé:', admin.email);
        } else {
            console.log('ℹ️  Administrateur existe déjà:', admin.email);
        }

        // 2. Créer un enseignant
        const [enseignantUser, enseignantCreated] = await Users.findOrCreate({
            where: { email: 'enseignant@hestim.ma' },
            defaults: {
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'enseignant@hestim.ma',
                password_hash: defaultPassword,
                role: 'enseignant',
                telephone: '+212 6XX XXX XXX',
                actif: true,
            },
        });

        if (enseignantCreated) {
            // Vérifier si l'enseignant n'existe pas déjà
            const existingEnseignant = await Enseignant.findByPk(enseignantUser.id_user);
            if (!existingEnseignant) {
                await Enseignant.create({
                    id_user: enseignantUser.id_user,
                    specialite: 'Informatique',
                    departement: 'Génie Informatique',
                });
            }
            console.log('✅ Enseignant créé:', enseignantUser.email);
        } else {
            console.log('ℹ️  Enseignant existe déjà:', enseignantUser.email);
        }

        // 3. Créer un étudiant
        const [etudiantUser, etudiantCreated] = await Users.findOrCreate({
            where: { email: 'etudiant@hestim.ma' },
            defaults: {
                nom: 'Martin',
                prenom: 'Sophie',
                email: 'etudiant@hestim.ma',
                password_hash: defaultPassword,
                role: 'etudiant',
                telephone: '+212 6XX XXX XXX',
                actif: true,
            },
        });

        if (etudiantCreated) {
            // Créer une filière pour l'étudiant
            const [filiere] = await Filiere.findOrCreate({
                where: { nom_filiere: 'Génie Informatique' },
                defaults: {
                    code_filiere: 'GI',
                    nom_filiere: 'Génie Informatique',
                    description: 'Filière de génie informatique',
                },
            });

            // Créer un groupe
            const currentYear = new Date().getFullYear();
            const anneeScolaire = `${currentYear}-${currentYear + 1}`;
            const [groupe] = await Groupe.findOrCreate({
                where: { nom_groupe: 'GI-3A' },
                defaults: {
                    nom_groupe: 'GI-3A',
                    id_filiere: filiere.id_filiere,
                    niveau: '3ème année',
                    annee_scolaire: anneeScolaire,
                    effectif: 30,
                },
            });

            // Vérifier si l'étudiant n'existe pas déjà
            const existingEtudiant = await Etudiant.findByPk(etudiantUser.id_user);
            if (!existingEtudiant) {
                await Etudiant.create({
                    id_user: etudiantUser.id_user,
                    numero_etudiant: 'ETU001',
                    id_groupe: groupe.id_groupe,
                    niveau: '3ème année',
                });
            }
            console.log('✅ Étudiant créé:', etudiantUser.email);
        } else {
            console.log('ℹ️  Étudiant existe déjà:', etudiantUser.email);
        }

        // 4. Créer quelques salles de test
        const salles = [
            { nom_salle: 'Salle A101', type_salle: 'Amphithéâtre', capacite: 100, batiment: 'A', etage: 1 },
            { nom_salle: 'Salle B205', type_salle: 'Salle de cours', capacite: 30, batiment: 'B', etage: 2 },
            { nom_salle: 'Labo Info 1', type_salle: 'Laboratoire', capacite: 25, batiment: 'C', etage: 1 },
        ];

        for (const salleData of salles) {
            const [salle, created] = await Salle.findOrCreate({
                where: { nom_salle: salleData.nom_salle },
                defaults: {
                    ...salleData,
                    disponible: true,
                },
            });
            if (created) {
                console.log('✅ Salle créée:', salle.nom_salle);
            }
        }

        // 5. Créer quelques créneaux de test
        const creneaux = [
            { jour_semaine: 'lundi', heure_debut: '08:00', heure_fin: '10:00', duree_minutes: 120 },
            { jour_semaine: 'lundi', heure_debut: '10:15', heure_fin: '12:15', duree_minutes: 120 },
            { jour_semaine: 'mardi', heure_debut: '08:00', heure_fin: '10:00', duree_minutes: 120 },
            { jour_semaine: 'mercredi', heure_debut: '14:00', heure_fin: '16:00', duree_minutes: 120 },
        ];

        for (const creneauData of creneaux) {
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
            if (created) {
                console.log('✅ Créneau créé:', creneau.jour_semaine, creneau.heure_debut);
            }
        }

        // 6. Créer quelques cours de test
        const [filiereGI] = await Filiere.findOrCreate({
            where: { nom_filiere: 'Génie Informatique' },
            defaults: {
                code_filiere: 'GI',
                nom_filiere: 'Génie Informatique',
                description: 'Filière de génie informatique',
            },
        });

        const cours = [
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
        ];

        for (const coursData of cours) {
            const [cours, created] = await Cours.findOrCreate({
                where: { code_cours: coursData.code_cours },
                defaults: coursData,
            });
            if (created) {
                console.log('✅ Cours créé:', cours.nom_cours);
            }
        }

        console.log('\n🎉 Seed terminé avec succès !\n');
        console.log('📋 Comptes de test créés :');
        console.log('   👨‍💼 Admin:');
        console.log('      Email: admin@hestim.ma');
        console.log('      Mot de passe: password123');
        console.log('   👨‍🏫 Enseignant:');
        console.log('      Email: enseignant@hestim.ma');
        console.log('      Mot de passe: password123');
        console.log('   👨‍🎓 Étudiant:');
        console.log('      Email: etudiant@hestim.ma');
        console.log('      Mot de passe: password123');
        console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants !\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du seed:', error);
        process.exit(1);
    }
}

// Exécuter le seed
seed();

