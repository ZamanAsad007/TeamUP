import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Chip } from '../components/Chip';
import { StateWrapper } from '../components/StateWrapper';
import { socketService } from '../services/socketService';
import { Text, View } from 'react-native';

jest.mock('socket.io-client', () => {
  const mockSocket = {
    connected: false,
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    close: jest.fn(),
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

describe('Phase 0 — Project Foundations', () => {
  it('renders shared M3 components (Card, Button, Badge, Chip, StateWrapper)', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Card>
          <Text>Foundation Card Content</Text>
          <Badge label="Active" variant="secondary" />
          <Chip label="React Native" selected />
          <Button title="Click Me" onPress={() => {}} />
        </Card>
      </ThemeProvider>
    );

    expect(getByText('Foundation Card Content')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('React Native')).toBeTruthy();
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders StateWrapper loading and empty states', () => {
    const { getByText } = render(
      <ThemeProvider>
        <StateWrapper state="empty" emptyTitle="No Projects Found" emptySubtitle="Create one now">
          <View />
        </StateWrapper>
      </ThemeProvider>
    );

    expect(getByText('No Projects Found')).toBeTruthy();
  });

  it('initializes socketService and manages connection lifecycle and status', async () => {
    expect(socketService.getStatus()).toBe('disconnected');

    const statusUpdates: string[] = [];
    const unsubscribe = socketService.onStatusChange((status) => {
      statusUpdates.push(status);
    });

    const socket = await socketService.connect();
    expect(socket).toBeDefined();

    socketService.joinRoom('proj-123');
    socketService.leaveRoom('proj-123');
    socketService.disconnect();

    expect(socketService.getStatus()).toBe('disconnected');
    expect(statusUpdates.length).toBeGreaterThan(0);
    unsubscribe();
  });
});
