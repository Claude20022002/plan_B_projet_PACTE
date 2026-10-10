# Plan : l'espace de l'enseignant (classe, appel projeté, quiz en direct, mobile, aide)

Statut : **à faire**. Rédigé le 10 octobre 2026, après la livraison de « Mes classes » et du rappel de l'appel. Ce plan complète `docs/plans/quiz-ia.md` (lots IA-4 à IA-7 et CQ-1 à CQ-3), sans le remplacer.

## 1. Objectif

L'enseignant fait tout ce qui concerne sa classe depuis un seul endroit, sur son ordinateur comme sur son téléphone :

- faire l'appel en projetant le QR code, sans rien montrer d'autre à la salle ;
- animer un quiz en direct au moins aussi bien qu'avec Wooclap, que l'école utilise aujourd'hui ;
- retrouver les mêmes actions sur son téléphone, synchronisées avec son portail ;
- être guidé à la première utilisation, et trouver de l'aide à tout moment.

## 2. Où on en est

| Élément | État |
|---|---|
| Page « Mes classes » (`/mes-classes`) : classe en cours, appel, devoir ou quiz, message à la classe, offre de stage, supports | fait le 10 octobre 2026, pas encore déployé |
| Rappel de l'appel 5 minutes avant la fin de la séance | fait : notification et bandeau sur toutes les pages de Planner. **Pas de push** : l'application mobile refuse les comptes enseignants |
| Appel par QR code (`/appel/:id`) | en production. L'écran affiche le QR **avec** le menu de Planner et la liste nominative des étudiants ; la fenêtre de projection (lot P-1) est écrite, pas encore déployée |
| Quiz en direct | dans ClassQuiz (quiz.finadmintech.fr), hors de Planner. Lots CQ-1 à CQ-3 prévus |
| Application mobile | étudiants seulement (`mobile/src/auth/AuthContext.jsx` refuse tout autre rôle) |
| Guide et aide | rien, sauf l'animation du logo à l'ouverture de l'application mobile |

## 3. Appel : projeter le QR code sans montrer le portail

**Le problème.** En classe, l'enseignant diffuse l'écran de son ordinateur sur le grand écran tactile de la salle. Avec l'écran d'appel actuel, la salle voit aussi le menu de Planner, les notifications et la liste des étudiants avec leurs signalements.

| Option | Ce que voit la salle | Effort | Limite |
|---|---|---|---|
| **A. Fenêtre de projection** (recommandée) : un bouton « Projeter » ouvre une page sans menu, en plein écran, avec le QR, le nom de la classe, le compte des présents et le temps avant le prochain code | le QR seul | faible : la page réutilise `presenceAPI.code` et `presenceAPI.liste` (pour le compte seulement) | si l'enseignant partage tout son écran, il doit garder cette fenêtre au premier plan |
| **B. Deux fenêtres** : la projection sur le grand écran, la liste d'appel sur l'ordinateur ou le téléphone de l'enseignant | le QR seul ; l'enseignant coche à la main de son côté | aucun de plus que A : les deux pages lisent le même appel sur le serveur | demande un écran étendu, ou le téléphone (voir § 5) |
| **C. Lien de projection** : l'enseignant ouvre sur le navigateur du grand écran une adresse courte à usage unique, valable pour cette séance | le QR seul, sans aucune session de l'enseignant sur l'écran de la salle | moyen : jeton signé limité à la lecture du code d'une séance, expirant à la fin de l'appel | il faut saisir l'adresse sur le grand écran ; à sécuriser avec soin (le jeton donne le QR, donc la présence) |

**Décision (10 octobre 2026) :** A, avec B qui vient gratuitement. **C est écartée** : les grands écrans des salles ne servent qu'à recopier l'écran de l'ordinateur de l'enseignant, ils n'ont pas de navigateur à utiliser.

**Déroulement retenu (précisé le 10 octobre 2026) :** l'enseignant projette le QR ; les étudiants scannent ; **chaque étudiant qui a scanné apparaît à droite de l'écran**, ce qui lui confirme que sa présence est enregistrée ; à la fin, l'enseignant **valide l'appel** depuis cet écran. Il n'a rien à cocher. La vérification surprise reste facultative. Le temps avant le prochain code n'est pas affiché.

