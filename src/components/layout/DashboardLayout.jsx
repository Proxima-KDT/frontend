import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { role } = useAuth()
  const isAdminShell = role === 'admin'

  return (
    <div
      className={
        isAdminShell
          ? 'min-h-screen bg-[#fdfbf7]'
          : 'min-h-screen bg-[radial-gradient(980px_circle_at_20%_18%,rgba(255,188,120,0.24)_0%,rgba(255,156,96,0.08)_36%,rgba(255,156,96,0)_72%),radial-gradient(900px_520px_at_68%_12%,rgba(255,255,255,0.48),rgba(255,255,255,0)_70%),linear-gradient(180deg,#f3f1ea_0%,#efe8de_100%)]'
      }
    >
      {/* 모바일 사이드바 오버레이 */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 사이드바 - 데스크톱: 항상 표시 / 모바일: 토글 */}
      <div className={`hidden md:block`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      {mobileSidebarOpen && (
        <div className="md:hidden">
          <Sidebar collapsed={false} />
        </div>
      )}

      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
      </div>

      {/* 메인 콘텐츠 */}
      <main
        className={`
          transition-all duration-300 min-h-screen
          pt-0 md:pt-0
          pb-20 md:pb-0
          ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}
        `}
      >
        <div className="max-w-[1200px] mx-auto p-4 md:p-6 animate-fade-in">
          {children}
        </div>
      </main>

      {/* 모바일 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}
