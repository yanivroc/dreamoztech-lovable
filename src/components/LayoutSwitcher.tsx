import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LAYOUTS, useLayout } from "@/lib/layout-theme";

export function LayoutSwitcher() {
  const { layout, setLayout } = useLayout();
  const current = LAYOUTS.find((l) => l.id === layout) ?? LAYOUTS[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-medium hover:bg-accent"
        aria-label={`Layout: ${current.name}`}
      >
        <CurrentIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Layout</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LAYOUTS.map((l) => {
          const Icon = l.icon;
          return (
            <DropdownMenuItem
              key={l.id}
              onSelect={() => setLayout(l.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                <span className="block text-sm">{l.name}</span>
                <span className="block text-[11px] text-muted-foreground">{l.description}</span>
              </span>
              {l.id === layout && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
