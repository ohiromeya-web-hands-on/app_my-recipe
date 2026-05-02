"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const themes = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="segmented skeleton-control" aria-hidden="true" />;
  }

  return (
    <div className="theme-panel" aria-label="テーマ切替">
      <div>
        <span className="eyebrow">Theme</span>
        <strong>{theme ?? "system"}</strong>
        <small>resolved: {resolvedTheme ?? "unknown"}</small>
      </div>
      <div className="segmented">
        {themes.map((item) => (
          <button
            key={item}
            type="button"
            className={theme === item ? "active" : ""}
            onClick={() => setTheme(item)}
            aria-pressed={theme === item}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
