import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './tokenStorage';

export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    profile?: {
      fullName: string;
      avatarUrl?: string;
    };
  };
}

class SocketService {
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private statusListeners: Set<(status: SocketConnectionStatus) => void> = new Set();
  private messageListeners: Set<(message: ChatMessage) => void> = new Set();
  private historyListeners: Set<(messages: ChatMessage[]) => void> = new Set();
  private status: SocketConnectionStatus = 'disconnected';

  private getBaseUrl(): string {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    return apiUrl.replace(/\/api\/v1\/?$/, '');
  }

  public getStatus(): SocketConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: SocketConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (err) {
        console.warn('Error in socket status listener:', err);
      }
    });
  }

  public async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setStatus('connecting');
    const token = await tokenStorage.getAccessToken();
    const serverUrl = this.getBaseUrl();

    this.socket = io(`${serverUrl}/chat`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token || '',
      },
      query: {
        token: token || '',
      },
    });

    this.socket.on('connect', () => {
      this.setStatus('connected');
      if (this.currentProjectId) {
        this.joinRoom(this.currentProjectId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.setStatus(reason === 'io client disconnect' ? 'disconnected' : 'reconnecting');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
      this.setStatus('error');
    });

    this.socket.on('reconnect', () => {
      this.setStatus('connected');
      if (this.currentProjectId) {
        this.joinRoom(this.currentProjectId);
      }
    });

    this.socket.on('reconnecting', () => {
      this.setStatus('reconnecting');
    });

    this.socket.on('newMessage', (payload: { message: ChatMessage }) => {
      if (payload?.message) {
        this.messageListeners.forEach((listener) => {
          try {
            listener(payload.message);
          } catch (err) {
            console.warn('Error in socket message listener:', err);
          }
        });
      }
    });

    this.socket.on('messageHistory', (payload: { messages: ChatMessage[] }) => {
      if (Array.isArray(payload?.messages)) {
        this.historyListeners.forEach((listener) => {
          try {
            listener(payload.messages);
          } catch (err) {
            console.warn('Error in socket history listener:', err);
          }
        });
      }
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.currentProjectId && this.socket?.connected) {
      this.leaveRoom(this.currentProjectId);
    }
    this.currentProjectId = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  public joinRoom(projectId: string, callback?: (res: any) => void): void {
    this.currentProjectId = projectId;
    if (this.socket?.connected) {
      this.socket.emit('joinRoom', { projectId }, (response: any) => {
        if (callback) callback(response);
      });
    }
  }

  public leaveRoom(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveRoom', { projectId });
    }
    if (this.currentProjectId === projectId) {
      this.currentProjectId = null;
    }
  }

  public sendMessage(
    projectId: string,
    content: string,
    callback?: (response: { success: boolean; message?: ChatMessage; error?: string }) => void
  ): void {
    if (!this.socket?.connected) {
      if (callback) {
        callback({ success: false, error: 'Socket is not connected' });
      }
      return;
    }

    this.socket.emit('sendMessage', { projectId, content }, (res: any) => {
      if (callback) callback(res);
    });
  }

  public onNewMessage(listener: (message: ChatMessage) => void): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  public onMessageHistory(listener: (messages: ChatMessage[]) => void): () => void {
    this.historyListeners.add(listener);
    return () => {
      this.historyListeners.delete(listener);
    };
  }

  public onStatusChange(listener: (status: SocketConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
