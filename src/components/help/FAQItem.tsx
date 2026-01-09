import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
  id: string;
}

export function FAQItem({ question, answer, id }: FAQItemProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={id} className="border-b-0">
        <AccordionTrigger className="py-3 hover:no-underline hover:bg-muted/30 px-3 rounded-lg">
          <div className="flex items-center gap-2 text-left">
            <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium">{question}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          <p className="text-sm text-muted-foreground pl-6">{answer}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
