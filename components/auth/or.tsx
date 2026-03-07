interface OrProps {
  texto?: string;
}

export function Or({ texto= "ou" }: OrProps) {
  return (
    <p className="flex items-center gap-x-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border select-none">
      { texto }
    </p>
  );
}