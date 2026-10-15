# Prompt pour Claude Design — maquette de la plateforme HESTIM

> Copier tout ce qui suit la ligne de séparation dans Claude Design.
> Avant d'envoyer, compléter la ligne marquée **[À COMPLÉTER]** dans « Ce qui a déjà été essayé ».

---

Tu travailles à la fois comme **ingénieur logiciel**, **game designer spécialisé dans les jeux pédagogiques**, **designer UX/UI** et **enseignant en école d'ingénieurs**. Garde les quatre points de vue en tête à chaque écran :

- l'**ingénieur** vérifie que ce qu'il dessine se construit avec la stack existante (React 19 + MUI 7 pour le site, React Native/Expo pour l'application) et que chaque élément correspond à une vraie donnée ;
- le **game designer** rend les quiz et les jeux engageants en classe : rythme, retours immédiats, tension du minuteur, récompense, jeu en équipe ;
- le **designer** donne une identité propre à HESTIM, lisible, accessible et cohérente d'un écran à l'autre ;
- l'**enseignant** juge si l'écran sert vraiment la séance : est-ce qu'on le lance en 10 secondes devant 40 étudiants, est-ce qu'on le lit au fond d'un amphi, est-ce que l'étudiant comprend sans explication ?

Ta mission : proposer une **nouvelle direction visuelle** et la **maquette des écrans clés** de la plateforme HESTIM (Planner, Bibliothèque, Jeux, Quiz).

## 1. Le produit

**HESTIM Planner** est la plateforme de planification des cours et de réservation des salles de **HESTIM Engineering & Business School** (Casablanca, deux campus : Gandhi et Stendhal). C'est un projet étudiant (PACTE, cycle ingénieur 3IIIA) évalué par un jury, mais destiné à un vrai usage à l'école.

Elle :
- centralise les données pédagogiques (filières, groupes, cours, salles, enseignants, étudiants) ;
- empêche les conflits d'horaire (salle, enseignant ou groupe en double) ;
- génère automatiquement les emplois du temps sous contraintes, avec des versions qu'on peut réactiver ;
- prévient tout le monde des changements (report, annulation, changement de salle), sur le web et par notification push ;
- regroupe quatre **espaces**, toujours dans cet ordre et sous ces noms : **Planner**, **Bibliothèque**, **Jeux**, **Quiz**. Un sélecteur d'espaces dans la barre du haut mène à chacun en deux clics.

Promesse : « Votre emploi du temps accessible en un geste. »
Ton de l'école : professionnel, accessible, orienté action (« S'engager. Créer. Partager. »).

## 2. Les utilisateurs et leurs appareils

