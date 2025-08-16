'use client';

import { UserButton, useUser } from "@stackframe/stack";
import { useTheme } from "next-themes";
import { Logo } from "./logo";

export default function HandlerHeader() {
  const user = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <header className="fixed w-full z-50 h-16 flex items-center px-6 border-b border-slate-200/60 dark:border-slate-700/60 justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-lg">
        <div className="flex items-center">
          <Logo link={user ? "/dashboard" : "/"}/>
        </div>

        <div className="flex items-center justify-end gap-4">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm">
            <UserButton colorModeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
          </div>
        </div>
      </header>
      <div className="min-h-16"/> {/* Placeholder for fixed header */}
    </>
  );
}