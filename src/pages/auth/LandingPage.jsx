import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  Settings,
  ArrowRight,
} from 'lucide-react'
import LandingLayout from '@/components/layout/LandingLayout'

const roles = [
  {
    key: 'student',
    title: '학생',
    icon: GraduationCap,
    // 핑크-퍼플 계열 (Slack 스크린샷 좌측 카드)
    bgFrom: '#E8A0BF',
    bgTo: '#C77DBA',
    iconBg: 'bg-white/20',
  },
  {
    key: 'teacher',
    title: '강사',
    icon: BookOpen,
    // 시안-스카이 계열 (Slack 스크린샷 중앙 카드)
    bgFrom: '#7DD3E8',
    bgTo: '#5BC0D8',
    iconBg: 'bg-white/20',
  },
  {
    key: 'admin',
    title: '관리자',
    icon: Settings,
    // 딥 퍼플 계열 (Slack 스크린샷 우측 카드)
    bgFrom: '#5B21B6',
    bgTo: '#4C1D95',
    iconBg: 'bg-white/20',
  },
]


export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <LandingLayout>
      {/* 역할 선택 카드 — Slack Design 스타일 */}
      <section className="pt-24 pb-16 md:pt-28 md:pb-24 px-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            역할을 선택하세요
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-md mx-auto">
            본인의 역할에 맞는 대시보드로 바로 이동합니다
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {roles.map((role) => (
              <button
                key={role.key}
                onClick={() => navigate(`/login?role=${role.key}`)}
                className="group rounded-2xl overflow-hidden bg-white
                  hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-left"
              >
                {/* 상단 컬러 일러스트 영역 */}
                <div
                  className="relative h-52 flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${role.bgFrom}, ${role.bgTo})`,
                  }}
                >
                  {/* 장식 도형들 */}
                  <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/10" />
                  <div className="absolute bottom-6 right-6 w-10 h-10 rounded-lg bg-white/10 rotate-12" />
                  <div className="absolute top-10 right-10 w-6 h-6 rounded-full bg-white/15" />

                  {/* 아이콘 */}
                  <div className="relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <role.icon className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* 하단 텍스트 영역 */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    {role.title}
                  </h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 py-10 px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-bold">EduPilot</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 EduPilot. AI 기반 IT교육 통합 관리 플랫폼
          </p>
        </div>
      </footer>
    </LandingLayout>
  )
}
