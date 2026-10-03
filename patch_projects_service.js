const fs = require('fs');
const file = 'server/src/projects/projects.service.ts';
let content = fs.readFileSync(file, 'utf8');

const methodString = `  /**
   * Get all active projects for the current user (creator or accepted member)
   */
  async getMyProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            members: {
              some: {
                userId,
                status: 'ACCEPTED',
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                department: true,
                semester: true,
              },
            },
          },
        },
        requiredSkills: {
          include: {
            skill: true,
          },
        },
        members: {
          where: { status: 'ACCEPTED' },
          select: {
            id: true,
            userId: true,
            role: true,
            status: true,
            joinedAt: true,
            user: {
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
        },
        _count: {
          select: { members: { where: { status: 'ACCEPTED' } } },
        },
      },
    });
  }

  /**
   * Find all projects with search & filters`;

content = content.replace('  /**\n   * Find all projects with search & filters', methodString);
fs.writeFileSync(file, content);
