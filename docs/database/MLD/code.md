@startuml MLD_HESTIM_COMPLET
!theme plain
title Modèle Logique de Données - HESTIM Planning

'==================== STYLES ====================

skinparam class {
BorderColor Black
ArrowColor #333333
FontSize 11
}

' --- Couleurs par stéréotype ---
skinparam class<<users>> {
BackgroundColor #E1F5FE
BorderColor #0277BD
}
skinparam class<<enseignants>> {
BackgroundColor #B3E5FC
BorderColor #0288D1
}
skinparam class<<etudiants>> {
BackgroundColor #F8BBD0
BorderColor #C2185B
}
skinparam class<<reference>> {
BackgroundColor #F3E5F5
BorderColor #6A1B9A
}
skinparam class<<core>> {
BackgroundColor #FFECB3
BorderColor #FF6F00
FontStyle bold
}
skinparam class<<association>> {
BackgroundColor #FFE0B2
BorderColor #E64A19
}
skinparam class<<historique>> {
BackgroundColor #D7CCC8
BorderColor #5D4037
FontStyle italic
}

'==================== TABLES UTILISATEURS ====================

class users <<users>> {
**PK** id_user : INT AUTO_INCREMENT
----
nom : VARCHAR(100) NOT NULL
prenom : VARCHAR(100) NOT NULL
**UK** email : VARCHAR(255) UNIQUE
password_hash : VARCHAR(255) NOT NULL
role : ENUM('admin','enseignant','etudiant')
telephone : VARCHAR(20)
avatar_url : VARCHAR(500)
actif : BOOLEAN DEFAULT TRUE
----
created_at : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at : TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
====
INDEX: idx_email, idx_role
}

class enseignants <<enseignants>> {
**PK/FK** id_enseignant : INT
----
specialite : VARCHAR(100)
departement : VARCHAR(100)
grade : ENUM('Professeur','Maitre-Assistant','Assistant','Vacataire')
bureau : VARCHAR(50)
----
**CONSTRAINT** fk_enseignant_user
FOREIGN KEY (id_enseignant) REFERENCES users(id_user)
ON DELETE CASCADE
}

class etudiants <<etudiants>> {
**PK/FK** id_etudiant : INT
----
**UK** numero_etudiant : VARCHAR(20) UNIQUE
**FK** id_groupe : INT NOT NULL
niveau : ENUM('1A','2A','3A','4A','5A')
date_inscription : DATE
----
**CONSTRAINT** fk_etudiant_user
FOREIGN KEY (id_etudiant) REFERENCES users(id_user) ON DELETE CASCADE
**CONSTRAINT** fk_etudiant_groupe
FOREIGN KEY (id_groupe) REFERENCES groupes(id_groupe) ON DELETE RESTRICT
====
INDEX: idx_groupe, idx_niveau
}

'==================== TABLES DE RÉFÉRENCE ====================

class filieres <<reference>> {
**PK** id_filiere : INT AUTO_INCREMENT
----
nom_filiere : VARCHAR(100) NOT NULL
**UK** code_filiere : VARCHAR(20) UNIQUE
description : TEXT
----
created_at : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}

class groupes <<reference>> {
**PK** id_groupe : INT AUTO_INCREMENT
----
nom_groupe : VARCHAR(50) NOT NULL
niveau : ENUM('1A','2A','3A','4A','5A')
effectif : INT DEFAULT 0
**FK** id_filiere : INT NOT NULL
annee_scolaire : VARCHAR(20) NOT NULL
----
created_at : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
**UK** UNIQUE (nom_groupe, annee_scolaire)
**CONSTRAINT** fk_groupe_filiere
FOREIGN KEY (id_filiere) REFERENCES filieres(id_filiere)
ON DELETE RESTRICT
====
INDEX: idx_filiere, idx_annee
}

class salles <<reference>> {
**PK** id_salle : INT AUTO_INCREMENT
----
**UK** nom_salle : VARCHAR(50) UNIQUE
type_salle : ENUM('amphi','informatique','standard','labo','atelier')
capacite : INT NOT NULL
batiment : VARCHAR(50)
etage : INT
equipements : JSON
disponible : BOOLEAN DEFAULT TRUE
----
created_at : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
====
INDEX: idx_type, idx_capacite
}

class cours <<reference>> {
**PK** id_cours : INT AUTO_INCREMENT
----
nom_cours : VARCHAR(150) NOT NULL
**UK** code_cours : VARCHAR(20) UNIQUE
**FK** id_filiere : INT NOT NULL
niveau : ENUM('1A','2A','3A','4A','5A')
volume_horaire : INT
type_cours : ENUM('CM','TD','TP','Projet')
semestre : ENUM('S1','S2')
coefficient : INT
----
created_at : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
**CONSTRAINT** fk_cours_filiere
FOREIGN KEY (id_filiere) REFERENCES filieres(id_filiere)
ON DELETE RESTRICT
====
INDEX: idx_filiere, idx_niveau
}

