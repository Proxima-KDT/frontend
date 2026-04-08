export default function LandingLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      {/* 로고: 항상 최상단 고정, 화면 왼쪽 상단 */}
      <img
        src="/logo.png"
        alt="EduPilot Logo"
        className="fixed top-4 left-4 h-12 w-auto object-contain"
        style={{ zIndex: 9999 }}
        draggable={false}
      />
      {children}
    </div>
  )
}
