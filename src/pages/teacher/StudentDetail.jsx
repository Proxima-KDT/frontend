import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Mail, Calendar as CalendarIcon, Clock, FileText, FolderOpen } from 'lucide-react'

const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
]
import { mockStudents, mockAttendance } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
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

  // 레이더 차트용: 긴 라벨 축약
  const radarData = skillData.map(item => ({
    ...item,
    subject: item.subject === '프로젝트·과제·시험' ? '프로젝트..' : item.subject,
  }))

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
        수강생 현황으로 돌아가기
      </button>

      {/* 학생 정보 헤더 */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          {/* 직사각형 프로필 사진 */}
          <div className="shrink-0 w-24 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-md">
            {student.avatar_url ? (
              <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-student-400 to-student-600 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">{student.name.charAt(0)}</span>
              </div>
            )}
          </div>
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

      {/* 역량 분석 - 전체 너비 */}
      <Card className="mb-6">
        <h2 className="text-h3 font-semibold text-gray-900 mb-6">역량 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex justify-center items-center">
            <SkillRadarChart data={radarData} color="#3B82F6" />
          </div>
          <div className="flex flex-col justify-center gap-4">
            {skillData.map((skill, idx) => (
              <ProgressBar
                key={skill.subject}
                value={skill.score}
                label={skill.subject}
                color={SKILL_COLORS[idx]}
                size="md"
              />
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 상담 노트 */}
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

        {/* 이번 주 출석 */}
        <Card className="flex flex-col">
          <h2 className="text-h3 font-semibold text-gray-900 mb-6">이번 주 출석</h2>
          <div className="grid grid-cols-7 gap-3 flex-1">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => {
              const day = mockAttendance[idx]
              return (
                <div key={d} className="flex flex-col items-center">
                  <span className="text-body-sm text-gray-500 font-medium mb-3">{d}</span>
                  <span className="text-body-sm text-gray-700 font-semibold mb-2">
                    {day ? new Date(day.date).getDate() : '-'}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      day?.status ? statusColors[day.status] : 'bg-gray-300'
                    }`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200 text-body-sm text-gray-600">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-500" /> 출석
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning-500" /> 지각
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error-500" /> 결석
            </span>
          </div>
        </Card>
      </div>

      {/* 이력서 / 포트폴리오 */}
      <Card className="mt-6">
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">이력서 / 포트폴리오</h2>
        {student.files && student.files.length > 0 ? (
          <div className="space-y-3">
            {student.files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    file.type === 'resume' ? 'bg-teacher-50' : 'bg-student-50'
                  }`}>
                    {file.type === 'resume' ? (
                      <FileText className="w-5 h-5 text-teacher-500" />
                    ) : (
                      <FolderOpen className="w-5 h-5 text-student-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-caption text-gray-400">{file.uploaded_at} 업로드</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm text-teacher-600 hover:text-teacher-700 font-medium"
                  >
                    보기
                  </a>
                  <a
                    href={file.url}
                    download
                    className="text-body-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    다운로드
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-gray-400">등록된 파일이 없습니다.</p>
        )}
      </Card>
    </div>
  )
}
