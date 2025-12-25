-- =====================================================
-- Script SQL pour insertion des données fictives
-- HESTIM Planner - Données de test
-- =====================================================
-- 
-- IMPORTANT : 
-- 1. Exécutez ce script dans l'ordre indiqué
-- 2. Les IDs sont gérés automatiquement (AUTO_INCREMENT)
-- 3. Assurez-vous que les tables existent avant d'exécuter
-- 4. Ce script peut être exécuté via phpMyAdmin
--
-- =====================================================

-- Désactiver temporairement les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. UTILISATEURS (Users)
-- =====================================================

-- Admin
INSERT INTO `Users` (`nom`, `prenom`, `email`, `password_hash`, `role`, `telephone`, `actif`, `avatar_url`) 
VALUES ('Admin', 'System', 'admin@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'admin', '+212612345678', 1, NULL);

-- Enseignants
INSERT INTO `Users` (`nom`, `prenom`, `email`, `password_hash`, `role`, `telephone`, `actif`, `avatar_url`) 
VALUES 
('Alami', 'Ahmed', 'ahmed.alami@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'enseignant', '+212612345679', 1, NULL),
('Bennani', 'Fatima', 'fatima.bennani@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'enseignant', '+212612345680', 1, NULL),
('Chraibi', 'Mohammed', 'mohammed.chraibi@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'enseignant', '+212612345681', 1, NULL);

-- Étudiants
INSERT INTO `Users` (`nom`, `prenom`, `email`, `password_hash`, `role`, `telephone`, `actif`, `avatar_url`) 
VALUES 
('Dari', 'Youssef', 'youssef.dari@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'etudiant', '+212612345682', 1, NULL),
('El Amrani', 'Sara', 'sara.elamrani@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'etudiant', '+212612345683', 1, NULL),
('Fassi', 'Karim', 'karim.fassi@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'etudiant', '+212612345684', 1, NULL),
('Ghazi', 'Amine', 'amine.ghazi@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'etudiant', '+212612345685', 1, NULL),
('Idrissi', 'Laila', 'laila.idrissi@hestim.ma', '$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX', 'etudiant', '+212612345686', 1, NULL);

-- =====================================================
-- 2. FILIÈRES (Filiere)
-- =====================================================

INSERT INTO `Filiere` (`code_filiere`, `nom_filiere`, `description`) 
VALUES 
('GI', 'Génie Informatique', 'Formation en ingénierie informatique avec spécialisation en développement logiciel, systèmes d''information et réseaux informatiques. Préparation aux métiers de l''informatique et du numérique.'),
('GC', 'Génie Civil', 'Formation en ingénierie civile avec spécialisation en construction, infrastructure et travaux publics. Préparation aux métiers du BTP et de l''aménagement urbain.'),
('GEM', 'Génie Électromécanique', 'Formation en ingénierie électromécanique combinant les compétences en électricité et mécanique. Préparation aux métiers de la maintenance industrielle et de l''automatisation.'),
('GE', 'Génie Énergétique', 'Formation en ingénierie énergétique avec spécialisation en énergies renouvelables et efficacité énergétique. Préparation aux métiers de la transition énergétique.');

-- =====================================================
-- 3. SALLES (Salles)
-- =====================================================

INSERT INTO `Salles` (`nom_salle`, `type_salle`, `capacite`, `batiment`, `etage`, `equipements`, `disponible`) 
VALUES 
('A101', 'Amphithéâtre', 150, 'Bâtiment A', 1, 'Vidéoprojecteur HD, Tableau numérique interactif, Système audio professionnel, Wi-Fi', 1),
('A102', 'Amphithéâtre', 120, 'Bâtiment A', 1, 'Vidéoprojecteur, Tableau blanc, Système audio', 1),
('B205', 'Salle de cours', 50, 'Bâtiment B', 2, 'Vidéoprojecteur, Tableau blanc, Wi-Fi', 1),
('B206', 'Salle de cours', 45, 'Bâtiment B', 2, 'Vidéoprojecteur, Tableau blanc', 1),
('B207', 'Salle de TD', 35, 'Bâtiment B', 2, 'Tableau blanc', 0),
('LAB-301', 'Laboratoire', 30, 'Bâtiment A', 3, 'Ordinateurs (30 postes), Serveur, Équipements techniques spécialisés, Wi-Fi haut débit', 1),
('LAB-302', 'Laboratoire', 25, 'Bâtiment A', 3, 'Ordinateurs (25 postes), Serveur, Équipements de réseau', 1),
('C101', 'Salle de réunion', 20, 'Bâtiment B', 1, 'Vidéoprojecteur, Tableau blanc, Système de visioconférence', 1);

-- =====================================================
-- 4. CRÉNEAUX HORAIRES (Creneaux)
-- =====================================================

INSERT INTO `Creneaux` (`jour_semaine`, `heure_debut`, `heure_fin`, `periode`, `duree_minutes`) 
VALUES 
('lundi', '08:00:00', '10:00:00', 'Matin', 120),
('lundi', '10:15:00', '12:15:00', 'Matin', 120),
('lundi', '14:00:00', '16:00:00', 'Après-midi', 120),
('lundi', '16:15:00', '18:15:00', 'Après-midi', 120),
('mardi', '08:00:00', '10:00:00', 'Matin', 120),
('mardi', '10:15:00', '12:15:00', 'Matin', 120),
('mardi', '14:00:00', '16:00:00', 'Après-midi', 120),
('mercredi', '08:00:00', '12:00:00', 'Matin', 240),
('mercredi', '14:00:00', '18:00:00', 'Après-midi', 240),
('jeudi', '08:00:00', '10:00:00', 'Matin', 120),
('jeudi', '10:15:00', '12:15:00', 'Matin', 120),
('jeudi', '14:00:00', '16:00:00', 'Après-midi', 120),
('vendredi', '08:00:00', '12:00:00', 'Matin', 240);

-- =====================================================
-- 5. ENSEIGNANTS (Enseignants)
-- =====================================================
-- Note: Les id_user correspondent aux IDs des utilisateurs créés précédemment
-- id_user 2 = Alami Ahmed
-- id_user 3 = Bennani Fatima
-- id_user 4 = Chraibi Mohammed

INSERT INTO `Enseignants` (`id_user`, `specialite`, `departement`, `grade`, `bureau`) 
VALUES 
(2, 'Informatique', 'Département Informatique', 'Professeur', 'B201'),
(3, 'Génie Civil', 'Département Génie Civil', 'Maître de Conférences', 'A305'),
(4, 'Électromécanique', 'Département Électromécanique', 'Professeur Associé', 'C401');

-- =====================================================
-- 6. GROUPES (Groupes)
-- =====================================================
-- Note: id_filiere 1 = GI, 2 = GC, 3 = GEM

INSERT INTO `Groupes` (`nom_groupe`, `niveau`, `effectif`, `annee_scolaire`, `id_filiere`) 
VALUES 
('GI-3A', '3ème année', 45, '2024-2025', 1),
('GI-3B', '3ème année', 42, '2024-2025', 1),
('GI-2A', '2ème année', 50, '2024-2025', 1),
('GC-2A', '2ème année', 38, '2024-2025', 2),
('GEM-3A', '3ème année', 35, '2024-2025', 3);

-- =====================================================
-- 7. COURS (Cours)
-- =====================================================
-- Note: id_filiere 1 = GI, 2 = GC, 3 = GEM

-- Cours Génie Informatique
INSERT INTO `Cours` (`code_cours`, `nom_cours`, `niveau`, `volume_horaire`, `type_cours`, `semestre`, `coefficient`, `id_filiere`) 
VALUES 
('GI301', 'Architecture des systèmes', '3ème année', 60, 'Cours magistral', 'S1', 4.5, 1),
('GI302', 'Développement web avancé', '3ème année', 80, 'TP', 'S1', 5.0, 1),
('GI303', 'Base de données avancées', '3ème année', 60, 'Cours magistral', 'S1', 4.0, 1),
('GI304', 'Intelligence artificielle', '3ème année', 70, 'Cours magistral', 'S1', 5.5, 1),
('GI305', 'Réseaux et sécurité', '3ème année', 65, 'Cours magistral', 'S1', 4.5, 1),
('GI201', 'Algorithmique avancée', '2ème année', 75, 'Cours magistral', 'S1', 5.0, 1);

-- Cours Génie Civil
INSERT INTO `Cours` (`code_cours`, `nom_cours`, `niveau`, `volume_horaire`, `type_cours`, `semestre`, `coefficient`, `id_filiere`) 
VALUES 
('GC201', 'Résistance des matériaux', '2ème année', 70, 'Cours magistral', 'S1', 6.0, 2),
('GC202', 'Structures métalliques', '2ème année', 60, 'Cours magistral', 'S1', 5.0, 2);

-- Cours Génie Électromécanique
INSERT INTO `Cours` (`code_cours`, `nom_cours`, `niveau`, `volume_horaire`, `type_cours`, `semestre`, `coefficient`, `id_filiere`) 
VALUES 
('GEM301', 'Automatisme industriel', '3ème année', 80, 'TP', 'S1', 5.5, 3),
('GEM302', 'Maintenance industrielle', '3ème année', 65, 'Cours magistral', 'S1', 4.5, 3);

-- =====================================================
-- 8. ÉTUDIANTS (Etudiants)
-- =====================================================
-- Note: Les id_user correspondent aux IDs des étudiants créés précédemment
-- id_user 5 = Dari Youssef
-- id_user 6 = El Amrani Sara
-- id_user 7 = Fassi Karim
-- id_user 8 = Ghazi Amine
-- id_user 9 = Idrissi Laila

INSERT INTO `Etudiants` (`id_user`, `numero_etudiant`, `niveau`, `date_inscription`) 
VALUES 
(5, 'GI2024-001', '3ème année', '2024-09-01'),
(6, 'GI2024-002', '3ème année', '2024-09-01'),
(7, 'GI2024-003', '3ème année', '2024-09-01'),
(8, 'GI2023-001', '2ème année', '2023-09-01'),
(9, 'GC2023-001', '2ème année', '2023-09-01');

-- =====================================================
-- 9. AFFECTATIONS (Affectations)
-- =====================================================
-- Note: 
-- id_cours: 1=GI301, 2=GI302, 3=GI303, 4=GI304, 5=GI305, 7=GC201, 8=GC202
-- id_groupe: 1=GI-3A, 2=GI-3B, 3=GI-2A, 4=GC-2A
-- id_user_enseignant: 2=Alami, 3=Bennani
-- id_salle: 1=A101, 2=A102, 3=B205, 6=LAB-301, 7=LAB-302
-- id_creneau: 1=lundi 08:00-10:00, 2=lundi 10:15-12:15, 5=mardi 08:00-10:00, 8=mercredi 08:00-12:00, 10=jeudi 08:00-10:00
-- id_user_admin: 1=Admin

INSERT INTO `Affectations` (`date_seance`, `statut`, `commentaire`, `id_cours`, `id_groupe`, `id_user_enseignant`, `id_salle`, `id_creneau`, `id_user_admin`) 
VALUES 
('2024-10-15', 'planifie', 'Premier cours du semestre - Présentation du module', 1, 1, 2, 1, 1, 1),
('2024-10-15', 'planifie', 'TP - Développement d''applications web', 2, 1, 2, 6, 2, 1),
('2024-10-16', 'planifie', NULL, 3, 2, 2, 3, 5, 1),
('2024-10-17', 'confirme', 'Cours confirmé par l''enseignant', 4, 1, 2, 1, 8, 1),
('2024-10-18', 'planifie', 'TP en laboratoire - Réseaux', 5, 2, 2, 7, 10, 1),
('2024-10-15', 'planifie', 'Cours Génie Civil', 7, 4, 3, 2, 1, 1),
('2024-10-16', 'planifie', NULL, 8, 4, 3, 3, 5, 1);

-- =====================================================
-- 10. APPARTENANCES (Appartenir)
-- =====================================================
-- Note: 
-- id_user_etudiant: 5=Dari, 6=El Amrani, 7=Fassi, 8=Ghazi, 9=GC étudiant
-- id_groupe: 1=GI-3A, 2=GI-3B, 3=GI-2A, 4=GC-2A

INSERT INTO `Appartenir` (`id_user_etudiant`, `id_groupe`) 
VALUES 
(5, 1),
(6, 1),
(7, 2),
(8, 3),
(9, 4);

-- =====================================================
-- 11. DISPONIBILITÉS (Disponibilites)
-- =====================================================
-- Note:
-- id_user_enseignant: 2=Alami, 3=Bennani
-- id_creneau: 1=lundi 08:00-10:00, 5=mardi 08:00-10:00

INSERT INTO `Disponibilites` (`disponible`, `raison_indisponibilite`, `date_debut`, `date_fin`, `id_user_enseignant`, `id_creneau`) 
VALUES 
(1, NULL, '2024-10-01', '2024-12-31', 2, 1),
(0, 'Congé personnel', '2024-11-15', '2024-11-20', 2, 1),
(1, NULL, '2024-10-01', '2024-12-31', 3, 5);

-- =====================================================
-- 12. DEMANDES DE REPORT (DemandeReports)
-- =====================================================
-- Note:
-- id_user_enseignant: 2=Alami, 3=Bennani
-- id_affectation: 1, 2, 6 (selon l'ordre d'insertion)

INSERT INTO `DemandeReports` (`motif`, `nouvelle_date`, `statut_demande`, `id_user_enseignant`, `id_affectation`) 
VALUES 
('Indisponibilité pour raison personnelle - Décès dans la famille', '2024-10-22', 'en_attente', 2, 1),
('Conférence internationale - Participation obligatoire', '2024-10-25', 'en_attente', 2, 2),
('Maladie - Certificat médical fourni', '2024-10-29', 'approuve', 3, 6);

-- =====================================================
-- 13. NOTIFICATIONS (Notifications)
-- =====================================================
-- Note:
-- id_user: 2=Alami, 5=Dari

INSERT INTO `Notifications` (`titre`, `message`, `type_notification`, `lue`, `id_user`) 
VALUES 
('Nouvelle affectation', 'Vous avez une nouvelle séance planifiée pour le 15 octobre 2024 à 08:00', 'info', 0, 2),
('Demande de report approuvée', 'Votre demande de report pour la séance du 15 octobre a été approuvée. Nouvelle date : 22 octobre 2024', 'success', 0, 2),
('Conflit détecté', 'Un conflit de salle a été détecté pour votre affectation du 15 octobre. Veuillez contacter l''administration.', 'warning', 0, 2),
('Affectation annulée', 'La séance du 18 octobre a été annulée', 'error', 1, 2),
('Bienvenue sur HESTIM Planner', 'Votre compte a été créé avec succès. Bienvenue sur la plateforme de planification des cours.', 'info', 0, 5);

-- =====================================================
-- 14. CONFLITS (Conflits)
-- =====================================================

INSERT INTO `Conflits` (`type_conflit`, `description`, `date_detection`, `resolu`, `date_resolution`) 
VALUES 
('salle', 'Deux cours planifiés dans la même salle (A101) au même créneau (lundi 08:00-10:00) le 15 octobre', '2024-10-01', 0, NULL),
('enseignant', 'Un enseignant a deux cours planifiés au même moment (lundi 08:00-10:00)', '2024-10-01', 1, '2024-10-02'),
('groupe', 'Un groupe a deux cours planifiés au même moment (mercredi 08:00-12:00)', '2024-10-01', 0, NULL);

-- =====================================================
-- 15. CONFLITS-AFFECTATIONS (ConflitAffectations)
-- =====================================================
-- Note: Associer les affectations aux conflits
-- id_conflit: 1, 2, 3 (selon l'ordre d'insertion)
-- id_affectation: selon les affectations créées

-- Pour le conflit de salle (id_conflit=1), on associe les affectations en conflit
-- Pour le conflit d'enseignant (id_conflit=2), on associe les affectations en conflit
-- Pour le conflit de groupe (id_conflit=3), on associe les affectations en conflit
-- Note: Les IDs exacts dépendent de l'ordre d'insertion, ajustez selon vos besoins

INSERT INTO `ConflitAffectations` (`id_conflit`, `id_affectation`) 
VALUES 
(1, 1),
(1, 6),
(2, 1),
(2, 6),
(3, 4);

-- =====================================================
-- 16. HISTORIQUE DES AFFECTATIONS (HistoriqueAffectations)
-- =====================================================
-- Note:
-- id_affectation: 1, 3 (selon l'ordre d'insertion)
-- id_user: 1=Admin, 2=Alami

INSERT INTO `HistoriqueAffectations` (`action`, `date_action`, `anciens_donnees`, `nouveaux_donnees`, `commentaire`, `id_affectation`, `id_user`) 
VALUES 
('creation', '2024-10-01 10:00:00', NULL, '{"date_seance":"2024-10-15","statut":"planifie","id_cours":1,"id_groupe":1}', 'Création initiale de l''affectation', 1, 1),
('modification', '2024-10-02 14:30:00', '{"statut":"planifie","id_salle":1}', '{"statut":"confirme","id_salle":2}', 'Modification de la salle et confirmation par l''enseignant', 1, 2),
('suppression', '2024-10-03 09:15:00', '{"date_seance":"2024-10-20","id_cours":3}', NULL, 'Suppression suite à annulation du cours', 3, 1);

-- =====================================================
-- Réactiver les vérifications de clés étrangères
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- 
-- Vérifications recommandées après insertion :
-- 
-- SELECT COUNT(*) FROM Users;           -- Devrait retourner 9
-- SELECT COUNT(*) FROM Filiere;         -- Devrait retourner 4
-- SELECT COUNT(*) FROM Salles;          -- Devrait retourner 8
-- SELECT COUNT(*) FROM Creneaux;        -- Devrait retourner 13
-- SELECT COUNT(*) FROM Enseignants;     -- Devrait retourner 3
-- SELECT COUNT(*) FROM Etudiants;       -- Devrait retourner 5
-- SELECT COUNT(*) FROM Groupes;         -- Devrait retourner 5
-- SELECT COUNT(*) FROM Cours;            -- Devrait retourner 10
-- SELECT COUNT(*) FROM Affectations;    -- Devrait retourner 7
-- SELECT COUNT(*) FROM Appartenir;      -- Devrait retourner 5
-- SELECT COUNT(*) FROM Disponibilites;  -- Devrait retourner 3
-- SELECT COUNT(*) FROM DemandeReports;  -- Devrait retourner 3
-- SELECT COUNT(*) FROM Notifications;   -- Devrait retourner 5
-- SELECT COUNT(*) FROM Conflits;        -- Devrait retourner 3
-- SELECT COUNT(*) FROM ConflitAffectations; -- Devrait retourner 5
-- SELECT COUNT(*) FROM HistoriqueAffectations; -- Devrait retourner 3
--
-- =====================================================

