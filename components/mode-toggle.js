"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="inline-flex items-center space-x-2">
      <button
        onClick={() => setTheme("light")}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Light"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme("dark")}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Dark"
      >
        🌙
      </button>
      <button
        onClick={() => setTheme("system")}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="System"
      >
        🖥️
      </button>
    </div>
  );
}
 