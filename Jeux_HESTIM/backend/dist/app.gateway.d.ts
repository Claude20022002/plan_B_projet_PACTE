import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, room: string): void;
    notifyGroupAssignment(userId: number, data: any): void;
    notifyNewSession(enseignantId: number, data: any): void;
    broadcastToClasse(classeId: number, event: string, data: any): void;
}
//# sourceMappingURL=app.gateway.d.ts.map