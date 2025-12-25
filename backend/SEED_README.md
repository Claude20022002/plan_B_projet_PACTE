# 🌱 Guide d'utilisation du Seed

Ce script permet de créer rapidement des utilisateurs de test dans votre base de données pour tester l'application.

## 🚀 Utilisation

### Option 1 : Utiliser le script de seed (Recommandé)

1. **Assurez-vous que votre base de données est configurée** dans le fichier `.env`

2. **Exécutez le script de seed** :
   ```bash
   npm run seed
   ```

   Ou directement :
   ```bash
   node seed.js
   ```

3. **Les comptes suivants seront créés** :

   - **👨‍💼 Administrateur**
     - Email: `admin@hestim.ma`
     - Mot de passe: `password123`

   - **👨‍🏫 Enseignant**
     - Email: `enseignant@hestim.ma`
     - Mot de passe: `password123`

   - **👨‍🎓 Étudiant**
     - Email: `etudiant@hestim.ma`
     - Mot de passe: `password123`

4. **Connectez-vous** avec l'un de ces comptes sur la page de connexion !

### Option 2 : Utiliser la route d'inscription

Vous pouvez également créer un compte via l'API d'inscription :

**Endpoint** : `POST /api/auth/register`

**Body** :
```json
{
  "nom": "Votre Nom",
  "prenom": "Votre Prénom",
  "email": "votre.email@hestim.ma",
  "password": "VotreMotDePasse123!",
  "role": "etudiant" // ou "enseignant" ou "admin"
}
```

**Exemple avec curl** :
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "email": "test@hestim.ma",
    "password": "Test123!@#",
    "role": "etudiant"
  }'
```

## 📋 Données créées par le seed

Le script crée également :
- ✅ 3 salles de test
- ✅ 4 créneaux horaires
- ✅ 3 cours de test
- ✅ 1 filière (Génie Informatique)
- ✅ 1 groupe (GI-3A)

## ⚠️ Notes importantes

- Le script utilise `findOrCreate`, donc il ne créera pas de doublons si vous l'exécutez plusieurs fois
- Le mot de passe par défaut est `password123` pour tous les comptes de test
- Pour la production, changez ces mots de passe !

## 🔄 Réinitialiser les données

Si vous voulez réinitialiser complètement la base de données :

1. Supprimez toutes les tables dans votre base de données MySQL
2. Redémarrez le serveur (les tables seront recréées)
3. Exécutez `npm run seed` pour créer les données de test

