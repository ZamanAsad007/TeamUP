import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('projects/:id/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get comprehensive project analytics dashboard
   * GET /projects/:id/analytics
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getProjectAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') projectId: string,
  ) {
    const analytics = await this.analyticsService.getProjectAnalytics(
      projectId,
      user.userId,
    );

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get task velocity (tasks completed per week)
   * GET /projects/:id/analytics/velocity
   */
  @Get('velocity')
  @UseGuards(JwtAuthGuard)
  async getTaskVelocity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') projectId: string,
    @Query('weeks') weeks?: string,
  ) {
    const weeksNum = weeks ? parseInt(weeks, 10) : 4;
    const velocity = await this.analyticsService.getTaskVelocity(
      projectId,
      user.userId,
      weeksNum,
    );

    return {
      success: true,
      data: velocity,
    };
  }

  /**
   * Get project health score
   * GET /projects/:id/analytics/health
   */
  @Get('health')
  @UseGuards(JwtAuthGuard)
  async getProjectHealth(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') projectId: string,
  ) {
    const health = await this.analyticsService.getProjectHealth(
      projectId,
      user.userId,
    );

    return {
      success: true,
      data: health,
    };
  }
}
