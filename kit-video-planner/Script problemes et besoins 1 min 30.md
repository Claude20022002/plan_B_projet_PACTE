# Script · « Les problèmes des établissements, la réponse de Planner » · 1 min 30

11 novembre 2026 · plan : [mkt-05-kit-video-et-presentation.md](../docs/conception/marketing/mkt-05-kit-video-et-presentation.md) · règles : [Kit vidéo Planner.md](<Kit vidéo Planner.md>), § « Ce qu'on ne montre pas »

**Public** : chefs d'établissement de toute structure de formation (école, collège, lycée, supérieur, formation professionnelle), publique ou privée. **Format** : 16:9, 1920 × 1080, 30 images par seconde. **Voix** : off, en français, ElevenLabs (licence d'usage commercial à vérifier avant diffusion). **École montrée** : ORION, école fictive, sur l'environnement de démonstration.

Le fil : quatre problèmes vécus partout, puis ce que Planner fait déjà, à l'écran, puis les objectifs et une invitation. Tout ce qui est montré existe aujourd'hui ; ce qui vient est dit comme un objectif (réponse V-5 du chef).

## 1. Les scènes

| N° | Temps | Voix off | Texte à l'écran | Image | Source du fait |
|---|---|---|---|---|---|
| 1 | 0:00 à 0:06 | Une école, un centre de formation, une université : chaque jour, des centaines de séances à tenir. | Des centaines de séances. Chaque jour. | I-1 | — |
| 2 | 0:06 à 0:12 | Et pourtant, l'emploi du temps se refait encore à la main, puis repart en PDF à chaque changement. | Refait à la main. Renvoyé en PDF. | I-2 | rapport du 4 nov. ; besoin C de l'étude du 11 nov. |
| 3 | 0:12 à 0:18 | La même information est saisie dans plusieurs outils, puis une fois encore dans la plateforme de l'État. | Saisi une fois. Puis deux. Puis trois. | I-3 | étude du 11 nov., besoin N : « la double saisie est la règle » |
| 4 | 0:18 à 0:23 | Un cours déplacé se découvre devant une salle vide. | Le cours a changé. Personne n'a été prévenu. | I-4 | argumentaire du 4 nov., § 3 |
| 5 | 0:23 à 0:29 | Et avant la paie, les heures des vacataires se vérifient une par une. | Heure prévue. Faite ? Payée ? | I-5 | étude du 11 nov., besoin G : la chaîne « prévue, faite, certifiée, payée » |
| 6 | 0:29 à 0:35 | Planner réunit tout cela dans une seule plateforme, sur ordinateur et sur téléphone. | Une seule plateforme. Web, Android, iPhone. | logo « le volet » qui s'ouvre, puis C-1 et C-2 côte à côte | kit du 25 oct. |
| 7 | 0:35 à 0:46 | L'emploi du temps du semestre est calculé en quelques minutes. Jamais deux cours dans la même salle, jamais un enseignant à deux endroits. | Le semestre en quelques minutes. 0 double réservation. | C-3, puis C-4 | générateur (12 règles strictes) ; 2 620 séances placées sans double réservation dans l'école en service |
| 8 | 0:46 à 0:56 | Un enseignant demande un report : la scolarité valide, et chaque apprenant est prévenu sur son téléphone. | 1. L'enseignant demande. 2. La scolarité valide. 3. Tous sont prévenus. | C-5, C-6, C-7 | circuit de report (kit, « Les fonctionnalités à filmer ») |
| 9 | 0:56 à 1:04 | En classe, l'appel se fait en un QR code, et les quiz se lancent en direct. | L'appel en un QR code. Les quiz en direct. | C-8, puis C-9 | appel à QR code changeant ; Quiz en direct |
| 10 | 1:04 à 1:11 | Chaque séance faite est visée : les heures des vacataires du mois sont prêtes, sans ressaisie. | Séance faite, visée, comptée. | C-10 | suivi du réalisé et export mensuel des heures des vacataires (`/api/suivi/vacataires.csv`) |
| 11 | 1:11 à 1:17 | Votre nom, votre logo, vos couleurs : Planner s'adapte à votre établissement. | Votre nom. Votre logo. Vos couleurs. | C-11 | panneau « Identité et marque » |
| 12 | 1:17 à 1:25 | Nos prochains objectifs : les familles, les notes et bulletins, les frais et les paiements, et les échanges avec l'État. | Nos prochains objectifs : familles · notes et bulletins · frais et paiements · échanges avec l'État | I-6 | plan par modules : VSC, FIN, MOB-05 |
| 13 | 1:25 à 1:30 | Votre établissement, votre Planner. Parlons de vos besoins. | Votre établissement, votre Planner. | logo horizontal inversé sur noir de panneau, contact | message central du kit |

**Durée de la voix** : environ 200 mots, soit à peu près 1 min 25 à un débit posé. Les 5 secondes restantes sont des respirations et la fin du logo.

## 2. Texte à coller dans ElevenLabs

Un paragraphe par scène. Les balises `<break>` ajoutent une pause ; les retirer si la voix choisie ne les accepte pas.

