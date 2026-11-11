# Session du 2026-11-11 · inventaire des outils · `doc/inventaire-outils-formation`

| | |
|---|---|
| Fait par | Claude Code (Opus 5.5) |
| Chantier | aucun : tâche `doc/` hors chantier, accord du chef de projet le 11 nov. (Q-7) |
| Dossier de travail | `..\travaux-planner\inventaire-outils-formation` (part de `origin/main`, `6fedf41`) |
| Dernier commit | voir `git log -1 doc/inventaire-outils-formation` |

## Objectif de la session

1. Prendre le contexte du projet.
2. Faire l'inventaire des outils des établissements, de leurs problèmes et de leurs besoins. Ce qui manque à Planner doit devenir des modules vendus seuls ou en packs, qui communiquent entre eux.
3. Ensuite, et dans une autre tâche : préparer le kit de la vidéo de présentation.

## Plan (court, tâche `doc/`, validé le 11 nov.)

Réponses du chef aux questions Q-1 à Q-8 :
- **Q-1 Périmètre** : maternelle, primaire, collège, lycée, supérieur et centres de formation, public et privé.
- **Q-2 Pays** : le plus de pays possible en Afrique et en Europe (RDC, Gabon, Centrafrique, Maroc, Algérie, Belgique…). Recherche structurée et approfondie : problèmes, pertes, avis des utilisateurs.
- **Q-3 Outils** : logiciels et pratiques réelles, plus la gestion des vacataires, les paiements et les inscriptions.
- **Q-4 Méthode** : recherche documentaire, chaque affirmation étiquetée [FAIT], [ANNONCE ÉDITEUR], [AVIS UTILISATEUR] ou [HYPOTHÈSE], avec une compétence de recherche vérifiée.
- **Q-5 Priorités** : indispensable pour vendre, différenciant, plus tard.
- **Q-6 Objectif** : concevoir des modules vendus seuls ou en packs, avec un modèle économique et une liaison garantie entre eux.
- **Q-7** : exception de chantier accordée.
- **Q-8** : branche et fichier tels que proposés.

**Méthode suivie** :
- compétence `deep-research` d'Anthropic, déjà installée ; aucune compétence de tiers installée ;
- 9 chercheurs en parallèle (5 par région, 4 par thème), puis un rédacteur ;
- réseaux sociaux : uniquement le contenu public trouvable par un moteur de recherche, sans connexion à un compte et sans aucun nom de particulier.

## Fait

- `docs/etude-marche/research_notes/Outils scolaires et besoins par pays/` : 9 fichiers de notes sourcées (Maghreb, Afrique centrale, Afrique de l'Ouest, de l'Est et du Sud, Europe francophone, Europe et produits internationaux, centres de formation, argent et personnel, avis des utilisateurs et sécurité, modèles économiques).
- `docs/etude-marche/reports/Outils scolaires et besoins par pays.md` : le rapport de synthèse (18 besoins, différences par région et par niveau, 12 modules proposés, 6 packs, consommables, sortie des données, 9 garanties de liaison, limites).
- `docs/etude-marche/05-outils-structures-formation.md` : le résumé pour le chef de projet et les décisions I-1 à I-5.
- `docs/etude-marche/README.md` : index mis à jour.
- `docs/plan/suivi.md` : #161, #162 et #163 sont marquées fusionnées ; ajout de la ligne de cette tâche, hors chantier.

## Vérifié

