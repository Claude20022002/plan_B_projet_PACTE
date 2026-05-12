const sequelize = require('./config/db.js').default;

async function checkData() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');
    
    // Import des modèles après la connexion
    const { Cours, Groupe, Institution } = require('./models/index.js');
    
    console.log('\n=== Vérification des institutions ===');
    const institutions = await Institution.findAll();
    console.log('Institutions trouvées:', institutions.length);
    institutions.forEach(inst => console.log(`- ${inst.id_institution}: ${inst.nom} (${inst.slug})`));
    
    console.log('\n=== Vérification des cours ===');
    const allCours = await Cours.findAll();
    console.log('Total cours dans la BD:', allCours.length);
    
    if (allCours.length > 0) {
      console.log('Exemples de cours:');
      allCours.slice(0, 3).forEach(cours => {
        console.log(`- ${cours.id_cours}: ${cours.nom_cours} (institution: ${cours.id_institution})`);
      });
    }
    
    const coursWithInstitution = await Cours.findAll({ 
      where: { id_institution: 1 },
      include: [{ model: Institution, as: 'institution' }]
    });
    console.log('Cours avec institution 1:', coursWithInstitution.length);
    
    console.log('\n=== Vérification des groupes ===');
    const allGroupes = await Groupe.findAll();
    console.log('Total groupes dans la BD:', allGroupes.length);
    
    if (allGroupes.length > 0) {
      console.log('Exemples de groupes:');
      allGroupes.slice(0, 3).forEach(groupe => {
        console.log(`- ${groupe.id_groupe}: ${groupe.nom_groupe} (institution: ${groupe.id_institution})`);
      });
    }
    
    const groupesWithInstitution = await Groupe.findAll({ 
      where: { id_institution: 1 },
      include: [{ model: Institution, as: 'institution' }]
    });
    console.log('Groupes avec institution 1:', groupesWithInstitution.length);
    
    await sequelize.close();
  } catch (error) {
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkData();
