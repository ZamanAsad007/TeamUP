import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

interface SendMessagePayload {
  projectId: string;
  content: string;
}

interface JoinRoomPayload {
  projectId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join a project chat room
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { projectId } = payload;

    try {
      // Verify user is a project member
      await this.chatService.verifyProjectMembership(projectId, user.userId);

      // Join the room
      const roomName = `project:${projectId}`;
      await client.join(roomName);

      // Fetch recent message history
      const messages = await this.chatService.getRecentMessages(projectId, 50);

      // Send history to the joining client
      client.emit('messageHistory', { messages });

      return {
        success: true,
        message: `Joined room ${roomName}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send a message to a project room
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { projectId, content } = payload;

    try {
      // Verify membership and persist message
      const message = await this.chatService.sendMessage(
        projectId,
        user.userId,
        content,
      );

      // Broadcast to all clients in the room
      const roomName = `project:${projectId}`;
      this.server.to(roomName).emit('newMessage', { message });

      return {
        success: true,
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Leave a project chat room
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { projectId } = payload;
    const roomName = `project:${projectId}`;
    await client.leave(roomName);

    return {
      success: true,
      message: `Left room ${roomName}`,
    };
  }
}
