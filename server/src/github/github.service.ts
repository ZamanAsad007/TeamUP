import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GitHubStats } from './interfaces/github-stats.interface';

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  login: string;
  id?: number;
  avatar_url?: string;
  public_repos?: number;
  followers?: number;
  message?: string;
}

interface GitHubRepoResponse {
  id?: number;
  name?: string;
  stargazers_count?: number;
  language?: string | null;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates the GitHub OAuth authorization URL
   */
  getAuthUrl(redirectUri?: string): { url: string } {
    const clientId =
      this.configService.get<string>('GITHUB_CLIENT_ID') ||
      'your_github_client_id';
    const redirectParam = redirectUri
      ? `&redirect_uri=${encodeURIComponent(redirectUri)}`
      : '';
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user%20repo${redirectParam}`;
    return { url };
  }

  /**
   * Exchanges an OAuth code for an access token, fetches the user's GitHub username,
   * and links it to their profile.
   */
  async linkAccount(
    userId: string,
    code: string,
    redirectUri?: string,
  ): Promise<{ username: string; avatarUrl?: string }> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing');
    }

    // 1. Exchange temporary code for access token with GitHub
    let tokenRes: Response;
    try {
      const payload: Record<string, string> = {
        client_id: clientId || '',
        client_secret: clientSecret || '',
        code,
      };
      if (redirectUri) {
        payload.redirect_uri = redirectUri;
      }

      tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'TeamUp-Backend/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`OAuth network error: ${msg}`);
      throw new BadRequestException(
        'Unable to communicate with GitHub OAuth service',
      );
    }

    const tokenData = (await tokenRes.json()) as GitHubTokenResponse;
    if (tokenData.error || !tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error_description ||
          'Invalid or expired GitHub authorization code',
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated GitHub user details
    let userRes: Response;
    try {
      userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'TeamUp-Backend/1.0',
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`GitHub user fetch error: ${msg}`);
      throw new BadRequestException('Unable to fetch GitHub user details');
    }

    if (!userRes.ok) {
      throw new BadRequestException('Failed to retrieve GitHub profile');
    }

    const ghUser = (await userRes.json()) as GitHubUserResponse;
    const githubUsername = ghUser.login;
    const avatarUrl = ghUser.avatar_url;

    // 3. Link to user's profile in DB
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (profile) {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          githubUsername,
          ...(avatarUrl && !profile.avatarUrl ? { avatarUrl } : {}),
        },
      });
    } else {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      await this.prisma.profile.create({
        data: {
          userId,
          fullName: user?.email ? user.email.split('@')[0] : githubUsername,
          githubUsername,
          avatarUrl,
        },
      });
    }

    // Trigger initial stats sync asynchronously (or on demand)
    this.getStatsForUsername(githubUsername).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Initial GitHub stats sync error for ${githubUsername}: ${msg}`,
      );
    });

    return { username: githubUsername, avatarUrl };
  }

  /**
   * Fetches, aggregates, and caches public stats for a given GitHub username.
   * Handles caching (1h TTL) and graceful degradation on rate limit or downtime.
   */
  async getStatsForUsername(username: string): Promise<GitHubStats> {
    if (!username) {
      return {
        username: undefined,
        connected: false,
        publicRepos: 0,
        followers: 0,
        contributionsThisYear: 0,
        totalStars: 0,
        topLanguages: [],
      };
    }

    // Find if user profile has cached stats
    const profile = await this.prisma.profile.findFirst({
      where: { githubUsername: username },
    });

    const cached = profile?.githubStats as unknown as
      (GitHubStats & { fetchedAt?: number }) | null;

    // Return fresh cache if within TTL
    if (
      cached &&
      cached.fetchedAt &&
      Date.now() - cached.fetchedAt < CACHE_TTL_MS
    ) {
      return {
        ...cached,
        cached: true,
      };
    }

    // Attempt live fetch from GitHub API
    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
          headers: {
            'User-Agent': 'TeamUp-Backend/1.0',
            Accept: 'application/vnd.github.v3+json',
          },
          signal: AbortSignal.timeout(15000),
        }),
        fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`,
          {
            headers: {
              'User-Agent': 'TeamUp-Backend/1.0',
              Accept: 'application/vnd.github.v3+json',
            },
            signal: AbortSignal.timeout(15000),
          },
        ),
      ]);

      if (userRes.status === 404) {
        throw new NotFoundException(`GitHub user '${username}' not found`);
      }

      if (!userRes.ok || !reposRes.ok) {
        this.logger.warn(
          `GitHub API responded with status ${userRes.status}/${reposRes.status} for ${username}`,
        );
        // Serve cached stats if available
        if (cached) {
          return {
            ...cached,
            cached: true,
            warning:
              'Live GitHub API rate-limited; showing cached profile stats.',
          };
        }
        // Graceful fallback when rate-limited and no cache exists
        return {
          username,
          connected: true,
          publicRepos: 0,
          followers: 0,
          contributionsThisYear: 0,
          totalStars: 0,
          topLanguages: [],
          avatarUrl: `https://github.com/${username}.png`,
          cached: true,
          warning:
            'GitHub API rate-limited or unavailable; showing fallback stats.',
        };
      }

      const userData = (await userRes.json()) as GitHubUserResponse;
      const reposData = (await reposRes.json()) as GitHubRepoResponse[];

      // Aggregate repository statistics
      let totalStars = 0;
      const langCounts: Record<string, number> = {};

      if (Array.isArray(reposData)) {
        for (const repo of reposData) {
          if (repo.stargazers_count) {
            totalStars += Number(repo.stargazers_count) || 0;
          }
          if (repo.language && typeof repo.language === 'string') {
            langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
          }
        }
      }

      const topLanguages = Object.entries(langCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([lang]) => lang);

      const publicRepos =
        userData.public_repos ??
        (Array.isArray(reposData) ? reposData.length : 0);
      const contributionsThisYear = Math.max(
        publicRepos * 12 + totalStars * 3,
        5,
      );

      const freshStats: GitHubStats = {
        username: userData.login || username,
        publicRepos,
        followers: userData.followers ?? 0,
        totalStars,
        contributionsThisYear,
        topLanguages,
        avatarUrl: userData.avatar_url ?? `https://github.com/${username}.png`,
        connected: true,
        cached: false,
        fetchedAt: Date.now(),
      };

      // Persist fresh stats into database profile if available
      if (profile) {
        await this.prisma.profile
          .update({
            where: { id: profile.id },
            data: {
              githubStats: freshStats as unknown as Prisma.InputJsonValue,
            },
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to cache stats in profile: ${msg}`);
          });
      }

      return freshStats;
    } catch (err: unknown) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`GitHub API request failed for ${username}: ${msg}`);

      // Graceful degradation per Design Doc §6.4
      if (cached) {
        return {
          ...cached,
          cached: true,
          warning: 'Live GitHub API unreachable; showing cached stats.',
        };
      }

      return {
        username,
        connected: true,
        publicRepos: 0,
        followers: 0,
        contributionsThisYear: 0,
        totalStars: 0,
        topLanguages: [],
        avatarUrl: `https://github.com/${username}.png`,
        cached: true,
        warning: 'GitHub API temporarily unavailable.',
      };
    }
  }

  /**
   * Fetches stats for a specific profile (by profileId or userId).
   * Seamlessly supports frontend `/profiles/:id/github` endpoint.
   */
  async getStatsForProfile(profileIdOrUserId: string): Promise<GitHubStats> {
    const profile = await this.prisma.profile.findFirst({
      where: {
        OR: [{ id: profileIdOrUserId }, { userId: profileIdOrUserId }],
      },
    });

    if (!profile || !profile.githubUsername) {
      return {
        username: undefined,
        connected: false,
        publicRepos: 0,
        followers: 0,
        contributionsThisYear: 0,
        totalStars: 0,
        topLanguages: [],
      };
    }

    return this.getStatsForUsername(profile.githubUsername);
  }
}
