import { api } from '../api/client';
import { ChatMessage } from './socketService';

export const chatService = {
  /**
   * Get message history for a project via REST
   */
  getProjectMessages: async (projectId: string): Promise<ChatMessage[]> => {
    return api.get<ChatMessage[]>(`/projects/${projectId}/messages`);
  },
};