- `node scripts/verifier-neutre.mjs` : aucun nom d'école en dur.
- Ni le rapport ni les notes ne citent l'école pilote.
- Aucun code modifié : la CI n'est pas concernée.
- **Limite** : le quota de recherches web (200 par tour, partagé) s'est épuisé chez les 9 chercheurs. Les avis des magasins d'applications et les réseaux sociaux sont presque absents, et plusieurs pays et produits ne sont pas couverts (rapport, dernière section). Des chiffres tirés seulement d'extraits de moteurs de recherche sont marqués « extrait » et sont à vérifier avant toute citation publique.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| I-1 à I-5 | Modules à entrer dans le plan, ordre de l'étape 4, seconde passe de recherche, règles commerciales, entretiens de terrain (voir `05-outils-structures-formation.md`, § 6) | — | **en attente** |
| Thème | Le bleu comme couleur de Planner | avis donné : oui, avec un bleu propre à Planner (pas le marine de l'école pilote) ; modifie les règles N-4 de la conception du socle neutre (encre ardoise par défaut, focus bleu) ; à reporter dans le plan de UIX-01 et `decisions.md` | **en attente** de l'accord du chef |
| V-1 | Kit vidéo : tâche à part, sur sa propre branche | proposé : `mkt/mkt-05-kit-video`, exception de chantier (MKT n'est pas ouvert) | **en attente** |
| V-2 | Source de la vidéo précédente | faite avec Claude sur un autre compte (lien de conversation partagé), voix ElevenLabs ; le kit existant est `kit-video-planner/` | réglé |
| V-3 | Public et durée | directeurs d'écoles et de centres de formation ; versions de 2 min et de 30 s | **validé** |
| V-4 | École fictive à la place de l'école pilote | oui | **validé** |
| V-5 | Modules prévus | présentés comme des **objectifs**, sans les dire disponibles (option b) ; seul ce qui fonctionne est montré | **validé** |
| V-6 | Voix off | ElevenLabs, en français ; vérifier que l'offre du compte permet l'usage commercial | à vérifier |
| Livrable vidéo | Ce que le chef attend | **uniquement les éléments** : texte de la voix off par scène, textes à l'écran, liste des images et captures (écran, rôle, données fictives), durées. Le montage se fait sur l'autre abonnement | **validé** |

## État laissé

- `docs/plan/suivi.md` : ligne « Inventaire des outils… » hors chantier, en attente des décisions I-1 à I-5.
- Chantiers ouverts inchangés : EXP, PLA, QUA (3 sur 3).
- PLA-06 (#164, brouillon) : un commit local non poussé, `7b195b6`, sur `etude/pla-06-mesure-d01`.

## Reste à faire, dans l'ordre

1. Le chef répond à I-1 à I-5 et dit si le bleu est retenu.
2. Si I-1 est accepté, ajouter les modules retenus dans `docs/plan/modules/` et `docs/plan/README.md`, ainsi que les décisions dans `decisions.md`, sur une branche `doc/` à part.
3. Si I-3 est accepté, seconde passe de recherche ciblée dans une session neuve.
4. Le kit vidéo (prompt ci-dessous), sur sa propre branche.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\inventaire-outils-formation" push -u origin doc/inventaire-outils-formation
gh pr create --base main --head doc/inventaire-outils-formation --title "Inventaire des outils des établissements et modules à créer (11 novembre)" --fill
git -C "..\travaux-planner\pla-06-mesure-d01" push origin etude/pla-06-mesure-d01
```

## Prompt de reprise : décisions de l'inventaire

```text
Tu reprends l'inventaire des outils des établissements de Planner (tâche doc/ hors chantier),
branche doc/inventaire-outils-formation, dossier ..\travaux-planner\inventaire-outils-formation.
Lis AGENTS.md, docs/plan/README.md, docs/plan/suivi.md, docs/etude-marche/05-outils-structures-formation.md,
le rapport docs/etude-marche/reports/Outils scolaires et besoins par pays.md
et cette fiche (docs/sessions/2026-11-11-doc-inventaire-outils-formation.md).
Réponses du chef à I-1 à I-5 : <à coller ici>.
Si des modules sont retenus : branche doc/ à part, fichiers de module au format de docs/plan/modules/,
lignes dans suivi.md, décisions datées dans decisions.md. Aucun code.
Fin de session : suivi.md, fiche dans docs/sessions/, prompt de reprise ; jamais de git push.
```

## Prompt de reprise : kit vidéo

```text
Tu prépares le kit de la vidéo de présentation de Planner (MKT-05, exception de chantier à confirmer : V-1),
sur une branche mkt/mkt-05-kit-video partant de origin/main, dans ..\travaux-planner\mkt-05-kit-video.
Lis AGENTS.md, docs/plan/modules/MKT-marketing.md, kit-video-planner/Kit vidéo Planner.md (kit du 25 octobre,
3 scénarios, 20 captures, logos fictifs ORION et NOVA), DESIGN.md, docs/conception/interface/conception-socle-neutre.md,
docs/etude-marche/05-outils-structures-formation.md et cette fiche (docs/sessions/2026-11-11-doc-inventaire-outils-formation.md, questions V-1 à V-6).
Décisions du chef : public = directeurs d'écoles (maternelle au lycée) et de centres de formation ; versions de 2 min et de 30 s ;
école FICTIVE à la place de l'école pilote ; ne montrer que ce qui fonctionne aujourd'hui ;
les modules prévus apparaissent seulement comme des OBJECTIFS (« Planner s'enrichit pour couvrir… »), jamais comme disponibles ;
voix off ElevenLabs en français.
Le chef veut UNIQUEMENT les éléments : texte de voix off par scène, textes à l'écran, liste des images et captures à produire
(écran, rôle, données fictives, format 16:9 et 9:16), durées. Le montage se fait sur un autre abonnement.
Vérifie dans le code, avant de l'écrire, que chaque fonction montrée existe. Pose tes questions (prix affiché ou non,
nom de la marque, contact du carton final, couleur bleue de démonstration) avant de rédiger, puis fais valider le plan court.
Fin de session : suivi.md, fiche dans docs/sessions/, prompt de reprise ; jamais de git push.
```
