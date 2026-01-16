import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LucideIcon } from "lucide-react";

interface HelpSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function HelpSection({ id, title, icon: Icon, children, defaultOpen }: HelpSectionProps) {
  return (
    <div data-section-id={id}>
      <Accordion type="single" collapsible defaultValue={defaultOpen ? id : undefined}>
        <AccordionItem value={id} className="border border-border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{title}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2 space-y-4">
              {children}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
