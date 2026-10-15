import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classe } from './classe.entity';
import { Matiere } from './matiere.entity';
import { Groupe } from './groupe.entity';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Classe)
    private classesRepo: Repository<Classe>,
    @InjectRepository(Matiere)
    private matieresRepo: Repository<Matiere>,
    @InjectRepository(Groupe)
    private groupesRepo: Repository<Groupe>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.run();
  }

  async run() {
    console.log('Vérification des données de base...');

    const niveaux = ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année'];
    const filieres = [
      'Génie Informatique',
      'Génie Industriel',
      'Génie Civil',
      'Management',
    ];

    // Création des classes si elles n’existent pas
    for (const niveau of niveaux) {
      let classe = await this.classesRepo.findOne({ where: { nom: niveau } });

      if (!classe) {
        classe = this.classesRepo.create({ nom: niveau });
        classe = await this.classesRepo.save(classe);
        console.log(`Classe ajoutée : ${niveau}`);
      }

      // Création des matières/filières pour chaque classe
      for (const filiere of filieres) {
        const matiereExistante = await this.matieresRepo.findOne({
          where: {
            nom: filiere,
            classe: { id: classe.id },
          },
          relations: ['classe'],
        });

        if (!matiereExistante) {
          const matiere = this.matieresRepo.create({
            nom: filiere,
            classe,
          });
          await this.matieresRepo.save(matiere);
          console.log(`Matière ajoutée : ${filiere} (${niveau})`);
        }
      }
    }

    // Création des 4 groupes/entreprises si nécessaires
    for (let i = 1; i <= 4; i++) {
      const nomGroupe = `Entreprise ${i}`;
      const groupeExistant = await this.groupesRepo.findOne({ where: { nom: nomGroupe } });

      if (!groupeExistant) {
        const groupe = this.groupesRepo.create({ nom: nomGroupe });
        await this.groupesRepo.save(groupe);
        console.log(`Groupe ajouté : ${nomGroupe}`);
      }
    }

    console.log('Données de base prêtes.');

    await this.generateLargeDataset();
  }

  async generateLargeDataset() {
    console.log('Génération d’un jeu de données volumineux...');
    const salt = await bcrypt.genSalt();
    const defaultPassword = await bcrypt.hash('password123', salt);

    // 1. Ajouter des Administrateurs (jusqu'à 4)
    for (let i = 1; i <= 3; i++) {
      const email = `admin${i}@hestim.ma`;
      const exists = await this.usersRepo.findOne({ where: { email } });
      if (!exists) {
        const admin = this.usersRepo.create({
          nom: 'Admin',
          prenom: `Hestim ${i}`,
          email,
          passwordHash: defaultPassword,
          role: 'Administrateur',
          statut: 'Validé',
        });
        await this.usersRepo.save(admin);
      }
    }

    const allClasses = await this.classesRepo.find();

    // 2. Ajouter des Enseignants (10)
    for (let i = 1; i <= 10; i++) {
      const email = `enseignant${i}@hestim.ma`;
      const exists = await this.usersRepo.findOne({ where: { email } });
      if (!exists) {
        const teacher = this.usersRepo.create({
          nom: 'Enseignant',
          prenom: `Pr. ${i}`,
          email,
          passwordHash: defaultPassword,
          role: 'Enseignant',
          statut: 'Validé',
          classe: allClasses[i % allClasses.length],
        });
        await this.usersRepo.save(teacher);
      }
    }

    // 3. Ajouter des Participants (200)
    const totalParticipantsNeeded = 200;
    const currentParticipants = await this.usersRepo.count({ where: { role: 'Participant' } });

    if (currentParticipants < totalParticipantsNeeded) {
      console.log(`Ajout de participants supplémentaires pour atteindre ${totalParticipantsNeeded}...`);
      for (let i = 1; i <= totalParticipantsNeeded; i++) {
        const email = `apprenant${i}@hestim.ma`;
        
        // Vérifier si cet email précis existe déjà
        const exists = await this.usersRepo.findOne({ where: { email } });
        
        if (!exists) {
          const student = this.usersRepo.create({
            nom: `Nom${i}`,
            prenom: `Prenom${i}`,
            email,
            passwordHash: defaultPassword,
            role: 'Participant',
            statut: 'Validé',
            classe: allClasses[i % allClasses.length],
          });
          await this.usersRepo.save(student);
          if (i % 50 === 0) console.log(`${i} participants vérifiés/créés...`);
        }
      }
    }

    console.log('Jeu de données volumineux prêt !');
  }
}