**Règles à garder :** le code change toujours toutes les 30 secondes ; l'écran projeté ne montre que les **présents** (ni les absents, ni les signalements de fraude) ; le scan reste réservé à l'application mobile (anti-fraude inchangée). Cocher à la main reste possible sur l'écran d'appel de l'enseignant, pour un étudiant sans téléphone.

**Liste complète pour l'enseignant :** une fois l'appel validé, le système compare les inscrits de la classe aux présences enregistrées et rend à l'enseignant la liste entière, **absents d'abord, puis présents** (écran d'appel `/appel/:id`, ouvert par « Voir la liste complète »). Un appel validé n'est plus rouvert par un simple retour sur cet écran : il faut le bouton « Rouvrir l'appel ».

**Essai du 10 octobre 2026 :** parcours déroulé dans un navigateur sur une base d'essai (8 étudiants, 5 scans simulés comme l'application mobile) : les 5 présents apparaissent, les 3 absents ne sont pas projetés, la validation donne « 5 présents · 3 absents » et la liste complète.

## 4. Quiz en direct : faire mieux que Wooclap

**Usage à l'école (confirmé le 10 octobre 2026) :** le quiz se déroule **question par question sur l'écran de la salle** ; les étudiants choisissent leur réponse **sur leur téléphone** ; l'écran montre **le nombre de choix pour chaque réponse**. Deux captures montrent un QCM et une question d'association. C'est ce déroulement que Planner doit reproduire en premier ; les autres capacités de Wooclap citées plus bas viennent de la connaissance générale du produit et restent à confirmer avec un enseignant.

**Conséquence pour CQ-2** (écran du projecteur dans Planner) : après chaque question, l'écran affiche le nombre de réponses par choix, avec la bonne réponse mise en avant. Constat dans le fork (`frontend/src/lib/play/admin/results.svelte`) : après une question, l'animateur voit le **classement des joueurs** ; le décompte par choix n'existe que pour les questions de vote (`voting_results.svelte`). Les résultats d'une question contiennent la réponse de chaque joueur : le décompte se calcule donc dans l'écran de Planner, sans changer le serveur de jeu.

### 4.1 Ce que Planner fait déjà mieux

- **Aucun code à saisir** : la partie est rattachée à la séance, les étudiants de la classe la reçoivent dans l'application.
- **Les scores vont au bon étudiant et au bon module**, et les groupes de TP s'affrontent.
- **Le même quiz sert en direct et en devoir noté**, corrigé par Planner.
- **Anti-triche** : réponses mélangées par joueur, sortie de l'application et captures signalées.
- **Génération par l'IA** depuis le support du cours (lots IA, en cours).
- **Données hébergées par l'école**, sans licence par enseignant.

### 4.2 Ce qui manque par rapport à Wooclap

| Manque | Détail | Lot |
|---|---|---|
| **Question d'association** (« Associez chaque notion à sa description ») | type absent de ClassQuiz, qui connaît `ABCD`, `CHECK`, `TEXT`, `RANGE`, `ORDER`, `VOTING`, `SLIDE` | W-1 |
| **Retour immédiat** après chaque réponse (« Félicitations ! », bonne réponse, explication) | à vérifier dans le joueur web et mobile ; l'explication n'existe pas dans le format | W-2 |
| **Mode « à son rythme »** : chaque étudiant avance seul, sans attendre l'enseignant | proche d'un devoir à durée courte ; à présenter comme un mode de la séance | W-3 |
| **Réactions et questions à l'enseignant** pendant la séance (pouce, « je n'ai pas compris », mur de questions) | rien aujourd'hui | W-4 |
| **Reprise des quiz existants** | import depuis un export Wooclap ou un fichier Excel | W-5 |
| **Autres types** : texte à trous, zone à trouver sur une image, échelle de notation | à faire seulement si les enseignants les utilisent vraiment | W-6 |

### 4.3 Préalable

