import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client déconnecté: ${client.id}`);
  }

  // Permet à un utilisateur de rejoindre une "salle" (room) spécifique
  // Par exemple sa classe ou son ID utilisateur pour des notifications privées
  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    console.log(`Client ${client.id} a rejoint la salle: ${room}`);
  }

  // Méthode pour envoyer une notification de mise à jour de groupe
  notifyGroupAssignment(userId: number, data: any) {
    this.server.to(`user_${userId}`).emit('group_updated', data);
  }

  // Notification pour l'enseignant quand une nouvelle session est créée
  notifyNewSession(enseignantId: number, data: any) {
    this.server.to(`user_${enseignantId}`).emit('session_created', data);
  }

  // Notification globale ou par classe
  broadcastToClasse(classeId: number, event: string, data: any) {
    this.server.to(`classe_${classeId}`).emit(event, data);
  }
}
