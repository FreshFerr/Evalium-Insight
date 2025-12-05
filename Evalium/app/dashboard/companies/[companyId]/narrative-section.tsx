import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { FinancialNarrative } from '@/lib/financial-logic/narrative';
import { cn } from '@/lib/utils';

interface NarrativeSectionProps {
  narrative: FinancialNarrative;
}

export function NarrativeSection({ narrative }: NarrativeSectionProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-evalium-50 border-evalium-100">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-evalium-100 flex items-center justify-center">
                <Info className="h-5 w-5 text-evalium-700" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-evalium-900 mb-1">
                Cosa significa per te
              </h3>
              <p className="text-evalium-800">{narrative.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narrative Sections */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {narrative.sections.map((section, index) => (
          <Card
            key={index}
            className={cn(
              'transition-colors',
              section.status === 'positive' && 'border-trust-200',
              section.status === 'negative' && 'border-red-200',
              section.status === 'neutral' && 'border-amber-200'
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>{section.icon}</span>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-trust-700">
              <CheckCircle2 className="h-5 w-5" />
              Punti di forza
            </CardTitle>
          </CardHeader>
          <CardContent>
            {narrative.strengths.length > 0 ? (
              <ul className="space-y-2">
                {narrative.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="success" className="mt-0.5">✓</Badge>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aggiungeremo i punti di forza quando avremo più dati.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Punti di attenzione
            </CardTitle>
          </CardHeader>
          <CardContent>
            {narrative.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {narrative.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="warning" className="mt-0.5">!</Badge>
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Non abbiamo identificato criticità evidenti. Ottimo!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

