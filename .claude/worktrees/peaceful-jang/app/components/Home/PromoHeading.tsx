// components/home/ModernWaveHeading.tsx
import React from "react";

type ModernWaveHeadingProps = {
  /**
   * Optional: allow reuse without changing other files.
   * Default preserved to avoid UX regressions.
   */
  text?: string;
  className?: string;
};

export default function ModernWaveHeading({
  text = "On the Menu",
  className = "",
}: ModernWaveHeadingProps) {
  return (
    <h2
      className={`text-lg sm:text-5xl font-serif font-bold text-black inline-block text-shadow-modern leading-tight ${className}`}
      aria-label={text}
    >
      {/* Better a11y: screen readers read the full string once */}
      <span className="sr-only">{text}</span>

      {Array.from(text).map((char, idx) => (
        <span
          key={`${char}-${idx}`}
          aria-hidden="true"
          className="inline-block opacity-0 animate-wave-letters motion-reduce:opacity-100 motion-reduce:animate-none"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h2>
  );
}
