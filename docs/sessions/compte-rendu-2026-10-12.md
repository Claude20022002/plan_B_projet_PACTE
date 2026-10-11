# Compte rendu pour la prochaine session (rédigé le 11 octobre 2026, à midi)

À lire en début de session, avant tout travail. Il remplace `compte-rendu-2026-10-11.md` pour l'état du projet. Les règles de travail entre les deux groupes et les règles de code de ce dernier (§ 4) restent valables ; elles ne sont pas recopiées ici.

**Deux groupes travaillent en parallèle** : groupe A (socle) et groupe B (interface). Le chef de projet dit son groupe à chaque session ; s'il ne le dit pas, le demander.

Rédigé par le groupe A. Ce qui concerne le groupe B vient de ses branches et de son journal, sans relecture de son code.

## 1. L'essentiel en dix lignes

1. **Rien n'est dans `main`.** Tout le travail des deux groupes est sur des branches ; `main` a 105 commits de retard sur le groupe A. C'est le premier point à régler (§ 4).
2. **La production est toujours en maj27**, à la connaissance de ce compte rendu. Aucun déploiement n'a été confirmé.
3. **Une faille du quiz est ouverte en production** : un étudiant qui connaît le code d'une partie peut en prendre la main. Le correctif est prêt et empaqueté, pas déployé (§ 5).
4. **Le groupe A a fini sa liste de priorité 1**, plus le campus par promotion, le quiz sur un sujet seul et deux préférences de salles dans le solveur.
5. **Le groupe B a 18 branches, aucune poussée**, et travaille en ce moment sur l'écran de R-11.
6. **Les branches se fusionnent avec trois petits conflits**, déjà identifiés (§ 4).
7. **L'onglet Jeux de l'application est remplacé par « Scanner »**, dans un dossier à part, pas encore commité.
8. **La vidéo a un second montage** sur les captures du jour ; le quiz y est encore sur maquettes.
9. **Il reste 14 lots prévus à développer** (§ 7).
10. **Le poste manque de mémoire** : l'émulateur, Docker et les tests ensemble ont fait tomber Docker une fois (§ 9).

## 2. État vérifié le 11 octobre à midi

| Élément | État |
|---|---|
| Production | **maj27**. À vérifier auprès du chef de projet. |
| `main` (GitHub) | Commit `1736313` du 10 octobre. Aucune PR ouverte. |
| Groupe A, dossier `plan_B_projet_PACTE` | Branche `a/d2-devoirs-fermes`, **105 commits d'avance sur `main`, poussée**. Elle contient tout le travail du groupe A et `feature/phase-e-timefold`. Dernier commit `a1c71da`. |
| Groupe A, dossier `../planner-a-scan` | Branche `a/onglet-scanner`, partie de `b/creer-quiz`. **11 fichiers non commités** : l'onglet Scanner (`mobile/`) et deux corrections de tableaux (`frontend/`, `shared/i18n`). |
| Groupe B, dossier `../planner-b` | Branche `b/b1-code-mort`, propre. |
| Groupe B, dossier `../planner-b-r7` | Branche `b/r11-visa`, **3 fichiers non commités** (travail en cours). |
| Branches du groupe B | 18 branches locales, **aucune poussée**. |
| Dépôt du quiz (`../ClassQuiz`) | Branche `main`, propre, dernier commit `7492697a` (correctif de la prise de main). |
| Dépôt de la bibliothèque (`../StudyLib`) | **11 fichiers non commités**, depuis le 10 octobre (lot 0-5). |
| Paquets (`deploy/vps/paquets`) | `quiz-correctif1.tar.gz` prêt. `maj29.tar.gz` **périmé**. |
| Tests du serveur | Intégration 353 sur 353, unitaires 184 sur 184, lint sans erreur. |
| Tests du solveur | 20 sur 20. |

## 3. Décisions du chef de projet, le 11 octobre en journée

Elles s'ajoutent à celles du § 3 du compte rendu précédent.

- **Barre du bas de l'application** : Tableau, Semaine, **Scanner**, Bibliothèque, Compte. L'onglet Jeux disparaît.
- **Jeux des modules** (terminal Linux, choix du personnage) : **masqués pour l'instant**. La page reste dans le code, sans entrée.
- **Solveur** : une gestion des salles la meilleure possible. Fait en partie (§ 5) ; l'effet sur une vraie génération reste à regarder.
- **Campus préféré par promotion**, et non plus seulement par filière.
- **Quiz** : génération possible à partir d'un sujet seul, sans document.
- **Parcours de démonstration « Créer un quiz »** : il remplace « quiz donné en devoir » dans B-8.
- **Jeu ouvert par un scan** : dans une vue navigateur, comme Wooclap, tant que les quiz ne comptent pas dans la note.
- **Vidéo** : une version plus longue pour la salle, une plus courte pour les réseaux ; une scène montre ce qui vient (schéma et extrait vidéo dans une question).

