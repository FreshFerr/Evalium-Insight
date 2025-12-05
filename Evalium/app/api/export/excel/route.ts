import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { generateExcelReport, getExcelFilename } from '@/lib/export/excel';
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitExceededResponse,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // H-6: Apply rate limiting
  const rateLimitKey = getRateLimitKey(request, session.user.id);
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.export);
  
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID richiesto' }, { status: 400 });
  }

  try {
    // Step 1: Verify user owns the company
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
      include: {
        financialStatements: {
          orderBy: { fiscalYear: 'desc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 });
    }

    // Step 2: Explicitly verify a PAID report exists for this company
    // H-3: Separate report lookup to ensure report belongs to this company
    const paidReport = await prisma.report.findFirst({
      where: {
        companyId: company.id,
        status: 'PAID',
        type: {
          in: ['FULL_ANALYSIS', 'BENCHMARK'], // Excel available for both Pro and Pro Plus
        },
      },
    });

    if (!paidReport) {
      return NextResponse.json(
        { error: 'Non hai ancora sbloccato questo report. Completa il pagamento per scaricare l\'analisi.' },
        { status: 403 }
      );
    }

    // Generate Excel
    const buffer = generateExcelReport({
      company,
      statements: company.financialStatements,
    });

    const filename = getExcelFilename(company.legalName);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { error: 'Errore durante la generazione del file' },
      { status: 500 }
    );
  }
}
