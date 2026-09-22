import { api } from '../api/client';

export interface RequiredSkill {
  id?: string;
  skillId?: string;
  skillName?: string;
  minimumExperience?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  skill?: {
    id: string;
    name: string;
    category?: string;
  };
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
  joinedAt?: string;
  user?: {
    id: string;
    email: string;
    profile?: {
      fullName: string;
      avatarUrl?: string;
      department?: string;
      semester?: string;
    };
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  semester: string;
  maxMembers: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  creatorId: string;
  creator?: {
    id: string;
    email: string;
    profile?: {
      fullName: string;
      avatarUrl?: string;
      department?: string;
      semester?: string;
    };
  };
  requiredSkills?: RequiredSkill[];
  members?: ProjectMember[];
  _count?: {
    members?: number;
    tasks?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectsSearchResponse {
  projects: Project[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProjectInput {
  title: string;
  description: string;
  domain: string;
  semester: string;
  maxMembers?: number;
  requiredSkills?: {
    skillName?: string;
    skillId?: string;
    minimumExperience?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  }[];
}

export const projectService = {
  /**
   * Search / List projects for Marketplace
   */
  getProjects: async (params?: Record<string, any>): Promise<Project[]> => {
    const res = await api.get<ProjectsSearchResponse | Project[]>('/projects/search', params);
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray((res as ProjectsSearchResponse).projects)) {
      return (res as ProjectsSearchResponse).projects;
    }
    return [];
  },

  /**
   * Get single project details by ID
   */
  getProjectById: async (id: string): Promise<Project> => {
    return api.get<Project>(`/projects/${id}`);
  },

  /**
   * Create a new project
   */
  createProject: async (dto: CreateProjectInput): Promise<Project> => {
    return api.post<Project>('/projects', dto);
  },

  /**
   * Apply / Join project
   */
  joinProject: async (projectId: string): Promise<any> => {
    return api.post(`/projects/${projectId}/join`);
  },

  /**
   * Get project members
   */
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    return api.get<ProjectMember[]>(`/projects/${projectId}/members`);
  },
};
