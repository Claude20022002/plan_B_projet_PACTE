# Modèles d'import

Deux fichiers Excel à copier, remplir puis importer depuis le site. Les personnes qu'ils contiennent sont **fictives** : leurs adresses finissent par `@exemple.hestim.test`, un domaine qui n'existe pas. Supprimer ces lignes avant d'importer.

| Fichier | Où l'importer | Colonnes obligatoires | Colonnes facultatives |
|---|---|---|---|
| `modele-etudiants.xlsx` | Étudiants, « Importer (Excel/CSV) » | `nom`, `prenom`, `email`, `numero_etudiant`, `niveau` | `telephone`, `groupe` |
| `modele-enseignants.xlsx` | Enseignants, « Importer » | `nom`, `prenom`, `email` | `telephone`, `specialite`, `departement`, `grade`, `bureau`, `statut`, `service_annuel_heures`, `max_heures_semaine`, `entreprise` |

## À savoir avant de remplir

- **La première ligne ne se modifie pas** : ce sont les noms des colonnes attendus par l'import. Seule la première feuille du classeur est lue.
- **Pas de colonne de mot de passe.** Chaque personne importée reçoit par email un lien d'invitation pour choisir le sien.
- **`groupe`** est le nom du groupe le plus fin, tel qu'il s'affiche dans la page Groupes (`IIIA-3A-TD1` n'est qu'un exemple). Un groupe inconnu fait refuser la ligne ; une case vide crée l'étudiant sans groupe.
- **`statut`** vaut `permanent` ou `vacataire`. Toute autre valeur fait refuser la ligne.
- Une adresse déjà utilisée ou un numéro d'étudiant déjà pris fait refuser la ligne ; les autres lignes sont importées, et le bilan liste les lignes à corriger.

## Ne pas versionner de vraie liste

Une liste d'étudiants ou d'enseignants est une donnée personnelle. Le `.gitignore` écarte tous les fichiers `.xlsx` et `.xls`, sauf ceux de ce dossier : un fichier rempli se garde hors du dépôt.
