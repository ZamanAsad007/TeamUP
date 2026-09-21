import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberStatus } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify user is a member of the project
   */
  async verifyProjectMembership(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        status: MemberStatus.ACCEPTED,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a project member to access chat',
      );
    }
  }

  /**
   * Send a message and persist to database
   */
  async sendMessage(projectId: string, senderId: string, content: string) {
    // Verify membership
    await this.verifyProjectMembership(projectId, senderId);

    // Persist message
    const message = await this.prisma.message.create({
      data: {
        projectId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return message;
  }

  /**
   * Get recent message history for a project
   */
  async getRecentMessages(projectId: string, limit: number = 50) {
    const messages = await this.prisma.message.findMany({
      where: { projectId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Get all messages for a project (REST endpoint alternative)
   */
  async getProjectMessages(projectId: string, userId: string) {
    await this.verifyProjectMembership(projectId, userId);

    const messages = await this.prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return messages;
  }
}
