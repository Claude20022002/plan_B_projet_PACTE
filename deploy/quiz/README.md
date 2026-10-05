# Quiz prêts à importer dans l’espace Quiz (ClassQuiz)

| Fichier | Contenu | Source et licence |
| --- | --- | --- |
| `culture-informatique.cqa` | 14 questions : processeur, IPv6, RIP, RAID, OSI, LAN, CSS, Node.js… | [Open Trivia DB](https://opentdb.com), catégorie « Science: Computers », traduit en français — **CC BY-SA 4.0** (citer Open Trivia DB, partager aux mêmes conditions) |
| `terminal-linux.cqa` | 10 questions sur les commandes de base, en lien avec le jeu « Terminal Linux » de l’espace Jeux | Défis de [Terminal Quest](https://github.com/brunozapico/terminal_quest) — **MIT**, © Bruno Zapico |

## Importer un quiz

1. Ouvrir l’espace **Quiz** (sélecteur d’espaces de Planner) et se connecter avec son compte HESTIM.
2. Aller sur `/import`, choisir le fichier `.cqa`, valider.
3. Le quiz apparaît dans le tableau de bord ; « Lancer » démarre une partie pendant la séance : les
   étudiants du groupe sont prévenus et la rejoignent depuis l’espace Jeux, code déjà rempli.

## Modifier ou ajouter un quiz

Les questions sont dans les `.json` (une bonne réponse, trois fausses). Après modification :

```bash
node deploy/quiz/generer-cqa.mjs
```

La place de la bonne réponse est calculée à partir du texte de la question : elle change d’une
question à l’autre mais reste la même d’une génération à la suivante.
