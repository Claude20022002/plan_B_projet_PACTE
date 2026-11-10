# MKT · Marketing

**Objet** : faire connaître Planner auprès de ses cibles (écoles privées de la maternelle au lycée, puis formation professionnelle ; décision du 7 novembre), avec des livrables **vrais et vérifiés**, produits par des agents spécialisés.

**Règles** :
- la **vente est mise de côté** (décision du 5 novembre) : préparer, oui ; **publier, dépenser, contacter une école, non**, tant que le chef ne lève pas ce gel ;
- **budget 0** (31 octobre) : outils gratuits ou hébergés soi-même ; une option payante se chiffre et se propose, jamais ne s'engage ;
- **aucun fait inventé** : une fonction, un chiffre, un client, une citation ne paraît que s'il est vérifié dans le produit ou dans le dépôt ;
- **ElevenLabs** et toute voix ou musique : licence vérifiée avant usage ;
- HESTIM peut être citée comme première école, avec son logo ; aucun chiffre d'usage ni propos de personne sans accord écrit ;
- dans les livrables : « Planner », « Bibliothèque », « Quiz », « Activités » ; jamais StudyLib, ClassQuiz ni PlannerQuiz ;
- les règles de l'équipe s'appliquent ([organisation.md](../organisation.md)) : chantier ouvert, plan avant production, questions, fiche de session.

**Hors module** : le site vitrine lui-même (pages, formulaire, hébergement) est dans [VIT](VIT-site-vitrine.md) ; MKT en écrit les textes. L'étude de marché de novembre ([../../etude-marche/](../../etude-marche/)) est la source des faits sur les concurrents.

## Ce qui existe

- **L'agence** : le dossier local `..\planner-marketing`, ouvert le 31 octobre. Il contient :
  - un `CLAUDE.md` (rôle du directeur marketing, règles, rangement) ;
  - 9 agents dans `.claude/agents/` et environ 40 skills dans `.claude/skills/` ;
  - le contexte produit `marketing/strategy/product-context.md` et la charte `marketing/brand/brand-guidelines.md` ;
  - une campagne commencée `marketing/campaigns/2026-10-31-lancement-ecoles/` et un projet vidéo Remotion.
- **Ce dossier n'a aucun commit** : son travail n'est sauvegardé nulle part (MKT-01).
- **Sa cible est dépassée** : son `CLAUDE.md` parle encore de « l'enseignement supérieur » (MKT-02).
- Dans ce dépôt : `kit-video-planner/`, `docs/presentation/`, `docs/etude-marche/`.

## Les agents spécialisés

La session principale de `..\planner-marketing` est le **directeur marketing** : elle découpe une demande, la confie aux agents, relit leur travail et tient l'état (suivi et fiche de session). Les sous-agents ne lancent pas d'autres sous-agents.

| Agent | Domaine | Fonctions qu'il porte |
|---|---|---|
| `product-marketing-manager` | marché, concurrents, personas, positionnement, argumentaire | MKT-02, MKT-03 |
| `copywriter` | accroches, textes, scripts, courriels, pages | MKT-03, MKT-04 |
| `growth-marketing-manager` | parcours, page d'accueil, référencement, courriels, tests | MKT-04, MKT-07 |
| `creative-director` | concept, direction artistique, validation esthétique | MKT-05, MKT-06 |
| `video-producer` | scripts, storyboards, montage Remotion, sous-titres, contrôle des MP4 | MKT-05 |
| `graphic-designer` | visuels, carrousels, bannières, supports commerciaux | MKT-06, MKT-09 |
| `social-media-manager` | stratégie par réseau, calendrier, publications | MKT-08 |
| `marketing-analyst` | objectifs, indicateurs, plan de mesure, rapports | MKT-07 |
| `chief-marketing-officer` | relecture finale et arbitrage, regard extérieur | relecture de toute fonction avant « fait » |

## Fonctions

| ID | Fonction | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|
| MKT-01 | Sauvegarder l'agence : premier commit de `..\planner-marketing`, dépôt GitHub **privé** (logos, stratégie), règles de l'équipe ajoutées à son `CLAUDE.md` | libre | S | — | à faire |
| MKT-02 | Contexte produit et personas à la cible du 7 novembre (directeur d'école privée, scolarité, enseignant, parent), faits vérifiés dans le code | libre | M | MKT-01 | à faire |
| MKT-03 | Argumentaire par cible, tiré des exigences produit EP-1 à EP-12 et des reproches faits aux concurrents | libre | M | MKT-02 | à faire |
| MKT-04 | Textes du site vitrine et du formulaire de contact | libre | M | MKT-03, VIT-01 | à faire |
| MKT-05 | Vidéo de démonstration sur une école fictive, sur le socle neutre (aucune donnée réelle) | libre | M | MKT-03, UIX-01 | à faire |
| MKT-06 | Charte visuelle mise à jour (marque Planner, thème neutre) et gabarits de visuels | libre | M | MKT-02 | à faire |
| MKT-07 | Plan de mesure : objectifs, indicateurs, outils gratuits | libre | S | MKT-03 | à faire |
| MKT-08 | Calendrier éditorial et publications sur les réseaux | quand la vente reprend | M | MKT-03, MKT-06 | gelé |
| MKT-09 | Supports commerciaux pour les directeurs (plaquette, présentation) | quand la vente reprend | M | MKT-03, VEN-07 | gelé |
| MKT-10 | Campagne de lancement auprès des écoles (reprend `2026-10-31-lancement-ecoles`) | quand la vente reprend | L | MKT-04 à MKT-09 | gelé |

## Critères de « terminé »

- **MKT-01** : le dossier a un historique Git et un dépôt distant privé poussé par le chef ; `CLAUDE.md` renvoie aux règles de l'équipe.
- **MKT-02** : chaque fait du contexte produit cite son fichier source ou l'écran qui le montre ; aucune mention « supérieur seulement » ne reste.
- **MKT-03** : un argumentaire par cible, une ligne par bénéfice, chacune reliée à une exigence produit ou à une fonction faite.
- **MKT-04** : textes relus par `chief-marketing-officer`, conformes au ton de l'équipe (« vous », phrases courtes, sans superlatif).
- **MKT-05** : MP4 contrôlé par `verifier-video`, aucune donnée réelle à l'image, licence de chaque son notée.
- **MKT-06** : charte écrite, gabarits utilisables par `npm run visuels`.
- **MKT-07** : plan de mesure chiffré à coût nul.

## Exigences produit

Aucune directement ; MKT s'appuie sur EP-1 à EP-12 pour ses arguments et ne promet rien qu'une fonction faite ne tienne.

## Où se range le travail

- **Livrables** : dans `..\planner-marketing` (rangement décrit dans son `CLAUDE.md`).
- **État** : dans ce dépôt, lignes MKT de [suivi.md](../suivi.md) et fiche de session dans `docs/sessions/`, sur une branche `mkt/<identifiant>-<mot>`.
