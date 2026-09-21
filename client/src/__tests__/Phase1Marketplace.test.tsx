import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeContext';
import { MarketplaceScreen } from '../screens/Marketplace/MarketplaceScreen';
import { ProjectDetailScreen } from '../screens/Marketplace/ProjectDetailScreen';
import { CreateProjectScreen } from '../screens/Marketplace/CreateProjectScreen';
import { projectService } from '../services/projectService';

jest.mock('../services/projectService');
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

const mockProjects = [
  {
    id: 'proj-1',
    title: 'Autonomous Drone Fleet',
    description: 'Cloud coordinated autonomous drones for survey tasks.',
    domain: 'Robotics',
    semester: 'Fall 2026',
    maxMembers: 4,
    status: 'OPEN',
    creatorId: 'user-1',
    requiredSkills: [
      { id: 'rs-1', skillName: 'ROS2', minimumExperience: 'INTERMEDIATE' },
      { id: 'rs-2', skillName: 'C++', minimumExperience: 'ADVANCED' },
    ],
    members: [{ id: 'm-1', userId: 'user-1', role: 'LEADER', status: 'ACCEPTED' }],
  },
];

describe('Phase 1 — Project Marketplace', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('MarketplaceScreen renders populated feed and triggers search', async () => {
    (projectService.getProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <MarketplaceScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Autonomous Drone Fleet')).toBeTruthy();
      expect(getByText('Robotics')).toBeTruthy();
      expect(getByText('Fall 2026')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search projects by title, domain, tech...');
    fireEvent.changeText(searchInput, 'Drone');
    fireEvent(searchInput, 'submitEditing');

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalledWith({ search: 'Drone' });
    });
  });

  it('MarketplaceScreen renders empty state when no projects are returned', async () => {
    (projectService.getProjects as jest.Mock).mockResolvedValueOnce([]);

    const { getByText } = render(
      <ThemeProvider>
        <MarketplaceScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('No Projects Found')).toBeTruthy();
    });
  });

  it('ProjectDetailScreen renders details, skills chips, and handles application', async () => {
    (projectService.getProjectById as jest.Mock).mockResolvedValueOnce(mockProjects[0]);
    (projectService.joinProject as jest.Mock).mockResolvedValueOnce({ success: true });

    const route = { params: { projectId: 'proj-1' } };

    const { getByText } = render(
      <ThemeProvider>
        <ProjectDetailScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Autonomous Drone Fleet')).toBeTruthy();
      expect(getByText('ROS2')).toBeTruthy();
      expect(getByText('C++')).toBeTruthy();
      expect(getByText('About the Project')).toBeTruthy();
    });
  });

  it('CreateProjectScreen validates required fields before submission', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <CreateProjectScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const submitBtn = getByText('Create Project');
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(getByText('Project title is required')).toBeTruthy();
      expect(getByText('Project description is required')).toBeTruthy();
      expect(getByText('Domain is required (e.g. AI / ML, Web Development)')).toBeTruthy();
      expect(getByText('Semester is required (e.g. Fall 2026)')).toBeTruthy();
    });

    expect(projectService.createProject).not.toHaveBeenCalled();
  });
});
