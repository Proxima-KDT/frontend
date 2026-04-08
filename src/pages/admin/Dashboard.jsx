import { useNavigate } from 'react-router-dom'
import { Users, UserX, FolderOpen } from 'lucide-react'
import { mockStudents } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import ProgressBar from '@/components/common/ProgressBar'
import SkillRadarChart from '@/components/charts/SkillRadarChart'

const ADMIN_COLOR = '#8B5CF6' // --color-admin-500

export default function AdminDashboard() {
  const navigate = useNavigate()

  const lowAttendanceCount = mockStudents.filter((s) => s.attendance_rate < 80).length
  const portfolioCount = mockStudents.filter((s) =>
    s.files.some((f) => f.type === 'portfolio')
  ).length

  const stats = [
    { label: '전체 수강생', value: mockStudents.length, icon: Users, color: 'text-admin-500', bg: 'bg-admin-50' },
    { label: '출석 80% 미만', value: lowAttendanceCount, icon: UserX, color: 'text-warning-500', bg: 'bg-warning-50' },
    { label: '포트폴리오 제출', value: portfolioCount, icon: FolderOpen, color: 'text-success-500', bg: 'bg-success-50' },
  ]

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">수강생 현황</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-caption text-gray-500">{stat.label}</p>
                <p className="text-h3 font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 수강생 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockStudents.map((student) => {
          const radarData = Object.entries(student.skills).map(([subject, score]) => ({
            subject: subject === '프로젝트·과제·시험' ? '프로젝트..' : subject,
            score,
            fullMark: 100,
          }))
          const hasPortfolio = student.files.some((f) => f.type === 'portfolio')
          const hasResume = student.files.some((f) => f.type === 'resume')
          const daysSinceActive = Math.floor(
            (new Date() - new Date(student.last_active)) / 86400000
          )

          return (
            <Card
              key={student.id}
              hoverable
              onClick={() => navigate(`/admin/students/${student.id}`)}
            >
              {/* 헤더 */}
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-20 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-admin-400 to-admin-600 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{student.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-body font-semibold text-gray-900 truncate">{student.name}</h3>
                    {hasPortfolio && <Badge variant="success">포트폴리오 있음</Badge>}
                    {hasResume && <Badge variant="info">이력서 있음</Badge>}
                  </div>
                  <p className="text-caption text-gray-500 mb-2">
                    {daysSinceActive === 0 ? '오늘 활동' : `${daysSinceActive}일 전 활동`}
                  </p>
                  {/* 출석률 — 멘토의 핵심 지표 */}
                  <ProgressBar
                    value={student.attendance_rate}
                    label="출석률"
                    color={student.attendance_rate < 80 ? 'bg-error-500' : 'bg-admin-500'}
                    size="sm"
                  />
                </div>
              </div>

              {/* 역량 레이더 */}
              <div className="border-t border-gray-100 pt-4">
                <SkillRadarChart data={radarData} color={ADMIN_COLOR} size="mini" />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
