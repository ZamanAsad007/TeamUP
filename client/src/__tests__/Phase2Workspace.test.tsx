import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
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

    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <WorkspaceHomeScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Autonomous Drone Fleet')).toBeTruthy();
      expect(getAllByText('Leader').length).toBeGreaterThan(0);
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

  it('MemberListScreen renders pending applications with Accept and Reject buttons for the leader', async () => {
    const mockMembersWithPending = [
      { id: 'm-1', userId: 'user-1', role: 'LEADER' as const, status: 'ACCEPTED' as const },
      {
        id: 'm-pending',
        userId: 'user-applicant',
        role: 'MEMBER' as const,
        status: 'PENDING' as const,
        user: {
          id: 'user-applicant',
          email: 'applicant@example.com',
          profile: { fullName: 'Applicant User', department: 'Computer Science' },
        },
      },
    ];

    (workspaceService.getProjectMembers as jest.Mock).mockResolvedValueOnce(mockMembersWithPending);
    (workspaceService.updateMember as jest.Mock).mockResolvedValueOnce({});

    const route = { params: { projectId: 'proj-1', isLeader: true } };

    const { getByText } = render(
      <ThemeProvider>
        <MemberListScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText(/Applicant User/)).toBeTruthy();
      expect(getByText('Accept')).toBeTruthy();
      expect(getByText('Reject')).toBeTruthy();
      expect(getByText('View Profile')).toBeTruthy();
    });

    const viewProfileBtn = getByText('View Profile');
    fireEvent.press(viewProfileBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('UserProfile', {
      userId: 'user-applicant',
      userName: 'Applicant User',
      projectId: 'proj-1',
    });

    const acceptBtn = getByText('Accept');
    fireEvent.press(acceptBtn);

    await waitFor(() => {
      expect(workspaceService.updateMember).toHaveBeenCalledWith('proj-1', 'm-pending', {
        status: 'ACCEPTED',
      });
    });
  });

  it('MemberListScreen renders Kick Member button for accepted members and kicks when confirmed', async () => {
    const mockMembers = [
      { id: 'm-1', userId: 'user-1', role: 'LEADER' as const, status: 'ACCEPTED' as const },
      {
        id: 'm-2',
        userId: 'user-2',
        role: 'MEMBER' as const,
        status: 'ACCEPTED' as const,
        user: {
          id: 'user-2',
          email: 'teammate@example.com',
          profile: { fullName: 'Teammate One' },
        },
      },
    ];

    (workspaceService.getProjectMembers as jest.Mock).mockResolvedValue(mockMembers);
    (workspaceService.kickMember as jest.Mock).mockResolvedValue({});

    const alertSpy = jest.spyOn(Alert, 'alert');

    const route = { params: { projectId: 'proj-1', isLeader: true } };

    const { getByText } = render(
      <ThemeProvider>
        <MemberListScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Kick Member')).toBeTruthy();
    });

    fireEvent.press(getByText('Kick Member'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Kick Member',
      expect.stringContaining('kick Teammate One'),
      expect.any(Array)
    );

    // Trigger confirmation action
    const buttons = alertSpy.mock.calls[0][2];
    const confirmAction = buttons?.find((b: any) => b.text === 'Kick Member');
    expect(confirmAction).toBeDefined();
    await confirmAction!.onPress!();

    await waitFor(() => {
      expect(workspaceService.kickMember).toHaveBeenCalledWith('proj-1', 'm-2');
    });

    alertSpy.mockRestore();
  });

  it('MemberListScreen renders Leave Project button for accepted member and leaves when confirmed', async () => {
    const mockMembers = [
      {
        id: 'm-1',
        userId: 'user-1',
        role: 'MEMBER' as const,
        status: 'ACCEPTED' as const,
        user: {
          id: 'user-1',
          email: 'leader@example.com',
          profile: { fullName: 'Current User' },
        },
      },
      {
        id: 'm-2',
        userId: 'user-2',
        role: 'LEADER' as const,
        status: 'ACCEPTED' as const,
        user: {
          id: 'user-2',
          email: 'other@example.com',
          profile: { fullName: 'Other Leader' },
        },
      },
    ];

    (workspaceService.getProjectMembers as jest.Mock).mockResolvedValue(mockMembers);
    (workspaceService.leaveProject as jest.Mock).mockResolvedValue({});

    const alertSpy = jest.spyOn(Alert, 'alert');

    const route = { params: { projectId: 'proj-1', isLeader: false } };

    const { getAllByText } = render(
      <ThemeProvider>
        <MemberListScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getAllByText('Leave Project').length).toBeGreaterThan(0);
    });

    fireEvent.press(getAllByText('Leave Project')[0]);

    expect(alertSpy).toHaveBeenCalledWith(
      'Leave Project',
      expect.stringContaining('leave this project'),
      expect.any(Array)
    );

    const buttons = alertSpy.mock.calls[0][2];
    const confirmAction = buttons?.find((b: any) => b.text === 'Leave Project');
    expect(confirmAction).toBeDefined();
    await confirmAction!.onPress!();

    await waitFor(() => {
      expect(workspaceService.leaveProject).toHaveBeenCalledWith('proj-1', 'm-1');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('MainApp', { screen: 'Projects' });
    });

    alertSpy.mockRestore();
  });

  it('WorkspaceHomeScreen renders Leave Project button for regular members and navigates on leave', async () => {
    const memberOverview = {
      ...mockOverview,
      userRole: 'MEMBER' as const,
    };

    (workspaceService.getWorkspaceOverview as jest.Mock).mockResolvedValue(memberOverview);
    (workspaceService.leaveProject as jest.Mock).mockResolvedValue({});

    const alertSpy = jest.spyOn(Alert, 'alert');

    const route = { params: { projectId: 'proj-1', projectTitle: 'Autonomous Drone Fleet' } };

    const { getByText } = render(
      <ThemeProvider>
        <WorkspaceHomeScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Leave Project')).toBeTruthy();
    });

    fireEvent.press(getByText('Leave Project'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Leave Project',
      expect.stringContaining('leave this project'),
      expect.any(Array)
    );

    const buttons = alertSpy.mock.calls[0][2];
    const confirmAction = buttons?.find((b: any) => b.text === 'Leave Project');
    expect(confirmAction).toBeDefined();
    await confirmAction!.onPress!();

    await waitFor(() => {
      expect(workspaceService.leaveProject).toHaveBeenCalledWith('proj-1');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('MainApp', { screen: 'Projects' });
    });

    alertSpy.mockRestore();
  });
});

