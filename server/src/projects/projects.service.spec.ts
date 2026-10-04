import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';

describe('ProjectsService - Search & Multi-criteria Filters', () => {
  let service: ProjectsService;

  const mockNotificationsService = {
    notifyUser: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockPrismaService = {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    projectMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should build dynamic WHERE clause with keyword and faceted filters', async () => {
      const mockRawProjects = [
        {
          id: 'proj-1',
          title: 'AI Study Group Finder',
          description: 'A platform to form study groups',
          domain: 'Education',
          semester: 'Fall 2026',
          status: ProjectStatus.OPEN,
          maxMembers: 4,
          createdAt: new Date('2026-09-01'),
          creator: {
            id: 'user-1',
            email: 'leader@uni.edu',
            profile: {
              fullName: 'Alice Leader',
              avatarUrl: 'https://avatar.png',
            },
          },
          requiredSkills: [
            { skill: { name: 'React Native' } },
            { skill: { name: 'NestJS' } },
          ],
          members: [{ id: 'm-1' }, { id: 'm-2' }],
          _count: { members: 2 },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockRawProjects);

      const result = await service.search({
        search: 'study group',
        domain: 'Education',
        semester: 'Fall 2026',
        status: ProjectStatus.OPEN,
        tech: 'NestJS',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'study group', mode: 'insensitive' } },
            { description: { contains: 'study group', mode: 'insensitive' } },
            { domain: { contains: 'study group', mode: 'insensitive' } },
          ],
          domain: { contains: 'Education', mode: 'insensitive' },
          semester: { contains: 'Fall 2026', mode: 'insensitive' },
          status: ProjectStatus.OPEN,
          requiredSkills: {
            some: {
              skill: {
                name: { contains: 'NestJS', mode: 'insensitive' },
              },
            },
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });

      // Verify normalization to ProjectListing contract
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'proj-1',
        title: 'AI Study Group Finder',
        description: 'A platform to form study groups',
        domain: 'Education',
        semester: 'Fall 2026',
        status: ProjectStatus.OPEN,
        requiredSkills: ['React Native', 'NestJS'],
        ownerName: 'Alice Leader',
        memberCount: 2,
        maxMembers: 4,
        createdAt: new Date('2026-09-01'),
      });
    });

    it('should ignore "All" values in domain, semester, status, and tech filters', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const result = await service.search({
        domain: 'All',
        semester: 'All',
        status: 'All' as any,
        tech: 'All',
      });

      expect(result).toEqual([]);
      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should fallback ownerName to email username if profile fullName is missing', async () => {
      const mockRawProjects = [
        {
          id: 'proj-2',
          title: 'Robotics Team',
          description: 'Autonomous rover project',
          domain: 'Robotics',
          semester: 'Spring 2026',
          status: ProjectStatus.OPEN,
          maxMembers: 5,
          createdAt: new Date('2026-09-02'),
          creator: {
            id: 'user-2',
            email: 'bob.builder@uni.edu',
            profile: null,
          },
          requiredSkills: [],
          members: [],
          _count: { members: 0 },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockRawProjects);

      const result = await service.search({});

      expect(result[0].ownerName).toBe('bob.builder');
      expect(result[0].requiredSkills).toEqual([]);
      expect(result[0].memberCount).toBe(0);
    });
  });

  describe('leaveProject and removeMember', () => {
    it('should allow a regular member to leave the project', async () => {
      mockPrismaService.projectMember.findFirst
        .mockResolvedValueOnce({
          id: 'mem-1',
          projectId: 'proj-1',
          userId: 'user-member',
          role: 'MEMBER',
          status: 'ACCEPTED',
        })
        .mockResolvedValueOnce({
          id: 'mem-1',
          projectId: 'proj-1',
          userId: 'user-member',
          role: 'MEMBER',
          status: 'ACCEPTED',
        })
        .mockResolvedValueOnce(null); // not leader in isProjectLeader

      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'user-leader',
      });
      mockPrismaService.project.findFirst.mockResolvedValue(null);
      mockPrismaService.projectMember.delete.mockResolvedValue({ id: 'mem-1' });

      const result = await service.leaveProject('proj-1', 'user-member');

      expect(result).toEqual({ message: 'Member removed successfully' });
      expect(mockPrismaService.projectMember.delete).toHaveBeenCalledWith({
        where: { id: 'mem-1' },
      });
    });

    it('should throw NotFoundException if member record does not exist', async () => {
      mockPrismaService.projectMember.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.leaveProject('proj-1', 'user-stranger')
      ).rejects.toThrow('Member record not found in this project');
    });

    it('should allow project leader to kick a member', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'user-leader',
      });
      mockPrismaService.projectMember.findFirst
        .mockResolvedValueOnce({
          id: 'mem-target',
          projectId: 'proj-1',
          userId: 'user-target',
          role: 'MEMBER',
          status: 'ACCEPTED',
        })
        .mockResolvedValueOnce({
          id: 'mem-leader',
          projectId: 'proj-1',
          userId: 'user-leader',
          role: 'LEADER',
          status: 'ACCEPTED',
        });
      mockPrismaService.projectMember.delete.mockResolvedValue({ id: 'mem-target' });

      const result = await service.removeMember('proj-1', 'mem-target', 'user-leader');

      expect(result).toEqual({ message: 'Member removed successfully' });
      expect(mockPrismaService.projectMember.delete).toHaveBeenCalledWith({
        where: { id: 'mem-target' },
      });
    });

    it('should block a sole leader from leaving if other accepted members exist', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'user-leader',
      });
      mockPrismaService.projectMember.findFirst
        .mockResolvedValueOnce({
          id: 'mem-leader',
          projectId: 'proj-1',
          userId: 'user-leader',
          role: 'LEADER',
          status: 'ACCEPTED',
        })
        .mockResolvedValueOnce({
          id: 'mem-leader',
          projectId: 'proj-1',
          userId: 'user-leader',
          role: 'LEADER',
          status: 'ACCEPTED',
        });
      mockPrismaService.projectMember.count
        .mockResolvedValueOnce(1) // leaderCount = 1
        .mockResolvedValueOnce(2); // otherMembers = 2

      await expect(
        service.leaveProject('proj-1', 'user-leader'),
      ).rejects.toThrow(
        'As the sole leader, you must promote another member to leader before leaving.',
      );
    });
  });

  describe('Notifications Integration', () => {
    it('should notify project leaders when a student applies', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        title: 'Drone Fleet',
        creatorId: 'leader-1',
        status: ProjectStatus.OPEN,
        maxMembers: 4,
        _count: { members: 1 },
      });
      mockPrismaService.projectMember.findUnique.mockResolvedValue(null);
      mockPrismaService.projectMember.create.mockResolvedValue({
        id: 'mem-new',
        projectId: 'proj-1',
        userId: 'applicant-1',
        role: 'MEMBER',
        status: 'PENDING',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'applicant-1',
        email: 'applicant@uni.edu',
        profile: { fullName: 'Bob Student' },
      });
      mockPrismaService.projectMember.findMany.mockResolvedValue([
        { userId: 'leader-1' },
      ]);

      await service.applyToProject('proj-1', 'applicant-1');

      expect(mockNotificationsService.notifyUser).toHaveBeenCalledWith(
        'leader-1',
        expect.objectContaining({
          type: 'APPLICATION_RECEIVED',
          title: 'New Team Application',
          body: 'Bob Student applied to join Drone Fleet',
        }),
      );
    });

    it('should notify applicant when application is accepted or rejected', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        title: 'Drone Fleet',
        creatorId: 'leader-1',
        maxMembers: 4,
        _count: { members: 1 },
      });
      mockPrismaService.projectMember.findFirst
        .mockResolvedValueOnce({
          id: 'mem-leader',
          role: 'LEADER',
          status: 'ACCEPTED',
        })
        .mockResolvedValueOnce({
          id: 'mem-applicant',
          userId: 'applicant-1',
          role: 'MEMBER',
          status: 'PENDING',
        });
      mockPrismaService.projectMember.update.mockResolvedValue({
        id: 'mem-applicant',
        status: 'ACCEPTED',
      });

      await service.updateMember('proj-1', 'mem-applicant', 'leader-1', {
        status: 'ACCEPTED' as any,
      });

      expect(mockNotificationsService.notifyUser).toHaveBeenCalledWith(
        'applicant-1',
        expect.objectContaining({
          type: 'APPLICATION_ACCEPTED',
          title: 'Application Accepted',
        }),
      );
    });
  });

  describe('inviteMember', () => {
    it('should throw BadRequestException if neither userId nor targetUserId is provided', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        title: 'Project 1',
        creatorId: 'leader-1',
      });

      await expect(
        service.inviteMember('proj-1', 'leader-1', {} as any),
      ).rejects.toThrow('userId is required');
    });

    it('should successfully invite using targetUserId alias', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        title: 'Project 1',
        creatorId: 'leader-1',
        maxMembers: 5,
        members: [{ userId: 'leader-1', role: 'LEADER', status: 'ACCEPTED' }],
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'target-user-1' });
      mockPrismaService.projectMember.findUnique.mockResolvedValue(null);
      mockPrismaService.projectMember.count.mockResolvedValue(1);
      mockPrismaService.projectMember.create.mockResolvedValue({
        id: 'pm-1',
        projectId: 'proj-1',
        userId: 'target-user-1',
        role: 'MEMBER',
        status: 'PENDING',
      });

      const res = await service.inviteMember('proj-1', 'leader-1', {
        targetUserId: 'target-user-1',
      });

      expect(mockPrismaService.projectMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'proj-1',
          userId: 'target-user-1',
          role: 'MEMBER',
          status: 'PENDING',
        }),
      });
      expect(mockNotificationsService.notifyUser).toHaveBeenCalledWith(
        'target-user-1',
        expect.objectContaining({
          type: 'PROJECT_INVITE',
        }),
      );
    });
  });
});


