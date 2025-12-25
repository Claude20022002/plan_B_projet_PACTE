# 🚀 Guide de Démarrage - Frontend HESTIM Planner

## 📋 Prérequis

- Node.js 18+ installé
- Backend démarré sur `http://localhost:5000`
- Base de données MySQL configurée

## 🔧 Installation

1. **Naviguer vers le dossier frontend**
   ```bash
   cd frontend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Créer un fichier `.env` à partir de `.env.example` :
   ```bash
   cp .env.example .env
   ```
   
   Vérifier que `VITE_API_URL=http://localhost:5000/api` est correct

4. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

   L'application sera accessible sur `http://localhost:5173` (ou le port indiqué)

## 🎯 Utilisation

### Connexion

1. Accéder à `http://localhost:5173`
2. Cliquer sur "Se connecter" ou aller sur `/connexion`
3. Utiliser les identifiants de test :
   - **Admin** : email admin, mot de passe admin
   - **Enseignant** : email enseignant, mot de passe enseignant
   - **Étudiant** : email étudiant, mot de passe étudiant

### Navigation

- **Sidebar** : Menu latéral avec toutes les fonctionnalités selon le rôle
- **Header** : Barre supérieure avec notifications et profil utilisateur
- **Dashboard** : Tableau de bord personnalisé selon le rôle

### Fonctionnalités par Rôle

#### 👨‍💼 Administrateur
- Dashboard avec statistiques
- Gestion complète des ressources (salles, cours, utilisateurs, etc.)
- Gestion des affectations
- Gestion des conflits
- Consultation des statistiques

#### 👨‍🏫 Enseignant
- Dashboard avec prochains cours
- Consultation de l'emploi du temps
- Gestion des disponibilités
- Demandes de report

#### 👨‍🎓 Étudiant
- Dashboard avec prochains cours
- Consultation de l'emploi du temps du groupe
- Recherche de salles disponibles

## 📁 Structure des Fichiers

```
frontend/src/
├── services/
│   └── api.js              # Service API centralisé
├── contexts/
│   └── AuthContext.jsx    # Contexte d'authentification
├── components/
│   ├── common/             # Composants réutilisables
│   └── layouts/           # Layouts (DashboardLayout)
├── pages/
│   ├── Accueil.jsx        # Page d'accueil
│   ├── Connexion.jsx      # Page de connexion
│   ├── dashboard/         # Dashboards par rôle
│   ├── gestion/           # Pages de gestion (admin)
│   └── emploi-du-temps/   # Pages d'emploi du temps
└── App.jsx                # Application principale avec routing
```

## 🔌 Configuration API

Le service API est configuré dans `src/services/api.js`. 

Pour changer l'URL de l'API, modifier la variable `VITE_API_URL` dans le fichier `.env`.

## 🎨 Personnalisation

### Thème Material-UI

Le thème est configuré dans `src/App.jsx`. Vous pouvez modifier les couleurs :

```javascript
const theme = createTheme({
    palette: {
        primary: {
            main: '#7c4dff', // Couleur principale
        },
        secondary: {
            main: '#001962', // Couleur secondaire
        },
    },
});
```

### Images

Les images sont dans :
- `src/assets/img/` - Images pour l'accueil et la connexion
- `public/` - Images publiques (logo, etc.)

## 🐛 Dépannage

### Erreur de connexion à l'API
- Vérifier que le backend est démarré
- Vérifier l'URL dans `.env`
- Vérifier les CORS dans le backend

### Erreur d'authentification
- Vérifier que le token est bien stocké dans localStorage
- Vérifier l'expiration du token
- Se déconnecter et se reconnecter

### Erreurs de build
- Supprimer `node_modules` et `package-lock.json`
- Réinstaller avec `npm install`
- Vérifier la version de Node.js (18+)

## 📝 Prochaines Étapes

Pour compléter le frontend, il reste à créer :

1. Pages de gestion supplémentaires (Cours, Filières, Groupes, Utilisateurs, etc.)
2. Page de notifications
3. Page de demandes de report
4. Page de disponibilités
5. Page de statistiques avec graphiques
6. Page de paramètres utilisateur

## 🆘 Support

Pour toute question ou problème, consulter :
- La documentation du backend : `backend/README.md`
- La structure créée : `STRUCTURE_CREEE.md`
- Les logs de la console du navigateur

