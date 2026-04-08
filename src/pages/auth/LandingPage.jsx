import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { GraduationCap, BookOpen, Settings } from 'lucide-react'
import LandingLayout from '@/components/layout/LandingLayout'

// ── 역할 데이터 ──────────────────────────────────────────────
const roles = [
  {
    key: 'student',
    title: '학생',
    subtitle: 'Student',
    icon: GraduationCap,
    // 시안-민트 계열
    colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'],
    glowColor: 'rgba(6, 182, 212, 0.35)',
    bgGradient: 'from-cyan-400 to-sky-500',
  },
  {
    key: 'admin',
    title: '관리자',
    subtitle: 'Admin',
    icon: Settings,
    // 퍼플-바이올렛 계열
    colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'],
    glowColor: 'rgba(124, 58, 237, 0.35)',
    bgGradient: 'from-violet-500 to-purple-600',
  },
  {
    key: 'teacher',
    title: '강사',
    subtitle: 'Instructor',
    icon: BookOpen,
    // 핑크-로즈 계열
    colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8'],
    glowColor: 'rgba(236, 72, 153, 0.35)',
    bgGradient: 'from-pink-400 to-rose-500',
  },
]

// ── 구체 내부 파도 애니메이션 (Canvas) ───────────────────────
function useSphereCanvas(canvasRef, colors, isHovered) {
  const animRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 280
    canvas.width  = size * 2  // retina 2x 해상도
    canvas.height = size * 2
    // style.width/height를 고정값으로 설정하지 않음 →
    // w-full h-full 클래스가 부모(sphereSize)에 맞게 자동 조절
    // 이렇게 해야 캔버스 전체가 부모 크기에 맞게 스케일되어
    // circle 중심(140,140)이 항상 표시 영역 안에 위치함
    ctx.scale(2, 2)

    const draw = () => {
      timeRef.current += isHovered ? 0.025 : 0.012
      const t = timeRef.current
      ctx.clearRect(0, 0, size, size)

      // 원형 클리핑
      ctx.save()
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
      ctx.clip()

      // ── Step 1: 가장 진한 주색(colors[0])으로 구체 전체를 완전 불투명하게 채움
      //    colors[2]/[3]은 파스텔(거의 흰색)이므로 절대 베이스로 쓰지 않음
      ctx.fillStyle = colors[0]
      ctx.fillRect(0, 0, size, size)

      // ── Step 2: 중심에서 바깥으로 colors[0]→colors[1] 깊이감 그라디언트
      //    외부 원 반경을 size*0.7로 크게 잡아 구체 전체를 빠짐없이 커버
      const bgGrad = ctx.createRadialGradient(
        size * 0.5, size * 0.5, 0,
        size * 0.5, size * 0.5, size * 0.7
      )
      bgGrad.addColorStop(0,   colors[1])   // 중심: 약간 밝은 색 (100% 불투명)
      bgGrad.addColorStop(0.5, colors[0])   // 중간: 주색
      bgGrad.addColorStop(1,   colors[0])   // 가장자리: 주색 유지
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, size, size)

      // 파도 레이어들 — 알파 최대치로 색상 진하게
      for (let layer = 0; layer < 4; layer++) {
        const offset = layer * 0.7
        const amplitude = 18 + layer * 6
        const freq = 0.02 + layer * 0.005
        const speed = t * (1.2 + layer * 0.3) + offset
        const yBase = size * (0.35 + layer * 0.12)

        ctx.beginPath()
        ctx.moveTo(0, size)
        for (let x = 0; x <= size; x += 2) {
          const y = yBase
            + Math.sin(x * freq + speed) * amplitude
            + Math.sin(x * freq * 1.8 + speed * 0.7) * (amplitude * 0.5)
            + Math.cos(x * freq * 0.5 + speed * 1.3) * (amplitude * 0.3)
          ctx.lineTo(x, y)
        }
        ctx.lineTo(size, size)
        ctx.closePath()

        const waveGrad = ctx.createLinearGradient(0, yBase - amplitude, 0, size)
        // 파도는 colors[0]~[2] 범위만 사용 — [3]은 너무 연해서 제외
        const ci = layer % 3
        waveGrad.addColorStop(0,   colors[ci]           )   // 진한 색 상단
        waveGrad.addColorStop(0.5, colors[(ci + 1) % 3] )   // 중간
        waveGrad.addColorStop(1,   colors[(ci + 2) % 3] )   // 진한 색 하단
        ctx.fillStyle = waveGrad
        ctx.fill()
      }

      // 유리 하이라이트 제거 — 상단부 투명/밝아짐 원인이므로 완전 삭제

      // 구체 테두리 그라디언트
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
      const edgeGrad = ctx.createRadialGradient(
        size / 2, size / 2, size / 2 - 20,
        size / 2, size / 2, size / 2
      )
      edgeGrad.addColorStop(0, 'rgba(255,255,255,0)')
      edgeGrad.addColorStop(0.7, 'rgba(255,255,255,0.05)')
      edgeGrad.addColorStop(1, 'rgba(255,255,255,0.25)')
      ctx.fillStyle = edgeGrad
      ctx.fill()

      ctx.restore()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [colors, isHovered])
}

