/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { JwtService } from '@nestjs/jwt';
import { BookmarkType, ProjectStatus } from '@prisma/client';

describe('Bookmarks & Favorites Subsystem (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  const mockUsers = [
    { id: 'user-bm-1', email: 'student1@uni.edu', role: 'STUDENT' },
    { id: 'user-bm-2', email: 'creator@uni.edu', role: 'STUDENT' },
  ];

  const mockProjects = [
    {
      id: 'proj-bm-1',
      title: 'Autonomous Drone Swarm',
      description: 'Coordinated robotics system',
      domain: 'Robotics',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      createdAt: new Date('2026-09-01'),
      creator: {
        id: 'user-bm-2',
        email: 'creator@uni.edu',
        profile: { fullName: 'Drone Lead', avatarUrl: null },
      },
      requiredSkills: [{ skill: { name: 'ROS' } }, { skill: { name: 'C++' } }],
      members: [{ id: 'm-1' }],
      _count: { members: 1 },
    },
  ];

  const mockIdeas = [
    {
      id: 'idea-bm-1',
      title: 'Decentralized Campus Voting',
      description: 'Blockchain student governance',
      domain: 'Fintech',
    },
  ];

  let mockBookmarks: Array<{
    id: string;
    userId: string;
    targetType: BookmarkType;
    targetId: string;
    createdAt: Date;
  }> = [
    {
      id: 'bm-init-1',
      userId: 'user-bm-1',
      targetType: BookmarkType.PROJECT,
      targetId: 'proj-bm-1',
      createdAt: new Date('2026-09-02'),
    },
  ];

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(
        ({ where }: { where: { id?: string; email?: string } }) => {
          if (where.id)
            return Promise.resolve(
              mockUsers.find((u) => u.id === where.id) || null,
            );
          if (where.email)
            return Promise.resolve(
              mockUsers.find((u) => u.email === where.email) || null,
            );
          return Promise.resolve(null);
        },
      ),
    },
    project: {
      findUnique: jest.fn(({ where }: any) => {
        return Promise.resolve(
          mockProjects.find((p) => p.id === where.id) || null,
        );
      }),
      findMany: jest.fn(({ where }: any) => {
        if (where?.id?.in) {
          const ids: string[] = where.id.in;
          return Promise.resolve(
            mockProjects.filter((p) => ids.includes(p.id)),
          );
        }
        return Promise.resolve(mockProjects);
      }),
    },
    idea: {
      findUnique: jest.fn(({ where }: any) => {
        return Promise.resolve(
          mockIdeas.find((i) => i.id === where.id) || null,
        );
      }),
    },
    bookmark: {
      findUnique: jest.fn(({ where }: any) => {
        if (where?.userId_targetType_targetId) {
          const { userId, targetType, targetId } =
            where.userId_targetType_targetId;
          const found = mockBookmarks.find(
            (b) =>
              b.userId === userId &&
              b.targetType === targetType &&
              b.targetId === targetId,
          );
          return Promise.resolve(found || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn(({ where }: any) => {
        let list = [...mockBookmarks];
        if (where?.userId) {
          list = list.filter((b) => b.userId === where.userId);
        }
        if (where?.targetType) {
          list = list.filter((b) => b.targetType === where.targetType);
        }
        return Promise.resolve(list);
      }),
      upsert: jest.fn(({ where, create }: any) => {
        const { userId, targetType, targetId } =
          where.userId_targetType_targetId;
        let existing = mockBookmarks.find(
          (b) =>
            b.userId === userId &&
            b.targetType === targetType &&
            b.targetId === targetId,
        );
        if (!existing) {
          existing = {
            id: `bm-${Date.now()}`,
            userId: create.userId,
            targetType: create.targetType,
            targetId: create.targetId,
            createdAt: new Date(),
          };
          mockBookmarks.push(existing);
        }
        return Promise.resolve(existing);
      }),
      create: jest.fn(({ data }: any) => {
        const newBm = {
          id: `bm-${Date.now()}`,
          userId: data.userId,
          targetType: data.targetType,
          targetId: data.targetId,
          createdAt: new Date(),
        };
        mockBookmarks.push(newBm);
        return Promise.resolve(newBm);
      }),
      delete: jest.fn(({ where }: any) => {
        const idx = mockBookmarks.findIndex((b) => b.id === where.id);
        let removed: any = null;
        if (idx !== -1) {
          removed = mockBookmarks.splice(idx, 1)[0];
        }
        return Promise.resolve(removed);
      }),
      deleteMany: jest.fn(({ where }: any) => {
        const before = mockBookmarks.length;
        mockBookmarks = mockBookmarks.filter(
          (b) =>
            !(
              b.userId === where.userId &&
              b.targetType === where.targetType &&
              b.targetId === where.targetId
            ),
        );
        return Promise.resolve({ count: before - mockBookmarks.length });
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = await jwtService.signAsync(
      { sub: 'user-bm-1', email: 'student1@uni.edu', role: 'STUDENT' },
      {
        secret:
          process.env.JWT_SECRET || 'super_secret_jwt_access_key_teamup_2026',
      },
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/projects/bookmarks (Mobile discovery contract)', () => {
    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/bookmarks')
        .expect(401);
    });

    it('should return bookmarked project listings for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('proj-bm-1');
      expect(res.body.data[0].isBookmarked).toBe(true);
      expect(res.body.data[0].requiredSkills).toEqual(['ROS', 'C++']);
      expect(res.body.data[0].ownerName).toBe('Drone Lead');
    });
  });

  describe('POST & DELETE /api/v1/projects/:id/bookmark (Mobile sync contract)', () => {
    it('should add project bookmark idempotently', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects/proj-bm-1/bookmark')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bookmarked).toBe(true);
    });

    it('should return 404 when bookmarking non-existent project', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects/non-existent-proj/bookmark')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should remove project bookmark idempotently', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/projects/proj-bm-1/bookmark')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bookmarked).toBe(false);
    });
  });

  describe('REST Endpoints under /api/v1/bookmarks', () => {
    it('GET /api/v1/bookmarks/ids should return string array of target IDs', async () => {
      // Re-add bookmark
      await request(app.getHttpServer())
        .post('/api/v1/projects/proj-bm-1/bookmark')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/v1/bookmarks/ids')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain('proj-bm-1');
    });

    it('POST /api/v1/bookmarks/toggle should toggle bookmark off and on', async () => {
      // Toggle off
      const toggleOff = await request(app.getHttpServer())
        .post('/api/v1/bookmarks/toggle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetType: BookmarkType.PROJECT, targetId: 'proj-bm-1' })
        .expect(200);

      expect(toggleOff.body.data.bookmarked).toBe(false);

      // Toggle back on
      const toggleOn = await request(app.getHttpServer())
        .post('/api/v1/bookmarks/toggle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetType: BookmarkType.PROJECT, targetId: 'proj-bm-1' })
        .expect(200);

      expect(toggleOn.body.data.bookmarked).toBe(true);
    });

    it('POST /api/v1/bookmarks with IDEA targetType should bookmark an Idea', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetType: BookmarkType.IDEA, targetId: 'idea-bm-1' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bookmarked).toBe(true);
    });

    it('POST /api/v1/bookmarks should reject invalid targetType with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetType: 'INVALID_TYPE', targetId: 'proj-bm-1' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('DELETE /api/v1/bookmarks/:targetType/:targetId should delete specific bookmark', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/bookmarks/IDEA/idea-bm-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bookmarked).toBe(false);
    });
  });
});