## 4. D'abord : fusionner dans `main`

C'est le lot 0-2, et il bloque le déploiement. Le chef de projet fusionne.

**Avant de fusionner.**

- Commiter `../planner-a-scan` en deux lots : l'onglet Scanner (`mobile/`), puis les corrections de tableaux (`frontend/`, `shared/i18n`).
- Le groupe B commite son travail en cours (`b/r11-visa`).
- Commiter ou écarter les 11 fichiers de `../StudyLib`.

**Branches à réunir** : `a/d2-devoirs-fermes`, `b/b3-traductions` (elle contient quatorze lots du groupe B), `b/b1-code-mort`, `b/b8-parcours`, `b/donnees-fictives`, `b/r11-visa`, `a/onglet-scanner`.

**Conflits connus**, relevés par des fusions simulées deux à deux :

| Fichier | Résolution |
|---|---|
| `frontend/src/providers/AppProviders.jsx` | Garder `ConfirmationProvider` autour de `{children}`, dans `ToastProvider` ; retirer `QueryClientProvider`, `QueryErrorBridge` et leurs deux imports. |
| `frontend/package.json` | Garder les deux lignes de script, `test:unit` et `test:parcours`. |
| `docs/sessions/journal-groupe-b.md` | Garder les deux textes. |

D'autres conflits peuvent apparaître quand les fusions s'enchaînent, et `b/r11-visa` n'a pas été simulée. **Aucun test n'a tourné sur l'ensemble réuni.**

**Commandes**, depuis le dossier du groupe A :

```powershell
git switch -c integration/2026-10-11 a/d2-devoirs-fermes
git merge --no-ff b/b3-traductions      # conflit : AppProviders.jsx
git merge --no-ff b/b1-code-mort        # conflits : journal du groupe B, AppProviders.jsx
git merge --no-ff b/b8-parcours         # conflit : package.json
git merge --no-ff b/donnees-fictives
git merge --no-ff b/r11-visa
git merge --no-ff a/onglet-scanner
git push -u origin integration/2026-10-11
gh pr create --base main --head integration/2026-10-11 --title "Fusion des lots des groupes A et B du 11 octobre"
gh pr merge --merge                     # une fois la CI verte
```

Le groupe A a proposé de préparer cette branche lui-même (conflits résolus, lints et tests lancés sur le tout). **Le chef de projet n'a pas encore répondu.**

## 5. Ce que le groupe A a fait le 11 octobre

Le détail, les vérifications et les limites de chaque lot sont dans `journal-groupe-a.md`.

| Lot | Résultat | Ce qui reste |
|---|---|---|
| A-1 | Modèles d'import avec des personnes fictives | `docs/users.xlsx` reste dans l'historique (lot 0-1) |
| A-2 | Script de contrôle des mots de passe de démonstration | **À lancer sur le serveur** par le chef de projet |
| R-11, serveur | Séances « à vérifier », visa de l'administration | Deux questions ouvertes (§ 8) |
| CQ-1 | Partie lancée depuis Planner, relais du quiz | Rechargement de Caddy jamais essayé sur le serveur |
| A-9 et R-3 | Procédure de retour arrière, contrôle des dépendances | **À dérouler à blanc sur le serveur** |
| A-4 et Q-1 | ESLint du backend, bloquant dans la CI | La CI elle-même n'a pas tourné |
| A-3 | Sauvegarde quotidienne chiffrée, hors du serveur | **Pas en service** : attend la destination (§ 8) |
| D-2 | Devoirs fermés côté serveur (`DEVOIRS_ACTIFS`) | Rien |
| Faille du quiz | Correctif complété, commité, empaqueté | **À déployer** (ci-dessous) |
| Paquet du moteur seul | `preparer-maj.sh --quiz-seul`, `appliquer-quiz.sh` | Jamais lancé sur le serveur |
| Solveur, tests | 6 vérifications ajoutées (16 en tout) | A-8 demande une classe de test par règle |
| Solveur, salles | Salle à la taille du groupe ; même salle pour deux cours qui se suivent | Effet sur une vraie génération non mesuré |
| Plafond d'heures | Signalé dès le début de la génération | Le site ne l'affiche pas encore |
| Campus par promotion | Migration 0040, lu par le solveur et l'assistant | Le champ manque dans le formulaire d'un groupe |
| Quiz sur un sujet seul | Route et consigne prêtes | Pas essayé avec le vrai fournisseur |
| Messages « PlannerQuiz » | Remplacés par « le service de quiz » | Rien |
| Liste des séances | `ordre=asc` : les plus proches d'abord | Rien |
| Onglet Scanner | Fait, essayé dans l'émulateur Android | Non commité ; ni iPhone ni vrai scan essayés |
| Vidéo | Script, 3 maquettes, 31 captures, deux montages | § 6 |

