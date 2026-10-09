# Scénarios de test à faire sur écran (recette)

Version visée : **maj28** (tout ce qui a changé depuis maj13, en ligne au 8 octobre 2026 : ClassQuiz, double authentification, optimisation des requêtes, journal de sécurité et durcissements OWASP).
Cocher chaque case (`[x]`) une fois le résultat attendu constaté. Noter tout écart sous le scénario.

## Préparation

- Comptes : 1 admin, 2 enseignants, 3 étudiants du même groupe (A, B, C), 1 étudiant d'un autre groupe.
- Étudiants de test et séance du jour pour l'appel : script `deploy/vps/demo/etudiants-test-appel.mjs` (groupe « TEST APPEL », `test.appel1@hestim.ma`…, mots de passe ajoutés au fichier des identifiants du serveur ; `RESET=1` remet l'essai à zéro).
- Quiz de test : script `deploy/vps/demo/quiz-test.py` (« Test HESTIM : culture numérique », 7 questions), après une première connexion de l'enseignant à quiz.finadmintech.fr.
- Expo Go : chaque testeur scanne le QR de `npx expo start` avec l'appareil photo de l'iPhone (ou depuis Expo Go sur Android), sur le même Wi-Fi que le PC, sinon `npx expo start --tunnel` ; chacun se connecte avec **son** compte étudiant.
- Appareils : un ordinateur (site), au moins deux téléphones avec l'application (Expo Go), idéalement un iPhone et un Android.
- Une séance **aujourd'hui** pour l'enseignant et le groupe des étudiants A, B, C (sinon l'appel ne s'ouvre pas).

---

## 0. Mise en production

