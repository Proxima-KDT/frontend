import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { problemsApi } from '@/api/problems'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Textarea from '@/components/common/Textarea'
import CodeEditor from '@/components/forms/CodeEditor'
import Skeleton from '@/components/common/Skeleton'

const difficultyBadgeMap = {
  '하': 'difficulty-low',
  '중': 'difficulty-mid',
  '상': 'difficulty-high',
}

export default function ProblemDetail() {
  const { id } = useParams()
  const [problem, setProblem] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedChoice, setSelectedChoice] = useState(null)
  const [shortAnswer, setShortAnswer] = useState('')
  const [codeAnswer, setCodeAnswer] = useState('')

  useEffect(() => {
    problemsApi.getDetail(id)
      .then((data) => {
        setProblem(data)
        if (data.submitted) {
          return problemsApi.getEvaluation(id)
            .then((evalData) => setEvaluation(evalData))
            .catch(() => null)
        }
      })
      .catch(() => setProblem(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="150px" height="20px" rounded="rounded-lg" />
        <Skeleton width="100%" height="400px" rounded="rounded-2xl" />
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-h3 text-gray-500">문제를 찾을 수 없습니다</p>
      </div>
    )
  }

  const isSubmitted = problem.submitted

  const handleSubmit = async () => {
    let answer
    if (problem.type === 'multiple_choice') answer = selectedChoice
    else if (problem.type === 'short_answer') answer = shortAnswer
    else answer = codeAnswer

    if (answer === null || answer === '') return
    setSubmitting(true)
    try {
      await problemsApi.submit(id, answer)
      const evalData = await problemsApi.getEvaluation(id)
      setEvaluation(evalData)
      setProblem((prev) => ({ ...prev, submitted: true }))
    } catch {
      // 제출 실패
    } finally {
      setSubmitting(false)
    }
  }

  const renderInput = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <h3 className="text-body font-semibold text-gray-900 mb-2">답안 선택</h3>
            {problem.choices.map((choice, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedChoice === idx
                    ? 'border-[#4e5a61] bg-[#f4f8fb]'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isSubmitted ? 'pointer-events-none' : ''}`}
              >
                <input
                  type="radio"
                  name="choice"
                  value={idx}
                  checked={selectedChoice === idx}
                  onChange={() => setSelectedChoice(idx)}
                  disabled={isSubmitted}
                  className="mt-0.5 accent-[#4e5a61]"
                />
                <span className="text-body-sm text-gray-700">{choice}</span>
              </label>
            ))}
          </div>
        )

      case 'short_answer':
        return (
          <div>
            <h3 className="text-body font-semibold text-gray-900 mb-2">답안 작성</h3>
            <Textarea
              placeholder="답안을 입력하세요..."
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              rows={6}
              disabled={isSubmitted}
            />
          </div>
        )

      case 'code':
        return (
          <div>
            <h3 className="text-body font-semibold text-gray-900 mb-2">코드 작성</h3>
            <CodeEditor
              value={codeAnswer}
              onChange={(e) => setCodeAnswer(e.target.value)}
              language="python"
              readOnly={isSubmitted}
            />
          </div>
        )

      default:
        return null
    }
  }

  const score = evaluation?.score ?? null

  return (
    <div className="space-y-6">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        목록으로 돌아가기
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 왼쪽: 문제 + 입력 (70%) */}
        <div className="w-full md:w-[70%] space-y-6">
          <Card>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <Badge variant={difficultyBadgeMap[problem.difficulty]}>
                {problem.difficulty}
              </Badge>
              {(problem.tags ?? []).map((tag) => (
                <Badge key={tag} variant="info">
                  {tag}
                </Badge>
              ))}
              {isSubmitted && (
                <Badge variant="success">제출완료</Badge>
              )}
            </div>

            <h1 className="text-h2 font-bold text-gray-900 mb-4">
              {problem.title}
            </h1>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <pre className="text-body-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {problem.description}
              </pre>
            </div>

            {renderInput()}

            {!isSubmitted && (
              <div className="mt-6">
                <Button
                  fullWidth
                  loading={submitting}
                  onClick={handleSubmit}
                  className="bg-[#4e5a61] hover:bg-[#424d53] active:bg-[#384248]"
                >
                  제출하기
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* 오른쪽: 정보 사이드바 (30%) */}
        <div className="w-full md:w-[30%] space-y-4">
          <Card>
            <h3 className="text-body font-semibold text-gray-900 mb-4">문제 정보</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-body-sm text-gray-500">유형</dt>
                <dd className="text-body-sm font-medium text-gray-900">
                  {problem.type === 'multiple_choice'
                    ? '객관식'
                    : problem.type === 'short_answer'
                    ? '서술형'
                    : '코드'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-body-sm text-gray-500">난이도</dt>
                <dd>
                  <Badge variant={difficultyBadgeMap[problem.difficulty]}>
                    {problem.difficulty}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-body-sm text-gray-500">출제일</dt>
                <dd className="text-body-sm font-medium text-gray-900">
                  {problem.date}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-body-sm text-gray-500">제출 상태</dt>
                <dd className="text-body-sm font-medium">
                  {isSubmitted ? (
                    <span className="text-[#4f6475]">제출완료</span>
                  ) : (
                    <span className="text-gray-400">미제출</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          {isSubmitted && score !== null && (
            <Card>
              <h3 className="text-body font-semibold text-gray-900 mb-4">채점 결과</h3>
              <div className="flex items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-h2 font-bold text-white ${
                    score >= 90
                      ? 'bg-[#6f8391]'
                      : score >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                >
                  {score}
                </div>
              </div>
              <p className="text-center text-caption text-gray-500 mt-2">점수</p>
            </Card>
          )}

          <Card>
            <h3 className="text-body font-semibold text-gray-900 mb-3">태그</h3>
            <div className="flex flex-wrap gap-2">
              {(problem.tags ?? []).map((tag) => (
                <Badge key={tag} variant="info">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
