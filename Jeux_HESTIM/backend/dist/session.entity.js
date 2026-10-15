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
exports.SessionPedagogique = void 0;
const typeorm_1 = require("typeorm");
const classe_entity_1 = require("./classe.entity");
const user_entity_1 = require("./user.entity");
let SessionPedagogique = class SessionPedagogique {
};
exports.SessionPedagogique = SessionPedagogique;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SessionPedagogique.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SessionPedagogique.prototype, "titre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], SessionPedagogique.prototype, "dateDebut", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], SessionPedagogique.prototype, "dateFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SessionPedagogique.prototype, "jeu", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SessionPedagogique.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Brouillon' }),
    __metadata("design:type", String)
], SessionPedagogique.prototype, "statut", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SessionPedagogique.prototype, "duree", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => classe_entity_1.Classe, { nullable: false }),
    __metadata("design:type", classe_entity_1.Classe)
], SessionPedagogique.prototype, "classe", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    __metadata("design:type", user_entity_1.User)
], SessionPedagogique.prototype, "enseignant", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], SessionPedagogique.prototype, "participants", void 0);
exports.SessionPedagogique = SessionPedagogique = __decorate([
    (0, typeorm_1.Entity)()
], SessionPedagogique);
//# sourceMappingURL=session.entity.js.map