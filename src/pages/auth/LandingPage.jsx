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
    title: '수강생',
    icon: GraduationCap,
    bgFrom: '#f3f1ea',
    bgTo: '#e8e4dc',
    iconBg: 'bg-[#ece9e3]',
    textColor: 'text-[#4a4640]',
    arrowColor: 'text-[#a8a29e]',
  },
  {
    key: 'teacher',
    title: '강사',
    icon: BookOpen,
    bgFrom: '#3f4147',
    bgTo: '#26282e',
    iconBg: 'bg-white/12',
    textColor: 'text-[#f9fafb]',
    arrowColor: 'text-[#9ca3af]',
  },
  {
    key: 'admin',
    title: '관리자',
    icon: Settings,
    bgFrom: '#6c4b3f',
    bgTo: '#584035',
    iconBg: 'bg-white/12',
    textColor: 'text-[#fdf8f3]',
    arrowColor: 'text-[#e8d8cc]',
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
                className="group rounded-2xl overflow-hidden border border-[#ebe8e3]
                  hover:shadow-[0_18px_36px_rgba(45,42,38,0.12)] hover:-translate-y-1 transition-all duration-300
                  focus:outline-none text-left"
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
                  <div className={`relative w-20 h-20 rounded-2xl ${role.iconBg} backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <role.icon className={`w-10 h-10 ${role.textColor}`} />
                  </div>
                </div>

                {/* 하단 텍스트 영역 */}
                <div className="px-6 py-5 flex items-center justify-between bg-white/92">
                  <h3 className={`text-lg font-semibold text-[#2d2a26]`}>
                    {role.title}
                  </h3>
                  <ArrowRight className={`w-5 h-5 ${role.arrowColor} group-hover:text-[#2d2a26] group-hover:translate-x-1 transition-all`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-[#2d2a26] py-10 px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/12 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-[#e5e7eb]" />
            </div>
            <span className="text-[#fdf8f3] font-semibold italic">Korea IT Academy</span>
          </div>
          <p className="text-sm text-[#a8a29e]">
            © 2026 EduPilot. AI 기반 IT교육 통합 관리 플랫폼
          </p>
        </div>
      </footer>
    </LandingLayout>
  )
}
