"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const classe_entity_1 = require("./classe.entity");
const matiere_entity_1 = require("./matiere.entity");
const groupe_entity_1 = require("./groupe.entity");
const user_entity_1 = require("./user.entity");
const bcrypt = __importStar(require("bcrypt"));
let SeedService = class SeedService {
    constructor(classesRepo, matieresRepo, groupesRepo, usersRepo) {
        this.classesRepo = classesRepo;
        this.matieresRepo = matieresRepo;
        this.groupesRepo = groupesRepo;
        this.usersRepo = usersRepo;
    }
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
                    if (i % 50 === 0)
                        console.log(`${i} participants vérifiés/créés...`);
                }
            }
        }
        console.log('Jeu de données volumineux prêt !');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(classe_entity_1.Classe)),
    __param(1, (0, typeorm_1.InjectRepository)(matiere_entity_1.Matiere)),
    __param(2, (0, typeorm_1.InjectRepository)(groupe_entity_1.Groupe)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map