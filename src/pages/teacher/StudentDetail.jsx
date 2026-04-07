import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Mail, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { mockStudents, mockAttendance } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Avatar from '@/components/common/Avatar'
import Button from '@/components/common/Button'
import Textarea from '@/components/common/Textarea'
import ProgressBar from '@/components/common/ProgressBar'
import SkillRadarChart from '@/components/charts/SkillRadarChart'

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const student = mockStudents.find((s) => s.id === id) || mockStudents[0]
  const [notes, setNotes] = useState('학생과 1:1 면담 후 학습 계획 수립 필요. 알고리즘 부분 보충 학습 권장.')

  const skillData = Object.entries(student.skills).map(([subject, score]) => ({
    subject,
    score,
    fullMark: 100,
  }))

  const activities = [
    { time: '2026-04-07 10:30', action: '데일리 문제 제출', detail: 'Two Sum 문제 - 85점' },
    { time: '2026-04-07 08:55', action: '출석 완료', detail: '정상 출석' },
    { time: '2026-04-06 16:20', action: '음성 피드백 완료', detail: '72점 획득' },
    { time: '2026-04-06 14:00', action: '모의면접 완료', detail: '네이버 프론트엔드 - 82점' },
    { time: '2026-04-06 09:00', action: '출석 완료', detail: '정상 출석' },
    { time: '2026-04-05 15:30', action: '데일리 문제 제출', detail: 'SQL JOIN - 75점' },
  ]

  const statusColors = {
    present: 'bg-success-500',
    late: 'bg-warning-500',
    absent: 'bg-error-500',
  }

  return (
    <div>
      <button
        onClick={() => navigate('/teacher')}
        className="flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드로 돌아가기
      </button>

      {/* 학생 정보 헤더 */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-h2 font-bold text-gray-900">{student.name}</h1>
              {student.is_at_risk && <Badge variant="error">위험</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 text-body-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {student.email}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" /> 등록일: {student.enrolled_at}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 최근 활동: {student.last_active}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* 왼쪽 60% */}
        <div className="md:col-span-3 space-y-6">
          {/* 역량 레이더 */}
          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-4">역량 분석</h2>
            <SkillRadarChart data={skillData} color="#14B8A6" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <ProgressBar value={student.attendance_rate} label="출석률" color="bg-success-500" size="sm" />
              <ProgressBar value={student.submission_rate} label="제출률" color="bg-student-500" size="sm" />
              <ProgressBar value={student.accuracy} label="정확도" color="bg-primary-500" size="sm" />
            </div>
          </Card>

          {/* 활동 타임라인 */}
          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-4">최근 활동</h2>
            <div className="space-y-4">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-teacher-500 mt-1.5" />
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-body-sm font-medium text-gray-900">{act.action}</p>
                    <p className="text-caption text-gray-500">{act.detail}</p>
                    <p className="text-caption text-gray-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 오른쪽 40% */}
        <div className="md:col-span-2 space-y-6">
          {/* 노트 */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-h3 font-semibold text-gray-900">상담 노트</h2>
              <span className="text-caption text-gray-400">자동 저장됨</span>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="학생에 대한 메모를 작성하세요..."
            />
          </Card>

          {/* 미니 출석 달력 */}
          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">이번 주 출석</h2>
            <div className="grid grid-cols-7 gap-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <span key={d} className="text-caption text-gray-400 text-center">{d}</span>
              ))}
              {mockAttendance.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-caption text-gray-600">
                    {new Date(day.date).getDate()}
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      day.status ? statusColors[day.status] : 'bg-gray-200'
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-caption text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-success-500" /> 출석
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-warning-500" /> 지각
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-error-500" /> 결석
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
