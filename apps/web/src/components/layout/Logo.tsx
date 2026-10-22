export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="ritma-logo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ritma-logo)" />
      <path d="M10 9h7a5 5 0 0 1 1.6 9.74L22 23h-3.6l-3-4H13.5v4H10zm3.5 3v4H17a2 2 0 0 0 0-4z" fill="white" />
    </svg>
  );
}