- [ ] Le script `appliquer-maj.sh` se termine sans erreur et affiche les contrôles 404, 400, 200, 200, puis 200 (quiz), 401 (API ClassQuiz) et 401 (bibliothèque).
- [ ] `docker exec hestim_backend node -p process.versions.tz` répond `2026c`.
- [ ] `https://planner.finadmintech.fr/api/activites` répond 401 (et non 404).
- [ ] Le script de démo des stages s'exécute (retour de stage Cybel avec photo, 128 idées de projets).
- [ ] Sur GitHub, la CI de `main` est verte (Build Frontend, Test Backend avec l'étape « Banc des requêtes SQL », Test Mobile, Test Solveur).
- [ ] Au démarrage, le journal du backend indique les migrations 0035 (index), 0036 (journal de sécurité) et 0037 (compteurs de connexion) appliquées, sans erreur.

## 1. Connexion et sécurité

- [ ] Connexion réussie sur le site et dans l'application, déconnexion, reconnexion.
- [ ] 10 mauvais mots de passe sur un même compte : le 11e essai est refusé (« trop de tentatives sur ce compte »), même avec le bon mot de passe ; il repasse après 15 minutes.
- [ ] Plusieurs étudiants qui se connectent correctement depuis le Wi-Fi de l'école ne sont jamais bloqués.
- [ ] Changer son mot de passe (profil) sur l'ordinateur : la session du téléphone est fermée, celle de l'ordinateur reste ouverte.
- [ ] L'admin réinitialise le mot de passe d'un étudiant : l'étudiant est déconnecté partout et doit choisir un nouveau mot de passe à la connexion suivante.
- [ ] 10 mauvais mots de passe sur un compte, puis `docker restart hestim_backend` : le compte reste bloqué (les compteurs de connexion survivent au redémarrage).

### Choix du mot de passe (NIST)

À faire sur un compte de test, par « Changer mon mot de passe » (profil) et par le lien « Mot de passe oublié ».

- [ ] Une phrase de passe sans majuscule ni chiffre (`le train de nuit pour fes`) est acceptée.
- [ ] Moins de 12 caractères : refusé, avec le message « au moins 12 caractères ».
- [ ] Un mot de passe courant (`motdepasse123`) ou contenant le nom, le prénom ou l'email du compte : refusé, avec la raison affichée.
- [ ] Un mot de passe connu des fuites (`Password1234!`) : refusé (« figure dans une fuite de données connue »).
- [ ] Les comptes existants se connectent toujours avec leur mot de passe actuel, même s'il ne suit pas les nouvelles règles.
- [ ] Import d'utilisateurs avec un mot de passe provisoire trop court : la ligne est refusée et signalée dans le rapport, les autres sont créées.

### Double authentification

- [ ] Après la mise à jour, chaque administrateur est conduit à la page « Double authentification » et ne peut rien faire d'autre avant de l'avoir configurée.
- [ ] Le QR code se scanne dans Google Authenticator (ou Microsoft Authenticator, 2FAS) ; la clé affichée sous le QR fonctionne aussi à la main.
- [ ] Un code faux est refusé ; le bon code active la double authentification et affiche 10 codes de secours (copier, télécharger, « J'ai rangé ces codes » obligatoire).
- [ ] Connexion suivante : mot de passe, puis écran « Double authentification » ; le code de l'application ouvre la session.
- [ ] Un code de secours fonctionne une seule fois (avec ou sans tiret, majuscules ou minuscules).
- [ ] Le même code de l'application, réutilisé tout de suite, est refusé.
- [ ] 5 codes faux : retour au mot de passe (« Connexion expirée ou trop d'essais »).
- [ ] 10 codes faux en tout, sur plusieurs connexions de suite : même le bon code est refusé (« Trop de codes incorrects : réessayez dans 15 minutes ») ; il passe à nouveau après 15 minutes.
- [ ] Paramètres : bloc « Double authentification » (Activée / Non activée) et bouton « Gérer » ; nouveaux codes de secours sur présentation d'un code.
- [ ] Un administrateur ne peut pas la désactiver ; un enseignant peut l'activer puis la désactiver (mot de passe + code).
- [ ] Page Utilisateurs : sur un compte où elle est active, l'icône « Réinitialiser la double authentification » demande confirmation, déconnecte la personne ; sa propre réinitialisation est refusée.
- [ ] Les étudiants ne voient rien de nouveau et se connectent comme avant (site et application).
- [ ] Mot de passe oublié : l'email arrive, le lien fonctionne une fois, puis est refusé.
- [ ] Depuis l'application, ouvrir la bibliothèque ou le site : on arrive connecté, sans ressaisir le mot de passe.
- [ ] Une erreur serveur (si on en provoque une) n'affiche qu'un message générique, jamais de détail technique.

### Journal de sécurité (menu Personnes, administration)

- [ ] Les essais des scénarios ci-dessus y apparaissent, du plus récent au plus ancien : connexions réussies et refusées (en rouge), codes faux, blocage, changements de mot de passe, double authentification réinitialisée.
- [ ] L'adresse IP affichée est celle du testeur, pas une adresse interne du serveur (`172.…`, `10.…`).
- [ ] L'admin désactive puis réactive un compte : deux lignes « Compte modifié », « par » son nom, avec « Statut : actif → désactivé » puis l'inverse.
- [ ] Les filtres (type d'événement, dates) fonctionnent ; un clic sur un email n'affiche que ce compte, la croix de la pastille retire le filtre.
- [ ] Aucun mot de passe ni code n'apparaît, même dans les détails.
- [ ] Un enseignant ou un étudiant n'a pas accès à cet écran.
- [ ] L'écran s'affiche correctement en anglais et sur un téléphone.

### Navigateur (politique de contenu)

- [ ] `curl -sI https://planner.finadmintech.fr/ | grep -i content-security` montre `Content-Security-Policy` (appliquée) ; sur `/biblio/`, seulement `Content-Security-Policy-Report-Only`.
- [ ] Console du navigateur (F12) ouverte en parcourant le tableau de bord, les emplois du temps, les statistiques, Paramètres et le journal de sécurité : aucun message « Content Security Policy » ou « Refused to ».
- [ ] L'impression de l'emploi du temps et les exports (PDF, Excel, CSV, agenda) fonctionnent toujours.
- [ ] StudyLib (`/biblio`) fonctionne comme avant.

## 2. Appel par QR code (enseignant et étudiants)

### Ouverture et scan

- [ ] L'enseignant ouvre l'appel de la séance du jour : un QR s'affiche et change toutes les 30 s.
- [ ] Un autre enseignant ou un étudiant ne peut pas ouvrir cet appel.
- [ ] L'appel d'une séance qui n'est pas aujourd'hui refuse de s'ouvrir.
- [ ] L'étudiant A scanne depuis l'application : « présent », et il apparaît coché chez l'enseignant.
- [ ] A scanne une 2e fois : « déjà présent », pas de doublon.
- [ ] Le QR scanné avec l'appareil photo du téléphone (hors application) ouvre la page `/presence` qui explique d'utiliser l'application.
- [ ] Une photo du QR envoyée à un absent ne marche plus après une minute (code expiré).
- [ ] L'étudiant d'un autre groupe est refusé.

### Un compte = un téléphone (lot 2)

- [ ] B se connecte sur le téléphone de A (déjà utilisé par A dans la séance) et scanne : refusé ; chez l'enseignant, puces orange « même téléphone que … » sur A et B.
- [ ] C (jamais scanné) se connecte sur le téléphone de A lors d'une **autre** séance et scanne : refusé, puce « téléphone de A ».
- [ ] A scanne avec un autre téléphone que le sien : refusé avec « Votre compte est lié à un autre téléphone… », puce « pas son téléphone habituel ».
- [ ] Après réinstallation de l'application (Android surtout), A est refusé tant que l'admin n'a pas délié son téléphone.
- [ ] La déconnexion puis la reconnexion de A sur **son** téléphone ne change rien : il pointe normalement.

### Vérification surprise et fin d'appel

- [ ] L'enseignant lance une vérification de 1 à 5 étudiants : seuls des présents par scan non vérifiés sont tirés.
- [ ] « Présent » : l'étudiant est marqué « vu en salle ». « Absent » : sa présence est retirée et il est signalé.
- [ ] L'enseignant coche et décoche un étudiant à la main.
- [ ] « Terminer l'appel » : plus aucun scan accepté, la séance passe en « réalisée ».
- [ ] L'étudiant retrouve la séance dans ses présences.

### Écran admin « Signalements de présence » (menu Planification)

- [ ] Tous les signalements ci-dessus apparaissent, du plus récent au plus ancien, avec étudiant, motif, séance et date.
- [ ] Le filtre par motif fonctionne.
- [ ] La date de liaison du téléphone s'affiche ; « Délier le téléphone » demande confirmation, puis affiche « Aucun téléphone lié ».
- [ ] Après déliaison, le prochain scan de l'étudiant lie son nouveau téléphone et il est présent.
- [ ] Un enseignant ou un étudiant n'a pas accès à cet écran.
- [ ] L'écran s'affiche correctement en anglais et sur un téléphone (largeur étroite).

## 3. Administration du planning

- [ ] Une seule entrée « Emplois du temps » avec les onglets Grille, Liste des séances, Mois.
- [ ] L'ancienne adresse « Salles disponibles » redirige vers Réservations.
- [ ] « Utilisateurs » ne crée que des comptes administrateurs ; étudiants et enseignants se créent depuis leurs pages.
- [ ] Le rôle d'un compte n'est pas modifiable depuis l'écran « Utilisateurs ».
- [ ] Le tableau de bord admin est inchangé et ses statistiques s'affichent vite (moins d'une seconde).
- [ ] Statistiques : par défaut sur l'année universitaire en cours (rappel « Année 2026-2027 · du … au … » sous les filtres).
- [ ] Le sélecteur « Périmètre » propose chaque année, « Toutes les années » et « Période personnalisée » (deux dates) ; les chiffres changent en conséquence.
- [ ] La liste des séances s'affiche vite, même sur un mois chargé.
- [ ] Suivi du réalisé, onglet des modules : s'affiche en moins d'une seconde.
- [ ] Export CSV des heures des vacataires et export CSV de l'emploi du temps : s'ouvrent dans Excel avec les bonnes colonnes, même pour une salle ou un groupe dont le nom contient « ; » ou des guillemets.
- [ ] Un nom qui commence par `=` (par ex. une entreprise de vacataire `=1+1`) s'affiche tel quel dans Excel, sans être calculé.
- [ ] L'EDT du mois s'imprime en PDF au format HESTIM.

## 4. Activités (quiz, devoirs, jeux)

- [ ] L'enseignant propose le terminal Linux dans un de ses modules, en choisissant un but (vérifier la compréhension ou s'entraîner) et une notion.
- [ ] Un étudiant inscrit dans ce module voit le jeu (site et application) et peut y jouer ; sa progression est enregistrée.
- [ ] Un étudiant d'un autre module ne voit pas ce jeu et ne peut pas y accéder par son adresse (refus).
- [ ] L'enseignant donne un devoir quiz : l'étudiant le rend une fois, voit sa note, et la correction après la date limite.
- [ ] Devoir « fichier » : l'enseignant dépose l'énoncé, l'étudiant dépose sa copie (PDF), l'enseignant la note ; l'étudiant est prévenu.
- [ ] Un fichier renommé (par ex. une image en `.pdf`) est refusé.
- [ ] L'administration ne gère pas les activités (pas d'accès).

### Quiz en direct : anti-triche (lot 3)

À faire avec une partie ClassQuiz lancée par l'enseignant depuis Planner, et deux étudiants côte à côte.

- [ ] Mode « normal » : sur deux téléphones voisins, les réponses d'un QCM ne sont pas dans le même ordre ; chacun est noté juste s'il choisit la bonne réponse.
- [ ] Question à cases à cocher en mode « normal » : ordre différent d'un téléphone à l'autre, et la bonne combinaison est bien comptée juste.
- [ ] Mode « kahoot » : les formes et couleurs du téléphone correspondent toujours à celles du projecteur (ordre non mélangé).
- [ ] Pendant une question, l'étudiant passe sur une autre application 5 s puis revient : une sortie est comptée.
- [ ] Sortie très courte (moins d'une seconde) ou après avoir répondu : rien n'est compté.
- [ ] Sur ordinateur, passer à une autre fenêtre pendant une question compte aussi une sortie.
- [ ] Application mobile, sans partie en cours : aucun quiz ni « Saisir un code » dans Activités, ni dans le menu des espaces.
- [ ] L'enseignant lance une partie pendant la séance : dans les 20 s, la ligne « Quiz en cours » apparaît dans Activités ; « Rejoindre » ouvre la partie **dans l'application** (pas de page web), avec le prénom et l'initiale de l'étudiant.
- [ ] Chaque type de question se joue : QCM (tuiles colorées), cases à cocher + « Valider », réponse libre, curseur (-10, -1, +1, +10), ordre (flèches) ; le compte à rebours s'arrête à 0 (« Temps écoulé »).
- [ ] Après chaque question : « Bonne réponse » et les points gagnés, ou « Mauvaise réponse » ; en fin de partie, le bilan puis « Voir le classement ».
- [ ] Mode « kahoot » : le téléphone affiche les quatre formes du projecteur, dans les mêmes couleurs.
- [ ] Pendant une question, passer l'application en arrière-plan 5 s puis revenir : la sortie est comptée (iPhone et Android).
- [ ] Capture d'écran pendant la partie : bloquée sur Android (image noire ou refus) ; sur iPhone, l'enregistrement de l'écran est masqué.
- [ ] iPhone : une capture faite pendant une question apparaît en fin de partie dans la colonne « Sorties / captures » de l'enseignant (« 1 capture »).
- [ ] Lancement d'une partie dans ClassQuiz : le choix « Projecteur (recommandé) » est sélectionné par défaut, l'autre s'appelle « Sur chaque téléphone », chacun avec son explication.
- [ ] Téléphone mis en veille quelques secondes pendant l'attente : « Connexion perdue, reconnexion… » puis la partie reprend.
- [ ] Deux étudiants au même prénom et même initiale : le second joue sous « Prénom N. 2 », et chaque score revient au bon étudiant dans Planner.
- [ ] La croix demande confirmation avant de quitter la partie.
- [ ] Fin de partie : dans Planner, les résultats du quiz montrent à l'enseignant la colonne « Sorties » (nombre · durée), en orange pour les étudiants concernés.
- [ ] Un étudiant qui consulte les résultats ne voit aucune colonne « Sorties », ni pour lui ni pour les autres.
- [ ] Le projecteur n'affiche jamais de nom ni de sortie.

## 5. Application mobile : bibliothèque et stages

- [ ] La bibliothèque s'affiche en étagères de couvertures : les modules, puis les documents d'un module.
- [ ] La fiche d'un document indique sa taille ; au-delà de 10 Mo en données mobiles, une confirmation est demandée.
- [ ] Le téléchargement montre sa progression et peut être annulé.
- [ ] Un document téléchargé porte une coche ✓ et s'ouvre ensuite hors ligne (mode avion).
- [ ] PDF : lecteur intégré sur iPhone et sur Android.
- [ ] Word, PowerPoint, ZIP : proposés via « Ouvrir avec ».
- [ ] La recherche trouve des modules, documents, stages et idées de projets.
- [ ] Les idées de projets se chargent par pages de 12.
- [ ] Les cartes de stage affichent leur photo (dont le retour Cybel et la photo du robot).
- [ ] « Partager mon stage » avec une photo : la photo est envoyée réduite et le retour apparaît après modération.

## 6. StudyLib (site, `/biblio`)

- [ ] La fiche d'un document importé depuis Google Drive (sans auteur) s'ouvre sans erreur.
- [ ] Les panneaux latéraux s'ouvrent, dont la fiche détaillée d'un stage.
- [ ] La page d'accueil s'affiche à la bonne taille sur iPhone (pas dézoomée).
- [ ] Un document non encore validé n'est visible que de son auteur et de l'admin.

## 7. Agenda (abonnement ICS)

- [ ] S'abonner à son agenda depuis le profil (Google Agenda et iPhone).
- [ ] Une séance à 9 h apparaît à **9 h** dans l'agenda (pas 8 h ni 10 h).
- [ ] Renouveler l'adresse de l'agenda : l'ancienne adresse ne fonctionne plus.

## 8. Textes et affichage

- [ ] Aucun tiret long (—) visible sur le site, l'application et StudyLib, y compris dans les noms en base.
- [ ] Les valeurs absentes s'affichent « - » et les listes vides « Aucun ».
- [ ] Les statuts de séance (en cours, reportée, annulée) s'affichent dans l'application.
- [ ] Le site s'affiche correctement en français et en anglais.

## 9. Annonces, réservations, examens (non-régression)

- [ ] Annonce ciblée sur un groupe avec pièce jointe : reçue par les étudiants du groupe seulement, accusés de lecture visibles par l'auteur.
- [ ] Réservation de salle par un enseignant, validée ou refusée par l'admin.
- [ ] Examen créé par l'admin, surveillants affectés, publication visible par les étudiants concernés.
- [ ] Notifications : la page affiche les plus récentes (200 au plus) ; le badge compte toutes les non lues.
- [ ] Emploi du temps de l'étudiant (application) : les séances mutualisées avec un autre groupe apparaissent.

---

## Écarts constatés

| Scénario | Ce qui s'est passé | Appareil / navigateur |
|---|---|---|
|  |  |  |
