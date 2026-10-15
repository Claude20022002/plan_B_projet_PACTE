"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const groupe_entity_1 = require("./groupe.entity");
let ChatService = class ChatService {
    constructor(usersRepository, groupesRepository) {
        this.usersRepository = usersRepository;
        this.groupesRepository = groupesRepository;
    }
    // Récupère toutes les infos nécessaires pour nourrir le chatbot
    async getContextForUser(userId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['groupe', 'groupe.participants'],
        });
        if (!user)
            return null;
        const groupe = user.groupe;
        const membres = groupe ? groupe.participants.map(p => p.nom + ' ' + p.prenom) : [];
        return {
            nom: user.nom,
            groupe: groupe ? groupe.nom : 'Aucun',
            membresDuGroupe: membres,
            progression: '45%', // Simulation
        };
    }
    // Assistant pour l'animateur : Synthèse globale
    async getAnimateurSummary() {
        const groupes = await this.groupesRepository.find({ relations: ['participants'] });
        return groupes.map(g => ({
            nom: g.nom,
            effectif: g.participants.length,
            scoreMoyen: g.participants.length > 0
                ? g.participants.reduce((acc, p) => acc + (p.score || 0), 0) / g.participants.length
                : 0
        }));
    }
    // Assistant pour l'animateur : Alertes groupes
    async getAlertesAnimateur() {
        return "Système : Tous les groupes sont actifs. Aucune alerte critique pour le moment.";
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(groupe_entity_1.Groupe)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map