class creneaux <<reference>> {
**PK** id_creneau : INT AUTO_INCREMENT
----
jour_semaine : ENUM('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi')
heure_debut : TIME NOT NULL
heure_fin : TIME NOT NULL
periode : ENUM('matin','apres-midi','soir')
duree_minutes : INT GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, heure_debut, heure_fin))
**UK** UNIQUE (jour_semaine, heure_debut, heure_fin)
====
INDEX: idx_jour_heure
}

'==================== TABLE CENTRALE ====================

class reservations <<core>> {
**PK** id_reservation : INT AUTO_INCREMENT
----
**FK** id_cours : INT NOT NULL
**FK** id_enseignant : INT NOT NULL
**FK** id_salle : INT NOT NULL
**FK** id_groupe : INT NOT NULL
**FK** id_creneau : INT NOT NULL
date_seance : DATE NOT NULL
statut : ENUM('confirmee','en_attente','annulee','reportee') DEFAULT 'confirmee'
commentaire : TEXT
----
created_at : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at : TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
**FK** created_by : INT NOT NULL
**CONSTRAINTS:**
FK: id_cours → cours.id_cours
FK: id_enseignant → enseignants.id_enseignant
FK: id_salle → salles.id_salle
FK: id_groupe → groupes.id_groupe
FK: id_creneau → creneaux.id_creneau
FK: created_by → users.id_user
----
**UK** UNIQUE (id_salle, id_creneau, date_seance, statut)
====
INDEX: idx_date_seance, idx_statut, idx_composite (date_seance, id_creneau)
}

'==================== TABLES ASSOCIATIVES ====================

class conflits <<association>> {
**PK** id_conflit : INT AUTO_INCREMENT
----
**FK** id_reservation_1 : INT NOT NULL
**FK** id_reservation_2 : INT NOT NULL
type_conflit : ENUM('salle','enseignant','groupe','multiple')
description : TEXT
date_detection : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
resolu : BOOLEAN DEFAULT FALSE
date_resolution : TIMESTAMP NULL
**FK** resolu_par : INT NULL
**CONSTRAINTS:**
FK: id_reservation_1 → reservations.id_reservation
FK: id_reservation_2 → reservations.id_reservation
FK: resolu_par → users.id_user
CHECK: id_reservation_1 < id_reservation_2
====
INDEX: idx_resolu, idx_type
}

class disponibilites_enseignants <<association>> {
**PK** id_disponibilite : INT AUTO_INCREMENT
----
**FK** id_enseignant : INT NOT NULL
**FK** id_creneau : INT NOT NULL
disponible : BOOLEAN DEFAULT TRUE
raison_indisponibilite : VARCHAR(255)
date_debut : DATE NOT NULL
date_fin : DATE NOT NULL
**CONSTRAINTS:**
FK: id_enseignant → enseignants.id_enseignant
FK: id_creneau → creneaux.id_creneau
**UK** UNIQUE (id_enseignant, id_creneau, date_debut)
CHECK: date_fin >= date_debut
====
INDEX: idx_enseignant_dates
}

class notifications <<association>> {
**PK** id_notification : INT AUTO_INCREMENT
----
**FK** id_user : INT NOT NULL
titre : VARCHAR(150) NOT NULL
message : TEXT NOT NULL
type_notification : ENUM('modification','annulation','nouveau_cours','conflit','rappel')
lue : BOOLEAN DEFAULT FALSE
date_envoi : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
**CONSTRAINT** fk_notification_user
FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
====
INDEX: idx_user_lue, idx_date_envoi
}

'==================== TABLE HISTORIQUE ====================

class historique_reservations <<historique>> {
**PK** id_historique : INT AUTO_INCREMENT
----
**FK** id_reservation : INT NOT NULL
**FK** id_user : INT NULL
action : ENUM('création','modification','suppression') NOT NULL
anciens_donnees : JSON
nouveaux_donnees : JSON
commentaire_action : TEXT
date_action : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
**CONSTRAINTS:**
FK: id_reservation → reservations.id_reservation
FK: id_user → users.id_user
====
INDEX: idx_reservation_action, idx_date_action
}

'==================== RELATIONS ====================

users "1" -down- "0..1" enseignants : ▲
users "1" -down- "0..1" etudiants : ▲
filieres "1" -right- "0.._" groupes
filieres "1" -down- "0.._" cours
groupes "1" -down- "0.._" etudiants
cours "1" -down- "0.._" reservations
enseignants "1" -down- "0.._" reservations
salles "1" -down- "0.._" reservations
groupes "1" -down- "0.._" reservations
creneaux "1" -down- "0.._" reservations
users "1" ..down.. "0.._" reservations : created_by
reservations "1" -right- "0.._" conflits : res_1/res_2
users "1" ..right.. "0.._" conflits : resolu_par
enseignants "1" -down- "0.._" disponibilites_enseignants
creneaux "1" -down- "0.._" disponibilites_enseignants
users "1" -down- "0.._" notifications
reservations "1" -down- "0.._" historique_reservations
users "1" -down- "0.._" historique_reservations

note right of historique_reservations
**Traçabilité des réservations**

-   Garde l’historique des modifications
-   Lie la réservation modifiée à l’utilisateur responsable
    end note

@enduml
