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
exports.ReactikState = void 0;
const typeorm_1 = require("typeorm");
const session_entity_1 = require("./session.entity");
const groupe_entity_1 = require("./groupe.entity");
let ReactikState = class ReactikState {
};
exports.ReactikState = ReactikState;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReactikState.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_entity_1.SessionPedagogique, { onDelete: 'CASCADE' }),
    __metadata("design:type", session_entity_1.SessionPedagogique)
], ReactikState.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => groupe_entity_1.Groupe),
    __metadata("design:type", groupe_entity_1.Groupe)
], ReactikState.prototype, "groupe", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ReactikState.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReactikState.prototype, "fluxData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 15 }),
    __metadata("design:type", Number)
], ReactikState.prototype, "delais", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 500 }),
    __metadata("design:type", Number)
], ReactikState.prototype, "stocks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], ReactikState.prototype, "partsDeMarche", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReactikState.prototype, "paysConquis", void 0);
exports.ReactikState = ReactikState = __decorate([
    (0, typeorm_1.Entity)()
], ReactikState);
//# sourceMappingURL=reactik-state.entity.js.map