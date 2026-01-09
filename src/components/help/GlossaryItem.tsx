interface GlossaryItemProps {
  term: string;
  definition: string;
  analogy?: string;
}

export function GlossaryItem({ term, definition, analogy }: GlossaryItemProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-bold text-primary">{term}</span>
      </div>
      <p className="text-sm text-foreground mt-1">{definition}</p>
      {analogy && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          💡 Analogia: {analogy}
        </p>
      )}
    </div>
  );
}
