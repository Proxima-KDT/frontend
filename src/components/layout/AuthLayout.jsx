import { Link } from 'react-router-dom'

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f3f1ea] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(980px_circle_at_20%_20%,rgba(255,200,120,0.22),rgba(255,160,90,0.06)_42%,transparent_74%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_520px_at_60%_35%,rgba(255,255,255,0.72),rgba(255,255,255,0)_70%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background:radial-gradient(circle_at_18%_30%,rgba(255,235,190,0.35),transparent_36%),radial-gradient(circle_at_78%_60%,rgba(255,210,160,0.22),transparent_44%)]" />

      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 180 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#fff2d6] opacity-70"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: `${(i % 4) + 1}px`,
              height: `${(i % 4) + 1}px`,
              boxShadow: '0 0 10px rgba(255, 236, 196, 0.75)',
            }}
          />
        ))}
      </div>

      <Link to="/" className="relative z-10 mb-8 flex flex-col items-center gap-2">
        <img
          src="/edupilot-header-logo.png"
          alt="Korea IT Academy"
          width={104}
          height={104}
          className="h-[56px] w-auto"
          decoding="async"
        />
        <span className="text-xs font-semibold tracking-[0.18em] text-[#6b7280]">Innovative experience</span>
      </Link>

      <div className="relative z-10 w-full max-w-[420px]">
        {children}
      </div>
    </div>
  )
}
