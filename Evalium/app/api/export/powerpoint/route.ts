import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/db';
import { generatePowerPointReport, getPowerPointFilename } from '@/lib/export/powerpoint';
import { generateNarrative } from '@/lib/financial-logic/narrative';
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitExceededResponse,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato. Effettua il login per continuare.' }, { status: 401 });
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
    return NextResponse.json({ error: 'ID azienda non specificato.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Azienda non trovata o non hai i permessi per accedervi.' }, { status: 404 });
    }

    // Step 2: Explicitly verify a PAID BENCHMARK report exists for this company
    // H-3: Separate report lookup to ensure report belongs to this company
    // PowerPoint export requires Pro Plus (BENCHMARK report type)
    const paidReport = await prisma.report.findFirst({
      where: {
        companyId: company.id,
        status: 'PAID',
        type: 'BENCHMARK', // Pro Plus only
      },
    });

    if (!paidReport) {
      return NextResponse.json(
        { error: 'Non hai ancora sbloccato questo report. Il piano Pro Plus è richiesto per l\'export PowerPoint.' },
        { status: 403 }
      );
    }

    // Generate narrative
    const narrative = generateNarrative(company.financialStatements);

    // Generate PowerPoint
    const buffer = await generatePowerPointReport({
      company,
      statements: company.financialStatements,
      narrative,
    });

    const filename = getPowerPointFilename(company.legalName);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logError('PowerPoint export error', error);
    return NextResponse.json(
      { error: 'Qualcosa è andato storto durante la generazione del file. Riprova più tardi.' },
      { status: 500 }
    );
  }
}
