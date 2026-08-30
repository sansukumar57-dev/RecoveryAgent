"use client";

import { useEffect } from "react";

export default function ErrorPage({
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
    <div className="min-h-screen bg-[#17130c] flex items-center justify-center">
      <div className="max-w-md text-center space-y-4 font-mono">
        <span className="material-symbols-outlined text-6xl text-rose-400 block">error</span>
        <h1 className="text-2xl font-extrabold text-white">Something went wrong</h1>
        <p className="text-xs text-[#a79f93]">{error.message || "An unexpected error occurred"}</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase hover:bg-[#dda64a] cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
