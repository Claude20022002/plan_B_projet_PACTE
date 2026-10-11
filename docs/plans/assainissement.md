# Plan : assainir le projet avant de l'étendre (deux équipes)

Statut : **à faire**. Rédigé le 10 octobre 2026, après la revue critique du projet et l'allègement des rôles (`espace-enseignant.md`, § 6 quater). Ce plan passe avant les nouveaux lots des autres plans : il fixe ce que l'on garde, ce que l'on abandonne, et répartit les correctifs entre deux équipes qui peuvent travailler en parallèle sans se gêner.

## 1. Pourquoi ce plan

Le projet fonctionne et la base est saine : sécurité sérieuse (double authentification, journal, CSP, politique de mots de passe), règles métier vérifiées côté serveur, migrations versionnées, 521 tests backend, banc SQL dans la CI. Mais trois choses le menacent avant la soutenance :

1. **Un risque immédiat** : des données personnelles dans un dépôt public.
2. **Un périmètre trop large** : Planner, StudyLib, un fork de ClassQuiz, l'application mobile, l'IA et les jeux, avec environ 35 lots encore ouverts. Le jury évalue des parcours qui marchent de bout en bout, pas un nombre de fonctions.
3. **Un écart qui grandit entre le code et la production** : la production est en maj27, la branche a plus de 37 commits d'avance.

Ligne de conduite : **réparer, déployer, puis seulement étendre.**

