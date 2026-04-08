import { useNavigate } from 'react-router-dom'
import { Code2, Globe, Database, GitBranch, Users, Brain, ChevronRight, BookOpen } from 'lucide-react'
import { mockSubjects } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import ProgressBar from '@/components/common/ProgressBar'

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

function getSubjectProgress(subject) {
  const totalProblems = subject.concepts.reduce((sum, c) => sum + c.problems.length, 0)
  // 실제로는 사용자의 풀이 기록을 기반으로 계산
  // 임시로 phase별 진행률 시뮬레이션
  if (subject.phase <= 3) return { solved: totalProblems, total: totalProblems, percent: 100 }
  if (subject.phase === 4) return { solved: Math.floor(totalProblems * 0.6), total: totalProblems, percent: 60 }
  return { solved: 0, total: totalProblems, percent: 0 }
}

function getSubjectStatus(subject) {
  if (subject.phase <= 3) return 'completed'
  if (subject.phase === 4) return 'in_progress'
  return 'upcoming'
}

export default function ProblemList() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold text-gray-900">개념 학습 & 문제풀이</h1>
        <p className="text-body-sm text-gray-500 mt-1">
          커리큘럼에 맞는 개념을 학습하고 문제를 풀어보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockSubjects.map((subject) => {
          const Icon = iconMap[subject.icon]
          const progress = getSubjectProgress(subject)
          const status = getSubjectStatus(subject)
          const statusInfo = statusMap[status]

          return (
            <Card
              key={subject.id}
              hoverable
              onClick={() => navigate(`/student/problems/${subject.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center shrink-0`}>
                  {Icon && <Icon className="w-6 h-6 text-white" />}
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
                    value={progress.percent}
                    color={status === 'completed' ? 'bg-green-500' : status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-300'}
                    size="sm"
                    showValue={false}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-caption text-gray-400">
                      <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                      {subject.concepts.length}개 개념 · {progress.total}문제
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
    </div>
  )
}