| Rôle | Appareil principal | Ce dont il a besoin |
|---|---|---|
| **Étudiant** | Téléphone, presque toujours | Savoir en 2 secondes où et quand est son prochain cours ; voir tout de suite un report ou une annulation ; sa semaine, son mois (format officiel imprimable), ses examens ; faire les quiz en direct et en devoir ; jouer aux jeux proposés ; accéder aux supports de cours. |
| **Enseignant** | Téléphone entre deux cours, ordinateur et vidéoprojecteur en salle | Son tableau du jour ; ses classes (appel, y compris par QR code projeté) ; déclarer ses disponibilités et ses vœux ; accepter les services proposés ; demander un report ; lancer un quiz en direct ou le donner en devoir (écrit à la main ou généré par IA) ; proposer un jeu et suivre la progression ; écrire à ses classes. |
| **Responsable de filière** | Ordinateur | Préparer le semestre de sa filière : maquette (modules CM / TD / TP), groupes, services des enseignants, revue des conflits, suivi. |
| **Administration / scolarité** | Ordinateur, longues séances, beaucoup de données | Calendrier (fériés marocains, Ramadan, examens), campus et salles, grilles horaires, génération automatique, conflits, demandes de report, imprévus (absences, salle en panne, journée annulée), examens et surveillances, réservations de salles, suivi du réalisé, statistiques (taux d'occupation, heures creuses et pics), utilisateurs, journal de sécurité. |
| **Jury PACTE** | Démonstration projetée | Voir chaque parcours de bout en bout sans explication orale. |

Les comptes sont créés par l'administration : il n'y a pas d'inscription publique. L'interface est **bilingue français / anglais**, en français par défaut.

## 3. Le métier à respecter

- **Format réel des emplois du temps HESTIM** : un document par groupe et par période d'environ 4 semaines, avec un en-tête du type « 1ère année du cycle Ingénieur d'État en Ingénierie Informatique et Intelligence Artificielle — 3A | IIA (S6) ». On y trouve une ligne par jour du lundi au samedi et, pour chaque séance, **Matière, Enseignant, Salle** (par exemple « HESTIM-STENDHAL : Étage 3 - Amphi C »).
- **Créneaux** : 09:00–10:45, 11:00–12:30, 13:30–15:15, 15:30–17:00 ; le vendredi après-midi, 14:30–16:15 et 16:30–18:00.
- **Marqueurs** à afficher : (P.S) première séance, (D.S) dernière séance, « + Évaluation », « En distanciel », « Blended learning », événements (journée culturelle, ateliers), encadrement de projet (« Projet PACTE »), cours dédoublés (Groupe 1 / Groupe 2), types CM / TD / TP.
- **États d'une séance** : planifiée, confirmée, en cours, reportée ou modifiée, annulée. Une couleur par état, qui garde le même sens partout : vert = en cours, prochaine ou confirmée ; orange = reportée ou modifiée ; rouge = annulée. Ces trois couleurs ne servent jamais de décoration.
- **Filières** : chaque filière a une couleur stable, identique dans les listes, la grille de la semaine et les graphiques. Cette couleur n'est jamais verte, orange ou rouge, pour ne pas être prise pour un état.
- **Conflits** : une séance en conflit est refusée avec la liste des règles enfreintes, et l'administration peut forcer avec une justification tracée. Il faut un dialogue de conflit clair qui propose des alternatives.

## 4. Les jeux et les quiz (à soigner particulièrement)

- **Quiz en direct** (moteur ClassQuiz, au nom affiché « PlannerQuiz ») :
  - l'enseignant lance depuis sa séance, et l'écran projeté affiche le code de partie et un QR code ;
  - les étudiants rejoignent sur leur téléphone, sans compte et avec le code déjà rempli quand ils viennent de Planner ;
  - question projetée avec minuteur, et réponses en grandes tuiles (une couleur **et** une forme chacune, pour les daltoniens) ;
  - après chaque question : la bonne réponse, la répartition des réponses, puis le classement ;
  - podium à la fin ;
  - **mode équipe** : 2 à 8 équipes choisies par les joueurs, avec un score d'équipe égal à la moyenne de ses membres et un classement des équipes ;
  - **nuage de mots** pour les réponses libres ;
  - **anti-triche** : l'enseignant voit discrètement qui a quitté l'écran pendant une question.
- **Quiz en devoir** : un quiz à faire avant une date, noté, que l'enseignant suit (qui l'a fait, les scores).
- **Quiz générés par IA** : l'enseignant décrit le sujet, relit et corrige le brouillon question par question, puis le lance ou le donne en devoir.
- **Jeux intégrés** :
  - **Terminal Linux** : 66 défis joués dans un terminal simulé, avec la progression visible par l'étudiant et par l'enseignant ;
  - un jeu de **simulation d'entreprise par équipes** existe aussi (« Reactik », 8 phases, coaching en direct de l'enseignant). Il est à prévoir comme une tuile de plus dans l'espace Jeux.
- L'enseignant **propose** un jeu dans ses modules et **suit** la progression de ses étudiants.

Points de vue à croiser : l'écran projeté se lit à 10 m ; le téléphone de l'étudiant ne montre que l'essentiel (une action à la fois, de grandes cibles tactiles) ; l'enseignant garde la main (passer, mettre en pause, révéler, terminer) sans quitter l'écran projeté.

## 5. Ce qui a déjà été essayé (ne pas refaire)

1. **« Le Hall des Départs »** (version actuelle) : chaque séance est une ligne d'un panneau de départs de gare, en noir mat dans un cadre bleu marine, en capitales condensées, avec des lettres qui basculent en volets quand un statut change. Le principe « l'information qui change saute aux yeux » est bon. Le rendu a été jugé **trop sombre et pas assez accueillant** pour un produit scolaire.
2. **Refonte en « cartes claires »** (essayée le 13 octobre, abandonnée) : sol gris très clair `#F5F7FB`, cartes blanches arrondies à 12 px avec ombres douces, mode nuit en ardoise, et quiz en « salle de jeu » claire et colorée. Elle **n'a pas plu** : **[À COMPLÉTER : ce qui n'a pas plu, par exemple trop générique, ressemble à n'importe quel SaaS, manque d'identité HESTIM…]**.

