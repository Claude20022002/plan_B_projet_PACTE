const sequelize = require('./config/db.js').default;

async function fixAuth() {
  try {
    console.log('🔧 Nettoyage des sessions et tokens invalides...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');
    
    const { AuthSession, Users } = require('./models/index.js');
    
    // Supprimer toutes les sessions existantes pour forcer une réinitialisation
    const deletedSessions = await AuthSession.destroy({
      where: {},
      truncate: true
    });
    
    console.log(`✅ ${deletedSessions} sessions supprimées`);
    
    // Réinitialiser tous les tokens utilisateurs si nécessaire
    const updatedUsers = await Users.update(
      { 
        // Pas de modification des mots de passe, juste forcer la régénération de tokens
        updated_at: new Date()
      },
      {
        where: {
          actif: true
        }
      }
    );
    
    console.log(`✅ ${updatedUsers[0]} utilisateurs mis à jour`);
    
    await sequelize.close();
    console.log('\n🔄 Veuillez vous reconnecter avec les identifiants suivants :');
    console.log('👨‍💼 Admin : admin@hestim.ma (password123)');
    console.log('👨‍🏫 Prof  : alain.bennis0@hestim.ma (password123)');
    console.log('👨‍🎓 Étud  : hamza.benali0@hestim.ma (password123)');
    console.log('\n✅ Nettoyage terminé !');
    
  } catch (error) {
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixAuth();
