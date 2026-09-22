import { api } from '../api/client';
import { Project, ProjectMember } from './projectService';

export interface TaskMetrics {
  todo: number;
  inProgress: number;
  testing: number;
  done: number;
  total: number;
  highPriority: number;
  assignedToMe: number;
}

export interface WorkspaceOverview {
  project: Project;
  userRole: 'LEADER' | 'MEMBER';
  members: ProjectMember[];
  metrics: {
    tasks: TaskMetrics;
    files: {
      totalCount: number;
      totalSize: number;
      recent: any[];
    };
    chat: {
      totalMessages: number;
      lastMessage?: {
        content: string;
        createdAt: string;
        sender?: {
          id: string;
          email: string;
          profile?: {
            fullName: string;
            avatarUrl?: string;
          };
        };
      };
    };
  };
  recentTasks?: any[];
}

export const workspaceService = {
  /**
   * Get workspace overview, metrics, and member lists
   * Protected: throws error if user is not an accepted project member
   */
  getWorkspaceOverview: async (projectId: string): Promise<WorkspaceOverview> => {
    return api.get<WorkspaceOverview>(`/projects/${projectId}/workspace`);
  },

  /**
   * Get all members for a project
   */
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    return api.get<ProjectMember[]>(`/projects/${projectId}/members`);
  },

  /**
   * Update member status or role (Accept/Reject/Promote) - Leader only
   */
  updateMember: async (
    projectId: string,
    memberId: string,
    dto: { status?: 'ACCEPTED' | 'REJECTED'; role?: 'LEADER' | 'MEMBER' }
  ): Promise<any> => {
    return api.patch(`/projects/${projectId}/members/${memberId}`, dto);
  },

  /**
   * Remove member or leave project
   */
  removeMember: async (projectId: string, memberId: string): Promise<any> => {
    return api.delete(`/projects/${projectId}/members/${memberId}`);
  },
};
