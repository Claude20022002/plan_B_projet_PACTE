# Script de la vidéo qui vend (lot V-2)

Rédigé le 13 octobre 2026. Il succède à `script-video-motion-design.md` (lot V-1), qui reste la référence du montage actuel (`video/out/matinee-ecole.mp4`, 1 min 15). La vidéo A, « Direction », est montée depuis le 13 octobre (`video/out/direction.mp4`, 60 s) ; ses écarts avec ce script sont dans `video/README.md`. La vidéo B et les formats courts ne le sont pas.

**Statut : à valider par le chef de projet.** Les points à trancher sont au § 9.

## 1. Ce qui change

Le montage actuel montre neuf fonctions en 75 secondes, à tous les publics à la fois. Ce script fait l'inverse : une promesse, trois preuves, une action, et une version par public.

| | Montage actuel (V-1) | Ce script (V-2) |
|---|---|---|
| Public | Tout le monde | **Deux vidéos** : la direction de l'école (elle décide et paie), puis les étudiants |
| Message | Neuf fonctions | **Une promesse et trois preuves** |
| Première image du produit | À 11 s | **À la première seconde** |
| Texte à l'écran | Des descriptions, jusqu'à 15 mots | **Un bénéfice, six mots au plus** |
| Place de l'écran | Un tiers de l'image | **Les deux tiers**, cadré sur le détail qui prouve |
| Fin | Les plateformes | **Une action et une adresse** |
| Durée | 1 min 15 et 40 s | **60 s** (direction) et **30 s** (étudiants) |

Les formes de quiz, la bibliothèque de jeux et la Bibliothèque sortent de la vidéo principale : chacune devient un format court de 15 secondes (§ 7).

## 2. À qui parle chaque vidéo

| | Vidéo A, « Direction » | Vidéo B, « Étudiants » |
|---|---|---|
| Qui | Direction, responsable de la scolarité | Étudiants, puis enseignants |
| Où elle passe | En salle, en rendez-vous, sur LinkedIn | Instagram, TikTok, écrans du campus |
| Format | 16:9, 60 s | 9:16, 30 s |
| Ce qu'il veut | Une école qui tourne, des heures justes | Savoir où aller, ne rien rater |
| Ce qu'on lui demande | Demander une démonstration | Installer l'application |
| Ton | Vouvoiement, posé | Tutoiement, rapide |

Le positionnement complet (personas, objections, mots à employer) est dans `.claude/product-marketing.md`.

## 3. La promesse, les preuves, l'action

**La promesse retenue : « Toute l'école à l'heure, dans une seule application. »**

Elle part de l'ancienne (« L'emploi du temps, l'appel et les quiz d'une école, au même endroit. ») et l'élargit. « À l'heure » dit trois choses en deux mots : l'étudiant arrive dans la bonne salle, l'appel est fait, les heures des enseignants sont comptées. C'est aussi le mot du panneau des départs, l'image de la marque. « Dans une seule application » garde l'idée de l'ancienne phrase.

Deux autres pistes, si celle-ci ne convient pas :

- « Toute la journée de l'école, dans une seule application. » Plus descriptive, moins mémorable.
- « L'emploi du temps, l'appel et les quiz : toute l'école au même endroit. » La plus proche de l'ancienne ; elle énumère au lieu de promettre.

**Les trois preuves**, toujours dans cet ordre :

1. Chaque étudiant sait où aller (le tableau du jour, l'alerte de report).
2. L'appel se fait en une minute (le QR projeté, les présents qui s'affichent).
3. Le quiz se joue dans le cours (lancé depuis la séance, classement à la fin).

**L'action.** Vidéo A : « Demandez une démonstration », avec l'adresse `planner.hestim.ma`. Vidéo B : « Disponible sur iPhone et Android ».

L'adresse `planner.hestim.ma` est **fictive** : elle tient la place de la vraie dans le montage. À remplacer avant toute diffusion, ou à créer.

## 4. Direction artistique

**L'idée : le panneau des départs.** Dans une gare, chacun lève les yeux et sait où aller. Toute la vidéo tient cette image : volets qui tournent, fond noir, heures en gros chiffres. L'écran d'accueil de l'administration s'appelle déjà « Prochains départs · Campus » : c'est la première image de la vidéo A.

