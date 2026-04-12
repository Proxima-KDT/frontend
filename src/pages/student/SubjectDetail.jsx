import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, BookOpen, Shuffle, ChevronRight } from 'lucide-react'
import { subjectsApi } from '@/api/subjects'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import ProgressBar from '@/components/common/ProgressBar'
import Skeleton from '@/components/common/Skeleton'

export default function SubjectDetail() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [subject, setSubject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    subjectsApi.getDetail(subjectId)
      .then((data) => { if (!cancelled) setSubject(data) })
      .catch(() => { if (!cancelled) setSubject(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [subjectId, location.key])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="120px" height="20px" rounded="rounded-lg" />
        <Skeleton width="100%" height="80px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="200px" rounded="rounded-2xl" />
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-h3 text-gray-500">과목을 찾을 수 없습니다</p>
      </div>
    )
  }

  const totalProblems = subject.concepts?.reduce((sum, c) => sum + (c.problems_count ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/student/problems')}
        className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        과목 목록으로
      </button>

      {/* 과목 헤더 */}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center`}>
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-h1 font-bold text-gray-900">{subject.title}</h1>
          <p className="text-body-sm text-gray-500 mt-0.5">
            {subject.concepts.length}개 개념 · 총 {totalProblems}문제
          </p>
        </div>
      </div>

      {/* 개념 카드 목록 */}
      <div className="space-y-3">
        {(subject.concepts ?? []).map((concept) => {
          const progress = concept.progress ?? { solved: 0, total: concept.problems_count ?? 0, percent: 0 }
          const isCompleted = progress.percent >= 100
          const isStarted = progress.percent > 0

          return (
            <Card
              key={concept.id}
              hoverable
              onClick={() => navigate(`/student/problems/${subjectId}/${concept.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-[#6f8391]" />
                  ) : (
                    <Circle className={`w-6 h-6 ${isStarted ? 'text-amber-400' : 'text-gray-300'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-body font-semibold text-gray-900">{concept.title}</h3>
                    {isCompleted && <Badge variant="soft-info">완료</Badge>}
                    {isStarted && !isCompleted && <Badge variant="warning">진행 중</Badge>}
                  </div>
                  <p className="text-caption text-gray-500 mb-2">{concept.description}</p>
                  <div className="flex items-center gap-3">
                    <ProgressBar
                      value={progress.percent}
                      color={isCompleted ? 'bg-[#6f8391]' : 'bg-[#b79b5d]'}
                      size="sm"
                      showValue={false}
                      className="flex-1"
                    />
                    <span className="text-caption font-medium text-gray-500 shrink-0">
                      {progress.solved}/{progress.total}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </div>
            </Card>
          )
        })}

        {/* 종합 문제 풀기 카드 */}
        <Card
          hoverable
          onClick={() => navigate(`/student/problems/${subjectId}/comprehensive`)}
          className="border-2 border-dashed border-[#d8d2c7] bg-[#faf9f6]"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2f4]">
                <Shuffle className="h-5 w-5 text-[#4e5a61]" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-body font-semibold text-[#4f6475]">
                {subject.title} 종합 문제 풀기
              </h3>
              <p className="text-caption text-[#7f786d]">
                모든 개념에서 랜덤으로 출제 · 총 {totalProblems}문제 중 랜덤 선택
              </p>
            </div>
            <ChevronRight className="w-5 h-5 shrink-0 text-[#c5bfb4]" />
          </div>
        </Card>
      </div>
    </div>
  )
}
