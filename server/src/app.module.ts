import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SkillsModule } from './skills/skills.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { GithubModule } from './github/github.module';
import { MatchingModule } from './matching/matching.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MeetingsModule } from './meetings/meetings.module';
import { CalendarModule } from './calendar/calendar.module';
import { IdeasModule } from './ideas/ideas.module';
import { ChatModule } from './chat/chat.module';
import { FilesModule } from './files/files.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    ProfilesModule,
    SkillsModule,
    ProjectsModule,
    WorkspaceModule,
    GithubModule,
    MatchingModule,
    BookmarksModule,
    NotificationsModule,
    MeetingsModule,
    CalendarModule,
    IdeasModule,
    ChatModule,
    FilesModule,
    EvaluationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