// ── 개별 구체 컴포넌트 ─────────────────────────────────────
function Sphere({ role, scale, opacity, zIndex, posX, posY, onClick }) {
  const canvasRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  useSphereCanvas(canvasRef, role.colors, isHovered)

  const sphereSize = 140 * scale
  const hoverScale = isHovered ? 1.08 : 1
  const blurPx = scale < 0.75 ? (0.75 - scale) * 4 : 0

  return (
    // 최상위: 위치·크기만. opacity·filter 없음 → 자식 레이어가 독립적으로 제어됨
    <div
      className="absolute cursor-pointer select-none"
      style={{
        left: `calc(50% + ${posX}px)`,
        top: `calc(50% + ${posY}px)`,
        width: sphereSize,
        height: sphereSize,
        transform: `translate(-50%, -50%) scale(${hoverScale})`,
        zIndex,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label={`${role.title}(으)로 로그인`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      {/* ── 레이어 1: 구체 캔버스 + 글로우 (opacity·blur 적용) ── */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          opacity: 1,
          filter: 'none',
          boxShadow: `
            inset 0 -12px 28px rgba(0,0,0,0.20),
            0 10px 60px ${role.glowColor},
            0 0 ${isHovered ? 100 : 60}px ${role.glowColor}
          `,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ borderRadius: '50%' }}
        />
      </div>

      {/* ── 레이어 2: 아이콘 + 텍스트 (항상 opacity 1, blur 없음) ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10"
        style={{ gap: Math.max(sphereSize * 0.07, 5) }}
      >
        {/* 아이콘 박스 */}
        <div
          className="rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            width: sphereSize * 0.34,
            height: sphereSize * 0.34,
            backgroundColor: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.45)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <role.icon
            style={{ width: sphereSize * 0.18, height: sphereSize * 0.18 }}
            className="text-white"
          />
        </div>

        {/* 역할 텍스트 — 항상 선명 (최소 13px 보장) */}
        <span
          style={{
            fontSize: Math.max(Math.round(sphereSize * 0.14), 13),
            fontWeight: 800,
            color: '#ffffff',
            textShadow: '0 1px 8px rgba(0,0,0,0.55), 0 0 16px rgba(0,0,0,0.3)',
            letterSpacing: '0.04em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {role.title}
        </span>
      </div>
    </div>
  )
}

// ── 토성형 고리 공유 상수 ──────────────────────────────────────
// 경사각: ry = rx * RING_TILT (토성 이미지 기준 약 22도 경사)
const RING_TILT = 0.38

// 고리 밴드 정의: C링(내부) → B링(최고 밝기) → 카시니 간극 → A링(외부)
// light navy 계열 색상 / 두께 30% 수준으로 축소
const RING_BANDS = [
  { rxi: 134, rxo: 140, r: 94,  g: 130, b: 184, a: 0.30 },  // 가장 작은 링
  { rxi: 261, rxo: 267, r: 114, g: 147, b: 192, a: 0.38 },  // 가장 큰 링
]

// 고리 밴드별 독립 밝기 진동 파라미터 (freq: Hz, phase: rad)
const BAND_PULSE = [
  { freq: 0.38, phase: 0.00 },
  { freq: 0.52, phase: 2.20 },
]

// 구체별 색상 (각 구체 위치에서 링에 반사광 표시용)
const SPHERE_COLORS = [
  [6,   182, 212],  // 학생 (cyan)
  [124, 58,  237],  // 관리자 (purple)
  [236, 72,  153],  // 강사 (pink)
]

// 고리 반원 채워 그리기 (앞/뒤 컴포넌트 공용)
// alphaScale: 뒷면 0.45, 앞면 1.0 → 3D 원근감
// orbitAngle: 현재 궤도 각도 → 구체 위치에 맞게 링 반사광 표시
function drawRingHalf(ctx, cx, cy, startA, endA, alphaScale, orbitAngle) {
  const N = 180

  const t = Date.now() / 1000  // 초 단위 시간 (밝기 진동 드라이버)

  // ── 구체 높이에 연동된 동적 3D 기울기 ──────────────────────
  // 구체 사인 진동(sinFreq=2)과 동일 주파수로 링의 ry(수직반경) 변조
  // → 구체가 올라갈 때 링이 더 열리고(tilt↑), 내려갈 때 닫힘(tilt↓)
  const heightDriver = Math.sin(orbitAngle * 2)          // -1 ~ 1
  const dynamicTilt  = RING_TILT + heightDriver * 0.07  // 0.31 ~ 0.45

  for (let bi = 0; bi < RING_BANDS.length; bi++) {
    const band  = RING_BANDS[bi]
    const pulse = BAND_PULSE[bi]
    // 각 밴드가 독립적으로 0.65~1.0 사이를 사인파로 진동
    const pulseFactor = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(t * pulse.freq * Math.PI * 2 + pulse.phase))
    const innerRy = band.rxi * dynamicTilt
    const outerRy = band.rxo * dynamicTilt
    const alpha   = band.a * alphaScale * pulseFactor

    // 원형 conic 그라데이션: 시안→인디고→퍼플→마젠타→핑크→시안 순환
    const conicGrad = ctx.createConicGradient(0, cx, cy)
    conicGrad.addColorStop(0,    `rgba(6,   182, 212, ${alpha})`)  // 시안 (오른쪽)
    conicGrad.addColorStop(0.22, `rgba(99,  102, 241, ${alpha})`)  // 인디고
    conicGrad.addColorStop(0.45, `rgba(124, 58,  237, ${alpha})`)  // 퍼플 (왼쪽)
    conicGrad.addColorStop(0.68, `rgba(192, 38,  211, ${alpha})`)  // 마젠타
    conicGrad.addColorStop(0.82, `rgba(236, 72,  153, ${alpha})`)  // 핑크
    conicGrad.addColorStop(0.93, `rgba(56,  182, 230, ${alpha})`)  // 스카이
    conicGrad.addColorStop(1.0,  `rgba(6,   182, 212, ${alpha})`)  // 시안 (닫힘)

    ctx.save()
    ctx.shadowBlur  = 14 * pulseFactor
    ctx.shadowColor = `rgba(120, 80, 220, ${0.45 * pulseFactor})`

    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const a = startA + (endA - startA) * (i / N)
      const x = cx + Math.cos(a) * band.rxo
      const y = cy + Math.sin(a) * outerRy
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    for (let i = N; i >= 0; i--) {
      const a = startA + (endA - startA) * (i / N)
      ctx.lineTo(cx + Math.cos(a) * band.rxi, cy + Math.sin(a) * innerRy)
    }
    ctx.closePath()
    ctx.fillStyle = conicGrad
    ctx.fill()
    ctx.restore()
  }

  // ── 구체 반사광: 각 구체가 지나는 링 위치에 색상 발광 ─────
  const spotRx = 199  // B ring 중심 반경
  for (let i = 0; i < 3; i++) {
    // 구체 각도를 [0, 2π) 범위로 정규화
    const sphA = ((orbitAngle + i * Math.PI * 2 / 3) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    // 현재 반원(앞/뒤) 범위 밖이면 skip
    if (sphA < startA || sphA > endA) continue

    const [r, g, b] = SPHERE_COLORS[i]
    const x = cx + Math.cos(sphA) * spotRx
    const y = cy + Math.sin(sphA) * spotRx * dynamicTilt

    ctx.save()
    const spotGrad = ctx.createRadialGradient(x, y, 0, x, y, 44)
    spotGrad.addColorStop(0,    `rgba(${r},${g},${b},${0.58 * alphaScale})`)
    spotGrad.addColorStop(0.45, `rgba(${r},${g},${b},${0.24 * alphaScale})`)
    spotGrad.addColorStop(1,    `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = spotGrad
    ctx.beginPath()
    ctx.arc(x, y, 44, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ── 뒷면 고리 (π→2π) — memo + 자체 rAF 루프로 angle 변화 반영 ──
const OrbitalRingBack = memo(function OrbitalRingBack({ angleRef }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 660, H = 440
    canvas.width = W * 2; canvas.height = H * 2
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`
    ctx.scale(2, 2)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      drawRingHalf(ctx, W / 2, H / 2, Math.PI, Math.PI * 2, 0.45, angleRef.current)
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [angleRef])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />
})

// ── 앞면 고리 (0→π) — memo + 자체 rAF 루프로 angle 변화 반영 ────
const OrbitalRingFront = memo(function OrbitalRingFront({ angleRef }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 660, H = 440
    canvas.width = W * 2; canvas.height = H * 2
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`
    ctx.scale(2, 2)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      drawRingHalf(ctx, W / 2, H / 2, 0, Math.PI, 1.0, angleRef.current)
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [angleRef])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 55 }} />
})

// ── 배경 이미지 슬라이드쇼 (도형 전환 애니메이션) ────────────
const BG_IMAGES = [
  '/images/bg1.png',
]

const SLIDE_INTERVAL  = 5000   // 이미지 교체 간격 (ms)
const ANIM_DURATION   = 3250   // 도형 전환 애니메이션 시간 (ms)

function BackgroundSlideshow({ parallaxRef }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealIdx,  setRevealIdx]  = useState(null)
  const [animating,  setAnimating]  = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentIdx + 1) % BG_IMAGES.length
      setRevealIdx(next)
      // 한 프레임 뒤 transition 트리거 (DOM mount 후 시작)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)))
    }, SLIDE_INTERVAL)
    return () => clearInterval(interval)
  }, [currentIdx])

  const handleTransitionEnd = (e) => {
    // clip-path 전환이 끝날 때만 상태 교체 (opacity 이벤트 중복 방지)
    if (e.propertyName !== 'clip-path') return
    setCurrentIdx(revealIdx)
    setRevealIdx(null)
    setAnimating(false)
  }

  // 도형(다이아몬드) 전환: 중심점 → 화면 밖까지 확장
  const diamond = {
    collapsed: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
    expanded:  'polygon(50% -150%, 250% 50%, 50% 250%, -150% 50%)',
  }

  const dur = `${ANIM_DURATION}ms`

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 시차 이동 컨테이너 — 패닝 시 엣지 노출 방지를 위해 8% 여백 확장 */}
      <div
        ref={parallaxRef}
        style={{
          position: 'absolute',
          inset: '-8%',
          willChange: 'transform',
        }}
      >
        {/* 현재 이미지 — 전환 중 서서히 어두워져 새 이미지와 자연스럽게 연결 */}
        <img
          src={BG_IMAGES[currentIdx]}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: animating ? 0.1 : 0.2,
            transition: animating ? `opacity ${dur} ease-in-out` : 'none',
          }}
          alt=""
          draggable={false}
        />

        {/* 새 이미지 — 다이아몬드 확장 + 페이드인 동시 적용 */}
        {revealIdx !== null && (
          <img
            src={BG_IMAGES[revealIdx]}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: animating ? 0.2 : 0,
              clipPath: animating ? diamond.expanded : diamond.collapsed,
              transition: animating
                ? `clip-path ${dur} ease-in-out, opacity ${dur} ease-in-out`
                : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
            alt=""
            draggable={false}
          />
        )}
      </div>
    </div>
  )
}

// ── 메인 랜딩 페이지 ───────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [angle, setAngle] = useState(0)
  const animRef  = useRef(null)
  // angleRef: 모듈로 없는 연속 증가값 → 사인 진동이 끊기지 않음
  const angleRef = useRef(0)

  // ── 멀티레이어 시차(parallax) refs ───────────────────────────
  // 레이어별 이동 속도 차이 → 3D 깊이감 (unseen.co 방식)
  // Layer 1: 배경 이미지  (가장 느림 — 가장 먼 레이어)
  // Layer 2: 장식 그라디언트 (중간)
  // Layer 3: 궤도 시스템  (가장 빠름 — 가장 가까운 레이어)
  const mousePosRef    = useRef({ x: 0, y: 0 })
  // 레이어별 별도 보간 위치 (속도 분리로 시차 깊이감 강화)
  const bgSmoothRef    = useRef({ x: 0, y: 0 })   // 배경: lerp 0.04
  const orbSmoothRef   = useRef({ x: 0, y: 0 })   // 궤도: lerp 0.07
  const isMouseActive  = useRef(false)
  const bgParallaxRef  = useRef(null)   // BackgroundSlideshow 시차 컨테이너
  const decorRef       = useRef(null)   // 장식 그라디언트 블롭
  const orbitalInnerRef = useRef(null)  // 궤도 내부 3D div

  // 마우스 이동 핸들러 (raw 좌표만 기록, 렌더 유발 없음)
  const handleMouseMove = useCallback((e) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY }
    if (!isMouseActive.current) {
      bgSmoothRef.current  = { x: e.clientX, y: e.clientY }
      orbSmoothRef.current = { x: e.clientX, y: e.clientY }
      isMouseActive.current = true
    }
  }, [])

  // 멀티레이어 시차 RAF 루프 (기존 궤도 루프와 독립)
  useEffect(() => {
    let rafId
    const lerp = (a, b, t) => a + (b - a) * t
    const tick = () => {
      if (isMouseActive.current) {
        const target = mousePosRef.current
        const W = window.innerWidth
        const H = window.innerHeight

        // ── Layer 1: 배경 이미지 시차 (느린 보간 → 가장 먼 느낌) ──
        bgSmoothRef.current.x = lerp(bgSmoothRef.current.x, target.x, 0.04)
        bgSmoothRef.current.y = lerp(bgSmoothRef.current.y, target.y, 0.04)
        if (bgParallaxRef.current) {
          const nx = (bgSmoothRef.current.x / W - 0.5) * 2  // -1 ~ 1
          const ny = (bgSmoothRef.current.y / H - 0.5) * 2
          // 마우스 반대 방향으로 이동 → 카메라 시점 이동 느낌
          bgParallaxRef.current.style.transform =
            `translate(${nx * -32}px, ${ny * -22}px)`
        }

        // ── Layer 2: 장식 그라디언트 블롭 (중간 속도) ─────────────
        if (decorRef.current) {
          const nx = (bgSmoothRef.current.x / W - 0.5) * 2
          const ny = (bgSmoothRef.current.y / H - 0.5) * 2
          decorRef.current.style.transform =
            `translate(calc(-50% + ${nx * -18}px), calc(-50% + ${ny * -14}px))`
        }

        // ── Layer 3: 궤도 시스템 기울기 (빠른 보간 → 가장 가까운 느낌) ──
        orbSmoothRef.current.x = lerp(orbSmoothRef.current.x, target.x, 0.07)
        orbSmoothRef.current.y = lerp(orbSmoothRef.current.y, target.y, 0.07)
        if (orbitalInnerRef.current) {
          const nx = (orbSmoothRef.current.x / W - 0.5) * 2
          const ny = (orbSmoothRef.current.y / H - 0.5) * 2
          orbitalInnerRef.current.style.transform =
            `rotateX(${15 - ny * 4}deg) rotateY(${nx * 6}deg)`
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(rafId)
  }, [])

  // 궤도 파라미터
  const orbitConfig = useMemo(() => ({
    rx: 200,        // 타원 반지름 X (B링 중심과 일치)
    ry: 76,         // 타원 반지름 Y = rx * RING_TILT(0.38) → 링 타원과 정합
    centerY: -10,   // 중심점 Y 오프셋
    speed: 0.003,   // 선형 회전 속도 (rad/frame)
    sinFreq: 2,     // 정수 주파수 → 궤도 1바퀴(2π) 완료 시 사인도 정확히 순환
    sinAmp: 42,     // 사인 진동 진폭 (px) — 궤도면 위아래로 튀어나옴
  }), [])

  // 궤도 애니메이션
  // angle은 모듈로 없이 계속 증가 → 사인 진동 시작/종료 점프 없음
  useEffect(() => {
    const animate = () => {
      angleRef.current += orbitConfig.speed
      setAngle(angleRef.current)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [orbitConfig.speed])

  // 각 구체의 위치/크기/깊이 계산
  const spherePositions = useMemo(() => {
    return roles.map((role, i) => {
      const roleAngle = angle + (i * (Math.PI * 2)) / 3
      const x    = Math.cos(roleAngle) * orbitConfig.rx
      const rawY = Math.sin(roleAngle) * orbitConfig.ry

      // 원근감: 앞(sin>0) → 크고 밝음, 뒤(sin<0) → 작고 흐림
      const depth   = Math.sin(roleAngle)           // -1(뒤) ~ 1(앞)
      const scale   = 0.55 + (depth + 1) * 0.3     // 0.55 ~ 1.15
      const opacity = 0.45 + (depth + 1) * 0.275   // 0.45 ~ 1.0

      const sphereRadius = 70 * scale

      // 사인곡선 위아래 진동: 각 구체는 120° 위상 차이로 독립 진동
      // → 궤도를 돌면서 링 평면 위아래로 파동처럼 움직임
      const phaseOffset = i * (Math.PI * 2 / 3)
      const floatY = Math.sin(angle * orbitConfig.sinFreq + phaseOffset) * orbitConfig.sinAmp

      const y = rawY + orbitConfig.centerY + depth * 25 - sphereRadius + floatY

      // zIndex 범위: 5~105 → OrbitalRingFront(z=55) 기준으로 앞/뒤 구분
      const zIndex = Math.round((depth + 1) * 50) + 5

      return { role, x, y, scale, opacity, zIndex }
    })
  }, [angle, orbitConfig])

  return (
    <LandingLayout>
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" onMouseMove={handleMouseMove}>
        {/* 배경 이미지 슬라이드쇼 (parallaxRef로 시차 이동 제어) */}
        <BackgroundSlideshow parallaxRef={bgParallaxRef} />

        {/* 배경 장식 — 마우스 시차 Layer 2 (중간 속도) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            ref={decorRef}
            className="absolute rounded-full blur-3xl opacity-[0.06]"
            style={{
              width: 900,
              height: 900,
              background: 'radial-gradient(circle, #7c3aed, transparent 70%)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
          />
        </div>


        {/* 궤도 + 구체 영역 — 모바일에서 축소 */}
        {/* 외부 래퍼: 반응형 스케일 + CSS 3D 원근 */}
        <div
          className="relative z-10 origin-center scale-[0.55] sm:scale-[0.7] md:scale-[0.85] lg:scale-100"
          style={{ perspective: '1400px' }}
        >
          {/* 내부: 15도 기울기 → 토성 고리 3D 비스듬한 각도 (마우스 시차로 동적 변경) */}
          <div
            ref={orbitalInnerRef}
            className="relative"
            style={{
              width: 660,
              height: 440,
              transform: 'rotateX(15deg)',
              transformOrigin: 'center center',
            }}
          >
            {/* 뒷면 고리 (z=3) — 구체 뒤에 */}
            <OrbitalRingBack angleRef={angleRef} />

            {/* 구체들 (z=5~105, depth 기반) */}
            {spherePositions.map(({ role, x, y, scale, opacity, zIndex }) => (
              <Sphere
                key={role.key}
                role={role}
                scale={scale}
                opacity={opacity}
                zIndex={zIndex}
                posX={x}
                posY={y}
                onClick={() => navigate(`/login?role=${role.key}`)}
              />
            ))}

            {/* 앞면 고리 (z=55) — 뒤쪽 구체 앞에, 앞쪽 구체 뒤에 */}
            <OrbitalRingFront angleRef={angleRef} />
          </div>
        </div>

      </section>

    </LandingLayout>
  )
}
