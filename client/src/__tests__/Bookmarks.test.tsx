import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BookmarksScreen } from '../screens/Bookmarks/BookmarksScreen';
import { ProjectCard, ProjectListing } from '../components/ProjectCard';
import { ThemeProvider } from '../theme/ThemeContext';
import { bookmarkService } from '../services/bookmarkService';
import * as Haptics from 'expo-haptics';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('Bookmarks (Phase 6 - Feature 13)', () => {
  const mockProject: ProjectListing = {
    id: 'proj-1',
    title: 'EduTech Collaboration',
    description: 'A student matching platform.',
    domain: 'Education',
    status: 'OPEN',
    isBookmarked: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers haptic feedback when bookmark button is pressed on ProjectCard', () => {
    const onToggleMock = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <ProjectCard project={mockProject} onBookmarkToggle={onToggleMock} />
      </ThemeProvider>
    );

    const bookmarkBtn = getByTestId('bookmark-button');
    fireEvent.press(bookmarkBtn);

    expect(onToggleMock).toHaveBeenCalledWith('proj-1');
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('renders bookmarked projects list on BookmarksScreen', async () => {
    jest.spyOn(bookmarkService, 'getBookmarkedProjects').mockResolvedValueOnce([
      {
        id: 'proj-101',
        title: 'TeamUp - Student Partner Finder',
        description: 'A student matching platform.',
        domain: 'Education',
        status: 'OPEN',
        isBookmarked: true,
      },
    ]);

    const { findByText } = render(
      <ThemeProvider>
        <BookmarksScreen />
      </ThemeProvider>
    );

    expect(await findByText('Saved Bookmarks')).toBeTruthy();
    expect(await findByText('TeamUp - Student Partner Finder')).toBeTruthy();
  });

  it('optimistically removes project from list when unbookmarked', async () => {
    jest.spyOn(bookmarkService, 'getBookmarkedProjects').mockResolvedValueOnce([
      {
        id: 'proj-101',
        title: 'TeamUp - Student Partner Finder',
        description: 'A student matching platform.',
        domain: 'Education',
        status: 'OPEN',
        isBookmarked: true,
      },
    ]);
    jest.spyOn(bookmarkService, 'toggleBookmark').mockResolvedValueOnce(false);

    const { findByText, getByTestId, queryByText } = render(
      <ThemeProvider>
        <BookmarksScreen />
      </ThemeProvider>
    );

    await findByText('TeamUp - Student Partner Finder');

    const bookmarkBtn = getByTestId('bookmark-button');
    fireEvent.press(bookmarkBtn);

    // Immediately removed from view (optimistic UI update)
    await waitFor(() => {
      expect(queryByText('TeamUp - Student Partner Finder')).toBeNull();
    });

    expect(bookmarkService.toggleBookmark).toHaveBeenCalled();
  });

  it('renders empty state when no projects are bookmarked', async () => {
    jest.spyOn(bookmarkService, 'getBookmarkedProjects').mockResolvedValueOnce([]);

    const { findByText } = render(
      <ThemeProvider>
        <BookmarksScreen />
      </ThemeProvider>
    );

    expect(await findByText(/No Saved Bookmarks Yet/i)).toBeTruthy();
  });
});
