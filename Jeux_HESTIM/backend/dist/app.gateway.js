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
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let AppGateway = class AppGateway {
    handleConnection(client) {
        console.log(`Client connecté: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client déconnecté: ${client.id}`);
    }
    // Permet à un utilisateur de rejoindre une "salle" (room) spécifique
    // Par exemple sa classe ou son ID utilisateur pour des notifications privées
    handleJoinRoom(client, room) {
        client.join(room);
        console.log(`Client ${client.id} a rejoint la salle: ${room}`);
    }
    // Méthode pour envoyer une notification de mise à jour de groupe
    notifyGroupAssignment(userId, data) {
        this.server.to(`user_${userId}`).emit('group_updated', data);
    }
    // Notification pour l'enseignant quand une nouvelle session est créée
    notifyNewSession(enseignantId, data) {
        this.server.to(`user_${enseignantId}`).emit('session_created', data);
    }
    // Notification globale ou par classe
    broadcastToClasse(classeId, event, data) {
        this.server.to(`classe_${classeId}`).emit(event, data);
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinRoom", null);
exports.AppGateway = AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*', // In production, replace with your frontend URL
        },
    })
], AppGateway);
//# sourceMappingURL=app.gateway.js.map