**Révision du 11 octobre 2026 (relecture de l'équipe B, constats revérifiés dans le dépôt).** Corrigé : le constat sur « aujourd'hui » en UTC (le Maroc est à UTC+0, § 2 et B-2), le nombre de fichiers à dialogues natifs (3, pas 5), le critère des couleurs (B-4) et celui du découpage (B-7). Mis à jour : l'application mobile des enseignants passe de « à garder » à « idée pour un plan futur » (décision du 11 octobre, § 3.3). Ajouté : le renvoi à `remarques-par-profil.md` et son lot R-11, les deux autres dépôts (0-5), le paquet maj29 à refaire (0-3), les fiches d'aide et les traductions mortes (B-3, B-9), l'organisation de travail à deux équipes dans un même dossier (§ 6) et deux décisions ouvertes (§ 7).

**Révision du 11 octobre 2026, au soir (décisions du chef de projet).** Ajouté : les règles de code communes aux deux équipes (§ 6, « Règles de code »), les lots **D-1** et **D-2** (devoirs masqués, code gardé) et **Q-1** et **Q-2** (longueur des fichiers signalée par le lint). Modifié : le parcours « quiz donné en devoir » sort de B-8. Les autres décisions du jour (prix, paie, bibliothèque, vidéo, espace Carrière) sont dans `remarques-par-profil.md`, § 1, 5, 8, 9 et 10.

**La soutenance n'est plus un repère** (décision du chef de projet, le 11 octobre 2026 au soir). Dans ce plan, « avant la soutenance » se lit « d'abord » et « après la soutenance » se lit « plus tard » : l'ordre des priorités 1, 2 et 3 reste le même, sans date butoir. Le dépôt GitHub est privé depuis ce même soir (première moitié du lot 0-1).

## 2. Constats

Chaque constat est tiré du dépôt (mesures du 10 octobre 2026) et renvoie au correctif qui le traite (§ 5).

### Données et sécurité

| Constat | Preuve | Correctif |
|---|---|---|
| Le dépôt est **public** et contient `docs/users.xlsx` : noms, adresses `@hestim.ma`, colonne `password` à `password123` | `gh repo view` : PUBLIC | 0-1, A-1 |
| Des identifiants de test écrits en dur (`password123`, comptes nommés) | `frontend/playwright.global-setup.cjs` | A-2 |

### Architecture et code

| Constat | Preuve | Correctif |
|---|---|---|
| Une couche React Query complète n'est utilisée par aucune page : environ 40 fichiers morts, avec un `MIGRATION_EXAMPLE.jsx` | `services/apiClient.js`, `services/domains/` (17 fichiers), `services/queries/`, `hooks/api/` ; 0 `useQuery` dans les pages, 59 pages sur `services/api.js` | B-1 |
| Deux styles de backend : logique dans les anciens contrôleurs, services fins dans le code récent ; noms anglais d'un côté, français de l'autre ; format d'erreur variable | `authController.js` (751 lignes), `statistiquesController.js` (512), `emploiDuTempsController.js` (513), `demandeReportController.js` (491) ; erreurs `{ message }` ou `{ message, error }` | A-5, A-6 |
| Le site calcule « aujourd'hui » en UTC, par une ligne copiée 11 fois. **Sans effet aujourd'hui** : le Maroc est à UTC+0 toute l'année depuis le 20 septembre 2026 (`backend/tzdata/LISEZMOI.md`), donc la date UTC est celle de Casablanca. Le défaut est la duplication, et la fragilité si le fuseau change de nouveau | `new Date().toISOString().slice(0, 10)` dans 9 fichiers de `frontend/src` (Disponibilités, Imprévus, Génération, Suivi, MesExamens, AssistantCreneaux…), dont 2 fois pour un simple nom de fichier d'export ; aucune dans `mobile/src` ; le backend a sa fonction (`affectationRules.js`, `aujourdhui`) | B-2 |
| Quatre tâches périodiques tournent dans le processus de l'API : avec deux instances, un rappel partirait deux fois | `server.js` (réalisé, purge), `rappelAppel.js`, `envoiEdt.js` | A-7 |
| Le fork ClassQuiz grossit à chaque fonction de quiz : une troisième application à maintenir | plans `quiz-ia.md`, `espace-enseignant.md` (W-1 à W-6, J-1, IA-8 à IA-10) | § 3 |

### Interface

| Constat | Preuve | Correctif |
|---|---|---|
| Traduction incomplète : 10 pages sur 53 sans `useTranslation`, une trentaine de textes français en dur | `DemandesReport.jsx`, `Conflits.jsx`, `MesAffectations.jsx`… | B-3 |
| 66 couleurs hexadécimales en dur dans 16 fichiers JSX. Toutes ne sont pas des fautes : 9 sont dans `ThemeContext.jsx`, où le thème se définit, et le QR code de l'appel doit rester noir sur blanc pur. Le vrai défaut est dans les pages et la mise en page (`DashboardLayout.jsx` : 15, `EdtMensuel.jsx` : 9) | `grep "#xxxxxx"` dans `frontend/src` | B-4 |
| Dialogues natifs du navigateur au milieu d'une interface MUI, alors qu'un `ConfirmDialog` commun existe déjà | `window.confirm` dans 3 fichiers : `PanneauDevoirs.jsx`, `Affectations.jsx`, `Etudiants.jsx` (les deux autres résultats de la recherche sont le commentaire de `ConfirmDialog.jsx` et l'exemple mort de React Query) | B-5 |
| Cinq formats d'export pour un emploi du temps, dont trois en double | `TimetableExportMenu.jsx` : PDF, Excel, CSV, iCal, YAML | B-6 |
| Des fichiers de 600 à 860 lignes qui mélangent chargement, état, dialogues et tableau | `Cours.jsx`, `Calendrier.jsx`, `Affectations.jsx`, `DashboardLayout.jsx`, `exportEmploiDuTemps.js` | B-7 |

### Tests, CI et exploitation

| Constat | Preuve | Correctif |
|---|---|---|
| Aucun test unitaire pour le site ; un seul test Playwright, absent de la CI | `frontend/tests/app.spec.cjs` | B-8 |
| Pas de lint pour le backend : l'étape de la CI ne fait rien (`--if-present`) | aucun `eslint.config.*` dans `backend/` | A-4 |
| Le solveur, cœur métier, n'a que 3 classes de test pour 15 fichiers Java | `solver/` | A-8 |
| La base n'est sauvegardée qu'au moment d'une mise à jour, et sur le même serveur | `deploy/vps/appliquer-maj.sh` → `/root/sauvegardes` | A-3 |
| Pas de procédure écrite de retour arrière ; 232 Mo de paquets locaux | `deploy/vps/paquets/` | A-9 |

### Documentation et dépôt

| Constat | Preuve | Correctif |
|---|---|---|
| Environ 7 300 lignes de Markdown à la racine et dans `docs/rapports`, dont plusieurs rapports dépassés | `AUDIT_TECHNIQUE.md` (mai), `ANALYSE_COMPLETE.md`, `AMELIORATIONS_PROPOSEES.md`… | A-10 |
| Le dépôt pèse 88 Mo, surtout à cause des fichiers audio de la vidéo, présents en plusieurs versions | `docs/presentation/video/public/audio/*.wav` (jusqu'à 11 Mo) | 0-1, A-10 |
| Des commits fourre-tout : on ne peut ni les relire ni les annuler à moitié | « Refactor and enhance various components and services » (37 fichiers) | § 6 |
| Le nom de la branche ne correspond plus à son contenu | `feature/phase-e-timefold` | 0-2 |
| Les deux autres dépôts ont du travail non commité, que ce plan ne couvrait pas : un paquet de mise à jour prend les fichiers tels qu'ils sont sur le disque, commités ou non | `../StudyLib` : 11 fichiers (espace de l'enseignant, types Exercice et Article, 1 test) ; `../ClassQuiz` : 1 fichier ; `preparer-maj.sh` n'écrit dans `VERSION` que le commit de Planner et, avec `--studylib`, celui de StudyLib | 0-5 |
| Deux équipes modifient le même dossier de travail et tout part dans le même commit : le travail en cours de l'une est commité avec celui de l'autre | commit de 37 fichiers du 10 octobre : fiches d'aide en cours et retraits de fonctions mélangés | § 6 |
| Le paquet maj29 préparé le 10 octobre est périmé : il date d'avant les retraits de fonctions | `deploy/vps/paquets/maj29.tar.gz` et `hestim-backend-maj29.tar.gz`, construits sur `d0dfe0f` | 0-3 |
| Les fiches d'aide décrivent les écrans : un retrait de fonction les rend fausses s'il ne les met pas à jour | deux fiches ont dû être réécrites le 10 octobre après le retrait des devoirs « fichier » et de l'offre de stage | B-9 |

## 3. Fonctionnalités dont on peut se passer

Critère du chef de projet : une fonction reste si elle sert un parcours que le jury verra, ou un usage réel de l'école, **et** si son coût de construction et d'entretien reste raisonnable. Sinon elle est abandonnée, ou reportée après la soutenance.

### 3.1 Déjà retirées (10 octobre 2026)

Pour rappel (détail dans `espace-enseignant.md`, § 6 quater) : les surveillances côté enseignant, les devoirs « fichier », les retours anonymes, la confirmation et le marquage « réalisée » d'une séance, la réservation de salle par un enseignant, l'offre de stage et les boutons « bientôt » de « Mes classes », et la création de notifications à la main.

### 3.2 À abandonner

| Fonction | Où | Pourquoi |
|---|---|---|
| Images, audio et vidéo générés ou analysés par l'IA (IA-8, IA-9, IA-10) | `quiz-ia.md` | Chaque type demande un fournisseur de plus, un champ dans le fork, trois joueurs à adapter (site, application, devoirs) et une relecture humaine. Le risque juridique augmente (supports et voix envoyés hors du Maroc) pour un gain marginal : le QCM texte couvre l'essentiel. |
| Parité avec Wooclap (W-1 à W-6 : association, retour immédiat, mode à son rythme, réactions, import, autres types) | `espace-enseignant.md` | On ne rattrapera pas un produit dédié. Chaque type touche le fork et trois joueurs. Le quiz en direct lancé depuis Planner (CQ-1 à CQ-3) suffit à démontrer la valeur. |
| Télécommande du quiz depuis le téléphone (M-4) | `espace-enseignant.md` | L'ordinateur de la salle pilote déjà la projection. C'est un gadget qui dépend de deux lots non faits. |
| Second thème « StudyLib » pour le site (T-1, T-2) | `espace-enseignant.md` | Il faut reprendre les 66 couleurs en dur et tous les composants « panneau », puis vérifier le contraste dans deux thèmes et deux modes, et ajouter une migration. La valeur est cosmétique, et le panneau des départs est justement l'identité qui distingue le projet en démonstration. |
| Exports CSV, iCal (fichier) et YAML de l'emploi du temps | `TimetableExportMenu.jsx` | L'abonnement agenda remplace le fichier iCal et se met à jour seul. Excel couvre le CSV. Personne n'utilise le YAML. On garde le PDF au format officiel HESTIM, l'Excel et l'abonnement. |
| Import de quiz depuis Wooclap ou Excel (W-5) | `espace-enseignant.md` | Aucun enseignant de HESTIM n'a demandé de reprise, et la génération par l'IA crée déjà des quiz rapidement. |

### 3.3 À reporter après la soutenance

| Fonction | Pourquoi |
|---|---|
| Défis du terminal Linux dans un quiz (J-1) | Demandé le 10 octobre. C'est un nouveau type de question dans le fork et les trois joueurs, pour un public restreint (filières informatiques). Le jeu du terminal existe déjà et reste en place : rien n'est perdu en attendant. **Décision du chef de projet à confirmer.** |
| Source « document StudyLib » pour l'IA (IA-6) | Déposer le fichier suffit pour la démonstration. Ce lot touche aussi un second dépôt. |
| Fonctions enseignant dans StudyLib (S-1 à S-6) | Elles vivent dans un autre dépôt et n'entrent dans aucun parcours de démonstration de Planner. |
| Vidéos du guide (G-2, G-3) | Les fiches d'aide par rôle et par page existent déjà (`components/aide/`). Produire des vidéos coûte cher, et il faudrait les refaire à chaque changement d'écran. |
| Application mobile pour les enseignants (M-1, M-2, M-3) | **Décision du 11 octobre 2026 : une idée pour un plan futur**, pas un lot à faire avant la soutenance (`remarques-par-profil.md`, § 1). En attendant, l'enseignant utilise le site sur son téléphone : onglet « Mes classes », appel projeté, rappel à l'écran. `PRODUCT.md` dit l'enseignant « surtout sur mobile » : cela désigne le site sur téléphone, pas l'application. |

### 3.4 À garder et à finir

| Lot | Pourquoi |
|---|---|
| **CQ-1 à CQ-3** : quiz lancé et projeté depuis Planner | Il répond à l'exigence d'une seule adresse pour l'enseignant, et termine un parcours déjà à moitié fait. |
| **IA-7** : recette et déploiement de la génération par l'IA | Le code est prêt. Ce lot attend la décision de l'école sur le fournisseur (§ 7). |
| Recette maj28 (134 scénarios) | Rien n'a encore été déroulé. |

## 4. Avant de séparer les équipes : lot 0 (chef de projet)

Ces actions bloquent tout le reste ou demandent une décision. Elles passent en premier.

| Lot | Contenu | Résultat |
|---|---|---|
| **0-1** | Données personnelles, en deux temps. **Tout de suite : rendre le dépôt privé**, ce qui arrête l'exposition. **Ensuite : réécrire l'historique** (`git filter-repo`) pour retirer `docs/users.xlsx` et les fichiers audio, puis faire recloner tout le monde. Rendre le dépôt privé ne suffit pas : ce qui a été public a pu être copié, et le fichier reste dans l'historique même après A-1. Si les personnes du fichier sont réelles, prévenir l'école et considérer ces adresses comme connues. | Plus aucune donnée personnelle publique, ni dans l'historique |
| **0-2** | Fusionner `feature/phase-e-timefold` dans `main` (PR n°4) une fois la CI verte. Les deux équipes partent ensuite de `main`. | Une seule base de départ |
| **0-3** | Déployer un paquet **maj29 refait** sur la branche fusionnée ; il contient maj28, inutile de la déployer à part. Le paquet préparé le 10 octobre est périmé. Les dépendances du backend ont changé (`pdfjs-dist`, `mammoth`, `jszip`) : la superposition ne suffit pas, il faut **charger une nouvelle image du backend** avant d'appliquer le paquet, et garder l'ancienne sous une étiquette à part pour le retour arrière (celle que pose `appliquer-maj.sh` pointerait sur la nouvelle). Dérouler la recette, en commençant par la section 0. | Production alignée sur le code |
| **0-4** | Geler le périmètre : valider les § 3.2 et 3.3, puis mettre à jour l'état des lots dans `quiz-ia.md` et `espace-enseignant.md`. Plusieurs lots abandonnés ici ont été demandés le 10 octobre (second thème, médias générés par l'IA, parité avec Wooclap) : la validation doit dire explicitement qu'ils le sont. | Plus de nouvelle fonction avant la soutenance |
| **0-5** | Les deux autres dépôts : commiter ou écarter le travail en cours de `../StudyLib` et de `../ClassQuiz`, sur une branche chacun, avant de préparer un paquet. Faire écrire aussi le commit de ClassQuiz dans le fichier `VERSION` du paquet (`preparer-maj.sh`, équipe A). | Un paquet ne contient que du code commité, dans les trois dépôts |

## 5. Correctifs, répartis entre deux équipes

La répartition suit les dossiers, pour que les deux équipes ne modifient presque jamais les mêmes fichiers.

- **Équipe A, « Socle »** : `backend/`, `solver/`, `deploy/`, `docs/`, la CI côté backend.
- **Équipe B, « Interface »** : `frontend/`, `mobile/`, `shared/`, les tests de bout en bout.

Effort : **S** = une demi-journée au plus ; **M** = 1 à 3 jours ; **L** = plus de 3 jours. Priorité : **1** = avant la soutenance, sans discussion ; **2** = avant la soutenance si possible ; **3** = après.

### Équipe A : socle

| Lot | Contenu | Fait quand | Effort | Priorité |
|---|---|---|---|---|
| **A-1** | Remplacer `docs/users.xlsx` par un modèle d'import avec des personnes fictives (`exemple.hestim.test`) ; ajouter `*.xlsx` au `.gitignore` sauf les modèles | Le modèle d'import existe et aucun vrai nom n'est versionné | S | 1 |
| **A-2** | Identifiants de test lus dans des variables d'environnement (`E2E_ADMIN_EMAIL`, `E2E_MOT_DE_PASSE`…) ; vérifier qu'aucun compte de production n'a de mot de passe de démonstration | Aucun mot de passe dans le code ; vérification notée dans la recette | S | 1 |
| **A-3** | Sauvegarde quotidienne de la base (cron + `mysqldump`) envoyée hors du serveur, avec 14 jours de rétention ; restauration testée une fois sur une base vide, procédure écrite dans `DEPLOIEMENT.md` | Une restauration réussie est documentée | M | 1 |
| **A-4** | ESLint pour le backend (`eslint.config.js`, mêmes règles que le site), corriger ce qu'il signale, rendre l'étape bloquante dans la CI | La CI échoue sur une variable inutilisée dans `backend/` | M | 1 |
| **A-5** | Un seul format d'erreur pour l'API : `{ message, code?, violations? }`, documenté dans `docs/api/` ; les contrôleurs anciens sont alignés au fil de A-6 | Le format est écrit, et testé sur 3 routes représentatives | S | 2 |
| **A-6** | Alléger les anciens contrôleurs : leur logique passe dans `services/`, une PR par contrôleur, **sans changer l'API** (les tests d'intégration en sont la garantie). Ordre : `demandeReportController`, `emploiDuTempsController`, `statistiquesController`, `etudiantController`, `authController` en dernier (le plus sensible) | Chaque contrôleur fait moins de 200 lignes ; tous les tests restent verts | L | 3 |
| **A-7** | Tâches périodiques : verrou MySQL (`GET_LOCK`) autour de chaque tâche pour qu'elle ne tourne qu'une fois même avec deux instances, et un journal de chaque passage | Test : deux appels simultanés ne font qu'un seul envoi | M | 2 |
| **A-8** | Tests du solveur : salle, enseignant ou groupe en double, capacité, vacataire hors de ses disponibilités, trajet entre campus, jour bloqué | Une classe de test par règle, dans la CI | M | 2 |
| **A-9** | Procédure de retour arrière dans `DEPLOIEMENT.md` (image `avant-<date>`, restauration de la sauvegarde, migrations) ; script qui ne garde que les 3 derniers paquets | La procédure a été suivie une fois à blanc | S | 1 |
| **A-10** | Ranger la documentation : la référence reste à sa place (README, PRODUCT, DESIGN, DEPLOIEMENT, `docs/plans/`, `docs/recette/`) ; les anciens rapports et `AUDIT_TECHNIQUE.md` partent dans `docs/archives/` ; un index dans `docs/README.md` | Une personne qui arrive trouve la doc à jour en un clic | S | 2 |
| **D-2** | Devoirs fermés côté serveur par une variable d'environnement (`DEVOIRS_ACTIFS`, éteinte par défaut) : les routes des devoirs répondent « indisponible » et les activités d'un étudiant n'en listent plus. **Le code et les tables restent** : les devoirs pourront revenir. Les tests des devoirs tournent avec la variable allumée. Après D-1 de l'équipe B | Variable éteinte : aucune route de devoir ne répond ; variable allumée : tous les tests des devoirs passent | S | 2 |
| **Q-1** | Avec A-4 : la règle ESLint `max-lines` (300 lignes, hors lignes vides et commentaires) en **avertissement** dans `backend/`, pour voir les fichiers longs sans bloquer la CI (§ 6, « Règles de code ») | Le lint liste les fichiers trop longs ; la CI reste verte | S | 1 |

