import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollapsibleHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  defaultOpen?: boolean;
  rightSlot?: ReactNode;
}

/**
 * Mobile-collapsible header. On desktop (lg+) it renders fully expanded.
 * On mobile it shows the title row with a chevron toggle to hide/show subtitle + children.
 */
export function CollapsibleHeader({
  title,
  subtitle,
  children,
  defaultOpen = true,
  rightSlot,
}: CollapsibleHeaderProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
              {title}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 lg:hidden shrink-0"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "হেডার লুকান" : "হেডার দেখান"}
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {subtitle && (
            <p
              className={`text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 ${
                open ? "block" : "hidden lg:block"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
      {children && (
        <div className={open ? "block" : "hidden lg:block"}>{children}</div>
      )}
    </div>
  );
}
