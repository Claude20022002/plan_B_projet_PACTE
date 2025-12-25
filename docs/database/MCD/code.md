@startuml MCD_HESTIM_PLANNING
!theme plain
title Modèle Conceptuel de Données — HESTIM Planning

'==================== STYLE ====================
skinparam class {
BorderColor Black
FontSize 11
FontStyle plain
}
skinparam class<<Entité>> {
BackgroundColor #E8F5E9
}

skinparam class<<Association>> {
BackgroundColor #FFE4B5
BorderColor #FF8C00
FontStyle bold
}
'==================== ENTITÉS ====================

class User <<Entité>> {
<u>id_user</u>
nom
prenom
email
password_hash
role
telephone
actif
avatar_url
}

class Enseignant <<Entité>> {
specialite
departement
grade
bureau
}

class Etudiant <<Entité>> {
numero_etudiant
niveau
date_inscription
}

class Filiere <<Entité>> {
<u>id_filiere</u>
code_filiere
nom_filiere
description
}

class Groupe <<Entité>> {
<u>id_groupe</u>
nom_groupe
niveau
effectif
annee_scolaire
}

class Salle <<Entité>> {
<u>id_salle</u>
nom_salle
type_salle
capacite
batiment
etage
equipements
disponible
}

class Cours <<Entité>> {
<u>id_cours</u>
code_cours
nom_cours
niveau
volume_horaire
type_cours
semestre
coefficient
}

class Creneau <<Entité>> {
<u>id_creneau</u>
jour_semaine
heure_debut
heure_fin
periode
duree_minutes
}

class Affectation <<Entité>> {
<u>id_affectation</u>
date_seance
statut
commentaire
}

class DemandeReport <<Entité>> {
<u>id_demande</u>
date_demande
motif
nouvelle_date
statut_demande
}

class Conflit <<Entité>> {
<u>id_conflit</u>
type_conflit
description
date_detection
resolu
date_resolution
}

class Notification <<Entité>> {
<u>id_notification</u>
titre
message
type_notification
lue
date_envoi
}

class HistoriqueAffectation <<Entité>> {
<u>id_historique</u>
action
date_action
anciens_donnees
nouveaux_donnees
commentaire
}

'==================== HÉRITAGE ====================
User <|-- Enseignant
User <|-- Etudiant

'==================== ASSOCIATIONS (avec cardinalités lisibles dans les 2 sens) ====================

' APPARTENIR (Etudiant - Groupe)
class APPARTENIR <<Association>>
Etudiant "1,1" -- APPARTENIR
APPARTENIR -- "1,n" Groupe
' Lecture : pour 1 Étudiant -> 1 Groupe ; pour 1 Groupe -> 1..n Étudiants

' CONTENIR (Filiere - Groupe)
class CONTENIR <<Association>>
Filiere "1,1" -- CONTENIR
CONTENIR -- "1,n" Groupe
' Lecture : pour 1 Filière -> 1..n Groupes ; pour 1 Groupe -> 1 Filière

' PROPOSER (Filiere - Cours)
class PROPOSER <<Association>>
Filiere "1,1" -- PROPOSER
PROPOSER -- "1,n" Cours
' Lecture : pour 1 Filière -> 1..n Cours ; pour 1 Cours -> 1 Filière

' DISPONIBILITE (Enseignant - Creneau) avec attributs
class DISPONIBILITE <<Association>> {
disponible
raison_indisponibilite
date_debut
date_fin
}
Enseignant "0,n" -- DISPONIBILITE
DISPONIBILITE -- "1,1" Creneau
' Lecture : pour 1 Enseignant -> 0..n Créneaux de disponibilité ; pour 1 Créneau -> 0..n Enseignants

' AFFECTER (association 5-aire matérialisée par une association menant à Affectation)
class AFFECTER <<Association>>
Cours "1,n" -- AFFECTER
Groupe "1,n" -- AFFECTER
Enseignant "1,n" -- AFFECTER
Salle "1,n" -- AFFECTER
Creneau "1,n" -- AFFECTER
User "1,n" -- AFFECTER : realisée_par
AFFECTER -- "1,1" Affectation : génère
' Lectures :
' - Pour 1 Cours -> 1..n AFFECTER (un cours peut avoir plusieurs affectations / séances)
' - Pour 1 Affectation -> 1 Cours
' Même logique appliquée aux autres entités (Groupe, Enseignant, Salle, Creneau, User[admin])

' DEMANDER_REPORT (Enseignant - Affectation -> DemandeReport)
class DEMANDER_REPORT <<Association>>
Enseignant "1,1" -- DEMANDER_REPORT
DEMANDER_REPORT -- "0,n" DemandeReport
Affectation "0,1" -- DEMANDER_REPORT : concerne
' Lecture :
' - Un Enseignant peut créer plusieurs demandes -> Enseignant 1 -> 0..n DemandeReport
' - Une DemandeReport concerne exactement 1 Affectation ; une Affectation peut avoir 0..n DemandeReport
' (notation Affectation "0,1" -- DEMANDER_REPORT signifie : une demande concerne 1 affectation ; côté affectation : 0..n demandes)

' RECEVOIR (User - Notification)
class RECEVOIR <<Association>>
User "1,1" -- RECEVOIR
RECEVOIR -- "0,n" Notification
' Lecture : 1 User -> 0..n Notifications ; 1 Notification -> 1 User

' CONFLIT_ENTRE (Affectation - Affectation - Conflit)
class CONFLIT_ENTRE <<Association>>
Affectation "0,n" -- CONFLIT_ENTRE
CONFLIT_ENTRE -- "0,n" Affectation
CONFLIT_ENTRE -- "0,n" Conflit
' Lecture : une Affectation peut apparaître dans 0..n Conflit_ENTRE ; un Conflit relie 2 (ou plus) Affectations

' HISTORISER (Affectation - HistoriqueAffectation - User)
class HISTORISER <<Association>>
Affectation "1,1" -- HISTORISER
HISTORISER -- "0,n" HistoriqueAffectation
User "0,n" -- HISTORISER : modifie
' Lecture :
' - 1 Affectation -> 0..n HistoriqueAffectation
' - 1 HistoriqueAffectation -> 1 Affectation
' - 1 User (admin) -> 0..n actions historiques ; une action historique peut être liée à 0..1 user (optionnel)

'==================== NOTES / CONTRAINTES ====================

note right of User
UTILISATEURS
id_user : identifiant technique
email : clé métier unique
role ∈ {admin, enseignant, etudiant}
end note

note bottom of AFFECTER
AFFECTATION (entité forte) : matérialise la séance affectée par l'administration.
Obligatoire : cours, groupe, enseignant, salle, créneau.
Lecture des cardinalités : pour ex. Cours 1..n -> Affectation ; Affectation -> 1 Cours.
end note

note right of DemandeReport
DEMANDES DE REPORT

-   Créées par les enseignants
-   Concerne une affectation (séance)
-   Permet de proposer une nouvelle date et un motif
    end note

note bottom of CONFLIT_ENTRE
CONFLITS détectés automatiquement (même salle/créneau, même enseignant/créneau, même groupe/créneau).
Un conflit relie au moins deux affectations.
end note

note right of HistoriqueAffectation
HISTORIQUE
Trace des actions (création/modification/suppression/annulation)
Contient anciens/nouveaux états et commentaire
end note

@enduml
