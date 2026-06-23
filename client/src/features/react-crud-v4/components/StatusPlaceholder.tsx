// ============================================================================
// Reusable placeholder for empty, loading, and error states.
// Includes aria-live for screen reader announcements (WCAG).
// ============================================================================

import { cn } from "@/lib/utils";

type StatusPlaceholderProps = {
  children: React.ReactNode;
  variant?: "muted" | "error";
};

export const StatusPlaceholder = ({ children, variant = "muted" }: StatusPlaceholderProps) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      "mt-4 flex h-24 items-center justify-center rounded p-4",
      variant === "error" ? "text-destructive bg-muted" : "text-muted-foreground bg-muted",
    )}
  >
    {children}
  </div>
);
