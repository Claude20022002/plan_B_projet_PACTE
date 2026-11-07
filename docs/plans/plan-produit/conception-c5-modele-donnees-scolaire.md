# Conception C-5 : modèle de données du scolaire

**Plan du document, à valider par le chef de projet avant de le remplir.** Groupes A et B, lot C-5, vague V1 (`04-plan-fusionne.md`). Conception seulement, sans code.

Chaque question porte la réponse que le groupe A propose (P-xx du registre). Valider le plan, c'est dire si ces réponses conviennent.

## Questions à trancher avant de remplir

| N° | Question | Proposition du groupe A | Pourquoi cela compte |
|---|---|---|---|
| Q-1 | **Doubler les tables ou réutiliser celles du supérieur ?** | **Réutiliser** : une classe est un `Groupe`, un élève un `Etudiant`, une matière un `Cours`. Le sens reste dans le code, le vocabulaire dans la base (D-06) | Doubler coûterait toute la planification, le solveur, l'appel et l'application. Réutiliser oblige à desserrer plusieurs colonnes (§ 2) |
| Q-2 | **`Groupe.id_filiere` et `Cours.id_filiere` sont obligatoires ; que met-on pour un collège sans filière ?** | **Un cycle ou une filière implicite** créés d'office, plutôt que rendre ces colonnes facultatives | Rendre ces colonnes facultatives toucherait des dizaines de requêtes. À vérifier fichier par fichier avant de trancher |
| Q-3 | **Groupes de langue ou d'option, formés d'élèves de plusieurs classes ?** D-06 limite à trois niveaux emboîtés, et le solveur ne connaît pas les conflits par élève (écart F-5) | **Une nature de groupe « transversal »**, hors de la hiérarchie, avec ses inscriptions ; sa prise en compte par le solveur reste à F-11 | Au collège et au lycée, c'est le cas courant. D-06 en serait amendée |
| Q-4 | **Un parent : un rôle dans `Users`, ou une table à part ?** | **`ResponsableLegal` à part, avec un compte facultatif** ; `Users.role` gagne `parent` seulement si le compte existe | Beaucoup de parents n'auront pas de compte ; le lien de famille existe sans lui. Touche `role`, un ENUM, et D-05 |
| Q-5 | **Un parent avec des enfants dans deux écoles** | Un seul compte plateforme, une appartenance par école (D-05) ; **chaque école ne voit que sa propre fiche** | Une école ne doit pas apprendre où sont scolarisés les autres enfants |
| Q-6 | **`Appartenir` (élève et groupe) n'a pas d'année ni d'état. Où vit l'inscription ?** | **Une table `Inscription`** (élève, année, niveau, état). `Appartenir` reste le lien aux groupes, année lue par `Groupe.id_annee` (ME-18) | La réinscription, les frais et l'historique en dépendent |
| Q-7 | **Le numéro de CIN et les données de santé** | **Aucun champ de CIN obligatoire, pas de santé** dans le socle. Le code Massar (CNE) est facultatif | D'après la loi 09-08 lue, la CIN et la santé imposent une autorisation préalable de la CNDP. À confirmer par la CNDP |
| Q-8 | **Note absente, dispensé, à rattraper** | **Un état à part de la valeur** : une absence n'est pas un zéro | Sinon les moyennes sont fausses ; condition du bulletin partiel (F-13) |
| Q-9 | **Une note ou un paiement peut-il se modifier ?** | **Note** : modifiable jusqu'au verrouillage de la période, ensuite avec une raison, historisée. **Paiement et reçu** : jamais modifiés, on annule par une écriture inverse, reçus numérotés sans trou | Les règles de EC-3 restent à valider par la scolarité et le juriste. La numérotation des reçus est à confirmer avec l'expert-comptable |
| Q-10 | **Le supérieur reçoit-il aussi les notes et les frais ?** | **Oui en tables, éteints par le registre des modules** (F-02) : HESTIM ne voit rien changer, et pourra les allumer | Évite de construire deux fois |
| Q-11 | **Sur quelle pile écrire ?** L'étude est ouverte | **MySQL et Sequelize, comme aujourd'hui**, sans fonction propre à MySQL hors des tables existantes | Le document ne doit pas attendre l'étude, ni la gêner |
| Q-12 | **Numéros de migration** : `05-suivi.md` n'existe pas encore (C-1). 0059 EC-9, 0060 socle neutre, 0061 MP-1 | **Réserver 0062 à 0079 pour C-5** dans `05-suivi.md`, au plus tard à la relecture | Le plan impose la réservation avant d'écrire une migration |
| Q-13 | **MP-1 (`a/mp1-valeurs`) est-il un prérequis ?** | **Oui pour le profil par niveau** : une école de la maternelle au lycée suit plusieurs profils, ce que MP-1 résout. À fusionner avant F-04 | Sans lui, le § 3 n'a pas où ranger le profil d'un niveau |
| Q-14 | **Un élève doit-il avoir un compte ?** `Users.email` et `password_hash` sont obligatoires, et `Etudiant` a pour clé `id_user` : un enfant de 6 ans devrait avoir une adresse et un mot de passe | **Séparer la personne du compte**, avec une étude d'impact fichier par fichier ; pas d'adresse factice | `Users` est lu partout. C'est la décision la plus lourde de C-5 (revue, B-2) |

