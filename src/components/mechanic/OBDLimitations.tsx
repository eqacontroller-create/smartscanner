import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function OBDLimitations() {
  return (
    <Card className="border-blue-500/30 bg-blue-500/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-600 dark:text-blue-400">
              Limitações do Scanner OBD-II
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Este scanner lê códigos do <strong>motor (códigos P)</strong> via protocolo OBD-II padrão.
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">⚠️ NÃO detecta:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Airbag/SRS (luz do airbag)</li>
                <li>ABS/Sistema de freios</li>
                <li>Transmissão específica do fabricante</li>
                <li>Módulos de carroceria</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Para esses sistemas, é necessário um scanner multimarca profissional.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
