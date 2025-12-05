import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createReportCheckout, handlePaymentSuccess } from '@/lib/actions/payment';

/**
 * L-4: Unit tests for Payment Action Error Handling
 * Tests that error paths:
 * - Throw or return expected error objects when Stripe fails
 * - Do not create inconsistent DB state when an error occurs
 */

// Mock next-auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock('@/db', () => ({
  default: {
    company: {
      findFirst: vi.fn(),
    },
    report: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    purchase: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      report: {
        create: vi.fn(),
        update: vi.fn(),
      },
      purchase: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
    })),
  },
}));

// Mock Stripe
vi.mock('@/lib/payment/stripe', () => ({
  createCheckoutSession: vi.fn(),
  getProductConfig: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

import { auth } from '@/lib/auth';
import prisma from '@/db';
import { createCheckoutSession, getProductConfig } from '@/lib/payment/stripe';

describe('Payment Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createReportCheckout', () => {
    describe('Authentication Errors', () => {
      it('should return error when user is not authenticated', async () => {
        vi.mocked(auth).mockResolvedValue(null);

        const result = await createReportCheckout('company-123', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Non autorizzato');
      });

      it('should return error when session has no user id', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);

        const result = await createReportCheckout('company-123', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Non autorizzato');
      });

      it('should return error when session has no email', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: '' },
          expires: new Date().toISOString(),
        } as never);

        const result = await createReportCheckout('company-123', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Non autorizzato');
      });
    });

    describe('Authorization Errors', () => {
      it('should return error when company is not found', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);
        vi.mocked(getProductConfig).mockReturnValue({
          type: 'SINGLE_REPORT',
          name: 'Test Product',
          description: 'Test',
          priceId: 'price_123',
          amount: 4900,
          features: [],
        });
        vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

        const result = await createReportCheckout('nonexistent-company', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('non trovata');
      });

      it('should return error when company belongs to different user', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);
        vi.mocked(getProductConfig).mockReturnValue({
          type: 'SINGLE_REPORT',
          name: 'Test Product',
          description: 'Test',
          priceId: 'price_123',
          amount: 4900,
          features: [],
        });
        // findFirst with userId filter returns null (company belongs to different user)
        vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

        const result = await createReportCheckout('company-456', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('non trovata');
      });
    });

    describe('Invalid Plan Errors', () => {
      it('should return error for invalid plan type', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);
        // Company must be found first before plan is checked
        vi.mocked(prisma.company.findFirst).mockResolvedValue({
          id: 'company-123',
          userId: 'user-123',
        } as never);
        vi.mocked(getProductConfig).mockReturnValue(null); // Invalid plan returns null

        const result = await createReportCheckout('company-123', 'invalid_plan');

        expect(result.success).toBe(false);
        expect(result.error).toContain('non è valido');
      });
    });

    describe('Duplicate Purchase Errors', () => {
      it('should return error when user already purchased this report type', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);
        vi.mocked(getProductConfig).mockReturnValue({
          type: 'SINGLE_REPORT',
          name: 'Test Product',
          description: 'Test',
          priceId: 'price_123',
          amount: 4900,
          features: [],
        });
        vi.mocked(prisma.company.findFirst).mockResolvedValue({
          id: 'company-123',
          userId: 'user-123',
        } as never);
        // Existing paid report found
        vi.mocked(prisma.report.findFirst).mockResolvedValue({
          id: 'existing-report',
          status: 'PAID',
        } as never);

        const result = await createReportCheckout('company-123', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('già acquistato');
      });
    });

    describe('Stripe Errors', () => {
      it('should return error when Stripe checkout session creation fails', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);
        vi.mocked(getProductConfig).mockReturnValue({
          type: 'SINGLE_REPORT',
          name: 'Test Product',
          description: 'Test',
          priceId: 'price_123',
          amount: 4900,
          features: [],
        });
        vi.mocked(prisma.company.findFirst).mockResolvedValue({
          id: 'company-123',
          userId: 'user-123',
        } as never);
        vi.mocked(prisma.report.findFirst).mockResolvedValue(null); // No existing report
        vi.mocked(prisma.$transaction).mockResolvedValue({ report: { id: 'new-report' } });
        // Stripe throws error
        vi.mocked(createCheckoutSession).mockRejectedValue(new Error('Stripe API error'));

        const result = await createReportCheckout('company-123', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('pagamento');
      });

      it('should return error when Stripe returns no URL', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);
        vi.mocked(getProductConfig).mockReturnValue({
          type: 'SINGLE_REPORT',
          name: 'Test Product',
          description: 'Test',
          priceId: 'price_123',
          amount: 4900,
          features: [],
        });
        vi.mocked(prisma.company.findFirst).mockResolvedValue({
          id: 'company-123',
          userId: 'user-123',
        } as never);
        vi.mocked(prisma.report.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.$transaction).mockResolvedValue({ report: { id: 'new-report' } });
        // Stripe returns session without URL
        vi.mocked(createCheckoutSession).mockResolvedValue({ url: null } as never);

        const result = await createReportCheckout('company-123', 'pro');

        expect(result.success).toBe(false);
        expect(result.error).toContain('pagamento');
      });
    });

    describe('Success Path', () => {
      it('should return success with checkout URL when everything works', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123', email: 'test@test.com' },
          expires: new Date().toISOString(),
        } as never);
        vi.mocked(getProductConfig).mockReturnValue({
          type: 'SINGLE_REPORT',
          name: 'Test Product',
          description: 'Test',
          priceId: 'price_123',
          amount: 4900,
          features: [],
        });
        vi.mocked(prisma.company.findFirst).mockResolvedValue({
          id: 'company-123',
          userId: 'user-123',
        } as never);
        vi.mocked(prisma.report.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.$transaction).mockResolvedValue({ report: { id: 'new-report' } });
        vi.mocked(createCheckoutSession).mockResolvedValue({
          url: 'https://checkout.stripe.com/test',
        } as never);

        const result = await createReportCheckout('company-123', 'pro');

        expect(result.success).toBe(true);
        expect(result.checkoutUrl).toBe('https://checkout.stripe.com/test');
      });
    });
  });

  describe('handlePaymentSuccess', () => {
    describe('Database Errors', () => {
      it('should return error when database update fails', async () => {
        vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

        const result = await handlePaymentSuccess('session_123', 'report_123');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Qualcosa è andato storto');
      });
    });

    describe('Success Path', () => {
      it('should return success when payment is processed', async () => {
        vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

        const result = await handlePaymentSuccess('session_123', 'report_123');

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Message Safety', () => {
    it('should not expose internal error details to client', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@test.com' },
        expires: new Date().toISOString(),
      } as never);
      vi.mocked(getProductConfig).mockReturnValue({
        type: 'SINGLE_REPORT',
        name: 'Test',
        description: 'Test',
        priceId: 'price_123',
        amount: 4900,
        features: [],
      });
      vi.mocked(prisma.company.findFirst).mockRejectedValue(
        new Error('Connection refused to postgres://secret:password@db.internal:5432')
      );

      const result = await createReportCheckout('company-123', 'pro');

      expect(result.success).toBe(false);
      // Should not contain internal error details
      expect(result.error).not.toContain('postgres');
      expect(result.error).not.toContain('password');
      expect(result.error).not.toContain('Connection refused');
      // Should contain user-friendly message
      expect(result.error).toContain('pagamento');
    });
  });
});

describe('Transaction Integrity', () => {
  it('should use prisma.$transaction for atomic operations', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@test.com' },
      expires: new Date().toISOString(),
    } as never);
    vi.mocked(getProductConfig).mockReturnValue({
      type: 'SINGLE_REPORT',
      name: 'Test',
      description: 'Test',
      priceId: 'price_123',
      amount: 4900,
      features: [],
    });
    vi.mocked(prisma.company.findFirst).mockResolvedValue({
      id: 'company-123',
      userId: 'user-123',
    } as never);
    vi.mocked(prisma.report.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockResolvedValue({ report: { id: 'new-report' } });
    vi.mocked(createCheckoutSession).mockResolvedValue({
      url: 'https://checkout.stripe.com/test',
    } as never);

    await createReportCheckout('company-123', 'pro');

    // Verify $transaction was called (for atomic report + purchase creation)
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

