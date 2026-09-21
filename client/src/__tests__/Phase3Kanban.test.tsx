import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeContext';
import { KanbanScreen } from '../screens/Kanban/KanbanScreen';
import { taskService, Task } from '../services/taskService';
import { Alert } from 'react-native';

jest.mock('../services/taskService');
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Setup Redis adapter',
    description: 'Configure Redis socket.io pub/sub',
    status: 'TODO',
    priority: 'HIGH',
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'Design Kanban cards',
    description: 'Bento card styling',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Verify WebSocket auth',
    description: 'Test handshake JWT guard',
    status: 'TESTING',
    priority: 'HIGH',
  },
  {
    id: 'task-4',
    projectId: 'proj-1',
    title: 'Project Setup',
    description: 'Init Expo repo',
    status: 'DONE',
    priority: 'LOW',
  },
];

describe('Phase 3 — Kanban Board', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Kanban board with columns and tasks', async () => {
    (taskService.getTasks as jest.Mock).mockResolvedValue(mockTasks);

    const route = { params: { projectId: 'proj-1', projectTitle: 'Drone Fleet' } };

    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <KanbanScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Setup Redis adapter')).toBeTruthy();
      expect(getAllByText(/To Do/).length).toBeGreaterThan(0);
      expect(getByText(/In Progress/)).toBeTruthy();
      expect(getByText(/Testing/)).toBeTruthy();
      expect(getByText(/Done/)).toBeTruthy();
    });
  });

  it('optimistically moves task status and calls taskService.updateTask', async () => {
    (taskService.getTasks as jest.Mock).mockResolvedValue(mockTasks);
    (taskService.updateTask as jest.Mock).mockResolvedValue({
      ...mockTasks[0],
      status: 'IN_PROGRESS',
    });

    const route = { params: { projectId: 'proj-1' } };

    const { getByText } = render(
      <ThemeProvider>
        <KanbanScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Setup Redis adapter')).toBeTruthy();
    });

    const startBtn = getByText('Start →');
    fireEvent.press(startBtn);

    await waitFor(() => {
      expect(taskService.updateTask).toHaveBeenCalledWith('proj-1', 'task-1', {
        status: 'IN_PROGRESS',
      });
    });
  });

  it('rolls back optimistic move on API failure and alerts user', async () => {
    (taskService.getTasks as jest.Mock).mockResolvedValue(mockTasks);
    (taskService.updateTask as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    const route = { params: { projectId: 'proj-1' } };

    const { getByText } = render(
      <ThemeProvider>
        <KanbanScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Setup Redis adapter')).toBeTruthy();
    });

    const startBtn = getByText('Start →');
    fireEvent.press(startBtn);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Status Update Failed',
        expect.stringContaining('Network failure')
      );
    });
  });

  it('opens create task modal and submits new task', async () => {
    (taskService.getTasks as jest.Mock).mockResolvedValue(mockTasks);
    (taskService.createTask as jest.Mock).mockResolvedValue({
      id: 'task-new',
      projectId: 'proj-1',
      title: 'New Unit Test Task',
      description: 'Write Jest tests',
      status: 'TODO',
      priority: 'MEDIUM',
    });

    const route = { params: { projectId: 'proj-1' } };

    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <KanbanScreen route={route} navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('+ Add Task')).toBeTruthy();
    });

    fireEvent.press(getByText('+ Add Task'));

    await waitFor(() => {
      expect(getByText('Create Task')).toBeTruthy();
    });

    const titleInput = getByPlaceholderText('Task title');
    fireEvent.changeText(titleInput, 'New Unit Test Task');

    const saveBtn = getByText('Save Task');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalledWith('proj-1', {
        title: 'New Unit Test Task',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
      });
    });
  });
});
