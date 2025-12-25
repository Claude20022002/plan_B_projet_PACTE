# 📊 Données Fictives pour Tests API

Ce fichier contient toutes les données fictives prêtes à l'emploi pour tester l'API HESTIM Planner.

## 🔢 Ordre de création recommandé

Les données doivent être créées dans cet ordre pour respecter les dépendances :

1. **Users** (sans dépendances)
2. **Filiere** (sans dépendances)
3. **Salle** (sans dépendances)
4. **Creneau** (sans dépendances)
5. **Enseignant** (dépend de Users)
6. **Etudiant** (dépend de Users)
7. **Groupe** (dépend de Filiere)
8. **Cours** (dépend de Filiere)
9. **Affectation** (dépend de Cours, Groupe, Users, Salle, Creneau)
10. **Appartenir** (dépend de Etudiant, Groupe)
11. **Disponibilite** (dépend de Users, Creneau)
12. **DemandeReport** (dépend de Users, Affectation)
13. **Notification** (dépend de Users)
14. **Conflit** (dépend de Affectation)
15. **HistoriqueAffectation** (dépend de Affectation, Users)

---

## 👤 1. Utilisateurs (Users)

### Admin

```json
{
    "nom": "Admin",
    "prenom": "System",
    "email": "admin@hestim.ma",
    "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
    "role": "admin",
    "telephone": "+212612345678",
    "actif": true,
    "avatar_url": null
}
```

### Enseignants

```json
[
    {
        "nom": "Alami",
        "prenom": "Ahmed",
        "email": "ahmed.alami@hestim.ma",
        "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
        "role": "enseignant",
        "telephone": "+212612345679",
        "actif": true,
        "avatar_url": null
    },
    {
        "nom": "Bennani",
        "prenom": "Fatima",
        "email": "fatima.bennani@hestim.ma",
        "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
        "role": "enseignant",
        "telephone": "+212612345680",
        "actif": true,
        "avatar_url": null
    },
    {
        "nom": "Chraibi",
        "prenom": "Mohammed",
        "email": "mohammed.chraibi@hestim.ma",
        "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
        "role": "enseignant",
        "telephone": "+212612345681",
        "actif": true,
        "avatar_url": null
    }
]
```

### Étudiants

```json
[
    {
        "nom": "Dari",
        "prenom": "Youssef",
        "email": "youssef.dari@hestim.ma",
        "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
        "role": "etudiant",
        "telephone": "+212612345682",
        "actif": true,
        "avatar_url": null
    },
    {
        "nom": "El Amrani",
        "prenom": "Sara",
        "email": "sara.elamrani@hestim.ma",
        "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
        "role": "etudiant",
        "telephone": "+212612345683",
        "actif": true,
        "avatar_url": null
    },
    {
        "nom": "Fassi",
        "prenom": "Karim",
        "email": "karim.fassi@hestim.ma",
        "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
        "role": "etudiant",
        "telephone": "+212612345684",
        "actif": true,
        "avatar_url": null
    },
    {
        "nom": "Ghazi",
        "prenom": "Amine",
        "email": "amine.ghazi@hestim.ma",
        "password_hash": "$2b$10$rQ4aVJ7KXzE9mY6NpLqO3eXzQ8wR5tU2vB4nH6jK8mL9pQ1sT3uV5wX",
        "role": "etudiant",
        "telephone": "+212612345685",
        "actif": true,
        "avatar_url": null
    }
]
```

---

## 📚 2. Filières

