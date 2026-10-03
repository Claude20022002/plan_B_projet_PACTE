CREATE TABLE IF NOT EXISTS `Affectations` (
  `id_affectation` int NOT NULL AUTO_INCREMENT,
  `date_seance` date NOT NULL,
  `statut` enum('planifie','confirme','annule','reporte') COLLATE utf8mb4_unicode_ci DEFAULT 'planifie',
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `id_cours` int NOT NULL,
  `id_groupe` int NOT NULL,
  `id_user_enseignant` int NOT NULL,
  `id_salle` int NOT NULL,
  `id_creneau` int NOT NULL,
  `id_user_admin` int NOT NULL,
  `id_snapshot` int DEFAULT NULL,
  `id_generation_session` int DEFAULT NULL,
  `is_generated` tinyint(1) DEFAULT '0',
  `score_contrib` float DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_affectation`),
  KEY `id_cours` (`id_cours`),
  KEY `id_groupe` (`id_groupe`),
  KEY `id_user_enseignant` (`id_user_enseignant`),
  KEY `id_salle` (`id_salle`),
  KEY `id_creneau` (`id_creneau`),
  KEY `id_user_admin` (`id_user_admin`),
  KEY `id_snapshot` (`id_snapshot`),
  KEY `id_generation_session` (`id_generation_session`),
  CONSTRAINT `Affectations_ibfk_1` FOREIGN KEY (`id_cours`) REFERENCES `Cours` (`id_cours`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Affectations_ibfk_2` FOREIGN KEY (`id_groupe`) REFERENCES `Groupes` (`id_groupe`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Affectations_ibfk_3` FOREIGN KEY (`id_user_enseignant`) REFERENCES `Users` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Affectations_ibfk_4` FOREIGN KEY (`id_salle`) REFERENCES `Salles` (`id_salle`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Affectations_ibfk_5` FOREIGN KEY (`id_creneau`) REFERENCES `Creneaux` (`id_creneau`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Affectations_ibfk_6` FOREIGN KEY (`id_user_admin`) REFERENCES `Users` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Affectations_ibfk_7` FOREIGN KEY (`id_snapshot`) REFERENCES `PlanningSnapshots` (`id_snapshot`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Affectations_ibfk_8` FOREIGN KEY (`id_generation_session`) REFERENCES `GenerationSessions` (`id_generation_session`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Appartenir` (
  `id_user_etudiant` int NOT NULL,
  `id_groupe` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_user_etudiant`,`id_groupe`),
  KEY `id_groupe` (`id_groupe`),
  CONSTRAINT `Appartenir_ibfk_1` FOREIGN KEY (`id_user_etudiant`) REFERENCES `Etudiants` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Appartenir_ibfk_2` FOREIGN KEY (`id_groupe`) REFERENCES `Groupes` (`id_groupe`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AuthSessions` (
  `id_auth_session` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `session_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `family_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `last_used_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `revoked_reason` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `replaced_by_token_id` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_auth_session`),
  UNIQUE KEY `refresh_token_hash` (`refresh_token_hash`),
  KEY `auth_sessions_id_user` (`id_user`),
  KEY `auth_sessions_session_id` (`session_id`),
  KEY `auth_sessions_family_id` (`family_id`),
  KEY `auth_sessions_refresh_token_hash` (`refresh_token_hash`),
  CONSTRAINT `AuthSessions_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `Users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ConflitAffectations` (
  `id_conflit_affectation` int NOT NULL AUTO_INCREMENT,
  `id_conflit` int NOT NULL,
  `id_affectation` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_conflit_affectation`),
  UNIQUE KEY `ConflitAffectations_id_conflit_id_affectation_unique` (`id_conflit`,`id_affectation`),
  KEY `id_affectation` (`id_affectation`),
  CONSTRAINT `ConflitAffectations_ibfk_1` FOREIGN KEY (`id_conflit`) REFERENCES `Conflits` (`id_conflit`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ConflitAffectations_ibfk_2` FOREIGN KEY (`id_affectation`) REFERENCES `Affectations` (`id_affectation`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Conflits` (
  `id_conflit` int NOT NULL AUTO_INCREMENT,
  `type_conflit` enum('salle','enseignant','groupe') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_detection` datetime DEFAULT NULL,
  `resolu` tinyint(1) DEFAULT '0',
  `date_resolution` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_conflit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Cours` (
  `id_cours` int NOT NULL AUTO_INCREMENT,
  `code_cours` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_cours` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `niveau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `volume_horaire` int NOT NULL,
  `type_cours` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semestre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coefficient` decimal(3,2) DEFAULT '1.00',
  `id_filiere` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_cours`),
  UNIQUE KEY `code_cours` (`code_cours`),
  KEY `id_filiere` (`id_filiere`),
  CONSTRAINT `Cours_ibfk_1` FOREIGN KEY (`id_filiere`) REFERENCES `Filiere` (`id_filiere`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Creneaux` (
  `id_creneau` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') COLLATE utf8mb4_unicode_ci NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `periode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duree_minutes` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_creneau`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DemandeReports` (
  `id_demande` int NOT NULL AUTO_INCREMENT,
  `date_demande` datetime DEFAULT NULL,
  `motif` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `nouvelle_date` date NOT NULL,
  `statut_demande` enum('en_attente','approuve','refuse') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `id_user_enseignant` int NOT NULL,
  `id_affectation` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_demande`),
  KEY `id_user_enseignant` (`id_user_enseignant`),
  KEY `id_affectation` (`id_affectation`),
  CONSTRAINT `DemandeReports_ibfk_1` FOREIGN KEY (`id_user_enseignant`) REFERENCES `Users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DemandeReports_ibfk_2` FOREIGN KEY (`id_affectation`) REFERENCES `Affectations` (`id_affectation`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Disponibilites` (
  `id_disponibilite` int NOT NULL AUTO_INCREMENT,
  `disponible` tinyint(1) DEFAULT '1',
  `raison_indisponibilite` text COLLATE utf8mb4_unicode_ci,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `id_user_enseignant` int NOT NULL,
  `id_creneau` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_disponibilite`),
  KEY `id_user_enseignant` (`id_user_enseignant`),
  KEY `id_creneau` (`id_creneau`),
  CONSTRAINT `Disponibilites_ibfk_1` FOREIGN KEY (`id_user_enseignant`) REFERENCES `Users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Disponibilites_ibfk_2` FOREIGN KEY (`id_creneau`) REFERENCES `Creneaux` (`id_creneau`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Enseignants` (
  `id_user` int NOT NULL,
  `specialite` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departement` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bureau` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_user`),
  CONSTRAINT `Enseignants_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `Users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Etudiants` (
  `id_user` int NOT NULL,
  `numero_etudiant` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `niveau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_inscription` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `numero_etudiant` (`numero_etudiant`),
  CONSTRAINT `Etudiants_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `Users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Evenements` (
  `id_evenement` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `type_evenement` enum('vacances','examen','ferie','reunion','formation','autre') COLLATE utf8mb4_unicode_ci DEFAULT 'autre',
  `bloque_affectations` tinyint(1) DEFAULT '1' COMMENT 'Si true, aucune affectation ne peut être créée pendant cet événement',
  `id_user_createur` int NOT NULL COMMENT 'Administrateur qui a créé l''événement',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_evenement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Filiere` (
  `id_filiere` int NOT NULL AUTO_INCREMENT,
  `code_filiere` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_filiere` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_filiere`),
  UNIQUE KEY `code_filiere` (`code_filiere`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `GenerationSessions` (
  `id_generation_session` int NOT NULL AUTO_INCREMENT,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `status` enum('pending','running','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `progress` int DEFAULT '0',
  `last_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `score_total` int DEFAULT NULL,
  `score_detail` json DEFAULT NULL,
  `config` json DEFAULT NULL,
  `nb_assignees` int DEFAULT '0',
  `nb_conflits` int DEFAULT '0',
  `nb_non_placees` int DEFAULT '0',
  `duration_ms` int DEFAULT NULL,
  `id_user_admin` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_generation_session`),
  KEY `id_user_admin` (`id_user_admin`),
  CONSTRAINT `GenerationSessions_ibfk_1` FOREIGN KEY (`id_user_admin`) REFERENCES `Users` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Groupes` (
  `id_groupe` int NOT NULL AUTO_INCREMENT,
  `nom_groupe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `niveau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effectif` int DEFAULT '0',
  `annee_scolaire` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_filiere` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_groupe`),
  KEY `id_filiere` (`id_filiere`),
  CONSTRAINT `Groupes_ibfk_1` FOREIGN KEY (`id_filiere`) REFERENCES `Filiere` (`id_filiere`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HistoriqueAffectations` (
  `id_historique` int NOT NULL AUTO_INCREMENT,
  `action` enum('creation','modification','suppression','annulation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_action` datetime DEFAULT NULL,
  `anciens_donnees` json DEFAULT NULL,
  `nouveaux_donnees` json DEFAULT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `id_affectation` int NOT NULL,
  `id_user` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_historique`),
  KEY `id_affectation` (`id_affectation`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `HistoriqueAffectations_ibfk_1` FOREIGN KEY (`id_affectation`) REFERENCES `Affectations` (`id_affectation`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `HistoriqueAffectations_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `Users` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Notifications` (
  `id_notification` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_notification` enum('info','warning','error','success') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `lue` tinyint(1) DEFAULT '0',
  `lien` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_envoi` datetime DEFAULT NULL,
  `id_user` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_notification`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `Notifications_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `Users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PlanningSnapshots` (
  `id_snapshot` int NOT NULL AUTO_INCREMENT,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `score_total` int DEFAULT NULL,
  `score_detail` json DEFAULT NULL,
  `nb_affectations` int DEFAULT '0',
  `nb_conflits` int DEFAULT '0',
  `id_generation_session` int DEFAULT NULL,
  `id_user_admin` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_snapshot`),
  KEY `id_generation_session` (`id_generation_session`),
  KEY `id_user_admin` (`id_user_admin`),
  CONSTRAINT `PlanningSnapshots_ibfk_1` FOREIGN KEY (`id_generation_session`) REFERENCES `GenerationSessions` (`id_generation_session`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PlanningSnapshots_ibfk_2` FOREIGN KEY (`id_user_admin`) REFERENCES `Users` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Salles` (
  `id_salle` int NOT NULL AUTO_INCREMENT,
  `nom_salle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_salle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacite` int NOT NULL,
  `batiment` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etage` int DEFAULT NULL,
  `equipements` text COLLATE utf8mb4_unicode_ci,
  `disponible` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_salle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Users` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','enseignant','etudiant') COLLATE utf8mb4_unicode_ci DEFAULT 'etudiant',
  `telephone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id_token` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id_token`),
  UNIQUE KEY `token` (`token`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `Users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
