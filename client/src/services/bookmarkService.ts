import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from '../api/client';
import { ProjectListing } from '../components/ProjectCard';

const BOOKMARKS_STORAGE_KEY = 'teamup_bookmarked_project_ids';
const IDEA_BOOKMARKS_STORAGE_KEY = 'teamup_bookmarked_idea_ids';

let inMemoryBookmarkIds: string[] = ['proj-101'];
let inMemoryIdeaBookmarkIds: string[] = [];

export const bookmarkService = {
  /**
   * Get list of bookmarked project IDs, synchronizing with backend API
   */
  async getBookmarkedIds(): Promise<string[]> {
    try {
      const remoteIds = await api.get<string[]>('/bookmarks/ids?type=PROJECT');
      if (Array.isArray(remoteIds)) {
        inMemoryBookmarkIds = remoteIds;
        if (Platform.OS !== 'web') {
          SecureStore.setItemAsync(
            BOOKMARKS_STORAGE_KEY,
            JSON.stringify(remoteIds)
          ).catch(() => {});
        }
        return remoteIds;
      }
    } catch {
      // Network failure, fallback to persistent storage
    }

    try {
      if (Platform.OS !== 'web') {
        const stored = await SecureStore.getItemAsync(BOOKMARKS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            inMemoryBookmarkIds = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // Ignore storage errors, fallback to in-memory
    }

    return inMemoryBookmarkIds;
  },

  /**
   * Fetch bookmarked project listings from backend endpoint
   */
  async getBookmarkedProjects(): Promise<ProjectListing[]> {
    try {
      const data = await api.get<ProjectListing[]>('/projects/bookmarks');
      if (Array.isArray(data)) {
        const projectIds = data.map((p) => p.id);
        inMemoryBookmarkIds = projectIds;
        if (Platform.OS !== 'web') {
          SecureStore.setItemAsync(
            BOOKMARKS_STORAGE_KEY,
            JSON.stringify(projectIds)
          ).catch(() => {});
        }
        return data.map((p) => ({ ...p, isBookmarked: true }));
      }
    } catch {
      // Fallback: query /projects and match local IDs if offline
      try {
        const allProjects = await api.get<ProjectListing[]>('/projects');
        if (Array.isArray(allProjects)) {
          const savedIds = await this.getBookmarkedIds();
          return allProjects
            .filter((p) => savedIds.includes(p.id))
            .map((p) => ({ ...p, isBookmarked: true }));
        }
      } catch {
        // Return empty on complete offline failure
      }
    }
    return [];
  },

  /**
   * Optimistically toggle bookmark status for a project and persist state to backend
   */
  async toggleBookmark(project: { id: string }): Promise<boolean> {
    const currentIds = inMemoryBookmarkIds;
    const isCurrentlyBookmarked = currentIds.includes(project.id);
    const newStatus = !isCurrentlyBookmarked;

    const updatedIds = newStatus
      ? [...currentIds, project.id]
      : currentIds.filter((id) => id !== project.id);

    inMemoryBookmarkIds = updatedIds;

    // Cache locally
    try {
      if (Platform.OS !== 'web') {
        SecureStore.setItemAsync(
          BOOKMARKS_STORAGE_KEY,
          JSON.stringify(updatedIds)
        ).catch(() => {});
      }
    } catch {
      // Ignore local storage error
    }

    // Remote sync with backend
    try {
      if (newStatus) {
        await api.post(`/projects/${project.id}/bookmark`);
      } else {
        await api.delete(`/projects/${project.id}/bookmark`);
      }
    } catch {
      // If project endpoint fails, try polymorphic /bookmarks/toggle
      try {
        await api.post('/bookmarks/toggle', {
          targetType: 'PROJECT',
          targetId: project.id,
        });
      } catch {
        // Keep optimistic state if network drops
      }
    }

    return newStatus;
  },

  /**
   * Get list of bookmarked idea IDs
   */
  async getBookmarkedIdeaIds(): Promise<string[]> {
    try {
      const remoteIds = await api.get<string[]>('/bookmarks/ids?type=IDEA');
      if (Array.isArray(remoteIds)) {
        inMemoryIdeaBookmarkIds = remoteIds;
        if (Platform.OS !== 'web') {
          SecureStore.setItemAsync(
            IDEA_BOOKMARKS_STORAGE_KEY,
            JSON.stringify(remoteIds)
          ).catch(() => {});
        }
        return remoteIds;
      }
    } catch {
      // Fallback
    }

    try {
      if (Platform.OS !== 'web') {
        const stored = await SecureStore.getItemAsync(IDEA_BOOKMARKS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            inMemoryIdeaBookmarkIds = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // Ignore
    }

    return inMemoryIdeaBookmarkIds;
  },

  /**
   * Toggle bookmark for an idea via backend polymorphic endpoint
   */
  async toggleIdeaBookmark(ideaId: string): Promise<boolean> {
    const isCurrentlyBookmarked = inMemoryIdeaBookmarkIds.includes(ideaId);
    const newStatus = !isCurrentlyBookmarked;

    inMemoryIdeaBookmarkIds = newStatus
      ? [...inMemoryIdeaBookmarkIds, ideaId]
      : inMemoryIdeaBookmarkIds.filter((id) => id !== ideaId);

    try {
      if (Platform.OS !== 'web') {
        SecureStore.setItemAsync(
          IDEA_BOOKMARKS_STORAGE_KEY,
          JSON.stringify(inMemoryIdeaBookmarkIds)
        ).catch(() => {});
      }
    } catch {
      // Ignore
    }

    try {
      const res = await api.post<{ bookmarked: boolean }>('/bookmarks/toggle', {
        targetType: 'IDEA',
        targetId: ideaId,
      });
      if (typeof res?.bookmarked === 'boolean') {
        return res.bookmarked;
      }
    } catch {
      // Keep optimistic
    }

    return newStatus;
  },
};
