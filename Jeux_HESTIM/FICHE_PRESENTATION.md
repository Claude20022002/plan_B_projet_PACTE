# 🎓 Fiche Technique - Plateforme HESTIM Jeux

## 🚀 Architecture Technologique
*   **Frontend** : React 18 + Vite + Tailwind CSS. Une interface fluide, "Cloud Ready" et responsive.
*   **Backend** : NestJS + TypeORM + MySQL. Une architecture modulaire et scalable avec gestion avancée des rôles.
*   **Temps Réel** : **Socket.io** (WebSockets). Communication bidirectionnelle instantanée entre le serveur et les clients.
*   **Internationalisation** : **i18next**. Support complet multi-langues (Français/Anglais) avec détection automatique sur toutes les pages.
*   **Conteneurisation** : Docker & Docker Compose pour un déploiement standardisé.

## 🌐 Architecture Globale
Les différentes couches de l’application communiquent selon une architecture **REST**. Le Frontend échange avec le Backend via une API REST sécurisée par **JWT**. Le Backend traite les requêtes puis interagit avec la base de données **MySQL**.

## 🔑 Identifiants de Test (Accès Rapide)
| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Admin Principal** | `admin@hestim.ma` | `password123` |
| **Enseignant** | `enseignant1@hestim.ma` | `password123` |
| **Apprenant** | `apprenant1@hestim.ma` | `password123` |
*Note : 200 participants de test sont générés automatiquement.*

## 🌟 Nouvelles Fonctionnalités & Améliorations

### 1. Immersion et UX Personnalisée
*   **Dual-Language Support** : Bouton de bascule instantanée **FR/EN** sur toutes les interfaces, y compris dans le simulateur de jeu.
*   **Mode Sombre (Dark Mode)** : Thème visuel optimisé pour les longues sessions de jeu, mémorisé par l'utilisateur.
*   **Logo HESTIM** : Intégration de l'image de marque institutionnelle et bouton de déconnexion sécurisé pour tous les rôles (Admin, Enseignant, Participant).

### 2. Gestion Administrative Avancée
*   **Contrôle Total des Comptes** : L'administrateur peut désormais **créer, modifier et supprimer** les comptes des enseignants et des apprenants avec mise à jour instantanée des informations.
*   **Cycle de Vie des Sessions** :
    *   **Nettoyage Intelligent** : La suppression d'une session libère automatiquement tous les participants (statut **"Libre"** affiché dans le dashboard admin).
    *   **Sécurité d'Accès** : Les sessions marquées comme **"Terminées"** sont verrouillées; les élèves reçoivent un message d'alerte s'ils tentent d'y accéder à nouveau.
    *   **Sélection Granulaire** : Recherche en temps réel et sélection individuelle des participants pour chaque activité.

### 3. Pilotage Pédagogique en Temps Réel
*   **Coaching Privé** : L'enseignant peut envoyer des **commentaires spécifiques** à chaque entreprise. Ces messages s'affichent instantanément et uniquement sur les écrans des élèves concernés.
*   **Moteur de Répartition Intelligent** : L'algorithme d'affectation automatique applique les règles pédagogiques de HESTIM (optimisation à 3 ou 4 tables selon l'effectif réel).
*   **Feedback Live** : Mise à jour instantanée des barres de progression et des compositions d'équipes via WebSockets.
*   **Évaluation Post-Partie** : L'enseignant a accès aux scores finaux de chaque participant (basés sur la progression de leur groupe) dès la fin de la session, facilitant l'attribution des notes.

### 4. Module de Jeu "Reactik V2" Intégré
*   **Flux de Jeu Unifié** : Passage transparent de la page de groupe au simulateur via le bouton **"Lancer le jeu maintenant"**.
*   **Simulation Industrielle Complète** : Un parcours structuré en **8 phases** interactives.
*   **Moteur de Calcul Dynamique** : Calcul automatique et synchronisé des délais, des stocks et du score d'efficience basé sur les décisions de l'équipe.
*   **Clôture de Partie** : Bouton de fin de partie permettant aux participants de clôturer officiellement leur simulation et de sauvegarder leurs résultats finaux.

## ☁️ Guide de Déploiement Web
1.  **Repository** : Code source versionné sur GitHub.
2.  **Hébergement API** : Railway.app (Déploiement automatique via Docker).
3.  **Hébergement Frontend** : Vercel.com (Optimisé pour React).
4.  **Base de Données** : Cluster MySQL managé pour la sécurité et la persistance des données.

---
*Dernière mise à jour : Juillet 2026 - Plateforme Jeux Pédagogiques HESTIM*
