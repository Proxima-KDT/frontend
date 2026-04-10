import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Code2, Globe, Database, GitBranch, Users, Brain, ChevronRight, BookOpen } from 'lucide-react'
import { subjectsApi } from '@/api/subjects'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import ProgressBar from '@/components/common/ProgressBar'
import Skeleton from '@/components/common/Skeleton'

const iconMap = {
  Code2,
  Globe,
  Database,
  GitBranch,
  Users,
  Brain,
}

const statusMap = {
  completed: { label: '학습 완료', variant: 'success' },
  in_progress: { label: '학습 중', variant: 'warning' },
  upcoming: { label: '예정', variant: 'info' },
}

function getSubjectStatus(progress) {
  if (!progress) return 'upcoming'
  if (progress.percent >= 100) return 'completed'
  if (progress.percent > 0) return 'in_progress'
  return 'upcoming'
}

export default function ProblemList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    subjectsApi.getList()
      .then((data) => { if (!cancelled) setSubjects(data) })
      .catch(() => { if (!cancelled) setSubjects([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [location.key])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h1 font-bold text-gray-900">개념 학습 & 문제풀이</h1>
          <p className="text-body-sm text-gray-500 mt-1">커리큘럼에 맞는 개념을 학습하고 문제를 풀어보세요</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} width="100%" height="120px" rounded="rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold text-gray-900">개념 학습 & 문제풀이</h1>
        <p className="text-body-sm text-gray-500 mt-1">
          커리큘럼에 맞는 개념을 학습하고 문제를 풀어보세요
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-body text-gray-400">등록된 과목이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => {
            const Icon = iconMap[subject.icon]
            const progress = subject.progress ?? { solved: 0, total: subject.total_problems ?? 0, percent: 0 }
            const status = getSubjectStatus(progress)
            const statusInfo = statusMap[status]

            return (
              <Card
                key={subject.id}
                hoverable
                onClick={() => navigate(`/student/problems/${subject.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color ?? 'from-student-400 to-student-600'} flex items-center justify-center shrink-0`}>
                    {Icon ? <Icon className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-body font-semibold text-gray-900 truncate">
                        {subject.title}
                      </h3>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <p className="text-caption text-gray-500 mb-3 line-clamp-1">
                      {subject.description}
                    </p>

                    <ProgressBar
                      value={progress.percent ?? 0}
                      color={status === 'completed' ? 'bg-green-500' : status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-300'}
                      size="sm"
                      showValue={false}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-caption text-gray-400">
                        <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                        {subject.concepts?.length ?? 0}개 개념 · {progress.total}문제
                      </span>
                      <span className="text-caption font-medium text-gray-600">
                        {progress.solved}/{progress.total} 완료
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
