import { Check, ChevronDown, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES, useTheme } from "@/lib/theme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-medium hover:bg-accent"
        aria-label={`Theme: ${current.name}`}
      >
        <Palette className="h-3.5 w-3.5" />
        <span
          className="inline-block h-3 w-3 rounded-full border border-border"
          style={{ background: current.swatch }}
        />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => setTheme(t.id)}
            className="flex items-center gap-2"
          >
            <span
              className="inline-block h-4 w-4 rounded-full border border-border shrink-0"
              style={{ background: t.swatch }}
            />
            <span className="flex-1">
              <span className="block text-sm">{t.name}</span>
              <span className="block text-[11px] text-muted-foreground">{t.description}</span>
            </span>
            {t.id === theme && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
