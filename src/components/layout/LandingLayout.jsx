import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function LandingLayout({ children }) {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* 네비게이션 바 */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#F5F0EB]/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#ece9e3] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#8a847a]" />
            </div>
            <div className="leading-tight">
              <p className="text-[0.95rem] italic font-semibold text-[#4a4640]">Korea IT Academy</p>
              <p className="text-[0.62rem] tracking-[0.12em] text-[#a8a29e]">학습 포털</p>
            </div>
          </button>
        </div>
      </nav>

      {children}
    </div>
  )
}
