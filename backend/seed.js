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

        // 2. Créer des enseignants
        const enseignantsData = [
            { nom: 'Dupont', prenom: 'Jean', email: 'enseignant@hestim.ma', specialite: 'Informatique', departement: 'Génie Informatique' },
            { nom: 'Benali', prenom: 'Ahmed', email: 'enseignant2@hestim.ma', specialite: 'Réseaux', departement: 'Génie Informatique' },
            { nom: 'Alaoui', prenom: 'Sanae', email: 'enseignant3@hestim.ma', specialite: 'Base de données', departement: 'Génie Informatique' },
            { nom: 'Idrissi', prenom: 'Mohamed', email: 'enseignant4@hestim.ma', specialite: 'Développement Web', departement: 'Génie Informatique' },
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

        // 5. Créer des étudiants
        const etudiantsData = [
            { nom: 'Martin', prenom: 'Sophie', email: 'etudiant@hestim.ma', numero_etudiant: 'ETU001', id_groupe: groupeGI3A.id_groupe },
            { nom: 'Benjelloun', prenom: 'Youssef', email: 'etudiant2@hestim.ma', numero_etudiant: 'ETU002', id_groupe: groupeGI3A.id_groupe },
            { nom: 'Tazi', prenom: 'Laila', email: 'etudiant3@hestim.ma', numero_etudiant: 'ETU003', id_groupe: groupes[1].id_groupe },
            { nom: 'Bennani', prenom: 'Omar', email: 'etudiant4@hestim.ma', numero_etudiant: 'ETU004', id_groupe: groupes[1].id_groupe },
            { nom: 'Cherkaoui', prenom: 'Amina', email: 'etudiant5@hestim.ma', numero_etudiant: 'ETU005', id_groupe: groupes[2].id_groupe },
        ];

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
            { nom_salle: 'Salle B205', type_salle: 'Salle de cours', capacite: 30, batiment: 'B', etage: 2 },
            { nom_salle: 'Salle B206', type_salle: 'Salle de cours', capacite: 35, batiment: 'B', etage: 2 },
            { nom_salle: 'Labo Info 1', type_salle: 'Laboratoire', capacite: 25, batiment: 'C', etage: 1 },
            { nom_salle: 'Labo Info 2', type_salle: 'Laboratoire', capacite: 25, batiment: 'C', etage: 1 },
            { nom_salle: 'Salle C301', type_salle: 'Salle de cours', capacite: 40, batiment: 'C', etage: 3 },
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

        // 7. Créer des créneaux
        const creneauxData = [
            { jour_semaine: 'lundi', heure_debut: '08:00', heure_fin: '10:00', duree_minutes: 120 },
            { jour_semaine: 'lundi', heure_debut: '10:15', heure_fin: '12:15', duree_minutes: 120 },
            { jour_semaine: 'lundi', heure_debut: '14:00', heure_fin: '16:00', duree_minutes: 120 },
            { jour_semaine: 'mardi', heure_debut: '08:00', heure_fin: '10:00', duree_minutes: 120 },
            { jour_semaine: 'mardi', heure_debut: '10:15', heure_fin: '12:15', duree_minutes: 120 },
            { jour_semaine: 'mardi', heure_debut: '14:00', heure_fin: '16:00', duree_minutes: 120 },
            { jour_semaine: 'mercredi', heure_debut: '08:00', heure_fin: '10:00', duree_minutes: 120 },
            { jour_semaine: 'mercredi', heure_debut: '14:00', heure_fin: '16:00', duree_minutes: 120 },
            { jour_semaine: 'jeudi', heure_debut: '08:00', heure_fin: '10:00', duree_minutes: 120 },
            { jour_semaine: 'jeudi', heure_debut: '10:15', heure_fin: '12:15', duree_minutes: 120 },
            { jour_semaine: 'vendredi', heure_debut: '08:00', heure_fin: '10:00', duree_minutes: 120 },
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

        // 8. Créer des cours
        const coursData = [
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

        // 9. Créer des disponibilités pour les enseignants
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const inTwoWeeks = new Date(today);
        inTwoWeeks.setDate(today.getDate() + 14);

        const disponibilitesData = [
            {
                id_user_enseignant: enseignants[0].id_user,
                id_creneau: creneaux[0].id_creneau,
                disponible: true,
                date_debut: today.toISOString().split('T')[0],
                date_fin: inTwoWeeks.toISOString().split('T')[0],
            },
            {
                id_user_enseignant: enseignants[1].id_user,
                id_creneau: creneaux[3].id_creneau,
                disponible: true,
                date_debut: today.toISOString().split('T')[0],
                date_fin: inTwoWeeks.toISOString().split('T')[0],
            },
            {
                id_user_enseignant: enseignants[2].id_user,
                id_creneau: creneaux[6].id_creneau,
                disponible: false,
                raison_indisponibilite: 'Congé',
                date_debut: nextWeek.toISOString().split('T')[0],
                date_fin: inTwoWeeks.toISOString().split('T')[0],
            },
        ];

        for (const dispoData of disponibilitesData) {
            const [dispo, created] = await Disponibilite.findOrCreate({
                where: {
                    id_user_enseignant: dispoData.id_user_enseignant,
                    id_creneau: dispoData.id_creneau,
                    date_debut: dispoData.date_debut,
                },
                defaults: dispoData,
            });
            if (created) {
                console.log('✅ Disponibilité créée pour enseignant:', dispo.id_user_enseignant);
            }
        }

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
        console.log('      Email: enseignant@hestim.ma / enseignant2@hestim.ma / enseignant3@hestim.ma / enseignant4@hestim.ma');
        console.log('      Mot de passe: password123');
        console.log('   👨‍🎓 Étudiants:');
        console.log('      Email: etudiant@hestim.ma / etudiant2@hestim.ma / etudiant3@hestim.ma / etudiant4@hestim.ma / etudiant5@hestim.ma');
        console.log('      Mot de passe: password123');
        console.log('\n📊 Données créées :');
        console.log(`   - ${filieres.length} filière(s)`);
        console.log(`   - ${groupes.length} groupe(s)`);
        console.log(`   - ${salles.length} salle(s)`);
        console.log(`   - ${creneaux.length} créneau(x)`);
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

