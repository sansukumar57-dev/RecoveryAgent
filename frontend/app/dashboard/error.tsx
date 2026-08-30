"use client";

import { useEffect } from "react";

export default function DashboardErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto p-8 text-center space-y-4 font-mono">
      <span className="material-symbols-outlined text-5xl text-rose-400 block">error</span>
      <h2 className="text-xl font-extrabold text-white">Dashboard Error</h2>
      <p className="text-xs text-[#a79f93]">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase hover:bg-[#dda64a] cursor-pointer"
      >
        Reload Dashboard
      </button>
    </div>
  );
}
