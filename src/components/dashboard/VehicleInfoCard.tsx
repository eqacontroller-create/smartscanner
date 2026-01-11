import { useState } from 'react';
import { 
  Car, 
  Wrench, 
  AlertTriangle, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  Settings,
  Gauge,
  Thermometer,
  Battery,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import type { VehicleProfile, VehicleBrand } from '@/lib/vehicleProfiles';
import type { VehicleBenefits } from '@/types/vehicleTypes';

interface VehicleInfoCardProps {
  brand: VehicleBrand;
  profile: VehicleProfile;
  modelYear?: string | null;
  country?: string | null;
  benefits: VehicleBenefits & {
    applyRecommendedSettings: () => void;
    hasSettingsDifference: boolean;
  };
}

export function VehicleInfoCard({
  brand,
  profile,
  modelYear,
  country,
  benefits,
}: VehicleInfoCardProps) {
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isIssuesOpen, setIsIssuesOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [settingsApplied, setSettingsApplied] = useState(false);

  const handleApplySettings = () => {
    benefits.applyRecommendedSettings();
    setSettingsApplied(true);
    setTimeout(() => setSettingsApplied(false), 3000);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    combustivel: <Gauge className="h-3.5 w-3.5" />,
    manutencao: <Wrench className="h-3.5 w-3.5" />,
    desempenho: <Car className="h-3.5 w-3.5" />,
    seguranca: <AlertTriangle className="h-3.5 w-3.5" />,
    economia: <Battery className="h-3.5 w-3.5" />,
  };

  const priorityColors = {
    alta: 'bg-destructive/10 text-destructive border-destructive/30',
    media: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    baixa: 'bg-muted text-muted-foreground border-border',
  };

  const severityColors = {
    critical: 'border-destructive/50 bg-destructive/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    info: 'border-blue-500/50 bg-blue-500/5',
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base sm:text-lg">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `hsl(${profile.colors.primary} / 0.15)` }}
            >
              <Car 
                className="h-4 w-4 sm:h-5 sm:w-5" 
                style={{ color: `hsl(${profile.colors.primary})` }}
              />
            </div>
            <div>
              <span className="font-bold">{profile.displayName}</span>
              {modelYear && (
                <span className="text-muted-foreground font-normal ml-1.5">
                  {modelYear}
                </span>
              )}
            </div>
          </div>
          {country && (
            <Badge variant="outline" className="text-xs">
              {country}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground italic mt-1">
          "{profile.slogan}"
        </p>
      </CardHeader>

      <CardContent className="space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Botão para aplicar configurações recomendadas */}
        {benefits.hasSettingsDifference && !settingsApplied && (
          <Button 
            onClick={handleApplySettings}
            className="w-full gap-2"
            variant="outline"
          >
            <Settings className="h-4 w-4" />
            Aplicar configurações recomendadas para {profile.displayName}
          </Button>
        )}
        
        {settingsApplied && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Configurações aplicadas com sucesso!
          </div>
        )}

        {/* Especificações Técnicas */}
        <Collapsible open={isSpecsOpen} onOpenChange={setIsSpecsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between px-2 h-auto py-2"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gauge className="h-4 w-4 text-primary" />
                Especificações Técnicas
              </div>
              {isSpecsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Gauge className="h-3 w-3" />
                  Redline Típico
                </div>
                <span className="font-semibold">
                  {benefits.techSpecs.typicalRedlineRPM.toLocaleString()} RPM
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Thermometer className="h-3 w-3" />
                  Temp. Normal
                </div>
                <span className="font-semibold">
                  {benefits.techSpecs.normalTempRange[0]}-{benefits.techSpecs.normalTempRange[1]}°C
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Battery className="h-3 w-3" />
                  Voltagem Normal
                </div>
                <span className="font-semibold">
                  {benefits.techSpecs.normalVoltageRange[0]}-{benefits.techSpecs.normalVoltageRange[1]}V
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Gauge className="h-3 w-3" />
                  Toler. Fuel Trim
                </div>
                <span className="font-semibold">
                  ±{benefits.techSpecs.fuelTrimTolerance}%
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Dicas da Marca */}
        {benefits.currentTips.length > 0 && (
          <Collapsible open={isTipsOpen} onOpenChange={setIsTipsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between px-2 h-auto py-2"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Dicas para {profile.displayName}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {benefits.currentTips.length}
                  </Badge>
                </div>
                {isTipsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {benefits.currentTips.map((tip) => (
                <div 
                  key={tip.id}
                  className={`p-2.5 rounded-lg border ${priorityColors[tip.priority]}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {categoryIcons[tip.category]}
                    <span className="font-medium text-xs">{tip.title}</span>
                  </div>
                  <p className="text-xs opacity-80">{tip.description}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Problemas Conhecidos */}
        {benefits.knownIssues.length > 0 && (
          <Collapsible open={isIssuesOpen} onOpenChange={setIsIssuesOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between px-2 h-auto py-2"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Pontos de Atenção
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {benefits.knownIssues.length}
                  </Badge>
                </div>
                {isIssuesOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {benefits.knownIssues.map((issue) => (
                <div 
                  key={issue.id}
                  className={`p-2.5 rounded-lg border ${severityColors[issue.severity]}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">{issue.title}</span>
                    {issue.affectedYears && (
                      <Badge variant="outline" className="text-[10px]">
                        {issue.affectedYears}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs opacity-80 mb-1.5">{issue.description}</p>
                  {issue.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {issue.symptoms.map((symptom, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-[10px] font-normal"
                        >
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
