import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  percentageChange,
  truncate,
  capitalize,
  slugify,
  isDefined,
  range,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format numbers as EUR currency', () => {
      // Note: Locale formatting may vary by environment
      const result1 = formatCurrency(1000);
      expect(result1).toContain('1000') || expect(result1).toContain('1.000');
      expect(result1).toContain('€');
      
      const result2 = formatCurrency(1500000);
      expect(result2).toContain('€');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
      expect(result).toContain('€');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-1000);
      expect(result).toContain('1000') || expect(result).toContain('1.000');
      expect(result).toMatch(/-|−/); // Minus sign (various representations)
    });
  });

  describe('formatPercentage', () => {
    it('should format decimals as percentages', () => {
      expect(formatPercentage(0.1)).toBe('10,0%');
      expect(formatPercentage(0.125, 2)).toBe('12,50%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0,0%');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format large numbers with abbreviations', () => {
      expect(formatCompactNumber(1000)).toContain('1');
      expect(formatCompactNumber(1500000)).toContain('M');
    });
  });

  describe('percentageChange', () => {
    it('should calculate positive change', () => {
      expect(percentageChange(110, 100)).toBe(10);
    });

    it('should calculate negative change', () => {
      expect(percentageChange(90, 100)).toBe(-10);
    });

    it('should handle zero previous value', () => {
      expect(percentageChange(100, 0)).toBe(100);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hi', 5)).toBe('Hi');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });
  });

  describe('slugify', () => {
    it('should create URL-safe slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Café & Bar')).toBe('cafe-bar');
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('range', () => {
    it('should create array of numbers', () => {
      expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(range(0, 3)).toEqual([0, 1, 2, 3]);
    });
  });
});

