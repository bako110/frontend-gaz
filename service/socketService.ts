import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './config';

// Extraire l'URL de base sans le /api
const SOCKET_URL = API_BASE_URL.replace('/api', '');

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private messageListeners: ((message: any) => void)[] = [];
  private sentListeners: ((message: any) => void)[] = [];
  private errorListeners: ((error: any) => void)[] = [];

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('Socket déjà connecté');
      return;
    }

    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connecté:', this.socket?.id);
      if (this.userId) {
        this.socket?.emit('user:connect', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket.io déconnecté');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion Socket.io:', error);
    });

    // Écouter les messages reçus
    this.socket.on('message:received', (message) => {
      console.log('📨 Message reçu via Socket.io:', message);
      this.messageListeners.forEach(listener => listener(message));
    });

    // Écouter les confirmations d'envoi
    this.socket.on('message:sent', (message) => {
      console.log('✅ Message envoyé confirmé:', message);
      this.sentListeners.forEach(listener => listener(message));
    });

    // Écouter les erreurs
    this.socket.on('message:error', (error) => {
      console.error('❌ Erreur message:', error);
      this.errorListeners.forEach(listener => listener(error));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.messageListeners = [];
      this.sentListeners = [];
      this.errorListeners = [];
    }
  }

  sendMessage(data: {
    userId: string;
    userRole: string;
    userModel: string;
    userName: string;
    receiverId: string;
    content: string;
  }) {
    if (!this.socket?.connected) {
      throw new Error('Socket non connecté');
    }
    console.log('📤 Envoi message via Socket.io:', data);
    this.socket.emit('message:send', data);
  }

  onMessageReceived(callback: (message: any) => void) {
    this.messageListeners.push(callback);
  }

  onMessageSent(callback: (message: any) => void) {
    this.sentListeners.push(callback);
  }

  onMessageError(callback: (error: any) => void) {
    this.errorListeners.push(callback);
  }

  removeAllListeners() {
    this.messageListeners = [];
    this.sentListeners = [];
    this.errorListeners = [];
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
