"use client";

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ size = "md", showText = true }: LogoProps) {
  const dims = size === "sm" ? 28 : size === "lg" ? 44 : 32;
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Shield body */}
        <path
          d="M24 4L6 12V24C6 35.1 13.8 45.24 24 48C34.2 45.24 42 35.1 42 24V12L24 4Z"
          fill="#1f1812"
          stroke="#fbc162"
          strokeWidth="2"
        />
        {/* Inner shield highlight */}
        <path
          d="M24 8L10 14.5V24C10 33.03 16.38 41.34 24 43.76C31.62 41.34 38 33.03 38 24V14.5L24 8Z"
          fill="#241f18"
          stroke="#dda64a"
          strokeWidth="0.75"
          opacity="0.6"
        />
        {/* Recovery arrow — circular arrow going up-right */}
        <path
          d="M18 28C18 24.5 20 21.5 23 20.2V16L30 22L23 28V24.3C21.5 25.2 20.5 26.5 20.5 28C20.5 30.5 22.5 32.5 25 32.5C27 32.5 28.7 31.2 29.3 29.5H31.8C31.1 32.6 28.3 35 25 35C21.1 35 18 31.9 18 28Z"
          fill="#fbc162"
        />
        {/* Rupee sparkle — small accent */}
        <circle cx="33" cy="15" r="2" fill="#fbc162" opacity="0.7" />
        <circle cx="33" cy="15" r="1" fill="#fff" opacity="0.5" />
      </svg>
      {showText && (
        <span className={`font-mono ${textSize} tracking-widest text-[#fbc162] font-extrabold`}>
          RECOVERAI
        </span>
      )}
    </div>
  );
}