```json
[
    {
        "code_filiere": "GI",
        "nom_filiere": "Génie Informatique",
        "description": "Formation en ingénierie informatique avec spécialisation en développement logiciel, systèmes d'information et réseaux informatiques. Préparation aux métiers de l'informatique et du numérique."
    },
    {
        "code_filiere": "GC",
        "nom_filiere": "Génie Civil",
        "description": "Formation en ingénierie civile avec spécialisation en construction, infrastructure et travaux publics. Préparation aux métiers du BTP et de l'aménagement urbain."
    },
    {
        "code_filiere": "GEM",
        "nom_filiere": "Génie Électromécanique",
        "description": "Formation en ingénierie électromécanique combinant les compétences en électricité et mécanique. Préparation aux métiers de la maintenance industrielle et de l'automatisation."
    },
    {
        "code_filiere": "GE",
        "nom_filiere": "Génie Énergétique",
        "description": "Formation en ingénierie énergétique avec spécialisation en énergies renouvelables et efficacité énergétique. Préparation aux métiers de la transition énergétique."
    }
]
```

---

## 👥 3. Groupes

```json
[
    {
        "nom_groupe": "GI-3A",
        "niveau": "3ème année",
        "effectif": 45,
        "annee_scolaire": "2024-2025",
        "id_filiere": 1
    },
    {
        "nom_groupe": "GI-3B",
        "niveau": "3ème année",
        "effectif": 42,
        "annee_scolaire": "2024-2025",
        "id_filiere": 1
    },
    {
        "nom_groupe": "GI-2A",
        "niveau": "2ème année",
        "effectif": 50,
        "annee_scolaire": "2024-2025",
        "id_filiere": 1
    },
    {
        "nom_groupe": "GC-2A",
        "niveau": "2ème année",
        "effectif": 38,
        "annee_scolaire": "2024-2025",
        "id_filiere": 2
    },
    {
        "nom_groupe": "GEM-3A",
        "niveau": "3ème année",
        "effectif": 35,
        "annee_scolaire": "2024-2025",
        "id_filiere": 3
    }
]
```

---

## 🏫 4. Salles

```json
[
    {
        "nom_salle": "A101",
        "type_salle": "Amphithéâtre",
        "capacite": 150,
        "batiment": "Bâtiment A",
        "etage": 1,
        "equipements": "Vidéoprojecteur HD, Tableau numérique interactif, Système audio professionnel, Wi-Fi",
        "disponible": true
    },
    {
        "nom_salle": "A102",
        "type_salle": "Amphithéâtre",
        "capacite": 120,
        "batiment": "Bâtiment A",
        "etage": 1,
        "equipements": "Vidéoprojecteur, Tableau blanc, Système audio",
        "disponible": true
    },
    {
        "nom_salle": "B205",
        "type_salle": "Salle de cours",
        "capacite": 50,
        "batiment": "Bâtiment B",
        "etage": 2,
        "equipements": "Vidéoprojecteur, Tableau blanc, Wi-Fi",
        "disponible": true
    },
    {
        "nom_salle": "B206",
        "type_salle": "Salle de cours",
        "capacite": 45,
        "batiment": "Bâtiment B",
        "etage": 2,
        "equipements": "Vidéoprojecteur, Tableau blanc",
        "disponible": true
    },
    {
        "nom_salle": "B207",
        "type_salle": "Salle de TD",
        "capacite": 35,
        "batiment": "Bâtiment B",
        "etage": 2,
        "equipements": "Tableau blanc",
        "disponible": false
    },
    {
        "nom_salle": "LAB-301",
        "type_salle": "Laboratoire",
        "capacite": 30,
        "batiment": "Bâtiment Lab",
        "etage": 3,
        "equipements": "Ordinateurs (30 postes), Serveur, Équipements techniques spécialisés, Wi-Fi haut débit",
        "disponible": true
    },
    {
        "nom_salle": "LAB-302",
        "type_salle": "Laboratoire",
        "capacite": 25,
        "batiment": "Bâtiment Lab",
        "etage": 3,
        "equipements": "Ordinateurs (25 postes), Serveur, Équipements de réseau",
        "disponible": true
    },
    {
        "nom_salle": "C101",
        "type_salle": "Salle de réunion",
        "capacite": 20,
        "batiment": "Bâtiment C",
        "etage": 1,
        "equipements": "Vidéoprojecteur, Tableau blanc, Système de visioconférence",
        "disponible": true
    }
]
```

