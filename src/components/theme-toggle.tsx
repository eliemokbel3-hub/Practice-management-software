"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the saved theme after hydration on the client,
  // so don't highlight a button during server render.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5">
      {options.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={`${label} theme`}
            onClick={() => setTheme(value)}
            className={`rounded-full p-1.5 transition-colors ${
              active
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-faint hover:text-foreground"
            }`}
          >
            <Icon size={15} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