| Sujet | Règle |
|---|---|
| Une idée par plan | Le spectateur doit savoir quoi regarder en premier. Un plan, un bénéfice, un écran. |
| Texte | Six mots au plus par titre. Un bénéfice, jamais la description de l'écran. Pas de tiret long, pas de point d'exclamation. |
| Taille du texte | Titre : 130 px au moins en 16:9, 84 px en 9:16. Texte secondaire : 78 px et 44 px. Aujourd'hui les titres font 72 px. |
| Marges | Rien d'important à moins de 140 px des bords en 16:9. En 9:16 : 80 px sur les côtés, 100 px en haut, et le quart bas laissé libre pour les boutons des réseaux. |
| Place de l'écran | L'écran du produit occupe au moins 60 % de l'image. Le texte se pose dessus ou dessous, il ne partage plus l'image en deux. |
| Cadrage | Jamais la page entière. On entre par un plan large d'une demi-seconde, puis on resserre sur le détail qui prouve : le numéro de salle, le compteur de présents, le total des heures. |
| Le geste | Un doigt ou un curseur visible à chaque action (toucher, scanner, valider). Sans lui, une capture ne dit pas ce qui se passe. |
| Couleurs | Fond `#0B0B0D`, texte `#F2F1EC`, bleu marine `#001861`. Le vert, l'orange et le rouge ne servent qu'aux statuts (en cours, reporté, annulé). |
| Typographie | Barlow Condensed pour les titres et les volets, Barlow pour les phrases. Rien d'autre. |
| Mouvement | Ressort amorti, sans rebond. Chaque coupe tombe sur un temps (120 BPM, un temps = 0,5 s). Trois mouvements seulement : le volet qui tourne, le zoom qui resserre, le glissement latéral. |
| Rythme | Les plans de preuve durent 4 à 6 s, le plan fort (l'appel) 12 s. Un plan qui dure plus de 3 s doit bouger : compteur, zoom, nom qui apparaît. |
| Son | Bande-son actuelle (120 BPM), un bruitage par geste. Une voix off est possible pour la vidéo A (colonne « Voix » ci-dessous) ; la vidéo doit rester comprise sans le son. |
| Sous-titres | Le texte à l'écran en tient lieu. Version anglaise à prévoir pour LinkedIn. |
| Captures | Un seul thème par vidéo, l'heure de l'histoire sur chaque téléphone, des données fictives, jamais le domaine de démonstration. |
| Présence humaine | Un plan réel au moins dans la vidéo A : une salle, un écran projeté, des mains sur des téléphones. Trois secondes suffisent. À filmer à l'école. |

## 5. Vidéo A, « Direction » (16:9, 60 s)

L'histoire : un lundi à 13 h 40, vu depuis le bureau de la scolarité, puis dans la salle, puis de retour au bureau.

| # | Temps | Ce qu'on voit | Texte à l'écran | Voix (facultative) | Mouvement | Image |
|---|---|---|---|---|---|---|
| 1 | 0:00, 4 s | Le panneau « Prochains départs · Campus », plein écran : toutes les séances de 13 h 30, leurs salles | **13 h 40. Tout le campus, sur un écran.** | « Lundi, 13 h 40. Voici toute votre école. » | Les lignes du tableau arrivent en volets, zoom lent | `admin-01-tableau` (13 octobre) |
| 2 | 0:04, 5 s | Six outils éparpillés, barrés un à un | **Hier : six outils qui ne se parlent pas.** | « Hier, il fallait six outils pour le savoir. » | Animation existante, accélérée | `S2Outils` |
| 3 | 0:09, 6 s | Le téléphone de l'étudiante : la séance en cours, puis zoom sur « G-S05 » | **Chaque étudiant sait où aller.** | « Chaque étudiant a sa salle en grand. » | Plan large 0,5 s, puis zoom sur le numéro de salle | `app-01-tableau` |
| 4 | 0:15, 5 s | L'alerte « Cours reporté » glisse sur le téléphone | **Un cours bouge, il est prévenu.** | « Un cours reporté, et il le sait avant d'arriver. » | L'alerte tombe sur un temps, carillon | `S5Alerte` |
| 5 | 0:20, 12 s | La salle : le QR projeté. Un téléphone le vise. Les noms s'affichent un à un, le compteur monte | **L'appel en une minute.** puis **Le code change toutes les 30 secondes.** | « L'appel prend une minute. Le code change toutes les trente secondes : personne ne le transmet à un absent. » | Le compteur monte, zoom final sur le compteur de présents | `prof-05-appel-projection` (13 octobre), scanner redessiné |
| 6 | 0:32, 8 s | Le quiz : la question à l'écran de la salle, quatre formes sur le téléphone, un doigt touche | **Un quiz lancé depuis la séance.** | « Le quiz part du cours, sans autre site. » | Le doigt touche sur un temps, la bonne réponse s'allume | Maquette de l'écran de salle, téléphone redessiné |
| 7 | 0:40, 4 s | Le classement de la classe | **Le classement, dès la dernière réponse.** | « Et les résultats restent à l'école. » | Les lignes du classement montent | `web-21`, à refaire |
| 8 | 0:44, 5 s | Retour au bureau : l'emploi du temps du mois de la classe, au format officiel | **Un mois d'emploi du temps, sans conflit.** | « L'emploi du temps du mois se génère sans conflit. » | Zoom sur une semaine | `admin-04b-edt-mensuel-classe` (13 octobre) |
| 9 | 0:49, 5 s | Les heures du mois par enseignant, zoom sur la colonne « Réalisé » | **Les heures faites, prêtes pour la paie.** | « Et les heures de chaque enseignant sont déjà comptées. » | Zoom sur la colonne, les totaux en volets | `admin-05b-heures-du-mois` (13 octobre) |
| 10 | 0:54, 6 s | L'emblème, le nom en volets, la promesse, puis l'action et l'adresse | **Toute l'école à l'heure, dans une seule application.** puis **Demandez une démonstration · planner.hestim.ma** | « HESTIM Planner. Toute l'école à l'heure. » | Dernière seconde et demie immobile | `S9Fin` |

Ce qui manque pour la monter : le plan réel de la salle (facultatif), le classement refait, et la mesure de « une minute » (§ 9).

## 6. Vidéo B, « Étudiants » (9:16, 30 s)

La première seconde décide de tout : l'image, le geste et le texte arrivent ensemble.

| # | Temps | Ce qu'on voit | Texte à l'écran | Mouvement | Image |
|---|---|---|---|---|---|
| 1 | 0:00, 3 s | Un téléphone vise le QR, une coche verte, « Présence enregistrée » | **Présent en un scan.** | Le scan et la coche dans la première seconde | Scanner redessiné, coche à dessiner d'après l'application |
| 2 | 0:03, 6 s | Le tableau du jour, zoom sur la salle | **Ta salle, en grand.** | Volets sur l'heure, zoom sur « G-S05 » | `app-01-tableau` |
| 3 | 0:09, 5 s | L'alerte « Cours reporté » | **Cours reporté, tu le sais avant d'arriver.** | L'alerte tombe, vibration | `S5Alerte` |
| 4 | 0:14, 8 s | Le quiz : quatre formes, un doigt, la bonne réponse | **Le quiz se joue sur ton téléphone.** | Trois touches rapides, sur le temps | Téléphone redessiné |
| 5 | 0:22, 4 s | Son résultat : « 1er sur 4 » | **Tu vois où tu en es.** | Le score monte en volets | `mobile-13-resultats`, à refaire |
| 6 | 0:26, 4 s | L'emblème, « Toute l'école à l'heure. », « Disponible sur iPhone et Android » | La promesse courte | Dernière seconde immobile | `S9Fin` |

## 7. Les formats courts (15 s, un sujet chacun)

Ils reprennent ce qui sort de la vidéo principale. Même habillage, une seule idée.

| Sujet | Phrase | Quand le faire |
|---|---|---|
| Une seule connexion | « Un compte pour tout : Planner, Bibliothèque, Quiz. » | Dès maintenant (`app-07-espaces`) |
| Les supports du cours | « Le support du cours, à côté de la séance. » | Quand la Bibliothèque de l'application sera capturée de nouveau |
| Les jeux pédagogiques | « Réviser en jouant : le terminal Linux. » | Dès maintenant, sans annoncer une bibliothèque qui n'a qu'un jeu |
| Les formes de quiz | « Un quiz, plusieurs formes. » | Quand le schéma et la vidéo existeront dans l'application |

## 8. Les captures

**Refaites le 13 octobre 2026** sur la plateforme locale de captures (lundi 12 octobre, 13 h 40) : les 20 images `prof-*` et `admin-*` du site, par `capturer-profs-admin.mjs`, et deux nouvelles, par `capturer-video.mjs` : `admin-04b-edt-mensuel-classe` (le mois d'une classe, que l'ancienne `admin-04` montrait vide) et `etudiant-01-tableau-telephone` (le tableau de l'étudiante sur le site, format téléphone).

**Pas refaites :**

| Image | Pourquoi | Ce qu'il faut |
|---|---|---|
| L'application (`app-*`, `mobile-*`) | Il faut l'émulateur Android, Metro et le serveur ensemble ; le poste a redémarré Docker la dernière fois que tout tournait à la fois | Une session dédiée, Docker et l'émulateur seuls |
| Le classement et le résultat d'un quiz (`web-21`, `mobile-13`) | Le moteur de quiz n'est pas installé sur la plateforme locale | Le moteur de quiz branché, une partie jouée |
| Les supports (`mobile-39`) | La Bibliothèque n'est pas installée sur la plateforme locale | La Bibliothèque branchée, avec des documents |
| « Usage du mois » (comptes actifs) | L'onglet est sur `main`, pas sur la branche de la vidéo | Refaire les captures depuis `main` après fusion |

**Relancer la plateforme de captures** (rien n'y touche la production) :

1. `docker start hestim_mysql_test` ; la base jetable est `hestim_captures_test`.
2. Le serveur, depuis `backend/`, sur cette base, avec `MFA_ADMINS_OBLIGATOIRE=false` (sinon les captures de l'administration montrent l'écran de double authentification) et une horloge décalée : `HORLOGE=2026-10-12T13:40:00Z node --import ../docs/presentation/scripts/horloge-captures.mjs server.js`. Les autres réglages (base, port, pas d'e-mail ni de quiz) sont ceux du compte rendu du 12 octobre, § 9.
3. Le site, depuis `frontend/` : `npx vite --port 5174 --strictPort`.
4. Depuis `frontend/` : `node ../docs/presentation/capturer-profs-admin.mjs` puis `node ../docs/presentation/capturer-video.mjs`, avec `HESTIM_URL=http://localhost:5174`, `HORLOGE=2026-10-12T13:40:00Z` et les comptes de démonstration.

## 9. Ce qu'il reste à décider ou à vérifier

- **La promesse** : « Toute l'école à l'heure, dans une seule application. », ou une des deux autres (§ 3). Elle est déjà dans le montage actuel.
- **L'adresse** : `planner.hestim.ma` est fictive. Laquelle afficher ?
- **« L'appel en une minute »** : à mesurer sur un vrai appel avant de l'écrire en grand. Même chose pour « sans conflit », vrai sur le jeu de démonstration.
- **Le quiz reste sur maquette** dans les deux vidéos (plans 6 de A et 4 de B). Le plan montre le quiz en direct, qui existe ; l'écran de salle est une maquette.
- **La voix off** de la vidéo A : oui ou non, et qui la dit.
- **Le plan réel** de la salle : à filmer, avec l'accord des personnes à l'image.
- **Le nom et le logo de HESTIM** dans une vidéo publiée : accord de l'école.
- **Le thème des captures de l'application** : le tableau est en clair, les supports et le jeu en sombre. À unifier lors de la prochaine session de captures.

## 10. Outils

Ce script s'appuie sur les skills rangés dans `.claude/skills/` (origine et licences dans `SOURCES.md`) : `video`, `copywriting`, `social`, `marketing-psychology`, `ad-creative` et `product-marketing` pour le message ; `remotion-best-practices` pour la mise en image (tailles de texte, marges, une idée par plan).
