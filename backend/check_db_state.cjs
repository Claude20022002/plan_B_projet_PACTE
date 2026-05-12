const sequelize = require('./config/db.js').default;

async function checkDbState() {
  try {
    console.log('🔍 Vérification de l\'état actuel de la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');
    
    const { Cours, Groupe, Salle, Filiere, Institution, Users } = require('./models/index.js');
    
    // Vérifier l'institution par défaut
    const defaultInstitution = await Institution.findOne({ where: { slug: 'default' } });
    console.log(`Institution par défaut: ${defaultInstitution ? defaultInstitution.id_institution : 'NON TROUVÉE'}`);
    
    // Vérifier les données actuelles
    const allCours = await Cours.findAll();
    const coursWithInstitution = await Cours.findAll({ 
      where: { id_institution: defaultInstitution?.id_institution || 1 }
    });
    
    const allGroupes = await Groupe.findAll();
    const groupesWithInstitution = await Groupe.findAll({ 
      where: { id_institution: defaultInstitution?.id_institution || 1 }
    });
    
    const allSalles = await Salle.findAll();
    const sallesWithInstitution = await Salle.findAll({ 
      where: { id_institution: defaultInstitution?.id_institution || 1 }
    });
    
    const allFilieres = await Filiere.findAll();
    const filieresWithInstitution = await Filiere.findAll({ 
      where: { id_institution: defaultInstitution?.id_institution || 1 }
    });
    
    const allUsers = await Users.findAll();
    
    console.log('\n📊 ÉTAT ACTUEL DE LA BASE DE DONNÉES :');
    console.log(`Cours: ${allCours.length} totaux, ${coursWithInstitution.length} avec institution`);
    console.log(`Groupes: ${allGroupes.length} totaux, ${groupesWithInstitution.length} avec institution`);
    console.log(`Salles: ${allSalles.length} totaux, ${sallesWithInstitution.length} avec institution`);
    console.log(`Filières: ${allFilieres.length} totaux, ${filieresWithInstitution.length} avec institution`);
    console.log(`Users: ${allUsers.length} totaux`);
    
    // Vérifier s'il y a des admins
    const admins = await Users.findAll({ where: { role: 'admin' } });
    console.log(`Admins: ${admins.length}`);
    
    if (admins.length > 0) {
      console.log('Admins disponibles:');
      admins.slice(0, 3).forEach(admin => {
        console.log(`  - ${admin.email} (${admin.actif ? 'actif' : 'inactif'})`);
      });
    }
    
    await sequelize.close();
    
    if (coursWithInstitution.length === 0 || groupesWithInstitution.length === 0) {
      console.log('\n❌ PROBLÈME DÉTECTÉ : Les données ne sont pas associées à l\'institution!');
      console.log('💡 SOLUTION : Exécuter manuellement: node seed.js');
    } else {
      console.log('\n✅ Les données semblent correctement associées à l\'institution.');
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkDbState();
