import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
}

export function BenefitCard({ icon: Icon, title, description, highlight }: BenefitCardProps) {
  return (
    <div className={cn(
      "p-4 rounded-xl border-2 transition-all hover:scale-[1.02]",
      highlight 
        ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 shadow-lg shadow-primary/10" 
        : "bg-card border-border hover:border-primary/30 hover:bg-accent/50"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2.5 rounded-lg shrink-0",
          highlight ? "bg-primary/20" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            highlight ? "text-primary" : "text-primary"
          )} />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
