# 📸 Guide d'Export des Diagrammes en Images

Ce document explique comment exporter les diagrammes Mermaid en images PNG/SVG pour les inclure dans votre documentation et README GitHub.

---

## 🎯 Diagrammes à Exporter

Vous avez 6 diagrammes principaux à convertir en images :

1. **MCD** - Modèle Conceptuel de Données
2. **MLD** - Modèle Logique de Données
3. **Diagramme de Cas d'Usage**
4. **Diagramme de Classes**
5. **Diagramme de Séquence** - Création de Réservation
6. **Diagramme d'Activité** - Détection de Conflits

---

## 🛠️ Méthode 1 : Mermaid Live Editor (Recommandé)

### Étapes :

1. **Aller sur** : https://mermaid.live/

2. **Copier le code Mermaid** de chaque diagramme (fourni dans les artifacts précédents)

3. **Coller dans l'éditeur** Mermaid Live

4. **Exporter l'image** :

    - Cliquer sur le bouton **"Actions"** en haut à droite
    - Choisir **"PNG"** ou **"SVG"** selon votre préférence
    - Télécharger l'image

5. **Renommer et organiser** :
    ```
    docs/database/MCD.png
    docs/database/MLD.png
    docs/uml/use_case.png
    docs/uml/class_diagram.png
    docs/uml/sequence_reservation.png
    docs/uml/activity_conflict.png
    ```

---

## 🛠️ Méthode 2 : Extension VS Code

### Installation :

1. Installer l'extension **"Markdown Preview Mermaid Support"**
2. Ou installer **"Mermaid Chart"**

### Utilisation :

1. Créer un fichier `.md` avec le code Mermaid :

    ````markdown
    ```mermaid
    [votre code mermaid ici]
    ```
    ````

    ```

    ```

2. Ouvrir la prévisualisation Markdown (Ctrl+Shift+V)

3. Faire un clic droit sur le diagramme → **"Copy Image"**

4. Coller dans un éditeur d'images ou sauvegarder directement

---

## 🛠️ Méthode 3 : Mermaid CLI (Pour automatisation)

### Installation :

```bash
npm install -g @mermaid-js/mermaid-cli
```

### Utilisation :

```bash
# Créer un fichier diagram.mmd avec votre code Mermaid
# Puis exporter :
mmdc -i diagram.mmd -o diagram.png
```

---

## 📂 Structure des Fichiers Images

Créez cette structure dans votre projet :

```
docs/
├── database/
│   ├── MCD.png
│   ├── MLD.png
│   └── schema.sql
├── uml/
│   ├── use_case.png
│   ├── class_diagram.png
│   ├── sequence_reservation.png
│   └── activity_conflict.png
└── architecture/
    └── system_architecture.png
```

---

## 🎨 Recommandations de Format

### Pour le README GitHub :

-   **Format** : PNG
-   **Résolution** : 1920x1080px (maximum)
-   **Poids** : < 500 KB par image
-   **Fond** : Transparent ou blanc

### Pour les Rapports PDF :

-   **Format** : PNG ou SVG
-   **Résolution** : 300 DPI
-   **Fond** : Blanc

---

## ✅ Checklist après Export

-   [ ] MCD exporté et placé dans `docs/database/MCD.png`
-   [ ] MLD exporté et placé dans `docs/database/MLD.png`
-   [ ] Diagramme de cas d'usage exporté dans `docs/uml/use_case.png`
-   [ ] Diagramme de classes exporté dans `docs/uml/class_diagram.png`
-   [ ] Diagramme de séquence exporté dans `docs/uml/sequence_reservation.png`
-   [ ] Diagramme d'activité exporté dans `docs/uml/activity_conflict.png`
-   [ ] Toutes les images sont référencées dans le README.md
-   [ ] Les images s'affichent correctement sur GitHub

---

## 🔗 Liens dans le README

Une fois les images exportées, mettez à jour les liens dans le README :

```markdown
### Modèle Conceptuel de Données (MCD)

![MCD Diagram](docs/database/MCD.png)

### Modèle Logique de Données (MLD)

![MLD Diagram](docs/database/MLD.svg)

### Diagramme de Cas d'Usage

![Use Case Diagram](docs/uml/use_case.png)

### Diagramme de Classes

![Class Diagram](docs/uml/class_diagram.png)

### Diagramme de Séquence

![Sequence Diagram](docs/uml/sequence_reservation.png)

### Diagramme d'Activité

![Activity Diagram](docs/uml/activity_conflict.png)
```

---

## 💡 Astuce : Utiliser draw.io pour retouches

Si vous voulez améliorer visuellement vos diagrammes :

1. Exporter depuis Mermaid en SVG
2. Importer dans **draw.io** (https://app.diagrams.net/)
3. Ajuster couleurs, polices, disposition
4. Exporter en PNG haute qualité

---

## 🆘 En cas de problème

### Diagramme trop grand

-   Réduire la taille des labels
-   Diviser en plusieurs diagrammes
-   Utiliser des abréviations

### Image floue sur GitHub

-   Exporter en résolution supérieure (2x)
-   Utiliser SVG au lieu de PNG
-   Vérifier que l'image fait < 10 MB

### Couleurs illisibles

-   Utiliser des couleurs contrastées
-   Ajouter des bordures aux éléments
-   Tester en mode clair ET sombre de GitHub

---

**Bonne documentation ! 📚**
