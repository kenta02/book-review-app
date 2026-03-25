import { describe, expect, it } from 'vitest';

import {
  buildSafeProxyPath,
  parseAllowedOrigins,
  resolveApiServerPort,
} from '../src/swagger-server';

describe('swagger-server helpers', () => {
  describe('parseAllowedOrigins', () => {
    it('returns a Set without blank values', () => {
      const origins = parseAllowedOrigins(
        'http://localhost:8080, https://docs.example.com, http://localhost:8080,   '
      );

      expect(origins.has('http://localhost:8080')).toBe(true);
      expect(origins.has('https://docs.example.com')).toBe(true);
      expect(origins.size).toBe(2);
    });
  });

  describe('resolveApiServerPort', () => {
    it('returns the parsed port when the value is valid', () => {
      expect(resolveApiServerPort('4100')).toBe(4100);
    });

    it('throws when the port is outside the valid range', () => {
      expect(() => resolveApiServerPort('70000')).toThrow(
        'API_SERVER_PORT must be an integer between 1 and 65535'
      );
    });
  });

  describe('buildSafeProxyPath', () => {
    it('keeps only normalized /api paths', () => {
      expect(buildSafeProxyPath('/api/books?page=2')).toBe('/api/books?page=2');
    });

    it('rejects paths outside the API prefix', () => {
      expect(() => buildSafeProxyPath('/health')).toThrow('Forbidden proxy path');
    });
  });
});
