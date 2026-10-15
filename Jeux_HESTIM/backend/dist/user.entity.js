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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const typeorm_1 = require("typeorm");
const classe_entity_1 = require("./classe.entity");
const matiere_entity_1 = require("./matiere.entity");
const groupe_entity_1 = require("./groupe.entity");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "prenom", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'En attente' }),
    __metadata("design:type", String)
], User.prototype, "statut", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => classe_entity_1.Classe, (classe) => classe.participants, { nullable: true }),
    __metadata("design:type", classe_entity_1.Classe)
], User.prototype, "classe", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => matiere_entity_1.Matiere, { nullable: true }),
    __metadata("design:type", matiere_entity_1.Matiere)
], User.prototype, "matiere", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => groupe_entity_1.Groupe, (groupe) => groupe.participants, { nullable: true }),
    __metadata("design:type", groupe_entity_1.Groupe)
], User.prototype, "groupe", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)()
], User);
//# sourceMappingURL=user.entity.js.map