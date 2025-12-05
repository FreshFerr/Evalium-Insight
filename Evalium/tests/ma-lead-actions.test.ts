import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMAndALead } from '@/app/dashboard/admin/leads/actions';

/**
 * Unit tests for M&A Lead Actions
 * Tests that:
 * - Email notification is sent when lead is created
 * - Lead creation succeeds even if email fails
 * - Proper data is passed to email function
 */

// Mock next-auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Prisma
vi.mock('@/db', () => ({
  default: {
    company: {
      findFirst: vi.fn(),
    },
    mAndALead: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock email helper
vi.mock('@/lib/email/ma-lead', () => ({
  sendMAndALeadEmail: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

// Mock KPI extraction
vi.mock('@/lib/financial-logic/kpi', () => ({
  extractKPIs: vi.fn(),
}));

import { auth } from '@/lib/auth';
import prisma from '@/db';
import { sendMAndALeadEmail } from '@/lib/email/ma-lead';
import { logError } from '@/lib/logger';
import { extractKPIs } from '@/lib/financial-logic/kpi';

describe('M&A Lead Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createMAndALead', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    };

    const mockCompany = {
      id: 'company-123',
      legalName: 'Test Company S.r.l.',
      country: 'IT',
      userId: 'user-123',
      financialStatements: [
        {
          id: 'statement-1',
          fiscalYear: 2023,
          revenue: 3000000,
          ebitda: 450000,
          ebitdaMargin: 0.15,
          netDebt: 500000,
          netIncome: 200000,
          totalAssets: 5000000,
          totalLiabilities: 2000000,
          equity: 3000000,
          currency: 'EUR',
        },
      ],
      reports: [
        { type: 'FULL_ANALYSIS', status: 'PAID' },
        { type: 'BASIC_ANALYSIS', status: 'COMPLETED' },
      ],
      user: {
        name: 'Test User',
        email: 'user@example.com',
      },
    };

    const mockKPIs = {
      revenue: 3000000,
      ebitda: 450000,
      ebitdaMargin: 0.15,
      netDebt: 500000,
      fiscalYear: 2023,
      currency: 'EUR',
    };

    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: mockUser,
        expires: new Date().toISOString(),
      } as never);

      vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as never);
      vi.mocked(prisma.mAndALead.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.mAndALead.create).mockResolvedValue({
        id: 'lead-123',
        companyId: 'company-123',
        userId: 'user-123',
        status: 'NEW',
      } as never);

      vi.mocked(extractKPIs).mockReturnValue(mockKPIs);
    });

    it('should send email notification when lead is created successfully', async () => {
      const result = await createMAndALead({
        companyId: 'company-123',
        email: 'user@example.com',
        phone: '+39 02 1234567',
        consent: true,
        score: 75,
        highlights: ['Ricavi superiori a €2M', 'Buona redditività'],
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBe('lead-123');

      // Verify email was called with correct parameters
      expect(sendMAndALeadEmail).toHaveBeenCalledTimes(1);
      expect(sendMAndALeadEmail).toHaveBeenCalledWith({
        leadId: 'lead-123',
        company: {
          legalName: 'Test Company S.r.l.',
          country: 'IT',
          lastYearRevenue: 3000000,
          lastYearEbitda: 450000,
          lastYearEbitdaMargin: 0.15,
          netDebt: 500000,
        },
        user: {
          name: 'Test User',
          email: 'user@example.com',
          phone: '+39 02 1234567',
        },
        isPayingCustomer: true, // Has PAID report
        reports: [
          { type: 'FULL_ANALYSIS', status: 'PAID' },
          { type: 'BASIC_ANALYSIS', status: 'COMPLETED' },
        ],
      });
    });

    it('should mark user as non-paying if no PAID reports exist', async () => {
      const companyWithoutPaidReports = {
        ...mockCompany,
        reports: [
          { type: 'BASIC_ANALYSIS', status: 'COMPLETED' },
        ],
      };

      vi.mocked(prisma.company.findFirst).mockResolvedValue(companyWithoutPaidReports as never);

      const result = await createMAndALead({
        companyId: 'company-123',
        email: 'user@example.com',
        consent: true,
        score: 75,
      });

      expect(result.success).toBe(true);

      expect(sendMAndALeadEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          isPayingCustomer: false,
        })
      );
    });

    it('should handle missing financial data gracefully', async () => {
      const companyWithoutStatements = {
        ...mockCompany,
        financialStatements: [],
      };

      vi.mocked(prisma.company.findFirst).mockResolvedValue(companyWithoutStatements as never);
      vi.mocked(extractKPIs).mockReturnValue(null as never);

      const result = await createMAndALead({
        companyId: 'company-123',
        email: 'user@example.com',
        consent: true,
        score: 75,
      });

      expect(result.success).toBe(true);

      // Email should still be sent with null values
      expect(sendMAndALeadEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          company: expect.objectContaining({
            lastYearRevenue: null,
            lastYearEbitda: null,
            lastYearEbitdaMargin: null,
            netDebt: null,
          }),
        })
      );
    });

    it('should not fail lead creation if email sending fails', async () => {
      vi.mocked(sendMAndALeadEmail).mockRejectedValue(new Error('Email service unavailable'));

      const result = await createMAndALead({
        companyId: 'company-123',
        email: 'user@example.com',
        consent: true,
        score: 75,
      });

      // Lead creation should still succeed
      expect(result.success).toBe(true);
      expect(result.leadId).toBe('lead-123');

      // Error should be logged
      expect(logError).toHaveBeenCalledWith(
        'Failed to send M&A lead notification email',
        expect.any(Error)
      );
    });

    it('should handle missing phone number', async () => {
      const result = await createMAndALead({
        companyId: 'company-123',
        email: 'user@example.com',
        consent: true,
        score: 75,
      });

      expect(result.success).toBe(true);

      expect(sendMAndALeadEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            phone: null,
          }),
        })
      );
    });

    it('should handle missing user name', async () => {
      const companyWithoutUserName = {
        ...mockCompany,
        user: {
          name: null,
          email: 'user@example.com',
        },
      };

      vi.mocked(prisma.company.findFirst).mockResolvedValue(companyWithoutUserName as never);

      const result = await createMAndALead({
        companyId: 'company-123',
        email: 'user@example.com',
        consent: true,
        score: 75,
      });

      expect(result.success).toBe(true);

      expect(sendMAndALeadEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            name: null,
          }),
        })
      );
    });
  });
});