---

## 📖 5. Cours

### Cours Génie Informatique

```json
[
    {
        "code_cours": "GI301",
        "nom_cours": "Architecture des systèmes",
        "niveau": "3ème année",
        "volume_horaire": 60,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 4.5,
        "id_filiere": 1
    },
    {
        "code_cours": "GI302",
        "nom_cours": "Développement web avancé",
        "niveau": "3ème année",
        "volume_horaire": 80,
        "type_cours": "TP",
        "semestre": "S1",
        "coefficient": 5.0,
        "id_filiere": 1
    },
    {
        "code_cours": "GI303",
        "nom_cours": "Base de données avancées",
        "niveau": "3ème année",
        "volume_horaire": 60,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 4.0,
        "id_filiere": 1
    },
    {
        "code_cours": "GI304",
        "nom_cours": "Intelligence artificielle",
        "niveau": "3ème année",
        "volume_horaire": 70,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 5.5,
        "id_filiere": 1
    },
    {
        "code_cours": "GI305",
        "nom_cours": "Réseaux et sécurité",
        "niveau": "3ème année",
        "volume_horaire": 65,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 4.5,
        "id_filiere": 1
    },
    {
        "code_cours": "GI201",
        "nom_cours": "Algorithmique avancée",
        "niveau": "2ème année",
        "volume_horaire": 75,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 5.0,
        "id_filiere": 1
    }
]
```

### Cours Génie Civil

```json
[
    {
        "code_cours": "GC201",
        "nom_cours": "Résistance des matériaux",
        "niveau": "2ème année",
        "volume_horaire": 70,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 6.0,
        "id_filiere": 2
    },
    {
        "code_cours": "GC202",
        "nom_cours": "Structures métalliques",
        "niveau": "2ème année",
        "volume_horaire": 60,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 5.0,
        "id_filiere": 2
    }
]
```

### Cours Génie Électromécanique

```json
[
    {
        "code_cours": "GEM301",
        "nom_cours": "Automatisme industriel",
        "niveau": "3ème année",
        "volume_horaire": 80,
        "type_cours": "TP",
        "semestre": "S1",
        "coefficient": 5.5,
        "id_filiere": 3
    },
    {
        "code_cours": "GEM302",
        "nom_cours": "Maintenance industrielle",
        "niveau": "3ème année",
        "volume_horaire": 65,
        "type_cours": "Cours magistral",
        "semestre": "S1",
        "coefficient": 4.5,
        "id_filiere": 3
    }
]
```

---

## ⏰ 6. Créneaux horaires

```json
[
    {
        "jour_semaine": "lundi",
        "heure_debut": "08:00:00",
        "heure_fin": "10:00:00",
        "periode": "Matin",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "lundi",
        "heure_debut": "10:15:00",
        "heure_fin": "12:15:00",
        "periode": "Matin",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "lundi",
        "heure_debut": "14:00:00",
        "heure_fin": "16:00:00",
        "periode": "Après-midi",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "lundi",
        "heure_debut": "16:15:00",
        "heure_fin": "18:15:00",
        "periode": "Après-midi",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "mardi",
        "heure_debut": "08:00:00",
        "heure_fin": "10:00:00",
        "periode": "Matin",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "mardi",
        "heure_debut": "10:15:00",
        "heure_fin": "12:15:00",
        "periode": "Matin",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "mardi",
        "heure_debut": "14:00:00",
        "heure_fin": "16:00:00",
        "periode": "Après-midi",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "mercredi",
        "heure_debut": "08:00:00",
        "heure_fin": "12:00:00",
        "periode": "Matin",
        "duree_minutes": 240
    },
    {
        "jour_semaine": "mercredi",
        "heure_debut": "14:00:00",
        "heure_fin": "18:00:00",
        "periode": "Après-midi",
        "duree_minutes": 240
    },
    {
        "jour_semaine": "jeudi",
        "heure_debut": "08:00:00",
        "heure_fin": "10:00:00",
        "periode": "Matin",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "jeudi",
        "heure_debut": "10:15:00",
        "heure_fin": "12:15:00",
        "periode": "Matin",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "jeudi",
        "heure_debut": "14:00:00",
        "heure_fin": "16:00:00",
        "periode": "Après-midi",
        "duree_minutes": 120
    },
    {
        "jour_semaine": "vendredi",
        "heure_debut": "08:00:00",
        "heure_fin": "12:00:00",
        "periode": "Matin",
        "duree_minutes": 240
    }
]
```

