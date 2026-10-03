const fs = require('fs');
const file = 'client/src/services/projectService.ts';
let content = fs.readFileSync(file, 'utf8');

const apiString = `  /**
   * Get user's active projects (where they are creator or accepted member)
   */
  getMyProjects: async (): Promise<Project[]> => {
    return api.get<Project[]>('/projects/me');
  },

  /**
   * Get single project details by ID`;

content = content.replace('  /**\n   * Get single project details by ID', apiString);
fs.writeFileSync(file, content);