Les lots CQ-1 à CQ-3 de `quiz-ia.md` (lancer et projeter la partie depuis Planner) passent avant : sans eux, l'enseignant change de site pour chaque quiz, ce qui est le premier défaut face à Wooclap.

Un nouveau type de question touche à chaque fois : le modèle et la notation dans le fork, le joueur web, le joueur mobile (`mobile/src/app/quiz.jsx`), la correction des devoirs (`backend/services/quiz/devoirs.js`), l'éditeur et la génération par l'IA.

## 5. Une partie mobile pour l'enseignant

**La synchronisation ne demande rien de particulier.** Le site et l'application lisent et écrivent le même serveur : une action faite sur le téléphone apparaît sur le portail au rafraîchissement suivant, et inversement. Il n'y a pas d'état gardé sur le téléphone, seulement un cache de lecture hors ligne.

| Option | Avantages | Limites |
|---|---|---|
| **A. Ouvrir l'application existante aux enseignants** (recommandée) | vrai push (rappel de l'appel), même application que les étudiants, tableau et semaine déjà écrits | il faut la double authentification dans la connexion mobile, et des écrans propres à l'enseignant |
| **B. Site installable (PWA) avec push web** | rapide, aucun passage par les magasins d'applications | push web peu fiable sur iPhone (il faut installer le site sur l'écran d'accueil) ; pas de hors-ligne sérieux |
| **C. Application séparée pour les enseignants** | séparation nette | deux applications à maintenir et à publier : écarté |

**Écrans de l'enseignant dans l'application (option A) :**

1. **Tableau** : séance en cours et suivantes, confirmation d'une séance, demande de report.
2. **Ma classe** : la séance en cours avec ses actions, comme `/mes-classes`.
3. **Appel** : liste à cocher, compte des présents, fin de l'appel ; le QR affichable sur le téléphone en secours. Avec la projection du § 3, le téléphone devient la télécommande de l'appel.
4. **Rappel de l'appel en push**, 5 minutes avant la fin.
5. **Message à la classe** et offre de stage (annonces), avec photo ou PDF.
6. **Devoirs et quiz** : donner un de ses quiz en devoir, voir les rendus ; lancer un quiz en direct et **le piloter depuis le téléphone** (question suivante) pendant que la salle voit l'écran projeté (dépend de CQ-2).

**Points de sécurité :** double authentification obligatoire comme sur le site ; le scan de présence reste refusé aux enseignants ; la liaison compte-téléphone de l'anti-fraude ne concerne que les étudiants.

## 6. Guide en vidéo et bouton d'aide

**Demande :** une vidéo en motion design qui sert de guide d'utilisation, avec la possibilité de la passer, et un bouton d'aide pour les étudiants, les enseignants et l'administration.

- **Vidéo de bienvenue**
  - une par rôle (étudiant, enseignant, administration), courte (60 à 90 secondes), sous-titrée en français et en anglais ;
  - jouée à la première connexion, avec un bouton **« Passer »** visible dès la première seconde ;
  - vue une seule fois par compte : la date est enregistrée sur le serveur, pour ne pas la rejouer sur un autre appareil ;
  - sur le site et dans l'application mobile, après l'animation du logo.
- **Bouton d'aide**
  - présent sur chaque page : barre du haut sur le site, en-tête et onglet Compte dans l'application ;
  - ouvre un panneau adapté au rôle et à la page : « Revoir la vidéo », quelques fiches « Comment faire… » (faire l'appel, donner un devoir, pointer sa présence, changer de téléphone), et qui contacter.
- **Production**
  - les vidéos sont des fichiers à part, hébergés par l'école (pas de service vidéo externe, la CSP ne le permet pas) ;
  - le scénario de chaque vidéo suit le parcours réel du rôle, donc il s'écrit **après** les lots qui changent ce parcours (projection, quiz dans Planner).

## 7. Autres écarts relevés (audit du 10 octobre 2026)

| Écart | Où |
|---|---|
| La demande de report depuis le tableau de bord mène à la liste des séances, pas à la séance | site, enseignant |
| Devoir « fichier » : pas de dépôt de copie depuis l'application | mobile, étudiant |
| Les alertes « nouveau devoir » et « quiz lancé » ne s'ouvrent pas au toucher | mobile, étudiant |
| Pas de vue « mes modules » : le dépôt propose tous les modules | StudyLib, enseignant |
| Un document déposé ne peut pas être modifié (seulement supprimé) | StudyLib |
| Pas d'offres de stage dans StudyLib (seulement des retours d'expérience) : elles passent par les annonces de Planner | StudyLib |
| Notes de la classe et génération de supports : annoncées « bientôt » sur « Mes classes » | site, enseignant |

