import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeContext';
import { WorkspaceHomeScreen } from '../screens/Workspace/WorkspaceHomeScreen';
import { MemberListScreen } from '../screens/Workspace/MemberListScreen';
import { workspaceService } from '../services/workspaceService';

jest.mock('../services/workspaceService');
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'leader@example.com' },
    isAuthenticated: true,
  }),
}));

const mockOverview = {
  project: {
    id: 'proj-1',
    title: 'Autonomous Drone Fleet',
    description: 'Cloud coordinated drones.',
    domain: 'Robotics',
    semester: 'Fall 2026',
    maxMembers: 4,
    status: 'OPEN',
    creatorId: 'user-1',
  },
  userRole: 'LEADER' as const,
  members: [
    { id: 'm-1', userId: 'user-1', role: 'LEADER' as const, status: 'ACCEPTED' as const },
    { id: 'm-2', userId: 'user-2', role: 'MEMBER' as const, status: 'ACCEPTED' as const },
  ],
  metrics: {
    tasks: {
      todo: 2,
      inProgress: 3,
      testing: 1,
      done: 4,
      total: 10,
      highPriority: 2,
      assignedToMe: 1,
    },
    files: {
      totalCount: 3,
      totalSize: 10240,
      recent: [],
    },
    chat: {
      totalMessages: 15,
      lastMessage: {
        content: 'Latest build is ready for verification',
        createdAt: '2026-09-22T00:00:00.000Z',
        sender: {
          id: 'user-2',
          email: 'teammate@example.com',
          profile: { fullName: 'Teammate One' },
        },
      },
    },
  },
};

describe('Phase 2 — Team Workspace Shell', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('WorkspaceHomeScreen renders metrics and routes into sub-screens', async () => {
    (workspaceService.getWorkspaceOverview as jest.Mock).mockResolvedValue(mockOverview);

    const route = { params: { projectId: 'proj-1', projectTitle: 'Autonomous Drone Fleet' } };

    const { getByText } = render(
      <ThemeProvider>
        <WorkspaceHomeScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Autonomous Drone Fleet')).toBeTruthy();
      expect(getByText('Leader')).toBeTruthy();
      expect(getByText('10 Tasks')).toBeTruthy();
      expect(getByText('15 Messages')).toBeTruthy();
      expect(getByText('Latest build is ready for verification')).toBeTruthy();
    });

    const kanbanBtn = getByText('Open Kanban Board');
    fireEvent.press(kanbanBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Kanban', {
      projectId: 'proj-1',
      projectTitle: 'Autonomous Drone Fleet',
    });

    const chatBtn = getByText('Open Team Chat');
    fireEvent.press(chatBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Chat', {
      projectId: 'proj-1',
      projectTitle: 'Autonomous Drone Fleet',
    });
  });

  it('WorkspaceHomeScreen handles non-member access error gracefully', async () => {
    (workspaceService.getWorkspaceOverview as jest.Mock).mockRejectedValueOnce(
      new Error('You must be a member of this project to access the workspace.')
    );

    const route = { params: { projectId: 'proj-forbidden' } };

    const { getByText } = render(
      <ThemeProvider>
        <WorkspaceHomeScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('You must be a member of this project to access the workspace.')).toBeTruthy();
    });
  });

  it('MemberListScreen renders member list with roles and statuses', async () => {
    (workspaceService.getProjectMembers as jest.Mock).mockResolvedValueOnce(mockOverview.members);

    const route = { params: { projectId: 'proj-1' } };

    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <MemberListScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText(/LEADER/)).toBeTruthy();
      expect(getAllByText(/ACCEPTED/).length).toBe(2);
    });
  });
});
