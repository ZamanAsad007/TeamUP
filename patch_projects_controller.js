const fs = require('fs');
const file = 'server/src/projects/projects.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const routeString = `  /**
   * Get user's own projects (creator or accepted member)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getMyProjects(user.userId);
  }

  /**
   * Get project details by ID`;

content = content.replace('  /**\n   * Get project details by ID', routeString);
fs.writeFileSync(file, content);
