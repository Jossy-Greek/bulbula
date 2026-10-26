/** The directory's mark: a map pin over river ripples. */
export default function Mark({ className = "h-10 w-10", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="14" fill={dark ? "#ffffff" : "#0e3d47"} />
      <path d="M10 35c3.5-2.4 6.5-2.4 10 0s6.5 2.4 10 0 6.5-2.4 8 0" fill="none" stroke={dark ? "#1f7a85" : "#fbe3a6"} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 40c2.8-1.8 5.2-1.8 8 0s5.2 1.8 8 0 5.2-1.8 6 0" fill="none" stroke={dark ? "#1f7a85" : "#fbe3a6"} strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 7c-5.5 0-9.5 4.1-9.5 9.3 0 6.6 9.5 15.2 9.5 15.2s9.5-8.6 9.5-15.2C33.5 11.1 29.5 7 24 7z" fill="#f2b134" />
      <circle cx="24" cy="16.5" r="3.6" fill={dark ? "#ffffff" : "#0e3d47"} />
    </svg>
  );
}