### Déployer le correctif du quiz

Le paquet `deploy/vps/paquets/quiz-correctif1.tar.gz` ne contient que le code Python du moteur : ni migration, ni Planner. Depuis la version en production, ce code n'a changé que dans cinq fichiers, sans nouvelle dépendance.

```bash
scp deploy/vps/paquets/quiz-correctif1.tar.gz root@<serveur>:/root/
# sur le serveur, hors des heures de cours (les parties en cours sont coupées)
cd /root && tar -xzf quiz-correctif1.tar.gz && bash quiz-correctif1/deploy-vps/appliquer-quiz.sh /root/quiz-correctif1
```

Jouer ensuite une partie d'essai avec la télécommande : c'est le seul vrai contrôle.

## 6. La vidéo

- **Script** : `docs/presentation/script-video-motion-design.md`, **à valider**. Il décrit une matinée ; les montages racontent un après-midi, parce que les captures ont été prises sur une séance de 13 h 30.
- **Montages** : `docs/presentation/video/out/matinee-ecole.mp4` (1 min 35) et `matinee-ecole-9x16.mp4` (46 s). `out/` n'est pas versionné. Commandes : `npm run render:matinee` et `npm run render:matinee-reseaux`.
- **Captures du jour** dans `docs/presentation/captures/` : `app-*` (11), `prof-*` (10), `admin-*` (10). Les trois `maquette-quiz-*` ne sont pas des captures.

**Ce qui manque à la vidéo.**

- Le quiz est sur maquettes : le moteur n'était pas branché pendant les captures.
- Ni résultats d'un quiz, ni Bibliothèque : pas de capture à jour.
- `admin-04-edt-mensuel.png` est vide (aucune classe choisie) : à refaire.
- Le téléphone affiche « 2:03 » alors que le repère dit 13 h 20 ; le scanner montre la scène factice de l'émulateur.
- Pas de sous-titres anglais, pas de durée annoncée avant la lecture.
- Les vidéos n'ont été contrôlées que sur des images fixes : personne ne les a regardées en entier ni écoutées.
- `docs/presentation/video/src/scenes/M10Admin.tsx` n'est plus utilisé : à supprimer.

## 7. Ce qui reste à développer

### Demandes en attente, à traiter en premier

| Pour | Demande |
|---|---|
| Groupe A | **Serveur de jeu** : `player_answer` et `everyone_answered` partent vers toutes les parties en cours (`classquiz/socket_server/__init__.py`, lignes 349 et 354). Deux classes qui jouent en même temps faussent le compteur l'une de l'autre. Proposition du groupe B : `room=f"admin:{game_pin}"`. **Pas traité** ; à joindre au correctif du quiz avant de le déployer, ou dans un second paquet. |
| Groupe B | Afficher l'avertissement `plafond_hebdomadaire` dans l'écran de génération. |
| Groupe B | Ajouter `id_campus_prefere` au formulaire d'un groupe. |
| Groupe B | Activer la génération sur un sujet seul quand `disponibilite.sujet` est vrai. |
| Groupe B | `EmploiDuTempsAdmin.jsx` et `Affectations.jsx` demandent plus de 100 séances et n'en reçoivent que 100. |
| Groupe B | Retirer `game_id` de la statistique de la page du joueur (site du quiz). |
| Groupe B | Le bouton de scan de la barre de titre du Tableau fait double emploi avec l'onglet. |

### Lots prévus, pas développés (14)

| Lot | Contenu | Groupe |
|---|---|---|
| R-2 | `FORK.md` dans le dépôt du quiz | A |
| A-5 | Un seul format d'erreur pour l'API | A |
| A-7 | Verrou sur les tâches périodiques | A |
| A-10 | Ranger la documentation | A |
| R-12 | Compteurs d'usage mensuels | A |
| Relevé mensuel | L'enseignant confirme ses heures une fois par mois | A |
| IA-4 (reste) | Route de mise à jour d'un quiz | A |
| A-6 | Alléger les anciens contrôleurs (après B-8) | A |
| R-10 | Changement de téléphone demandé par l'étudiant | A et B |
| R-11, écran | En cours sur `b/r11-visa` | B |
| R-9 | Téléphones à délier et séances sans appel dans « À traiter » | B |
| B-4 | Couleurs en dur remplacées par les jetons | B |
| B-7 | Découper les gros fichiers du site | B |
| IA-5 (reste) | Éditeur « Mes quiz » | B |

