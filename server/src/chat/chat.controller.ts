import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('projects/:id/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get all messages for a project (REST endpoint)
   * GET /projects/:id/messages
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getProjectMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') projectId: string,
  ) {
    return this.chatService.getProjectMessages(projectId, user.userId);
  }
}
