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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    async login(loginData) {
        return this.appService.login(loginData);
    }
    async register(userData) {
        return this.appService.register(userData);
    }
    async getClasses() {
        return this.appService.getClasses();
    }
    async getMatieresByClasse(classeId) {
        return this.appService.getMatieresByClasse(classeId);
    }
    async getAdminDashboard() {
        return this.appService.getAdminDashboard();
    }
    async createSession(sessionData) {
        return this.appService.createSession(sessionData);
    }
    async getSessions() {
        return this.appService.getSessions();
    }
    async getParticipantDashboard(id) {
        return this.appService.getParticipantDashboard(id);
    }
    async getEnseignantDashboard(id) {
        return this.appService.getEnseignantDashboard(id);
    }
    async getSession(id) {
        return this.appService.getSessionDetails(id);
    }
    async assignGroups(id, body) {
        return this.appService.assignGroupsToSessionParticipants(body.assignments);
    }
    async removeFromGroup(id) {
        return this.appService.removeUserFromGroup(id);
    }
    async updateProgression(id, progression) {
        return this.appService.updateGroupeProgression(id, progression);
    }
    async updateCommentaire(id, commentaire) {
        return this.appService.updateGroupeCommentaire(id, commentaire);
    }
    async getGroupes() {
        return this.appService.getGroupes();
    }
    async updateSession(id, sessionData) {
        return this.appService.updateSession(id, sessionData);
    }
    async deleteSession(id) {
        return this.appService.deleteSession(id);
    }
    async endSession(id) {
        return this.appService.endSession(id);
    }
    async deleteUser(id) {
        return this.appService.deleteUser(id);
    }
    async updateUser(id, data) {
        return this.appService.updateUser(id, data);
    }
    async autoAssigner(classeId) {
        return this.appService.autoAssignerGroupes(classeId);
    }
    async getContext(userId) {
        return await this.appService.getContextForUser(userId);
    }
    async getAnimateurSummary(classeId) {
        return await this.appService.getAnimateurSummary(classeId);
    }
    async getAlertes() {
        return await this.appService.getAlertesAnimateur();
    }
    // --- ROUTES REACTIK V2 ---
    async getReactikState(sessionId, groupeId) {
        return this.appService.getReactikState(sessionId, groupeId);
    }
    async updateReactikPhase(sessionId, groupeId, body) {
        return this.appService.updateReactikPhase(sessionId, groupeId, body.phase, body.data);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('classes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getClasses", null);
__decorate([
    (0, common_1.Get)('matieres/:classeId'),
    __param(0, (0, common_1.Param)('classeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMatieresByClasse", null);
__decorate([
    (0, common_1.Get)('admin/dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminDashboard", null);
__decorate([
    (0, common_1.Post)('admin/sessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('admin/sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('participant/dashboard/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getParticipantDashboard", null);
__decorate([
    (0, common_1.Get)('enseignant/dashboard/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getEnseignantDashboard", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/assign-groups'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "assignGroups", null);
__decorate([
    (0, common_1.Post)('users/:id/remove-from-group'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "removeFromGroup", null);
__decorate([
    (0, common_1.Post)('groupes/:id/progression'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('progression')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateProgression", null);
__decorate([
    (0, common_1.Post)('groupes/:id/commentaire'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('commentaire')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateCommentaire", null);
__decorate([
    (0, common_1.Get)('groupes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getGroupes", null);
__decorate([
    (0, common_1.Put)('admin/sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)('admin/sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/end'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "endSession", null);
__decorate([
    (0, common_1.Delete)('admin/users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Put)('admin/users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Post)('auto-assign/:classeId'),
    __param(0, (0, common_1.Param)('classeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "autoAssigner", null);
__decorate([
    (0, common_1.Get)('chat/context/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getContext", null);
__decorate([
    (0, common_1.Get)('chat/animateur-summary'),
    __param(0, (0, common_1.Query)('classeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAnimateurSummary", null);
__decorate([
    (0, common_1.Get)('chat/animateur-alertes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAlertes", null);
__decorate([
    (0, common_1.Get)('reactik/state/:sessionId/:groupeId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getReactikState", null);
__decorate([
    (0, common_1.Post)('reactik/update/:sessionId/:groupeId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateReactikPhase", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map