import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new WsException('Authentication token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user to the socket data for later use
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Also set on request object for CurrentUser decorator
      const request = context.switchToWs().getData();
      request.user = client.data.user;

      return true;
    } catch (error) {
      throw new WsException('Invalid authentication token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // Check for token in handshake auth
    const token = client.handshake?.auth?.token;
    if (token) {
      return token;
    }

    // Fallback: check query params
    const queryToken = client.handshake?.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return undefined;
  }
}
