import { useMemo, useState } from 'react'
import { ArrowDownRight, Globe } from 'lucide-react'

const MENU_ITEMS = ['Index', 'Projects', 'Contact']

export default function MainPage() {
  const [pointer, setPointer] = useState({ x: 0, y: 0, active: false })
  const [textHovered, setTextHovered] = useState(false)
  const [textPointer, setTextPointer] = useState({ x: 0, y: 0 })

  const transforms = useMemo(() => {
    const move = (depth) =>
      `translate3d(${pointer.x * depth}px, ${pointer.y * depth}px, 0)`

    return {
      bg: move(1.4),
      arches: move(2.8),
      stage: move(3.6),
      orb: move(5.5),
      water: move(1.8),
      text: move(2.2),
    }
  }, [pointer.x, pointer.y])

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    setPointer({ x: x * 12, y: y * 12, active: true })
  }

  const handleLeave = () => {
    setPointer({ x: 0, y: 0, active: false })
  }

  const handleTextMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    setTextPointer({ x, y })
  }

  const handleTextLeave = () => {
    setTextHovered(false)
    setTextPointer({ x: 0, y: 0 })
  }

  return (
    <main
      className="relative isolate h-screen w-full overflow-hidden bg-[#ceb9bc] text-[#17171a]"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        className="absolute inset-0 transition-transform duration-200 ease-out"
        style={{
          transform: transforms.bg,
          background:
            'radial-gradient(1200px 620px at 72% 20%, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.1) 36%, rgba(255,255,255,0) 70%), radial-gradient(900px 540px at 25% 34%, rgba(214,192,205,0.44) 0%, rgba(214,192,205,0.14) 45%, rgba(214,192,205,0) 78%), linear-gradient(140deg, #dac6cc 0%, #d3c0c6 38%, #cbb6bd 74%, #c5b0b8 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.32)_0%,transparent_30%),radial-gradient(circle_at_84%_12%,rgba(208,226,247,0.35)_0%,transparent_26%),radial-gradient(circle_at_52%_54%,rgba(255,255,255,0.12)_0%,transparent_33%)]" />

      <header className="absolute inset-x-0 top-0 z-30 mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-6 md:px-10">
        <h1 className="text-4xl font-semibold tracking-tight">unseenstudio</h1>
        <nav className="flex items-center gap-8 text-[18px] font-medium">
          {MENU_ITEMS.map((item) => (
            <button key={item} className="transition-opacity hover:opacity-70">
              {item}
            </button>
          ))}
        </nav>
      </header>

      <section className="absolute inset-0">
        <div
          className="pointer-events-none absolute left-[3.5%] top-[12%] h-[74%] w-[45%] rounded-t-[190px] border-[30px] border-[#d8c3c9] bg-[linear-gradient(160deg,#d9d4e7_0%,#f0d8e5_52%,#c6acbf_100%)] shadow-[inset_0_18px_48px_rgba(255,255,255,0.2),0_30px_60px_rgba(113,84,101,0.15)] transition-transform duration-200 ease-out"
          style={{ transform: transforms.arches }}
        />
        <div
          className="pointer-events-none absolute left-[15.5%] top-[20.5%] h-[61%] w-[25%] rounded-t-[138px] border-[23px] border-[#d7c3c9] bg-[linear-gradient(180deg,#d8d6e8_0%,#efd8e4_55%,#c7afc3_100%)] shadow-[0_18px_36px_rgba(114,83,101,0.12)] transition-transform duration-200 ease-out"
          style={{ transform: transforms.arches }}
        />
        <div
          className="pointer-events-none absolute right-[10.6%] top-[8.5%] h-[52%] w-[13.6%] border-[20px] border-[#d8c5ca] bg-[linear-gradient(180deg,#c5dcf4_0%,#ecd8e3_68%,#d2c0c9_100%)] shadow-[0_16px_38px_rgba(145,102,120,0.2)] transition-transform duration-200 ease-out"
          style={{ transform: transforms.arches }}
        />

        <div
          className="pointer-events-none absolute bottom-[22.5%] right-[14%] h-[190px] w-[360px] rounded-[44px] bg-[radial-gradient(circle_at_35%_30%,#f7f6f8_0%,#d6cdd3_46%,#b3a8b1_100%)] opacity-95 blur-[0.35px] transition-transform duration-200 ease-out"
          style={{ transform: transforms.stage }}
        />
        <div
          className="pointer-events-none absolute bottom-[15.4%] left-[39.4%] h-[180px] w-[290px] bg-[linear-gradient(176deg,#f0dee4_0%,#d7c4cc_53%,#b9a8b2_100%)] [clip-path:polygon(11%_0%,100%_0%,90%_100%,0%_100%)] shadow-[0_16px_36px_rgba(60,38,51,0.22)] transition-transform duration-200 ease-out"
          style={{ transform: transforms.stage }}
        />
        <div
          className="pointer-events-none absolute bottom-[15.8%] left-[38.7%] h-[12px] w-[305px] rounded-sm bg-[#f0dfe4]/85 transition-transform duration-200 ease-out"
          style={{ transform: transforms.stage }}
        />
        <div
          className="pointer-events-none absolute bottom-[12.8%] left-[37.3%] h-[12px] w-[324px] rounded-sm bg-[#ecdae0]/80 transition-transform duration-200 ease-out"
          style={{ transform: transforms.stage }}
        />
        <div
          className="pointer-events-none absolute bottom-[9.7%] left-[35.8%] h-[12px] w-[344px] rounded-sm bg-[#e6d2d9]/76 transition-transform duration-200 ease-out"
          style={{ transform: transforms.stage }}
        />

        <div
          className="pointer-events-none absolute left-1/2 top-[55%] z-20 h-[170px] w-[170px] rounded-full bg-[radial-gradient(circle_at_34%_30%,#f9fdfc_0%,#ecf0f4_42%,#ccc5d3_74%,#b6b0bd_100%)] shadow-[0_14px_30px_rgba(110,92,111,0.3)] transition-transform duration-200 ease-out"
          style={{ transform: `${transforms.orb} translateX(170px)` }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] transition-transform duration-200 ease-out"
          style={{
            transform: transforms.water,
            background:
              'linear-gradient(180deg, rgba(199,189,203,0) 0%, rgba(169,159,176,0.42) 40%, rgba(131,122,141,0.72) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[25%] opacity-70"
          style={{
            background:
              'repeating-linear-gradient(182deg, rgba(255,255,255,0.24) 0px, rgba(255,255,255,0.24) 1px, rgba(255,255,255,0) 9px, rgba(255,255,255,0) 18px)',
            animation: 'water-shift 9s linear infinite',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[5%] h-[14%] opacity-40"
          style={{ transform: transforms.water }}
        >
          <div
            className="h-full w-full bg-[radial-gradient(65%_100%_at_30%_40%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_70%),radial-gradient(48%_100%_at_70%_70%,rgba(224,242,255,0.23)_0%,rgba(224,242,255,0)_70%)]"
            style={{ animation: 'water-breathe 5.4s ease-in-out infinite' }}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[11%] h-[3px] bg-white/30 blur-[1px]" />
      </section>

      <section
        className="absolute left-1/2 top-1/2 z-30 w-[92%] max-w-[840px] -translate-x-1/2 -translate-y-[38%] text-center transition-transform duration-200 ease-out"
        style={{ transform: `translate(-50%, -38%) ${transforms.text}` }}
      >
        <p className="text-[22px] font-medium tracking-[0.08em] text-[#1c1b20]/85">
          A BRAND, DIGITAL & MOTION STUDIO
        </p>
        <div
          onMouseEnter={() => setTextHovered(true)}
          onMouseMove={handleTextMove}
          onMouseLeave={handleTextLeave}
          style={{
            transform: textHovered
              ? `translate(${textPointer.x * 5}px, ${textPointer.y * 3}px) rotate(${textPointer.x * 1.6}deg)`
              : 'none',
            transition: textHovered ? 'transform 80ms linear' : 'transform 320ms ease-out',
          }}
        >
          <h2
            className="mt-4 font-serif text-[92px] italic leading-[0.92]"
            style={{
              color: textHovered ? 'transparent' : '#1a1a1d',
              backgroundImage: textHovered
                ? 'linear-gradient(110deg, #15161b 0%, #f5f5f7 22%, #15161b 44%, #efdae4 62%, #15161b 80%, #f5f5f7 100%)'
                : 'none',
              backgroundSize: textHovered ? '220% 100%' : '100% 100%',
              backgroundPosition: textHovered
                ? `${50 + textPointer.x * 30}% ${50 + textPointer.y * 20}%`
                : '50% 50%',
              WebkitBackgroundClip: textHovered ? 'text' : 'border-box',
              backgroundClip: textHovered ? 'text' : 'border-box',
              animation: textHovered ? 'text-wave-flow 1.6s linear infinite' : 'none',
              filter: textHovered ? `drop-shadow(${textPointer.x * 2}px ${textPointer.y * 2}px 6px rgba(255,255,255,0.28))` : 'none',
            }}
          >
            Creating the
          </h2>
          <h3
            className="-mt-2 text-[108px] font-semibold leading-[0.9] tracking-tight"
            style={{
              color: textHovered ? 'transparent' : '#15161b',
              backgroundImage: textHovered
                ? 'linear-gradient(110deg, #15161b 0%, #efe3ea 24%, #15161b 46%, #f7f7f8 70%, #15161b 100%)'
                : 'none',
              backgroundSize: textHovered ? '240% 100%' : '100% 100%',
              backgroundPosition: textHovered
                ? `${48 + textPointer.x * 34}% ${50 + textPointer.y * 22}%`
                : '50% 50%',
              WebkitBackgroundClip: textHovered ? 'text' : 'border-box',
              backgroundClip: textHovered ? 'text' : 'border-box',
              animation: textHovered ? 'text-wave-flow 1.8s linear infinite' : 'none',
              textShadow: textHovered ? `${textPointer.x * 5}px ${textPointer.y * 4}px 18px rgba(255,255,255,0.22)` : 'none',
            }}
          >
            unexpected
          </h3>
        </div>
        <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/90 px-7 py-3 text-[22px] font-medium text-[#16171b] shadow-[0_8px_22px_rgba(60,43,56,0.2)] backdrop-blur-sm transition-transform hover:scale-[1.02]">
          View our work
          <ArrowDownRight className="h-5 w-5" />
        </button>
      </section>

      <footer className="absolute inset-x-0 bottom-5 z-40 mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 md:px-10">
        <button className="rounded-full border border-white/60 bg-white/35 p-3 backdrop-blur-sm transition hover:bg-white/50">
          <Globe className="h-5 w-5 text-[#1a1a1d]" />
        </button>
        <button className="rounded-full border border-white/60 bg-white/35 px-6 py-2 text-[20px] font-medium backdrop-blur-sm transition hover:bg-white/50">
          Our 2025 Wrapped
        </button>
        <div className="h-11 w-11 rounded-full border border-white/60 bg-white/35 backdrop-blur-sm" />
      </footer>

      <div
        className={`pointer-events-none absolute inset-0 z-50 transition-opacity duration-300 ${
          pointer.active ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(520px circle at var(--mx) var(--my), rgba(255,255,255,0.14), rgba(255,255,255,0) 60%)',
          '--mx': `${50 + pointer.x * 1.8}%`,
          '--my': `${50 + pointer.y * 1.8}%`,
        }}
      />

      <style>
        {`
          @keyframes text-wave-flow {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 220% 50%;
            }
          }

          @keyframes water-shift {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-42px);
            }
          }

          @keyframes water-breathe {
            0%, 100% {
              transform: translateY(0px) scaleY(1);
              opacity: 0.52;
            }
            50% {
              transform: translateY(-4px) scaleY(1.06);
              opacity: 0.75;
            }
          }
        `}
      </style>
    </main>
  )
}
