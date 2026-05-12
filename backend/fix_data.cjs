const sequelize = require('./config/db.js').default;

async function fixData() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');
    
    // Import des modèles après la connexion
    const { Cours, Groupe, Institution } = require('./models/index.js');
    
    // Récupérer l'institution par défaut
    const defaultInstitution = await Institution.findOne({ where: { slug: 'default' } });
    
    if (!defaultInstitution) {
      console.error('❌ Institution par défaut non trouvée');
      return;
    }
    
    console.log(`\n=== Mise à jour des cours vers l'institution ${defaultInstitution.id_institution} ===`);
    
    // Mettre à jour tous les cours sans institution
    const [coursUpdated] = await Cours.update(
      { id_institution: defaultInstitution.id_institution },
      { where: { id_institution: null } }
    );
    console.log(`✅ ${coursUpdated} cours mis à jour`);
    
    console.log(`\n=== Mise à jour des groupes vers l'institution ${defaultInstitution.id_institution} ===`);
    
    // Mettre à jour tous les groupes sans institution
    const [groupesUpdated] = await Groupe.update(
      { id_institution: defaultInstitution.id_institution },
      { where: { id_institution: null } }
    );
    console.log(`✅ ${groupesUpdated} groupes mis à jour`);
    
    // Vérification après mise à jour
    console.log('\n=== Vérification après mise à jour ===');
    
    const coursWithInstitution = await Cours.findAll({ 
      where: { id_institution: defaultInstitution.id_institution }
    });
    console.log(`Cours avec institution ${defaultInstitution.id_institution}: ${coursWithInstitution.length}`);
    
    const groupesWithInstitution = await Groupe.findAll({ 
      where: { id_institution: defaultInstitution.id_institution }
    });
    console.log(`Groupes avec institution ${defaultInstitution.id_institution}: ${groupesWithInstitution.length}`);
    
    await sequelize.close();
    console.log('\n✅ Correction terminée avec succès !');
    
  } catch (error) {
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixData();
