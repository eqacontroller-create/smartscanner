import { cn } from '@/lib/utils';
import { getBrandAsset } from '@/lib/brandAssets';
import { VehicleModelData, VehicleModelsService } from '@/services/supabase/VehicleModelsService';
import { ChevronRight, AlertTriangle, Star, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
  model: VehicleModelData;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
  animationDelay?: number;
}

export function VehicleCard({ 
  model, 
  isSelected, 
  onClick, 
  className,
  animationDelay = 0 
}: VehicleCardProps) {
  const asset = getBrandAsset(model.brand);
  const engines = VehicleModelsService.parseEngineOptions(model.engine_options || []);
  const years = VehicleModelsService.parseYearsRange(model.years_available);
  const yearRange = years.length > 0 
    ? `${Math.min(...years)}-${Math.max(...years)}` 
    : model.years_available;
  
  const issues = Array.isArray(model.common_issues) ? model.common_issues : [];
  const hasIssues = issues.length > 0;
  const criticalIssues = issues.filter((i: any) => i.severity === 'error' || i.severity === 'critical').length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left p-4 rounded-xl border transition-all duration-300",
        "bg-card hover:bg-accent/30",
        "animate-fade-in",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
          : "border-border/50 hover:border-primary/30 hover:shadow-lg",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Brand logo */}
        <div 
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
            "text-sm font-bold transition-transform duration-300",
            "group-hover:scale-110"
          )}
          style={{
            backgroundColor: `hsl(${asset.color})`,
            color: `hsl(${asset.accent})`
          }}
        >
          {asset.initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Brand and premium badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-medium">
              {asset.displayName}
            </span>
            {asset.premium && (
              <Badge variant="outline" className="h-4 px-1 text-[10px] border-yellow-500/50 text-yellow-600">
                <Star className="w-2.5 h-2.5 mr-0.5 fill-yellow-500 text-yellow-500" />
                Premium
              </Badge>
            )}
          </div>

          {/* Model name */}
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {model.model_name}
          </h3>

          {/* Year range */}
          <p className="text-sm text-muted-foreground">
            {yearRange}
          </p>

          {/* Engines */}
          <div className="flex flex-wrap gap-1 mt-2">
            {engines.slice(0, 3).map((engine, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-[10px] h-5 px-1.5 font-normal"
              >
                {engine}
              </Badge>
            ))}
            {engines.length > 3 && (
              <Badge 
                variant="secondary" 
                className="text-[10px] h-5 px-1.5 font-normal"
              >
                +{engines.length - 3}
              </Badge>
            )}
          </div>

          {/* Issues indicator */}
          {hasIssues && (
            <div className="flex items-center gap-1.5 mt-2">
              {criticalIssues > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              ) : (
                <Wrench className="w-3.5 h-3.5 text-yellow-500" />
              )}
              <span className={cn(
                "text-[11px]",
                criticalIssues > 0 ? "text-destructive" : "text-yellow-600"
              )}>
                {issues.length} {issues.length === 1 ? 'problema conhecido' : 'problemas conhecidos'}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className={cn(
          "flex-shrink-0 w-5 h-5 text-muted-foreground transition-all duration-300",
          "group-hover:translate-x-1 group-hover:text-primary"
        )} />
      </div>
    </button>
  );
}