```text
Une école, un centre de formation, une université : chaque jour, des centaines de séances à tenir. <break time="0.6s" />

Et pourtant, l'emploi du temps se refait encore à la main, puis repart en PDF à chaque changement. <break time="0.4s" />

La même information est saisie dans plusieurs outils, puis une fois encore dans la plateforme de l'État. <break time="0.4s" />

Un cours déplacé se découvre devant une salle vide. <break time="0.4s" />

Et avant la paie, les heures des vacataires se vérifient une par une. <break time="1.0s" />

Planner réunit tout cela dans une seule plateforme, sur ordinateur et sur téléphone. <break time="0.6s" />

L'emploi du temps du semestre est calculé en quelques minutes. Jamais deux cours dans la même salle, jamais un enseignant à deux endroits. <break time="0.5s" />

Un enseignant demande un report : la scolarité valide, et chaque apprenant est prévenu sur son téléphone. <break time="0.5s" />

En classe, l'appel se fait en un QR code, et les quiz se lancent en direct. <break time="0.5s" />

Chaque séance faite est visée : les heures des vacataires du mois sont prêtes, sans ressaisie. <break time="0.5s" />

Votre nom, votre logo, vos couleurs : Planner s'adapte à votre établissement. <break time="0.8s" />

Nos prochains objectifs : les familles, les notes et bulletins, les frais et les paiements, et les échanges avec l'État. <break time="0.8s" />

Votre établissement, votre Planner. Parlons de vos besoins.
```

Réglages proposés : une voix posée et chaleureuse, ni publicitaire ni robotique ; stabilité moyenne ; prononcer « QR » à la française (« ku-èr »). Si la voix lit « PDF » ou « QR » de travers, les écrire « pé-dé-èf » et « ku-èr » dans ce texte seulement.

## 3. Les images à créer (scènes de problèmes)

Illustrations, pas de photographies : aucun visage reconnaissable, aucune école réelle, aucun logo de logiciel existant. Style plat et sobre, fond blanc cassé `#F2F1EC`, traits noir de panneau `#0B0B0D`, une seule couleur de signal par image (orange `#C77700` pour l'alerte).

| N° | Scène | Ce qu'on voit | Indication pour un générateur d'images |
|---|---|---|---|
| I-1 | 1 | Une façade d'établissement neutre, des dizaines de petites cases d'horaires qui se remplissent | « illustration plate, façade d'établissement scolaire neutre, grille d'emploi du temps qui se remplit, fond blanc cassé, sans texte » |
| I-2 | 2 | Un bureau, un tableur raturé, une pile de PDF imprimés avec un tampon « v3 », « v4 » | « illustration plate, bureau avec tableur raturé et pile de feuilles d'emploi du temps imprimées, sans visage, sans marque » |
| I-3 | 3 | La même fiche recopiée dans trois fenêtres différentes, la dernière marquée « plateforme officielle » sans drapeau ni logo | « illustration plate, même formulaire recopié dans trois fenêtres d'ordinateur, sans drapeau, sans logo » |
| I-4 | 4 | Une salle de classe vide, chaises en place, une seule lampe orange au-dessus de la porte | « illustration plate, salle de classe vide, lumière orange au-dessus de la porte, sans personnage » |
| I-5 | 5 | Une feuille d'heures avec des points d'interrogation à côté de certaines lignes, une calculatrice | « illustration plate, feuille de relevé d'heures avec des points d'interrogation, calculatrice, sans visage » |
| I-6 | 12 | Quatre tuiles du panneau des départs, une par objectif, qui basculent l'une après l'autre | à monter à partir des tuiles du logo (kit « le volet ») ; textes de la scène 12 |

## 4. Les captures à faire dans Planner

Sur l'**environnement de démonstration** seulement, jamais sur le site de production. Identité ORION (`#0B5D3B`, `#C77700`, logo de `logos-demo/`), données fictives. Ordinateur en 1920 × 1080, zoom du navigateur à 125 % pour que le texte se lise ; téléphone en portrait, puis posé dans un cadre de téléphone neutre.

| N° | Écran | Rôle | Ce qui doit être visible | Existe déjà ? |
|---|---|---|---|---|
| C-1 | Accueil | scolarité, ordinateur | tableau de bord ORION | oui : `captures/orion-accueil-bureau.png` |
| C-2 | Accueil de l'application | apprenant, téléphone | la journée en cours | oui : `captures/orion-accueil-telephone.png` |
| C-3 | Génération automatique | scolarité | le bouton de génération, puis la barre de progression | à faire |
| C-4 | Rapport de génération | scolarité | séances placées, 0 conflit sur les règles strictes | à faire |
| C-5 | Demande de report | enseignant, téléphone | le bouton « Demander un report » et le créneau proposé | à faire |
| C-6 | Validation du report | scolarité | la demande et le bouton de validation | à faire |
| C-7 | Notification | apprenant, téléphone | la notification « séance reportée » sur l'écran verrouillé | à faire |
| C-8 | Appel par QR code | enseignant, écran projeté | le QR code et les noms fictifs qui s'affichent | à faire |
| C-9 | Quiz en direct | enseignant et apprenant | une question, les réponses qui arrivent | à faire |
| C-10 | Suivi du réalisé | scolarité | séances visées du mois et bouton d'export des heures des vacataires | à faire |
| C-11 | Même écran, trois identités | scolarité | ORION, NOVA, sans logo côte à côte | oui : `captures/*-accueil-bureau.png` |

Pour les scènes 7 à 10, un court enregistrement d'écran de 3 à 5 secondes vaut mieux qu'une capture fixe : le clic, puis le résultat.

## 5. Avant de diffuser

- [ ] Licence ElevenLabs : l'offre du compte permet un usage commercial.
- [ ] Aucune capture ne montre de vraie personne, de vraie école ni l'adresse du site de production.
- [ ] Aucun concurrent n'est nommé ni montré.
- [ ] La scène 12 reste au futur (« objectifs ») tant que les fonctions ne sont pas faites dans `docs/plan/suivi.md`.
- [ ] Le chef valide la vidéo montée avant toute publication : la vente reste mise de côté (module MKT).
