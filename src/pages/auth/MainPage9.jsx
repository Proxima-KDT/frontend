import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, UserRound } from 'lucide-react';

const ROLE_ITEMS = [
  {
    key: 'student',
    label: '수강생',
    desc: '학습 진도, 과제, 피드백을 한 번에 확인',
    icon: GraduationCap,
  },
  {
    key: 'teacher',
    label: '강사',
    desc: '학생 관리, 상담, 평가 리포트 운영',
    icon: UserRound,
  },
  {
    key: 'admin',
    label: '관리자',
    desc: '전체 운영 현황과 계정/시스템 관리',
    icon: ShieldCheck,
  },
];

const T = {
  base: '#111827',
  heading: '#374151',
  body: '#6b7280',
};

const fontDisplay = '"Fraunces", "Georgia", "Times New Roman", serif';
const fontUi = '"Outfit", system-ui, sans-serif';

/** 호버 시 파란 톤 대신 따뜻한 하이라이트·빛 번짐 */
function MagneticGlowText({ as: Tag = 'span', children, className = '', intensity = 1 }) {
  const ref = useRef(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, active: false });

  const onMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const mx = ((e.clientX - cx) / Math.max(r.width, 1)) * 14 * intensity;
      const my = ((e.clientY - cy) / Math.max(r.height, 1)) * 10 * intensity;
      setGlow({ x: mx, y: my, active: true });
    },
    [intensity],
  );

  const onLeave = useCallback(() => setGlow({ x: 0, y: 0, active: false }), []);

  const sh = glow.active
    ? [
        `${glow.x * 0.12}px ${glow.y * 0.12}px 18px rgba(255, 255, 255, 0.95)`,
        `0 0 28px rgba(255, 248, 220, 0.9)`,
        `0 0 48px rgba(255, 230, 180, 0.55)`,
        `0 0 2px rgba(255, 255, 255, 0.8)`,
      ].join(', ')
    : undefined;

  return (
    <Tag
      ref={ref}
      className={`inline-block cursor-default transition-[transform,filter] duration-200 ease-out will-change-transform ${className}`}
      style={{
        transform: glow.active ? `translate3d(${glow.x}px, ${glow.y}px, 0) scale(1.02)` : 'translate3d(0,0,0)',
        textShadow: sh,
        filter: glow.active
          ? 'brightness(1.12) saturate(1.05) drop-shadow(0 0 14px rgba(255, 255, 255, 0.65))'
          : undefined,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </Tag>
  );
}

export default function MainPage9() {
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [pointerPct, setPointerPct] = useState({ x: 50, y: 45 });
  const [flies, setFlies] = useState(() => Array.from({ length: 18 }, () => ({ x: 0, y: 0 })));

  const twinkleStars = useMemo(
    () =>
      Array.from({ length: 900 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 0.5 + Math.random() * 1.8,
        dur: 0.9 + Math.random() * 2.8,
        delay: Math.random() * 2.4,
        driftX: (Math.random() - 0.5) * 8,
        driftY: (Math.random() - 0.5) * 8,
      })),
    [],
  );

  const moonTwinkles = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        left: 12 + Math.random() * 76,
        top: 12 + Math.random() * 76,
        size: 1.6 + Math.random() * 4.8,
        dur: 3.8 + Math.random() * 5.6,
        delay: Math.random() * 4.5,
        driftX: (Math.random() - 0.5) * 4.8,
        driftY: (Math.random() - 0.5) * 4.8,
      })),
    [],
  );

  const orbParallax = useMemo(
    () => `translate3d(${pointer.x * 14}px, ${pointer.y * 10}px, 0)`,
    [pointer.x, pointer.y],
  );

  const ambient = useMemo(
    () =>
      `radial-gradient(980px circle at ${pointerPct.x}% ${pointerPct.y}%, rgba(255,174,74,0.25) 0%, rgba(255,138,48,0.14) 32%, rgba(255,138,48,0.04) 56%, rgba(255,138,48,0) 78%)`,
    [pointerPct.x, pointerPct.y],
  );

  const starCursor = useMemo(
    () =>
      `radial-gradient(230px circle at ${pointerPct.x}% ${pointerPct.y}%, rgba(255,214,142,0.92) 0%, rgba(255,170,88,0.34) 30%, rgba(255,170,88,0) 70%)`,
    [pointerPct.x, pointerPct.y],
  );

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      targetRef.current = { x: r.width * 0.55, y: r.height * 0.42 };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = targetRef.current;
      setFlies((prev) =>
        prev.map((f, i) => {
          const k = 0.045 + i * 0.0065;
          return {
            x: f.x + (t.x - f.x) * k,
            y: f.y + (t.y - f.y) * k,
          };
        }),
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    targetRef.current = { x: px, y: py };

    const x = (px / rect.width - 0.5) * 2;
    const y = (py / rect.height - 0.5) * 2;
    setPointer({ x, y });
    setPointerPct({ x: (px / rect.width) * 100, y: (py / rect.height) * 100 });
  };

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen overflow-hidden bg-[#f3f1ea]"
      style={{ color: T.base, fontFamily: fontUi }}
      onMouseMove={handleMove}
    >
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.08; transform: translate(0, 0) scale(0.8); }
          35% { opacity: 1; transform: translate(var(--dx), var(--dy)) scale(1.55); }
          70% { opacity: 0.3; transform: translate(calc(var(--dx) * -0.5), calc(var(--dy) * -0.5)) scale(1.05); }
        }
        @keyframes moon-glow-drift {
          0%, 100% {
            opacity: 0.12;
            transform: translate(0, 0) scale(0.9);
            filter: blur(1.2px);
          }
          40% {
            opacity: 0.46;
            transform: translate(var(--dx), var(--dy)) scale(1.2);
            filter: blur(0.45px);
          }
          75% {
            opacity: 0.2;
            transform: translate(calc(var(--dx) * -0.35), calc(var(--dy) * -0.35)) scale(1.02);
            filter: blur(0.95px);
          }
        }
        @keyframes main9-moon-pulse {
          0%, 100% { opacity: 0.55; filter: blur(0px); }
          50% { opacity: 0.92; filter: blur(0.5px); }
        }
        @keyframes main9-rim-glow {
          0%, 100% { opacity: 0.65; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
        }
        @keyframes main9-sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.65); }
          25% { opacity: 1; transform: scale(1.3); }
          50% { opacity: 0.55; transform: scale(1); }
          75% { opacity: 0.85; transform: scale(1.15); }
        }
        @keyframes main9-water-glint {
          0%, 100% {
            opacity: 0.3;
            transform: translate3d(-1%, -1%, 0) scale(0.96);
            filter: blur(0.2px);
          }
          35% {
            opacity: 0.85;
            transform: translate3d(1.2%, 0.6%, 0) scale(1.02);
            filter: blur(0px);
          }
          70% {
            opacity: 0.45;
            transform: translate3d(-0.8%, 1.1%, 0) scale(0.99);
            filter: blur(0.3px);
          }
        }
        @keyframes main9-caustic-flow {
          0% { transform: translate3d(-2%, -1%, 0) rotate(0deg) scale(1); opacity: 0.3; }
          50% { transform: translate3d(2%, 1.5%, 0) rotate(6deg) scale(1.04); opacity: 0.62; }
          100% { transform: translate3d(-1.2%, 2%, 0) rotate(12deg) scale(1.01); opacity: 0.35; }
        }
        /* 시계방향 자전: 화면 축(Z) 기준 회전 + 고정 경사로 구체 느낌 (Y축 뒤집힘 최소화) */
        @keyframes main9-moon-spin {
          from {
            transform: translate(-50%, -50%) rotateX(11deg) rotateY(-5deg) rotateZ(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotateX(11deg) rotateY(-5deg) rotateZ(360deg);
          }
        }
        @keyframes main9-logo-orb-spin {
          0%, 100% { transform: rotateX(-16deg) rotateY(-8deg) scale(1.015); }
          50% { transform: rotateX(16deg) rotateY(8deg) scale(1.035); }
        }
      `}</style>

      {/* Main2와 동일한 마우스 커서 조명 */}
      <div className="pointer-events-none absolute inset-0 transition-all duration-150" style={{ background: ambient }} />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_22%_28%,rgba(255,220,160,0.22),transparent_34%),radial-gradient(circle_at_78%_66%,rgba(255,190,120,0.16),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 mix-blend-screen transition-all duration-75" style={{ background: starCursor }} />

      <div className="pointer-events-none absolute inset-0 z-[4]">
        {twinkleStars.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-[#ffe8bf]"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animation: `star-twinkle ${star.dur}s ease-in-out ${star.delay}s infinite`,
              ['--dx']: `${star.driftX}px`,
              ['--dy']: `${star.driftY}px`,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {flies.map((f, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: f.x,
              top: f.y,
              width: i % 3 === 0 ? 5 : 3.5,
              height: i % 3 === 0 ? 5 : 3.5,
              marginLeft: -2,
              marginTop: -2,
              background: 'rgba(255, 236, 200, 0.95)',
              boxShadow: `0 0 ${8 + (i % 5)}px rgba(255, 255, 255, 0.95), 0 0 ${12 + i}px rgba(255, 200, 120, 0.5)`,
              opacity: 0.8 + (i % 7) * 0.03,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_60%_35%,rgba(255,255,255,0.72),rgba(255,255,255,0)_70%)]" />

      <header className="relative z-20 mx-auto flex w-full max-w-[1320px] flex-col items-center justify-center px-6 py-5 md:px-10 md:py-6">
        <div className="relative mb-3 [perspective:1100px]">
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-[40px] w-[40px] -translate-x-1/2 -translate-y-1/2 rounded-full md:h-[50px] md:w-[50px]"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.88) 0%, rgba(255,248,231,0.6) 24%, rgba(255,220,170,0.22) 52%, rgba(255,220,170,0) 82%)',
              filter: 'blur(1px)',
            }}
          />
          <img
            src="/edupilot-header-logo.png"
            alt="Korea IT Academy"
            width={120}
            height={120}
            className="relative z-[1] h-[53px] w-auto select-none md:h-[65px]"
            style={{
              transformOrigin: '50% 50%',
              transformStyle: 'preserve-3d',
              animation: 'main9-logo-orb-spin 12s ease-in-out infinite',
              filter:
                'drop-shadow(0 3px 3px rgba(0,0,0,0.22)) drop-shadow(0 10px 22px rgba(0,0,0,0.14))',
            }}
            decoding="async"
          />
        </div>
        <MagneticGlowText as="p" className="text-center text-xs font-semibold tracking-[0.18em] md:text-sm" intensity={0.75}>
          <span style={{ color: T.body, fontFamily: fontUi }}>Innovative experience</span>
        </MagneticGlowText>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-6 px-6 pt-6 md:px-10 xl:grid-cols-[1.05fr_1fr]">
        <div className="pt-4 xl:pt-8">
          <h1
            className="text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[3.25rem] lg:text-[3.6rem]"
            style={{ color: T.heading, fontFamily: fontDisplay }}
          >
            <MagneticGlowText className="block" intensity={0.9}>
              Korea IT Academy
            </MagneticGlowText>
          </h1>
          <h2
            className="mt-2 text-[1.85rem] font-semibold leading-[1.12] tracking-[-0.015em] md:text-[2.35rem] lg:text-[2.65rem]"
            style={{ color: T.heading, fontFamily: fontDisplay }}
          >
            <MagneticGlowText className="block" intensity={0.85}>
              <span className="italic font-normal" style={{ color: T.body }}>
                AI
              </span>{' '}
              Integration Solution
            </MagneticGlowText>
          </h2>

          <p className="mt-8 max-w-[650px] text-[1.15rem] leading-relaxed md:text-[1.35rem]" style={{ color: T.body }}>
            <MagneticGlowText as="span" className="block" intensity={0.55}>
              수강생·강사·관리자 모두를 위한 AI 기반 학습 운영 플랫폼. 학습 관리, 피드백, 취업 연계를 하나의 경험으로 연결합니다.
            </MagneticGlowText>
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 [perspective:1700px]">
            {ROLE_ITEMS.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => navigate(`/login?role=${role.key}`)}
                  className="group relative transform-gpu overflow-hidden rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-white/95 to-neutral-50/90 px-4 py-5 text-left shadow-[0_10px_26px_rgba(12,12,18,0.1),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-12px_24px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] hover:z-10 hover:-translate-y-[10px] hover:scale-[1.02] hover:border-amber-200/75 hover:shadow-[0_22px_48px_rgba(45,32,18,0.12),0_12px_24px_rgba(255,200,130,0.14),0_0_0_1px_rgba(255,252,245,0.9),inset_0_-14px_26px_rgba(255,190,110,0.06)] hover:[transform:rotateX(7deg)_rotateY(-4deg)_translateZ(14px)] active:scale-[0.99] active:duration-150"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-amber-100/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <Icon
                    className="relative mb-2.5 h-6 w-6 transition-all duration-300 group-hover:scale-[1.08] group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] group-hover:brightness-105"
                    style={{ color: T.body }}
                  />
                  <p
                    className="relative text-[1.05rem] font-bold transition-all duration-300 group-hover:translate-x-0.5 group-hover:brightness-105 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.75)]"
                    style={{ color: T.heading }}
                  >
                    {role.label}
                  </p>
                  <p
                    className="relative mt-1.5 text-xs leading-relaxed transition-all duration-300 group-hover:translate-x-0.5 group-hover:brightness-105 group-hover:text-[#4a4338]"
                    style={{ color: T.body }}
                  >
                    {role.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative flex min-h-[380px] items-center justify-end xl:min-h-[520px]">
          <div
            className="relative z-0 aspect-square w-[min(62vw,480px)] max-w-[480px] shrink-0"
            style={{ marginRight: 'clamp(-8px, -1vw, 16px)' }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-full w-full origin-center [transform-style:preserve-3d]"
              style={{
                transform: 'translate(-50%, -50%)',
                animation: 'main9-moon-spin 72s linear infinite',
              }}
            >
              <div
                className="h-full w-full transition-transform duration-200 ease-out [transform-style:preserve-3d]"
                style={{ transform: orbParallax }}
              >
              {/* 테두리 글로우 링 */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[106%] max-w-[508px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, transparent 58%, rgba(255,252,245,0.5) 62%, rgba(255,235,200,0.35) 70%, rgba(255,220,170,0.2) 78%, transparent 85%)',
                  filter: 'blur(6px)',
                  animation: 'main9-rim-glow 3s ease-in-out infinite',
                }}
              />
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[103%] max-w-[494px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  boxShadow: `
                    0 0 32px rgba(255, 255, 255, 0.95),
                    0 0 64px rgba(255, 240, 210, 0.75),
                    0 0 100px rgba(255, 220, 170, 0.45),
                    inset 0 0 24px rgba(255, 255, 255, 0.35)
                  `,
                  animation: 'main9-rim-glow 2.4s ease-in-out infinite reverse',
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(230,240,255,0.55)_0%,rgba(200,220,245,0.22)_45%,transparent_72%)] blur-3xl"
                style={{ animation: 'main9-moon-pulse 4s ease-in-out infinite' }}
              />

              <div
                className="absolute inset-0 overflow-hidden rounded-full"
                style={{
                  background: `
                  radial-gradient(circle at 26% 20%, #ffffff 0%, #fdfcfa 8%, #f5f2ea 22%, #e8e4d8 42%, #cfc8b8 58%, #a39a8c 72%, #7a7368 88%, #5c564e 100%)
                `,
                  boxShadow: `
                  inset 28px 24px 56px rgba(255,255,255,0.95),
                  inset -22px -20px 48px rgba(120, 115, 105, 0.22),
                  0 0 80px rgba(255, 248, 230, 0.35),
                  0 24px 56px rgba(0,0,0,0.08)
                `,
                }}
              >
                {moonTwinkles.map((star) => (
                  <span
                    key={star.id}
                    className="absolute rounded-full mix-blend-screen"
                    style={{
                      left: `${star.left}%`,
                      top: `${star.top}%`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      animation: `moon-glow-drift ${star.dur}s ease-in-out ${star.delay}s infinite`,
                      ['--dx']: `${star.driftX}px`,
                      ['--dy']: `${star.driftY}px`,
                      background:
                        'radial-gradient(circle, rgba(255,252,238,0.62) 0%, rgba(255,246,220,0.38) 42%, rgba(255,238,205,0.12) 72%, transparent 100%)',
                      boxShadow: '0 0 10px rgba(255,252,236,0.35), 0 0 22px rgba(255,232,188,0.24)',
                    }}
                  />
                ))}
              </div>

              <div
                className="pointer-events-none absolute inset-0 rounded-full mix-blend-screen"
                style={{
                  background:
                    'radial-gradient(circle at 28% 22%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 12%, rgba(255,255,255,0.22) 28%, transparent 48%)',
                  animation: 'main9-rim-glow 2.8s ease-in-out infinite',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-full mix-blend-screen"
                style={{
                  background:
                    'conic-gradient(from 160deg at 38% 42%, transparent 0deg, rgba(255,255,255,0.08) 28deg, rgba(255,244,214,0.32) 52deg, transparent 82deg, rgba(255,255,255,0.09) 120deg, transparent 182deg, rgba(255,236,196,0.22) 230deg, transparent 310deg)',
                  animation: 'main9-caustic-flow 14s ease-in-out infinite alternate',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 70% 75%, rgba(255,255,255,0.2) 0%, transparent 35%), radial-gradient(circle at 48% 55%, rgba(255,255,255,0.16) 0%, transparent 25%)',
                  animation: 'main9-water-glint 6.8s ease-in-out infinite',
                }}
              />

              {[
                { t: '22%', l: '38%', d: '0s' },
                { t: '35%', l: '62%', d: '0.25s' },
                { t: '48%', l: '44%', d: '0.5s' },
                { t: '58%', l: '68%', d: '0.75s' },
                { t: '30%', l: '52%', d: '1s' },
                { t: '65%', l: '36%', d: '0.15s' },
              ].map((s, i) => (
                <span
                  key={i}
                  className="pointer-events-none absolute z-[2] rounded-full bg-white"
                  style={{
                    top: s.t,
                    left: s.l,
                    width: 5 + (i % 3),
                    height: 5 + (i % 3),
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 14px #fff, 0 0 32px rgba(255, 236, 200, 1)',
                    animation: `main9-sparkle ${1.1 + i * 0.12}s ease-in-out infinite`,
                    animationDelay: s.d,
                  }}
                />
              ))}

              <div
                className="pointer-events-none absolute inset-0 rounded-full opacity-80"
                style={{
                  background: `
                  radial-gradient(circle at 52% 50%, rgba(0,0,0,0.04) 0%, transparent 10%),
                  radial-gradient(circle at 40% 64%, rgba(0,0,0,0.035) 0%, transparent 9%)
                `,
                }}
              />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
