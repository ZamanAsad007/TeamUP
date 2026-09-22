/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { JwtService } from '@nestjs/jwt';

describe('Notification Engine & Expo Push Dispatcher (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  const mockUsers = [
    { id: 'user-notif-1', email: 'notif_student@uni.edu', role: 'STUDENT' },
  ];

  let mockPushTokens: Array<{
    id: string;
    userId: string;
    token: string;
    device?: string;
  }> = [];

  const mockNotifications: Array<{
    id: string;
    userId: string;
    title: string;
    body: string;
    type: string;
    data: any;
    isRead: boolean;
    createdAt: Date;
  }> = [
    {
      id: 'notif-e2e-1',
      userId: 'user-notif-1',
      title: 'Project Invitation',
      body: 'You have been invited to join Autonomous Drone Swarm',
      type: 'PROJECT_INVITE',
      data: { projectId: 'proj-1' },
      isRead: false,
      createdAt: new Date('2026-09-14T10:00:00Z'),
    },
    {
      id: 'notif-e2e-2',
      userId: 'user-notif-1',
      title: 'Task Assigned',
      body: 'You were assigned to Setup ROS Environment',
      type: 'TASK_ASSIGNED',
      data: { taskId: 'task-1' },
      isRead: false,
      createdAt: new Date('2026-09-14T11:00:00Z'),
    },
    {
      id: 'notif-e2e-3',
      userId: 'user-notif-1',
      title: 'Meeting Scheduled',
      body: 'Sprint Planning at 3:00 PM',
      type: 'MEETING_CONFIRMED',
      data: { meetingId: 'meet-1' },
      isRead: true,
      createdAt: new Date('2026-09-13T09:00:00Z'),
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
    pushToken: {
      upsert: jest.fn(({ where, create, update }: any) => {
        let existing = mockPushTokens.find((t) => t.token === where.token);
        if (existing) {
          existing.userId = update.userId;
          existing.device = update.device;
        } else {
          existing = {
            id: `pt-${Date.now()}`,
            userId: create.userId,
            token: create.token,
            device: create.device,
          };
          mockPushTokens.push(existing);
        }
        return Promise.resolve(existing);
      }),
      deleteMany: jest.fn(({ where }: any) => {
        const initialLen = mockPushTokens.length;
        mockPushTokens = mockPushTokens.filter(
          (t) => !(t.userId === where.userId && t.token === where.token),
        );
        return Promise.resolve({ count: initialLen - mockPushTokens.length });
      }),
      findMany: jest.fn(({ where }: any) => {
        const found = mockPushTokens.filter((t) => t.userId === where.userId);
        return Promise.resolve(found);
      }),
    },
    notification: {
      count: jest.fn(({ where }: any) => {
        let list = mockNotifications.filter((n) => n.userId === where.userId);
        if (where?.isRead !== undefined) {
          list = list.filter((n) => n.isRead === where.isRead);
        }
        return Promise.resolve(list.length);
      }),
      findMany: jest.fn(({ where, skip = 0, take = 20 }: any) => {
        let list = mockNotifications.filter((n) => n.userId === where.userId);
        if (where?.isRead !== undefined) {
          list = list.filter((n) => n.isRead === where.isRead);
        }
        return Promise.resolve(list.slice(skip, skip + take));
      }),
      findFirst: jest.fn(({ where }: any) => {
        const found = mockNotifications.find(
          (n) => n.id === where.id && n.userId === where.userId,
        );
        return Promise.resolve(found || null);
      }),
      update: jest.fn(({ where, data }: any) => {
        const found = mockNotifications.find((n) => n.id === where.id);
        if (found) {
          Object.assign(found, data);
        }
        return Promise.resolve(found);
      }),
      updateMany: jest.fn(({ where, data }: any) => {
        let count = 0;
        mockNotifications.forEach((n) => {
          if (
            n.userId === where.userId &&
            (where.isRead === undefined || n.isRead === where.isRead)
          ) {
            Object.assign(n, data);
            count++;
          }
        });
        return Promise.resolve({ count });
      }),
      delete: jest.fn(({ where }: any) => {
        const idx = mockNotifications.findIndex((n) => n.id === where.id);
        let removed: any = null;
        if (idx !== -1) {
          removed = mockNotifications.splice(idx, 1)[0];
        }
        return Promise.resolve(removed);
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
      { sub: 'user-notif-1', email: 'notif_student@uni.edu', role: 'STUDENT' },
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

  describe('Authentication Enforcement', () => {
    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .expect(401);
    });
  });

  describe('Push Token Registration & Lifecycle', () => {
    it('POST /api/v1/notifications/push-token should register an Expo push token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'ExponentPushToken[Abc123XyZ456]',
          device: 'iPhone 15 Pro',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.registered).toBe(true);
    });

    it('POST /api/v1/notifications/push-token should reject invalid token format with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: '',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('DELETE /api/v1/notifications/push-token should unregister token on logout', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/notifications/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'ExponentPushToken[Abc123XyZ456]',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.unregistered).toBe(true);
    });
  });

  describe('In-App Notification Feed & Counting', () => {
    it('GET /api/v1/notifications/unread-count should return unread notifications count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('GET /api/v1/notifications should return paginated list of all notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.notifications.length).toBe(3);
      expect(res.body.data.meta.total).toBe(3);
    });

    it('GET /api/v1/notifications?unreadOnly=true should return only unread notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications.length).toBe(2);
      expect(
        res.body.data.notifications.every((n: any) => n.isRead === false),
      ).toBe(true);
    });
  });

  describe('Read Receipts & Dismissal', () => {
    it('PATCH /api/v1/notifications/:id/read should mark a single notification read', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/notif-e2e-1/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    it('PATCH /api/v1/notifications/:id/read should return 404 for non-existent notification', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/unknown-notif/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('PATCH /api/v1/notifications/read-all should mark all unread notifications read', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBeGreaterThanOrEqual(1);

      // Verify unread count is now 0
      const countRes = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('DELETE /api/v1/notifications/:id should delete notification from feed', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/notifications/notif-e2e-2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted successfully');
    });

    it('DELETE /api/v1/notifications/:id should return 404 when deleting non-existent notification', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/notifications/unknown-notif')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