---

## 🎓 7. Enseignants

**Important :** L'utilisateur doit exister avec `role: "enseignant"` avant de créer l'enseignant.

```json
[
    {
        "id_user": 2,
        "specialite": "Informatique",
        "departement": "Département Informatique",
        "grade": "Professeur",
        "bureau": "B201"
    },
    {
        "id_user": 3,
        "specialite": "Génie Civil",
        "departement": "Département Génie Civil",
        "grade": "Maître de Conférences",
        "bureau": "A305"
    },
    {
        "id_user": 4,
        "specialite": "Électromécanique",
        "departement": "Département Électromécanique",
        "grade": "Professeur Associé",
        "bureau": "C401"
    }
]
```

---

## 👨‍🎓 8. Étudiants

**Important :** L'utilisateur doit exister avec `role: "etudiant"` avant de créer l'étudiant.

```json
[
    {
        "id_user": 5,
        "numero_etudiant": "GI2024-001",
        "niveau": "3ème année",
        "date_inscription": "2024-09-01"
    },
    {
        "id_user": 6,
        "numero_etudiant": "GI2024-002",
        "niveau": "3ème année",
        "date_inscription": "2024-09-01"
    },
    {
        "id_user": 7,
        "numero_etudiant": "GI2024-003",
        "niveau": "3ème année",
        "date_inscription": "2024-09-01"
    },
    {
        "id_user": 8,
        "numero_etudiant": "GI2023-001",
        "niveau": "2ème année",
        "date_inscription": "2023-09-01"
    },
    {
        "id_user": 9,
        "numero_etudiant": "GC2023-001",
        "niveau": "2ème année",
        "date_inscription": "2023-09-01"
    }
]
```

---

## 📅 9. Affectations

**Important :** Tous les IDs référencés doivent exister (cours, groupe, enseignant, salle, créneau, admin).

```json
[
    {
        "date_seance": "2024-10-15",
        "statut": "planifie",
        "commentaire": "Premier cours du semestre - Présentation du module",
        "id_cours": 1,
        "id_groupe": 1,
        "id_user_enseignant": 2,
        "id_salle": 1,
        "id_creneau": 1,
        "id_user_admin": 1
    },
    {
        "date_seance": "2024-10-15",
        "statut": "planifie",
        "commentaire": "TP - Développement d'applications web",
        "id_cours": 2,
        "id_groupe": 1,
        "id_user_enseignant": 2,
        "id_salle": 6,
        "id_creneau": 2,
        "id_user_admin": 1
    },
    {
        "date_seance": "2024-10-16",
        "statut": "planifie",
        "commentaire": null,
        "id_cours": 3,
        "id_groupe": 2,
        "id_user_enseignant": 2,
        "id_salle": 3,
        "id_creneau": 5,
        "id_user_admin": 1
    },
    {
        "date_seance": "2024-10-17",
        "statut": "confirme",
        "commentaire": "Cours confirmé par l'enseignant",
        "id_cours": 4,
        "id_groupe": 1,
        "id_user_enseignant": 2,
        "id_salle": 1,
        "id_creneau": 8,
        "id_user_admin": 1
    },
    {
        "date_seance": "2024-10-18",
        "statut": "planifie",
        "commentaire": "TP en laboratoire - Réseaux",
        "id_cours": 5,
        "id_groupe": 2,
        "id_user_enseignant": 2,
        "id_salle": 7,
        "id_creneau": 10,
        "id_user_admin": 1
    },
    {
        "date_seance": "2024-10-15",
        "statut": "planifie",
        "commentaire": "Cours Génie Civil",
        "id_cours": 7,
        "id_groupe": 4,
        "id_user_enseignant": 3,
        "id_salle": 2,
        "id_creneau": 1,
        "id_user_admin": 1
    },
    {
        "date_seance": "2024-10-16",
        "statut": "planifie",
        "commentaire": null,
        "id_cours": 8,
        "id_groupe": 4,
        "id_user_enseignant": 3,
        "id_salle": 3,
        "id_creneau": 5,
        "id_user_admin": 1
    }
]
```

