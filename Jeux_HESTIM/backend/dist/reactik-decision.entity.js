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
exports.ReactikDecision = void 0;
const typeorm_1 = require("typeorm");
const session_entity_1 = require("./session.entity");
const groupe_entity_1 = require("./groupe.entity");
let ReactikDecision = class ReactikDecision {
};
exports.ReactikDecision = ReactikDecision;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_entity_1.SessionPedagogique),
    __metadata("design:type", session_entity_1.SessionPedagogique)
], ReactikDecision.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => groupe_entity_1.Groupe),
    __metadata("design:type", groupe_entity_1.Groupe)
], ReactikDecision.prototype, "groupe", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "roundNumber", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "prixVente", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "quantiteProduite", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "investissementMarketing", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "ventesRealisees", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "resultatProfit", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], ReactikDecision.prototype, "partDeMarche", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReactikDecision.prototype, "createdAt", void 0);
exports.ReactikDecision = ReactikDecision = __decorate([
    (0, typeorm_1.Entity)()
], ReactikDecision);
//# sourceMappingURL=reactik-decision.entity.js.map