/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LandingScreen } from '../screens/Landing/LandingScreen';
import { ThemeProvider } from '../theme/ThemeContext';

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, {
    get: (_, name) => (props: any) => React.createElement(View, { testID: `icon-${String(name)}`, ...props })
  });
});

describe('Landing Screen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders hero headline, subtitle, and feature tags', () => {
    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    // Check hero headline
    expect(getByText('Your next project starts with the right team.')).toBeTruthy();

    // Check hero subtitle
    expect(
      getByText(
        'Connect with classmates who complement your stack, match your schedule, and actually want to build great software together.'
      )
    ).toBeTruthy();

    // Check highlight tags
    expect(getByText('Stack Compatibility')).toBeTruthy();
    expect(getByText('GitHub Activity Sync')).toBeTruthy();
    expect(getByText('Conflict-Free Scheduling')).toBeTruthy();
    expect(getByText('Capstone & Hackathons')).toBeTruthy();

    // Check CTAs exist
    expect(getAllByText('Join TeamUp').length).toBeGreaterThan(0);
    expect(getAllByText('Log In').length).toBeGreaterThan(0);
  });

  it('navigates to Register when Join TeamUp is pressed', () => {
    const { getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const joinButtons = getAllByText('Join TeamUp');
    fireEvent.press(joinButtons[0]);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('navigates to Login when Log In is pressed', () => {
    const { getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const loginButtons = getAllByText('Log In');
    fireEvent.press(loginButtons[0]);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('renders bento feature cards and 3-step workflow', () => {
    const { getByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    // Bento cards
    expect(getByText('Skill-Based Matching')).toBeTruthy();
    expect(getByText('Smart Meeting Scheduler')).toBeTruthy();
    expect(getByText('Verified GitHub Activity')).toBeTruthy();
    expect(getByText('Collaborative Idea Hub')).toBeTruthy();

    // 3 steps
    expect(getByText('Create Your Profile')).toBeTruthy();
    expect(getByText('Match & Invite')).toBeTruthy();
    expect(getByText('Schedule & Ship')).toBeTruthy();
  });

  it('renders interactive candidate match teaser card', () => {
    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    expect(getByText('Alice Johnson')).toBeTruthy();
    expect(getAllByText('95%').length).toBeGreaterThan(0);
    expect(getAllByText('Match').length).toBeGreaterThan(0);
    expect(getAllByText('#React Native').length).toBeGreaterThan(0);
    expect(getAllByText('#TypeScript').length).toBeGreaterThan(0);
  });

  it('allows toggling dark/light theme via theme toggle button', () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const toggleBtn = getByLabelText('Toggle theme');
    expect(toggleBtn).toBeTruthy();
    fireEvent.press(toggleBtn);
  });
});