## 8. Découpage en lots

| Lot | Contenu | Résultat | Dépend de | État |
|---|---|---|---|---|
| **P-1** | Fenêtre de projection de l'appel : page sans menu, plein écran, QR, classe, présents qui apparaissent au fil des scans, validation de l'appel, vérification surprise facultative (FR et EN) | Le QR se projette sans montrer le portail | — | **fait** le 10 octobre 2026 (`/appel/:id/projection`), pas encore déployé |
| **P-2** | Lien de projection à usage unique pour le navigateur du grand écran | — | — | écarté (les écrans recopient seulement l'ordinateur) |
| **CQ-1 à CQ-3** | voir `quiz-ia.md` ; CQ-2 inclut le nombre de réponses par choix après chaque question | Quiz lancé et projeté depuis Planner, question par question | IA-4 | à faire |
| **W-1** | Question d'association : fork, joueurs web et mobile, devoirs, éditeur, IA | Le type le plus utilisé de Wooclap est couvert | CQ-2 | à faire |
| **W-2** | Retour immédiat et explication de la réponse | L'étudiant sait tout de suite s'il a juste, et pourquoi | CQ-2 | à faire |
| **W-3** | Mode « à son rythme » pendant la séance | Chaque étudiant avance seul | W-2 | à faire |
| **W-4** | Réactions et questions à l'enseignant pendant la séance | L'enseignant voit qui décroche | CQ-2 | à faire |
| **W-5** | Import de quiz (export Wooclap, Excel) | Les quiz existants sont repris | IA-4 | à faire |
| **W-6** | Autres types de questions, selon l'usage réel | — | W-1 ; décision § 9 | à décider |
| **M-1** | Application mobile : connexion des enseignants avec double authentification, onglets selon le rôle, Tableau | L'enseignant entre dans l'application | — | à faire |
| **M-2** | Ma classe, appel (liste, fin, QR de secours), rappel en push | L'appel se fait et se rappelle sur le téléphone | M-1 | à faire |
| **M-3** | Message à la classe, offre de stage, devoirs et rendus | Les actions courantes sans ordinateur | M-2 | à faire |
| **M-4** | Télécommande du quiz en direct | Le quiz se pilote depuis le téléphone | M-2, CQ-2 | à faire |
| **G-1** | Bouton d'aide et panneau par rôle et par page (site et mobile) | De l'aide à tout moment | — | à faire |
| **G-2** | Lecteur de la vidéo de bienvenue avec « Passer », enregistrement « déjà vue » | Le guide se joue une fois, et se revoit depuis l'aide | G-1 | à faire |
| **G-3** | Écriture et production des trois vidéos | Les vidéos elles-mêmes | P-1, CQ-3 | à faire |

**Ordre conseillé :** P-1, puis CQ-1 à CQ-3 (déjà prévus), M-1 et M-2, W-1 et W-2, G-1 et G-2, puis le reste. G-3 vient en dernier, quand les parcours ne bougent plus.

## 9. Points ouverts

- **Wooclap :** au-delà du QCM question par question et de l'association, quels autres types les enseignants utilisent-ils, et jusqu'à quand court la licence ? La réponse fixe l'ordre des lots W-3 à W-6.
- **Application mobile des enseignants :** publication dans les magasins sous le même nom que celle des étudiants, ou distribution interne d'abord ?
- **Vidéos :** qui les produit, avec quel outil, et où sont-elles hébergées (taille, débit) ?
- **Notes de la classe :** quelle source fait foi (devoirs et quiz de Planner, ou un outil de scolarité existant) ?
