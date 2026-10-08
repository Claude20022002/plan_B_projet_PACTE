# Scénarios de test à faire sur écran (recette)

Version visée : **maj22** (tout ce qui a changé depuis maj13, en ligne au 8 octobre 2026).
Cocher chaque case (`[x]`) une fois le résultat attendu constaté. Noter tout écart sous le scénario.

### Préparation

- Comptes : 1 admin, 2 enseignants, 3 étudiants du même groupe (A, B, C), 1 étudiant d'un autre groupe.
- Appareils : un ordinateur (site), au moins deux téléphones avec l'application (Expo Go), idéalement un iPhone et un Android.
- Une séance **aujourd'hui** pour l'enseignant et le groupe des étudiants A, B, C (sinon l'appel ne s'ouvre pas).

---

## 0. Mise en production

- [ ] Le script `appliquer-maj.sh` se termine sans erreur et affiche les contrôles 404, 400, 200, 200, 401.
- [ ] `docker exec hestim_backend node -p process.versions.tz` répond `2026c`.
- [ ] `https://planner.finadmintech.fr/api/activites` répond 401 (et non 404).
- [ ] Le script de démo des stages s'exécute (retour de stage Cybel avec photo, 128 idées de projets).
- [ ] Sur GitHub, la CI de `main` est verte (Build Frontend, Test Backend, Test Mobile, Test Solveur).

## 1. Connexion et sécurité

- [ ] Connexion réussie sur le site et dans l'application, déconnexion, reconnexion.
- [ ] 10 mauvais mots de passe sur un même compte : le 11e essai est refusé (« trop de tentatives sur ce compte »), même avec le bon mot de passe ; il repasse après 15 minutes.
- [ ] Plusieurs étudiants qui se connectent correctement depuis le Wi-Fi de l'école ne sont jamais bloqués.
- [ ] Changer son mot de passe (profil) sur l'ordinateur : la session du téléphone est fermée, celle de l'ordinateur reste ouverte.
- [ ] L'admin réinitialise le mot de passe d'un étudiant : l'étudiant est déconnecté partout et doit choisir un nouveau mot de passe à la connexion suivante.
- [ ] Mot de passe oublié : l'email arrive, le lien fonctionne une fois, puis est refusé.
- [ ] Depuis l'application, ouvrir la bibliothèque ou le site : on arrive connecté, sans ressaisir le mot de passe.
- [ ] Une erreur serveur (si on en provoque une) n'affiche qu'un message générique, jamais de détail technique.

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
- [ ] La liste des séances s'affiche vite, même sur un mois chargé.
- [ ] L'EDT du mois s'imprime en PDF au format HESTIM.

## 4. Activités (quiz, devoirs, jeux)

- [ ] L'enseignant propose le terminal Linux dans un de ses modules, en choisissant un but (vérifier la compréhension ou s'entraîner) et une notion.
- [ ] Un étudiant inscrit dans ce module voit le jeu (site et application) et peut y jouer ; sa progression est enregistrée.
- [ ] Un étudiant d'un autre module ne voit pas ce jeu et ne peut pas y accéder par son adresse (refus).
- [ ] L'enseignant donne un devoir quiz : l'étudiant le rend une fois, voit sa note, et la correction après la date limite.
- [ ] Devoir « fichier » : l'enseignant dépose l'énoncé, l'étudiant dépose sa copie (PDF), l'enseignant la note ; l'étudiant est prévenu.
- [ ] Un fichier renommé (par ex. une image en `.pdf`) est refusé.
- [ ] L'administration ne gère pas les activités (pas d'accès).

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

---

## Écarts constatés

| Scénario | Ce qui s'est passé | Appareil / navigateur |
|---|---|---|
|  |  |  |
