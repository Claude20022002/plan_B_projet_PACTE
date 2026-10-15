import { io, Socket } from 'socket.io-client';

// Vite uses import.meta.env for environment variables
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(URL);
      
      this.socket.on('connect', () => {
        console.log('Connecté au serveur WebSocket');
        
        // Rejoindre sa propre salle utilisateur si connecté
        const userString = localStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          this.joinRoom(`user_${user.id}`);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Déconnecté du serveur WebSocket');
      });
    }
    return this.socket;
  }

  joinRoom(room: string) {
    if (this.socket) {
      this.socket.emit('join', room);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
