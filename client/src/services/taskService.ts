import { api } from '../api/client';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  assignee?: {
    id: string;
    email: string;
    profile?: {
      fullName: string;
      avatarUrl?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export const taskService = {
  /**
   * Get all tasks for a project
   */
  getTasks: async (projectId: string): Promise<Task[]> => {
    try {
      return await api.get<Task[]>(`/projects/${projectId}/workspace/tasks`);
    } catch {
      return await api.get<Task[]>(`/projects/${projectId}/tasks`);
    }
  },

  /**
   * Create a new task in project
   */
  createTask: async (projectId: string, input: CreateTaskInput): Promise<Task> => {
    try {
      return await api.post<Task>(`/projects/${projectId}/workspace/tasks`, input);
    } catch {
      return await api.post<Task>(`/projects/${projectId}/tasks`, input);
    }
  },

  /**
   * Update task (status transition, assignee, title, etc.)
   */
  updateTask: async (projectId: string, taskId: string, input: UpdateTaskInput): Promise<Task> => {
    try {
      return await api.patch<Task>(`/projects/${projectId}/workspace/tasks/${taskId}`, input);
    } catch {
      return await api.patch<Task>(`/tasks/${taskId}`, input);
    }
  },

  /**
   * Delete task
   */
  deleteTask: async (projectId: string, taskId: string): Promise<any> => {
    try {
      return await api.delete(`/projects/${projectId}/workspace/tasks/${taskId}`);
    } catch {
      return await api.delete(`/tasks/${taskId}`);
    }
  },
};