## Plan

### 1. Objet et limites

- Ce que le document décide, et ce qu'il laisse aux lots F-04, F-10 à F-15.
- Hors sujet : l'admission, les bourses, la comptabilité, la paie, le transport, la cantine.
- *Question : le conseil de classe et la décision de passage entrent-ils ici, ou à F-13 ?*

### 2. Les entités du scolaire (a) · groupe A

Pour chacune : rôle, champs, clés, règles.

- **Structure** : année scolaire, cycle, niveau, classe, demi-groupe, groupe transversal.
- **Enseignement** : matière, coefficient, professeur principal.
- **Personnes** : élève, responsable légal, lien de famille.
- **Parcours** : inscription, réinscription.
- **Évaluation** : période de notes, évaluation, note, appréciation.
- **Finance** : grille de frais, échéance, paiement, reçu.
- *Question : le coefficient dépend-il de la matière seule, ou aussi du niveau et de la filière du lycée ?* Le coefficient actuel est sur `Cours`.
- *Question : un paiement couvre-t-il un élève ou une famille ?* Les fratries payent souvent ensemble.
- *Question : combien de périodes de notes, et sont-elles les mêmes pour tous les cycles ?* `Periode.code` ne connaît que S1 et S2.

### 3. Correspondance avec le modèle du supérieur (b) · groupe A

Tableau par entité : **réutilisé, étendu ou ajouté**, et le changement exact de colonne.

- `Filiere`, `Groupe`, `Cours`, `CoursComposante`, `AnneeUniversitaire`, `Periode`, `Etudiant`, `Appartenir`, `Users`, `ConfigurationEtablissement`.
- Les listes fermées à ouvrir : `Users.role`, `Filiere.cycle`, `Filiere.ecole`, `Filiere.regime`, `CoursComposante.type`, `Groupe.type_groupe`, `Periode.code`.
- *Question : `AnneeUniversitaire` garde-t-elle son nom technique ?* Proposition : oui (identifiant figé, D-11), l'écran dit « année scolaire ».

### 4. Profils et nomenclatures (c) · groupe A

- Le lien entre un niveau et son profil du moteur (primaire, collège, lycée, formation).
- Ce qui reste du **sens** dans le code, ce qui devient **vocabulaire** dans la base (D-06, F-04), en remplacement de `backend/config/referentiel.js`, importé par 28 fichiers.
- Ce que ces données doivent fournir au solveur : effectifs, classes, salles fixes, vacataires.
- *Question : quelles nomenclatures sont communes à tout le produit, et lesquelles propres à chaque école ?*

### 5. Plusieurs écoles sur une installation (d) · groupe A

Tableau par table : effet de D-01 (une base par école), D-03 (contexte d'établissement), ME-3a et ME-3b.

- Rappel : aucune colonne d'établissement, chaque table vit dans la base de l'école.
- Ce qui passe par la Plateforme : comptes, appartenances des parents et des élèves.
- Les identifiants stables (`uid`, ME-2d), les canaux d'isolation de l'audit (18) touchés par ces tables, et les tests d'isolation (ME-6).
- *Question : un parent peut-il se connecter avant ME-8 réduit ?* La vague V2 doit le permettre.

### 6. Plan de migrations (e) · groupe A

- « Étendre puis contracter », lot par lot, avec les numéros réservés et l'ordre.
- **Preuve que HESTIM ne voit rien changer** : même schéma lu, mêmes parcours verts, problème envoyé au solveur identique, modules éteints.
- Le retour arrière de chaque migration.
- Données à créer d'office pour HESTIM (cycles, nomenclatures), et pour une base neuve.

### 7. Propriétaires des tables (f) · groupes A et B

Tableau : une table, une équipe (PF, MO, VS, FI, MP). Les contrats entre équipes.

- *Question : qui possède `Users` et les appartenances (PF), et `Etudiant` et `ResponsableLegal` (VS) ?*

### 8. Diagrammes (g) · groupe A

Mermaid : classes, cycle de vie d'une inscription, activité de la saisie des notes.

### 9. Règles numérotées (g) · groupes A et B

Règles C5-1 et suivantes, chacune avec le test qui la vérifie. Reprend les réponses aux questions ci-dessus.

### 10. Besoins des écrans (groupe B) · à compléter

Par le groupe B, qui relit aussi le reste.

- Vues de l'administration, de l'enseignant, du parent et de l'élève.
- **EP-5** saisie unique ; **EP-6** l'enseignant saisit moins ; **EP-7** notifications maîtrisées.
- Ce que ces écrans demandent en plus au modèle.

### 11. Questions ouvertes

Celles qui restent après validation, avec qui peut répondre (scolarité, juriste, CNDP, AREF, expert-comptable).