### Équipe B : interface

| Lot | Contenu | Fait quand | Effort | Priorité |
|---|---|---|---|---|
| **B-1** | Supprimer la couche React Query morte : `services/apiClient.js`, `services/domains/`, `services/queries/`, `services/queryClient.js`, `hooks/api/`, leur fournisseur dans `providers/AppProviders.jsx` (`QueryClientProvider`, `QueryErrorBridge`) et la dépendance `@tanstack/react-query` ; une seule couche reste, `services/api.js` | Plus aucun import vers ces dossiers ; le build et le lint passent | M | 1 |
| **B-2** | Une seule fonction `aujourdhui()` dans `shared/`, à la place des 11 copies de `toISOString().slice(0, 10)`. **Elle ne doit pas demander le fuseau `Africa/Casablanca` au navigateur** : un navigateur dont la base de fuseaux est ancienne croit encore le Maroc à UTC+1 et se tromperait de jour entre 23 h et minuit (c'est pour cette raison que le backend embarque sa propre base). Elle garde le calcul en UTC, exact tant que le Maroc reste à UTC+0, avec le décalage écrit à un seul endroit. Les deux noms de fichier d'export n'ont pas besoin de la date de l'école | Une seule définition ; `grep "toISOString().slice(0, 10)"` ne la trouve plus qu'à cet endroit dans `frontend/src` | S | 2 |
| **B-3** | Traduire les 10 pages qui ne le sont pas et les textes en dur (`DemandesReport`, `Conflits`, `MesAffectations`, `Notifications`, `Statistiques`, `Etudiants`, `Utilisateurs`, `ForgotPassword`, `ResetPassword`, `NotFound`). Retirer aussi les clés de traduction que les retraits du 10 octobre ont laissées mortes dans `fr.js` et `en.js` | Le site passé en anglais n'affiche plus un mot de français ; aucune clé sans usage | M | 2 |
| **B-4** | Remplacer par les jetons de `design-system/tokens` (ou `shared/tokens.js`) les couleurs en dur **des pages et de la mise en page**. Restent permises : la définition du thème (`ThemeContext.jsx`) et le noir et le blanc purs du QR code. Le second thème étant abandonné (§ 3.2), ce lot n'a plus d'urgence | Plus de couleur hexadécimale dans `pages/` ni `components/layouts/` | M | 3 |
| **B-5** | Remplacer les 3 `window.confirm` par le `ConfirmDialog` commun, qui existe déjà (`components/common/ConfirmDialog.jsx`) | Plus de dialogue natif dans `frontend/src` | S | 2 |
| **B-6** | Menu d'export de l'emploi du temps : PDF officiel, Excel et lien vers l'abonnement agenda ; retirer CSV, iCal (fichier) et YAML, avec leur code et leurs traductions | Le menu a trois entrées ; `exportEmploiDuTemps.js` a perdu le code des formats retirés | S | 2 |
| **B-7** | Découper les gros fichiers en composants (dialogue, tableau, chargement) : `Cours.jsx`, `Calendrier.jsx`, `Affectations.jsx`, `DashboardLayout.jsx`. **Après B-3 et B-4**, pour éviter les conflits | Chaque fichier a une seule responsabilité (la page assemble, les dialogues et les tableaux sont des composants à part), sans changement visible. Le nombre de lignes est un indice, pas le critère | L | 3 |
| **B-8** | Tests Playwright des parcours de démonstration, lancés dans la CI avec la base de test : connexion, appel par QR (côté enseignant), quiz donné en devoir puis rendu, demande de report puis décision, génération puis publication. Deux parcours demandent de **faux services dans la CI** : le quiz en devoir lit les quiz dans ClassQuiz (un faux service qui répond aux routes signées), et la génération appelle le solveur (le lancer, ou le simuler). Le scan d'un étudiant ne passe que par l'application : il se simule par un appel à l'API avec les en-têtes du mobile. Trois parcours pilotés existent déjà comme base (appel projeté, quiz par l'IA, aide), écrits le 10 octobre hors du dépôt : à reprendre dans `frontend/tests/` | Les 5 parcours sont verts dans la CI | L | 1 |
| **B-9** | Fiches d'aide (`components/aide/`) : chaque PR qui retire ou renomme un écran met à jour les fiches qui le citent (B-6 retire trois exports, par exemple). Un test vérifie que chaque fiche a ses textes dans les deux langues et que sa page existe | Le test échoue sur une fiche sans texte ou sans page | S | 2 |
| **D-1** | Masquer les devoirs sur le site et dans l'application (décision du 11 octobre : pas de devoir pour le moment, seulement des jeux pédagogiques). Un seul interrupteur dans `shared/`, lu par le site et par l'application ; il cache les entrées (page Activités, « Mes classes », quiz par l'IA « en devoir », onglet Jeux de l'application, route de l'écran de devoir) et les fiches d'aide qui en parlent. **Aucun fichier n'est supprimé** : les devoirs pourront revenir | Interrupteur éteint : plus aucun écran ni texte ne mentionne un devoir ; interrupteur allumé : tout revient | M | 1 |
| **Q-2** | La règle ESLint `max-lines` (300 lignes, hors lignes vides et commentaires) en **avertissement** dans `frontend/` et `mobile/` (§ 6, « Règles de code ») | Le lint liste les fichiers trop longs ; la CI reste verte | S | 1 |

**B-8, modifié le 11 octobre** : les devoirs étant masqués (D-1), le parcours « quiz donné en devoir puis rendu » sort de la liste. Proposition de remplacement, à valider par le chef de projet : « quiz généré par l'IA, relu puis créé », avec une fausse IA (un essai piloté existe déjà comme base).

### Ensuite : les lots gardés (§ 3.4)

Une fois les correctifs de priorité 1 terminés :

| Équipe | Lots |
|---|---|
| A | CQ-1 (route signée de démarrage, relais `/socket.io/` dans nginx), IA-7 (déploiement de l'IA, après la décision de l'école) |
| B | CQ-2 et CQ-3 (écran du projecteur dans Planner, lien « Quiz »), puis les lots R de priorité 2 de `remarques-par-profil.md` (R-6, R-14) |

Les réponses aux critiques des dix profils (administrateur, professeur, étudiant, investisseur, acheteur…) sont dans `remarques-par-profil.md`. Un de ses lots est de priorité 1 et s'ajoute à ce plan : **R-11**, les séances sans appel validé marquées « à vérifier » avant l'export de la paie des vacataires (équipe A pour le calcul, équipe B pour l'écran).

## 6. Règles de travail entre les deux équipes

- **Un dossier de travail par équipe.** Deux équipes dans le même dossier se marchent dessus : une branche ne peut être active qu'une fois par dossier, et un `git add` large emporte le travail en cours de l'autre. Chaque équipe travaille dans sa propre copie (`git worktree add ../planner-b b/…`, ou un second clone). C'est la condition pour que la règle suivante tienne.
- **Branches** : on part de `main` et on préfixe par l'équipe (`a/sauvegarde-quotidienne`, `b/supprimer-react-query`). Une branche et une PR par lot. Fusion par commit de fusion, CI verte obligatoire.
- **Qui commite** : chaque équipe commite son propre lot, fichier par fichier (`git add <fichiers du lot>`, jamais `git add .`), et le chef de projet fusionne les PR. À confirmer (§ 7), car jusqu'ici le chef de projet commitait lui-même tout le dossier.
- **Tests d'intégration du backend** : ils partagent une seule base (`hestim_test`). Deux suites lancées en même temps se détruisent leurs données : on les lance l'une après l'autre, et chaque dossier de travail a sa propre base de test (`DB_NAME`).
- **Revue croisée** : chaque PR est relue par une personne **de l'autre équipe**. Les deux équipes connaissent ainsi tout le projet, et la soutenance ne dépend pas d'une seule personne.
- **Commits** : un commit par changement cohérent, avec un message qui dit ce qui change et pourquoi (« supprimer la couche React Query inutilisée »). Plus de commit fourre-tout.
- **Fichiers partagés** :
  - `frontend/src/i18n/fr.js` et `en.js`, `frontend/src/services/api.js` : équipe B seulement ;
  - `backend/routes/` et `backend/services/` : équipe A seulement ;
  - `.github/workflows/ci-cd.yml` : modifié par A-4 puis par B-8. A fusionne en premier, B se met à jour avant d'ouvrir sa PR.
- **Contrat de l'API** : les correctifs de l'équipe A ne changent pas l'API (A-6 est un pur refactor). Tout changement de contrat (A-5) est annoncé dans la PR et appliqué côté site par l'équipe B dans la foulée.
- **Point hebdomadaire** du chef de projet : état des lots, blocages, et rien de neuf hors de ce plan.

### Règles de code (décision du 11 octobre 2026)

Demande du chef de projet : plus de longs fichiers, un travail par composants, un code facile à maintenir et commenté. Mesure du 11 octobre : 19 fichiers de plus de 400 lignes dans `frontend/src`, 11 dans `backend/`, aucun dans `mobile/src` ni dans `solver/`.

- **Un fichier, une responsabilité.** Sur le site et dans l'application, la page assemble ; le chargement des données va dans un hook (`useXxx`), chaque dialogue, tableau ou carte dans son composant. Sur le serveur : la route déclare, le contrôleur lit la requête et répond, la règle métier vit dans `services/`.
- **Repère de longueur : 300 lignes par fichier, 200 pour un contrôleur.** C'est un signal, pas le critère : un fichier court qui fait deux choses est aussi à découper. Le lint le signale en avertissement (Q-1, Q-2).
- **Tout fichier nouveau respecte le repère.** Un lot ne fait jamais grossir un fichier déjà trop long : il extrait d'abord dans un composant ou un service la partie qu'il doit modifier, puis la modifie là.
- **Pas de grand découpage avant la soutenance.** Les découpages complets (A-6, B-7) restent en priorité 3 : ils touchent beaucoup de code sans rien changer de visible, donc ils se font avec les tests des parcours (B-8) en place.
- **Commentaires.** Chaque fichier commence par un commentaire qui dit son rôle, comme le font déjà les écrans de l'application. Chaque fonction exportée a une ligne qui dit ce qu'elle rend. Un commentaire explique **pourquoi** (une règle de l'école, un piège, une limite), pas ce que la ligne fait déjà. En français, comme le reste du code. Pas de code laissé en commentaire.
- **Noms** : en français dans le code récent ; un fichier ancien garde sa langue tant qu'il n'est pas repris.
- **Revue** : la personne qui relit une PR refuse un fichier nouveau trop long, une fonction exportée sans commentaire ou une logique métier écrite dans une page ou un contrôleur.

## 7. Décisions ouvertes (chef de projet)

- **Date de la soutenance** : elle décide de ce qui tient avant, en particulier CQ-1 à CQ-3 et les tests des parcours de démonstration (B-8), les lots gardés les plus longs. L'application mobile des enseignants n'en dépend plus : elle est reportée à un plan futur (décision du 11 octobre).
- **Organisation du travail** (§ 6) : un dossier de travail par équipe, et chaque équipe commite son lot ? Ou le chef de projet continue de commiter, et dans ce cas comment sépare-t-il les lots ?
- **Historique du dépôt** (0-1) : le dépôt devient privé tout de suite ; reste à décider quand réécrire l'historique. La réécriture oblige tout le monde à recloner et casse les liens vers les anciens commits : la faire avant de séparer les équipes évite de la subir deux fois.
- **Défis du terminal dans un quiz** (J-1) : reporter après la soutenance, comme ce plan le recommande, ou maintenir la demande du 10 octobre ?
- **Fournisseur d'IA** : DeepSeek héberge ses serveurs hors du Maroc (loi 09-08, avis de la CNDP). Cette décision bloque IA-7.
- **Hébergement des sauvegardes** (A-3) : quel stockage hors du serveur (autre VPS, stockage objet, Drive de l'école), et qui en détient l'accès ?
