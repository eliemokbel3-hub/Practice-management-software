import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  phase,
  description,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong py-24 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
        <Icon size={22} />
      </span>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 text-sm font-medium text-primary">{phase}</p>
      <p className="mt-3 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