À moitié fait : **A-8** (tests du solveur). En attente du retour des devoirs : **R-13** (export des notes).

### Idées décidées, sans lot

L'onglet « Menu » ; l'espace Carrière ; la Bibliothèque à la place de Moodle ; l'illustration et l'extrait vidéo dans une question sur le téléphone ; une entrée pour les jeux des modules. Plus tard : l'application mobile des enseignants et les lots P-1 à P-5.

**L'écran Bibliothèque de l'application n'a été modifié sur aucune branche.**

## 8. Décisions attendues du chef de projet

- **Fusion** : le groupe A prépare-t-il la branche d'intégration (§ 4) ?
- **Sauvegardes (A-3)** : où les envoyer hors du serveur, qui en a l'accès, où garder la phrase de chiffrement ? Faut-il aussi sauvegarder les documents de la bibliothèque et les images des quiz ?
- **R-11, l'export** : une séance « à vérifier » part-elle dans l'export avec sa mention (état actuel) ou est-elle retenue jusqu'au visa ?
- **R-11, l'avancement** : une séance écartée sort-elle aussi des heures réalisées du module ?
- **Notifications « devoir » déjà envoyées** : les masquer côté serveur, ou les laisser ?
- **`POST /api/users/import`** : plus appelée par le site. La garder ou la retirer ?
- **Dépôt du quiz** : une branche par lot et un dossier par groupe, comme pour Planner ?
- **Vidéo** : la durée, la promesse d'ouverture, et la scène « Bientôt » dans la version pour la salle.
- **Fichiers inutiles** : la liste de 56 fichiers du compte rendu précédent (§ 6) attend toujours. Le groupe B en a traité une partie avec B-1.
- **Paie** : faire valider le relevé mensuel par la scolarité de HESTIM.
- **Fournisseur d'IA** : la décision de l'école bloque IA-7.
- **Compte « actif »** : au moins une connexion dans le mois ?

## 9. Repères pratiques

Ceux du compte rendu précédent (§ 8) restent valables. S'y ajoutent :

- **Base de test du groupe A** : `hestim_a_test` (`DB_NAME=hestim_a_test`). Une autre suite tournait sur `hestim_test` en même temps et les deux se vidaient leurs tables.
- **Mémoire du poste** : 11 Go. L'émulateur, Docker, Maven et les tests ensemble ont fait redémarrer Docker, qui a arrêté `hestim_mysql_test`. Le relancer : `docker start hestim_mysql_test`. Ne pas tout lancer à la fois.
- **Tests du solveur**, sans Maven sur le poste :
  `docker run --rm -v "<dépôt>\solver:/app" -v "$env:USERPROFILE\.m2:/root/.m2" -w /app maven:3.9-eclipse-temurin-21 mvn -B test`
- **Tests Python du quiz** : dans l'image de l'API, avec `pytest` installé à la volée et sept réglages jetables (`MAIL_*`, `SECRET_KEY`, `STORAGE_BACKEND`) ; la commande est dans le journal du groupe A.
- **Plateforme de captures**, sans toucher aux données :
  - base `hestim_captures_test`, copie de `hestim_demo_mobile`, dans le conteneur de test ; comptes de démonstration en `password123` ;
  - serveur lancé sur cette base, sans e-mail, quiz, IA ni push, avec une horloge décalée sur un lundi en cours de séance (un petit module chargé par `node --import`, à réécrire : il était dans un dossier temporaire) ;
  - site du dossier `../planner-a-scan` sur le port 5174 ;
  - `docs/presentation/capturer-profs-admin.mjs` pour le site, `docs/presentation/scripts/pilote-emulateur.py` pour l'application (Metro sur 8095, `adb reverse`, `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000`).
  - Après un appel ouvert, un rappel « terminez l'appel » apparaît sur les captures : le supprimer de la table `Notifications` avant de recapturer.
- **Application sur le téléphone** : Metro doit être lancé depuis le dossier qui contient le travail voulu. Aujourd'hui la nouvelle barre n'est que dans `../planner-a-scan/mobile`.
- **Outils** : certaines commandes PowerShell qui contiennent `rm -rf` ou `Remove-Item` sont refusées par le garde-fou de la session ; passer par l'outil d'édition, ou laisser la suppression au chef de projet.
- **Façon de travailler** : le chef de projet commite et pousse lui-même, souvent pendant la session. Vérifier `git status` et `git log` avant d'annoncer ce qui reste à commiter.
