import { describe, it, expect } from 'vitest';
import {
  calculateGrowthRate,
  calculateCAGR,
  getEbitdaMarginStatus,
  getGrowthStatus,
  getDebtToEquityStatus,
  getCurrentRatioStatus,
} from '@/lib/financial-logic/kpi';

describe('KPI Calculations', () => {
  describe('calculateGrowthRate', () => {
    it('should calculate positive growth correctly', () => {
      const result = calculateGrowthRate(110, 100);
      expect(result).toBe(0.1); // 10% growth
    });

    it('should calculate negative growth correctly', () => {
      const result = calculateGrowthRate(90, 100);
      expect(result).toBe(-0.1); // -10% growth
    });

    it('should handle zero previous value', () => {
      const result = calculateGrowthRate(100, 0);
      expect(result).toBe(1); // 100% for positive current
    });

    it('should return 0 for zero current and previous', () => {
      const result = calculateGrowthRate(0, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateCAGR', () => {
    it('should calculate CAGR correctly', () => {
      // 100 -> 121 in 2 years = 10% CAGR
      const result = calculateCAGR(100, 121, 2);
      expect(result).toBeCloseTo(0.1, 2);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateCAGR(0, 100, 2)).toBe(0);
      expect(calculateCAGR(100, 200, 0)).toBe(0);
      expect(calculateCAGR(-100, 200, 2)).toBe(0);
    });
  });

  describe('getEbitdaMarginStatus', () => {
    it('should return excellent for margin >= 20%', () => {
      expect(getEbitdaMarginStatus(0.20)).toBe('excellent');
      expect(getEbitdaMarginStatus(0.25)).toBe('excellent');
    });

    it('should return good for margin 12-20%', () => {
      expect(getEbitdaMarginStatus(0.12)).toBe('good');
      expect(getEbitdaMarginStatus(0.15)).toBe('good');
    });

    it('should return fair for margin 5-12%', () => {
      expect(getEbitdaMarginStatus(0.05)).toBe('fair');
      expect(getEbitdaMarginStatus(0.10)).toBe('fair');
    });

    it('should return poor for margin < 5%', () => {
      expect(getEbitdaMarginStatus(0.04)).toBe('poor');
      expect(getEbitdaMarginStatus(0)).toBe('poor');
    });
  });

  describe('getGrowthStatus', () => {
    it('should return fair for null growth', () => {
      expect(getGrowthStatus(null)).toBe('fair');
    });

    it('should return excellent for growth >= 15%', () => {
      expect(getGrowthStatus(0.15)).toBe('excellent');
      expect(getGrowthStatus(0.20)).toBe('excellent');
    });

    it('should return good for growth 5-15%', () => {
      expect(getGrowthStatus(0.05)).toBe('good');
      expect(getGrowthStatus(0.10)).toBe('good');
    });

    it('should return poor for negative growth', () => {
      expect(getGrowthStatus(-0.05)).toBe('poor');
    });
  });

  describe('getDebtToEquityStatus', () => {
    it('should return fair for null ratio', () => {
      expect(getDebtToEquityStatus(null)).toBe('fair');
    });

    it('should return excellent for ratio <= 0.3', () => {
      expect(getDebtToEquityStatus(0.2)).toBe('excellent');
      expect(getDebtToEquityStatus(0.3)).toBe('excellent');
    });

    it('should return poor for ratio > 1.0', () => {
      expect(getDebtToEquityStatus(1.5)).toBe('poor');
    });
  });

  describe('getCurrentRatioStatus', () => {
    it('should return fair for null ratio', () => {
      expect(getCurrentRatioStatus(null)).toBe('fair');
    });

    it('should return excellent for ratio >= 2.0', () => {
      expect(getCurrentRatioStatus(2.0)).toBe('excellent');
      expect(getCurrentRatioStatus(2.5)).toBe('excellent');
    });

    it('should return poor for ratio < 1.0', () => {
      expect(getCurrentRatioStatus(0.8)).toBe('poor');
    });
  });
});


