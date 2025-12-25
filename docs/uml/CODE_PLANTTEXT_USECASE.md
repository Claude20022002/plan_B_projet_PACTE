@startuml
left to right direction

'==========================
' Acteurs
'==========================
actor "Étudiant" as Etudiant
actor "Enseignant" as Enseignant
actor "Administrateur" as Admin


'==========================
' heritages (Décomposition)
'==========================
     'Acteurs
Enseignant --|> Etudiant
Admin --|> Enseignant

 

'==========================
'rectangles
'==========================
rectangle Notification {
   (Recevoir des notifications)
   (Consulter historique de notification)
 
}
rectangle Consultation {
   (Consulter emploi du temps)
   (Exporter emploi du temps)
   'heritage de filter
   (Filtrer) <|-- (Prof)
  (Filtrer) <|-- (Groupes)
  (Filtrer) <|-- (Salle)
}

rectangle réservation {
   (Créer une réservation)
   (Rechercher salles disponibles)
   (Modifier une réservation)
   (Annuler une réservation)
}

rectangle Statistique {
  (Visualiser taux d'occupation)
  (Générer rapport)
  
}
rectangle disponibilité {
  (Gérer ses disponibilité)
  (Consulter disponibilité enseignant)
  
}

rectangle gestion{
  (Gestion des Cours)
  (Gestion des Groupe)
  (Gestion des Utilisateurs)
  (Gestion des Salles)
  (Étudiant)
  (Professeur)
}




' ==========================
' Cas d'utilisation Étudiant
'==========================
Etudiant --> (Consulter emploi du temps)
Etudiant --> (Recevoir des notifications)
Etudiant --> (Consulter historique de notification)
Etudiant --> (Rechercher salles disponibles)

' Extensions liés à l'emploi du temps
(Consulter emploi du temps) <|-- (Exporter emploi du temps) : <<extend>>
(Consulter emploi du temps) <|-- (Filtrer) : <<extend>>


'==========================
' Cas d'utilisation Enseignant
'==========================
Enseignant --> (Créer une réservation)
Enseignant --> (Modifier une réservation)
Enseignant --> (Annuler une réservation)
Enseignant --> (Gérer ses disponibilité)

rectangle Planification {
(Détecter les conflits automatiquement)
(Résoudre un conflit)
  'Planifier
(Planifier) <|-- (Manuellement)
(Planifier) <|-- (Automatiquement)
  
}
    

'==========================
' Cas d'utilisation Administrateur
'==========================
Admin --> (Visualiser taux d'occupation)
Admin --> (Générer rapport)
Admin --> (Consulter disponibilité enseignant)
Admin --> (Résoudre un conflit)
Admin --> (Planifier)
Admin --> (Gestion des Salles)
Admin --> (Gestion des Utilisateurs)
Admin --> (Gestion des Groupe)
Admin --> (Gestion des Cours)

' Extensions liés à Planifier
(Planifier) --> (Détecter les conflits automatiquement) : <<include>>


'==========================
' Décomposition utilisateurs (héritage)
'==========================
(Gestion des Utilisateurs) <|-- (Étudiant)
(Gestion des Utilisateurs) <|-- (Professeur)


