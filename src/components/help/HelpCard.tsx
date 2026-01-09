import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children?: ReactNode;
}

const variantStyles = {
  default: "bg-muted/50 border-border",
  success: "bg-green-500/10 border-green-500/30",
  warning: "bg-yellow-500/10 border-yellow-500/30",
  danger: "bg-red-500/10 border-red-500/30",
  info: "bg-blue-500/10 border-blue-500/30",
};

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-green-500",
  warning: "text-yellow-500",
  danger: "text-red-500",
  info: "text-blue-500",
};

export function HelpCard({ title, description, icon: Icon, variant = "default", children }: HelpCardProps) {
  return (
    <div className={cn("p-4 rounded-lg border", variantStyles[variant])}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5">
            <Icon className={cn("h-5 w-5", iconStyles[variant])} />
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