Ce que je veux : une **troisième direction**, qui garde la force de la première (le changement se voit au premier coup d'œil, la fidélité au planning HESTIM) sans son noir, et qui évite le côté générique de la seconde. Propose **2 ou 3 directions contrastées** sur un même écran (le tableau de l'étudiant sur téléphone), en expliquant le parti pris de chacune. Ensuite, décline la direction la plus forte.

## 6. Contraintes de marque et d'accessibilité

- **Logo officiel** : symbole en triangles + logotype « HESTIM » (PNG, pas de SVG fourni).
- **Couleurs du logo**, d'où vient toute la palette : bleu marine `#001861`, orange `#F26322`, vert `#137D3F`, rouge `#DB1F26`. Le rouge et le vert du logo s'éclaircissent ou s'assombrissent pour tenir les contrastes, et ne servent qu'aux états.
- **Typographie actuelle** : Barlow et Barlow Condensed. Tu peux proposer autre chose si tu le justifies.
- **Accessibilité WCAG 2.2 AA** : contrastes, navigation clavier complète côté administration, cibles tactiles d'au moins 44 px sur téléphone, information jamais portée par la couleur seule, respect de `prefers-reduced-motion`.
- **Mode clair par défaut** ; un mode nuit au choix est bienvenu.
- **Densité adaptée au rôle** : beaucoup de données alignées pour l'administration sur grand écran ; une réponse en 2 secondes pour l'étudiant et l'enseignant sur téléphone.
- **Navigation actuelle** : sur ordinateur, un rail fixe à gauche, organisé en sections (Planning, Scolarité, Personnes, Établissement pour l'administration). Sur téléphone, un bandeau en haut et une barre d'onglets en bas (Tableau · Semaine · [Mes classes pour l'enseignant] · Alertes · Compte). Tu peux la repenser, mais chaque rubrique doit rester atteignable.
- **Ne rien inventer** : aucun témoignage, chiffre d'adoption ou logo de client. Les données affichées doivent être plausibles pour HESTIM (filières IIA, Génie civil, Management… ; salles « Amphi C », « Salle 204 », « Labo info 2 » ; campus Gandhi et Stendhal).

## 7. Écrans à maquetter, par ordre de priorité

1. **Étudiant, téléphone** : tableau du jour (prochaine séance en vedette avec salle, campus, compte à rebours ; séances du jour ; changements récents en évidence).
2. **Étudiant, téléphone** : semaine, puis mois au format officiel imprimable.
3. **Enseignant, téléphone** : tableau du jour et « Mes classes » avec l'appel (liste et QR code projeté).
4. **Quiz projeté** : salle d'attente (code + QR + joueurs qui arrivent), question avec minuteur, révélation et répartition, classement, podium, classement par équipes.
5. **Quiz côté étudiant, téléphone** : rejoindre (code, pseudo, choix d'équipe), répondre, retour bonne ou mauvaise réponse, rang.
6. **Enseignant** : création ou relecture d'un quiz généré par IA, puis lancement (en direct ou en devoir).
7. **Espace Jeux** : catalogue (Terminal Linux, simulation d'entreprise, quiz en devoir) avec la progression, et l'écran de jeu du Terminal Linux.
8. **Administration, ordinateur** : tableau de bord (changements et conflits à traiter d'abord, occupation des salles), grille de la semaine par groupe / enseignant / campus, et le **dialogue de conflit** avec alternatives et forçage justifié.
9. **Administration** : génération automatique (lancer, suivre, comparer les versions, réactiver une version) et statistiques (taux d'occupation, heures creuses et pics).
10. **Connexion** et **sélecteur d'espaces** (Planner, Bibliothèque, Jeux, Quiz).
11. **Notifications** : report, annulation, changement de salle, quiz en devoir à faire, partie de quiz lancée.

## 8. Ce que j'attends en retour

- Les 2 ou 3 directions, chacune avec son nom, son parti pris en deux phrases, sa palette, ses typographies et l'écran test.
- Pour la direction retenue : les jetons (couleurs avec leur rôle, typographie, rayons, espacements, ombres ou filets), les composants clés (ligne de séance, pastille d'état, carte de séance en vedette, tuile de réponse de quiz, minuteur, podium, rail et barre d'onglets, dialogue de conflit), puis les écrans de la liste ci-dessus.
- Pour chaque écran, une note courte des quatre points de vue : faisabilité technique, ressort ludique s'il y en a un, choix de design, intérêt pédagogique ou usage en classe.
- Tous les textes en **français** ; signale ceux qui risquent de déborder en anglais.