**Statuts possibles :**

-   `planifie` : Affectation planifiée (par défaut)
-   `confirme` : Confirmée par l'enseignant
-   `annule` : Annulée
-   `reporte` : Reportée à une autre date

---

## 👥 10. Appartenances (Étudiant-Groupe)

**Important :** L'étudiant et le groupe doivent exister.

```json
[
    {
        "id_user_etudiant": 5,
        "id_groupe": 1
    },
    {
        "id_user_etudiant": 6,
        "id_groupe": 1
    },
    {
        "id_user_etudiant": 7,
        "id_groupe": 2
    },
    {
        "id_user_etudiant": 8,
        "id_groupe": 3
    },
    {
        "id_user_etudiant": 9,
        "id_groupe": 4
    }
]
```

---

## 📆 11. Disponibilités

**Important :** L'enseignant et le créneau doivent exister.

```json
[
    {
        "disponible": true,
        "date_debut": "2024-10-01",
        "date_fin": "2024-12-31",
        "id_user_enseignant": 2,
        "id_creneau": 1
    },
    {
        "disponible": false,
        "raison_indisponibilite": "Congé personnel",
        "date_debut": "2024-11-15",
        "date_fin": "2024-11-20",
        "id_user_enseignant": 2,
        "id_creneau": 1
    },
    {
        "disponible": true,
        "date_debut": "2024-10-01",
        "date_fin": "2024-12-31",
        "id_user_enseignant": 3,
        "id_creneau": 5
    }
]
```

---

## 📋 12. Demandes de Report

**Important :** L'enseignant et l'affectation doivent exister.

```json
[
    {
        "motif": "Indisponibilité pour raison personnelle - Décès dans la famille",
        "nouvelle_date": "2024-10-22",
        "statut_demande": "en_attente",
        "id_user_enseignant": 2,
        "id_affectation": 1
    },
    {
        "motif": "Conférence internationale - Participation obligatoire",
        "nouvelle_date": "2024-10-25",
        "statut_demande": "en_attente",
        "id_user_enseignant": 2,
        "id_affectation": 2
    },
    {
        "motif": "Maladie - Certificat médical fourni",
        "nouvelle_date": "2024-10-29",
        "statut_demande": "approuve",
        "id_user_enseignant": 3,
        "id_affectation": 6
    }
]
```

**Statuts possibles :**

-   `en_attente` : En attente de validation (par défaut)
-   `approuve` : Approuvée par l'admin
-   `refuse` : Refusée par l'admin

---

## 🔔 13. Notifications

**Important :** L'utilisateur doit exister.

```json
[
    {
        "titre": "Nouvelle affectation",
        "message": "Vous avez une nouvelle séance planifiée pour le 15 octobre 2024 à 08:00",
        "type_notification": "info",
        "lue": false,
        "id_user": 2
    },
    {
        "titre": "Demande de report approuvée",
        "message": "Votre demande de report pour la séance du 15 octobre a été approuvée. Nouvelle date : 22 octobre 2024",
        "type_notification": "success",
        "lue": false,
        "id_user": 2
    },
    {
        "titre": "Conflit détecté",
        "message": "Un conflit de salle a été détecté pour votre affectation du 15 octobre. Veuillez contacter l'administration.",
        "type_notification": "warning",
        "lue": false,
        "id_user": 2
    },
    {
        "titre": "Affectation annulée",
        "message": "La séance du 18 octobre a été annulée",
        "type_notification": "error",
        "lue": true,
        "id_user": 2
    },
    {
        "titre": "Bienvenue sur HESTIM Planner",
        "message": "Votre compte a été créé avec succès. Bienvenue sur la plateforme de planification des cours.",
        "type_notification": "info",
        "lue": false,
        "id_user": 5
    }
]
```

