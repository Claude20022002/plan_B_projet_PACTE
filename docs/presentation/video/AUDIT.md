# AUDIT : vidéo promo « PactePromo » (phase 0)

Rédigé le 17 octobre 2026 d'après le dépôt lu en local (README, PRODUCT.md, `frontend/src/pages`, `backend/services`, captures de `../captures/`). Demande : `../PROMPT_VIDEO_PACTE.md`.

## Le produit

| Sujet | Réponse | Preuve dans le dépôt |
|---|---|---|
| Nom | **HESTIM Planner** (projet PACTE, cycle ingénieur 3IIIA) | `README.md` |
| Promesse | **« Toute l'école à l'heure, dans une seule application. »** (promesse déjà retenue le 13 octobre) | `../script-video-vendeur.md`, § 3 |
| Utilisateurs | Administration et scolarité, responsables de filière, enseignants, étudiants | `README.md`, tableau des rôles |
| Décideurs visés par la vidéo | Direction d'école, responsable de la scolarité | `.claude/product-marketing.md` |
| Problème résolu | La journée d'une école passe par des outils qui ne se parlent pas : PDF d'emploi du temps périmé dès qu'un cours bouge, messages pour prévenir, appel sur papier | `.claude/product-marketing.md`, « Core problem » |

## Les trois fonctionnalités les plus vendeuses

| # | Fonctionnalité | Bénéfice pour la direction | Où elle est prouvée |
|---|---|---|---|
| 1 | **Emploi du temps généré sous contraintes** : salle, enseignant et groupe jamais en double ; rendu au format officiel HESTIM | Un semestre planifié sans conflit | `backend/services/generation/`, `backend/services/planning/affectationRules.js` ; captures `web-08-generation.png` (2 620 séances créées), `admin-04b-edt-mensuel-classe.png` |
| 2 | **Un changement, tout le monde prévenu** : report ou changement de salle, alerte en direct et notification push aux seuls étudiants concernés ; le tableau de chaque rôle se met à jour | Fini les étudiants devant une salle vide | `backend/services/push.js`, `frontend/src/pages/dashboard/` ; captures `admin-01-tableau.png`, `app-01-tableau.png` ; l'alerte est dessinée d'après l'application (comme dans les vidéos précédentes) |
| 3 | **L'appel par QR code** : code projeté renouvelé toutes les 30 secondes, présents qui s'affichent en direct, historique par classe | Une présence fiable, sans papier | `frontend/src/pages/AppelProjection.jsx`, `backend/services/presences/` ; captures `prof-05-appel-projection.png`, `app-04-scanner.png` |

## Points de preuve chiffrables

| Chiffre | Source | Statut |
|---|---|---|
| **2 620 séances placées** sur un semestre | Capture `web-08-generation.png` : « 2620 séance(s) créée(s) » | Vérifié, **jeu de démonstration** : à écrire avec cette mention |
| **0 salle prise deux fois** | Règles de planification vérifiées à chaque enregistrement (`README.md`, § « Règles de planification ») | Vérifié par construction |
| **1 seul compte** pour Planner, la Bibliothèque et les quiz | Connexion unique (`README.md`, « Connexion unique ») | Vérifié |
| QR renouvelé toutes les **30 s** | Écran d'appel | Vérifié |
| « 90 secondes » pour un semestre | Cité dans `../discours-3-minutes.md`, **absent des captures** (la capture montre une durée de calcul réglée à 60 s) | **À CONFIRMER** : pas utilisé dans la vidéo |
| « L'appel en une minute » | Jamais mesuré | **À CONFIRMER** : pas utilisé |
| Témoignages, clients, adoption | Aucun | Aucun dans la vidéo |

## Écrans capturables

Les captures réelles existantes suffisent pour les trois fonctionnalités (données fictives du jeu de démonstration, aucune personne réelle) :

`web-08-generation`, `admin-04b-edt-mensuel-classe`, `admin-01-tableau`, `app-01-tableau`, `prof-05-appel-projection`, `app-04-scanner`, `app-03c-mois`.

Je pourrais aussi capturer moi-même l'assistant de créneaux (`/gestion/imprevus`), la fenêtre des conflits et les statistiques. Il faudrait alors une session dédiée : base de démonstration, solveur, serveur, site et génération, sur un poste à 11 Go déjà chargé de 6 conteneurs. **Pas fait pour ce premier rendu** : voir la liste « À fournir » dans `QA.md`.

## Questions de la phase 0 : réponses par défaut

Vous avez demandé d'exécuter sans attendre. Voici les cinq questions bloquantes et la réponse prise par défaut, à corriger au besoin :

| Question | Réponse retenue |
|---|---|
| 1. URL ou contact sur l'écran final ? | **Aucune adresse** : `planner.hestim.ma` n'existe pas et `finadmintech` ne doit pas apparaître. Bouton « Demandez votre démo » seul |
| 2. Voix off : synthèse ou enregistrement ? | **Voix neuronales françaises** (Microsoft, via `edge-tts`), une voix par personnage et une pour le narrateur |
| 3. Musique ? | **Composée par script** (instrumental doux à 100 BPM), faute de piste sous licence fournie |
| 4. Avatars ? | **Trois personnages illustrés**, dans le style des références Asana : Nadia (scolarité), Youssef (enseignant), Salma (étudiante). Ils parlent : bouche animée sur leur voix |
| 5. Accent de couleur ? | **Marine HESTIM `#001861`**, tirée du logo et de l'interface |
