import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, Calendar, FileText } from 'lucide-react'
import { mockStudents } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Avatar from '@/components/common/Avatar'
import ProgressBar from '@/components/common/ProgressBar'
import Tabs from '@/components/common/Tabs'
import SkillRadarChart from '@/components/charts/SkillRadarChart'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const atRiskCount = mockStudents.filter((s) => s.is_at_risk).length
  const avgAttendance = Math.round(mockStudents.reduce((sum, s) => sum + s.attendance_rate, 0) / mockStudents.length)
  const avgSubmission = Math.round(mockStudents.reduce((sum, s) => sum + s.submission_rate, 0) / mockStudents.length)

  const filteredStudents = filter === 'at_risk'
    ? mockStudents.filter((s) => s.is_at_risk)
    : mockStudents

  const stats = [
    { label: '전체 학생', value: mockStudents.length, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: '위험 학생', value: atRiskCount, icon: AlertTriangle, color: 'text-error-500', bg: 'bg-error-50' },
    { label: '평균 출석률', value: `${avgAttendance}%`, icon: Calendar, color: 'text-success-500', bg: 'bg-success-50' },
    { label: '평균 제출률', value: `${avgSubmission}%`, icon: FileText, color: 'text-student-500', bg: 'bg-student-50' },
  ]

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">대시보드</h1>

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

      {/* 필터 */}
      <Tabs
        tabs={[
          { key: 'all', label: '전체 학생', count: mockStudents.length },
          { key: 'at_risk', label: '위험 학생', count: atRiskCount },
        ]}
        activeTab={filter}
        onChange={setFilter}
        className="mb-6"
      />

      {/* 학생 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const skillData = Object.entries(student.skills).map(([subject, score]) => ({
            subject,
            score,
            fullMark: 100,
          }))

          return (
            <Card
              key={student.id}
              hoverable
              onClick={() => navigate(`/teacher/students/${student.id}`)}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={student.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-body font-semibold text-gray-900 truncate">{student.name}</h3>
                    {student.is_at_risk && (
                      <Badge variant="error">위험</Badge>
                    )}
                  </div>
                  <p className="text-caption text-gray-500">{student.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <ProgressBar value={student.attendance_rate} label="출석률" color="bg-success-500" size="sm" />
                <ProgressBar value={student.submission_rate} label="제출률" color="bg-student-500" size="sm" />
                <ProgressBar value={student.accuracy} label="정확도" color="bg-primary-500" size="sm" />
              </div>

              {/* 미니 레이더 - 데스크톱만 */}
              <div className="hidden md:block">
                <SkillRadarChart data={skillData} color="#14B8A6" size="mini" />
              </div>

              <p className="text-caption text-gray-400 mt-2">
                최근 활동: {student.last_active}
              </p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
