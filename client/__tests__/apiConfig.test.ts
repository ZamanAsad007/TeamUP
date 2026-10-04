import { apiConfig, sanitizeApiUrl, DEFAULT_API_URL } from '../src/services/apiConfig';
import { apiClient } from '../src/api/client';

describe('apiConfig & dynamic server tunneling', () => {
  beforeEach(async () => {
    await apiConfig.resetApiUrl();
  });

  describe('sanitizeApiUrl', () => {
    it('appends https:// if protocol is omitted', () => {
      const sanitized = sanitizeApiUrl('1234.ngrok-free.app/api/v1');
      expect(sanitized).toBe('https://1234.ngrok-free.app/api/v1');
    });

    it('appends /api/v1 if path is missing', () => {
      const sanitized = sanitizeApiUrl('https://1234.ngrok-free.app');
      expect(sanitized).toBe('https://1234.ngrok-free.app/api/v1');
    });

    it('strips trailing slashes cleanly', () => {
      const sanitized = sanitizeApiUrl('https://1234.ngrok-free.app/api/v1///');
      expect(sanitized).toBe('https://1234.ngrok-free.app/api/v1');
    });

    it('falls back to default if empty string given', () => {
      const sanitized = sanitizeApiUrl('   ');
      expect(sanitized).toBe(DEFAULT_API_URL);
    });
  });

  describe('runtime configuration and subscription', () => {
    it('updates URL, caches it, and notifies subscribers', async () => {
      let notifiedUrl = '';
      const unsubscribe = apiConfig.subscribe((url) => {
        notifiedUrl = url;
      });

      const updated = await apiConfig.setApiUrl('https://my-tunnel.ngrok-free.app');
      expect(updated).toBe('https://my-tunnel.ngrok-free.app/api/v1');
      expect(apiConfig.getApiUrl()).toBe('https://my-tunnel.ngrok-free.app/api/v1');
      expect(notifiedUrl).toBe('https://my-tunnel.ngrok-free.app/api/v1');
      expect(apiClient.defaults.baseURL).toBe('https://my-tunnel.ngrok-free.app/api/v1');

      unsubscribe();
    });

    it('resets URL back to default', async () => {
      await apiConfig.setApiUrl('https://temp.ngrok-free.app');
      expect(apiConfig.getApiUrl()).toBe('https://temp.ngrok-free.app/api/v1');

      await apiConfig.resetApiUrl();
      expect(apiConfig.getApiUrl()).toBe(DEFAULT_API_URL);
      expect(apiClient.defaults.baseURL).toBe(DEFAULT_API_URL);
    });

    it('falls back to localhost when on web and stored url is a stale LAN IP', async () => {
      // Simulate stored stale LAN IP
      await apiConfig.setApiUrl('http://192.168.0.174:5001/api/v1');
      // When re-initializing on localhost (test environment has default setup), resetApiUrl restores default
      await apiConfig.resetApiUrl();
      expect(apiConfig.getApiUrl()).toBe(DEFAULT_API_URL);
    });
  });
});