**Types possibles :**

-   `info` : Information générale (par défaut)
-   `success` : Succès
-   `warning` : Avertissement
-   `error` : Erreur

---

## ⚠️ 14. Conflits

**Important :** Les affectations doivent exister (pour les associer au conflit).

```json
[
    {
        "type_conflit": "salle",
        "description": "Deux cours planifiés dans la même salle (A101) au même créneau (lundi 08:00-10:00) le 15 octobre",
        "date_detection": "2024-10-01",
        "resolu": false
    },
    {
        "type_conflit": "enseignant",
        "description": "Un enseignant a deux cours planifiés au même moment (lundi 08:00-10:00)",
        "date_detection": "2024-10-01",
        "resolu": true,
        "date_resolution": "2024-10-02"
    },
    {
        "type_conflit": "groupe",
        "description": "Un groupe a deux cours planifiés au même moment (mercredi 08:00-12:00)",
        "date_detection": "2024-10-01",
        "resolu": false
    }
]
```

**Types possibles :**

-   `salle` : Conflit de salle (double réservation)
-   `enseignant` : Conflit d'enseignant (même enseignant, même créneau)
-   `groupe` : Conflit de groupe (même groupe, même créneau)

**Pour associer des affectations à un conflit :**

```
POST /api/conflits/:id_conflit/affectation/:id_affectation
```

---

## 📜 15. Historique des Affectations

**Important :** L'affectation doit exister. L'historique est généralement créé automatiquement lors des modifications, mais peut être créé manuellement.

```json
[
    {
        "action": "creation",
        "date_action": "2024-10-01T10:00:00.000Z",
        "anciens_donnees": null,
        "nouveaux_donnees": {
            "date_seance": "2024-10-15",
            "statut": "planifie",
            "id_cours": 1,
            "id_groupe": 1
        },
        "commentaire": "Création initiale de l'affectation",
        "id_affectation": 1,
        "id_user": 1
    },
    {
        "action": "modification",
        "date_action": "2024-10-02T14:30:00.000Z",
        "anciens_donnees": {
            "statut": "planifie",
            "id_salle": 1
        },
        "nouveaux_donnees": {
            "statut": "confirme",
            "id_salle": 2
        },
        "commentaire": "Modification de la salle et confirmation par l'enseignant",
        "id_affectation": 1,
        "id_user": 2
    },
    {
        "action": "suppression",
        "date_action": "2024-10-03T09:15:00.000Z",
        "anciens_donnees": {
            "date_seance": "2024-10-20",
            "id_cours": 3
        },
        "nouveaux_donnees": null,
        "commentaire": "Suppression suite à annulation du cours",
        "id_affectation": 3,
        "id_user": 1
    }
]
```

**Actions possibles :**

-   `creation` : Création d'une affectation
-   `modification` : Modification d'une affectation
-   `suppression` : Suppression d'une affectation
-   `annulation` : Annulation d'une affectation

---

## 🎯 Exemple d'utilisation complète

### Script de création séquentielle

```javascript
// Ordre de création recommandé avec IDs

// 1. Créer Users (retourne id_user)
// User 1: Admin (id_user: 1)
// User 2: Enseignant Alami (id_user: 2)
// User 3: Enseignant Bennani (id_user: 3)
// User 4: Enseignant Chraibi (id_user: 4)
// User 5: Étudiant Dari (id_user: 5)
// User 6: Étudiant El Amrani (id_user: 6)
// User 7: Étudiant Fassi (id_user: 7)
// User 8: Étudiant Ghazi (id_user: 8)

// 2. Créer Filiere (retourne id_filiere)
// Filiere 1: GI (id_filiere: 1)
// Filiere 2: GC (id_filiere: 2)
// Filiere 3: GEM (id_filiere: 3)

// 3. Créer Salle (retourne id_salle)
// Salle 1: A101 (id_salle: 1)
// Salle 2: A102 (id_salle: 2)
// ... etc

// 4. Créer Creneau (retourne id_creneau)
// Creneau 1: lundi 08:00-10:00 (id_creneau: 1)
// Creneau 2: lundi 10:15-12:15 (id_creneau: 2)
// ... etc

// 5. Créer Enseignant (utilise id_user existant)
// Enseignant 1: id_user: 2
// Enseignant 2: id_user: 3
// Enseignant 3: id_user: 4

// 6. Créer Etudiant (utilise id_user existant)
// Etudiant 1: id_user: 5
// Etudiant 2: id_user: 6
// ... etc

// 7. Créer Groupe (utilise id_filiere existant)
// Groupe 1: GI-3A, id_filiere: 1 (id_groupe: 1)
// Groupe 2: GI-3B, id_filiere: 1 (id_groupe: 2)
// ... etc

// 8. Créer Cours (utilise id_filiere existant)
// Cours 1: GI301, id_filiere: 1 (id_cours: 1)
// Cours 2: GI302, id_filiere: 1 (id_cours: 2)
// ... etc

// 9. Créer Affectation (utilise tous les IDs précédents)
// Affectation 1: id_cours: 1, id_groupe: 1, id_user_enseignant: 2, id_salle: 1, id_creneau: 1, id_user_admin: 1

// 10. Créer Appartenir (utilise id_user_etudiant et id_groupe)
// Appartenir 1: id_user_etudiant: 5, id_groupe: 1
// ... etc

// 11. Créer Disponibilite (utilise id_user_enseignant et id_creneau)
// Disponibilite 1: id_user_enseignant: 2, id_creneau: 1
// ... etc

// 12. Créer DemandeReport (utilise id_user_enseignant et id_affectation)
// DemandeReport 1: id_user_enseignant: 2, id_affectation: 1
// ... etc

// 13. Créer Notification (utilise id_user)
// Notification 1: id_user: 2
// ... etc

// 14. Créer Conflit (peut être créé indépendamment)
// Conflit 1: type_conflit: "salle"

// 15. Associer Affectation à Conflit (après création du conflit et de l'affectation)
// POST /api/conflits/1/affectation/1

// 16. Créer HistoriqueAffectation (utilise id_affectation et id_user)
// HistoriqueAffectation 1: id_affectation: 1, id_user: 1
// ... etc
```

---

## 📌 Notes importantes

1. **IDs de base de données** : Les IDs retournés lors de la création peuvent varier. Notez les IDs retournés et utilisez-les pour les créations suivantes.

2. **Dépendances** : Respectez toujours l'ordre de création pour éviter les erreurs de clés étrangères.

3. **Validation** : Certains champs sont obligatoires (`allowNull: false`). Assurez-vous de les fournir.

4. **Formats de date** : Utilisez le format ISO 8601 : `YYYY-MM-DD` pour les dates et `HH:mm:ss` pour les heures.

5. **Hash de mot de passe** : Utilisez `bcrypt` pour générer les hashs de mots de passe :

    ```javascript
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("MotDePasse123", 10);
    ```

6. **Token JWT** : Pour les routes protégées, vous devez fournir un token JWT valide dans l'en-tête `Authorization`.

---

**Prêt à tester ! Utilisez ces données avec le [GUIDE_TEST_ROUTES.md](./GUIDE_TEST_ROUTES.md) pour tester toutes les routes. 🚀**
