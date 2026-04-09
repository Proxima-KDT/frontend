import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react'
import { subjectsApi } from '@/api/subjects'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import ProgressBar from '@/components/common/ProgressBar'
import Skeleton from '@/components/common/Skeleton'

export default function ConceptQuiz() {
  const { subjectId, conceptId } = useParams()
  const navigate = useNavigate()

  const isComprehensive = conceptId === 'comprehensive'

  const [subjectTitle, setSubjectTitle] = useState('')
  const [conceptTitle, setConceptTitle] = useState('')
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectData, problemsData] = await Promise.all([
          subjectsApi.getDetail(subjectId),
          subjectsApi.getConceptProblems(subjectId, conceptId),
        ])
        setSubjectTitle(subjectData.title ?? '')
        if (!isComprehensive) {
          const concept = subjectData.concepts?.find((c) => c.id === conceptId)
          setConceptTitle(concept?.title ?? '')
        }
        setProblems(problemsData)
      } catch {
        setProblems([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [subjectId, conceptId, isComprehensive])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [results, setResults] = useState([])
  const [isFinished, setIsFinished] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="150px" height="20px" rounded="rounded-lg" />
        <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      </div>
    )
  }

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-h3 text-gray-500">문제를 찾을 수 없습니다</p>
      </div>
    )
  }

  const currentProblem = problems[currentIndex]
  const totalProblems = problems.length
  const progressPercent = ((currentIndex + (isSubmitted ? 1 : 0)) / totalProblems) * 100

  const handleSubmit = () => {
    if (selectedAnswer === null) return
    setIsSubmitted(true)
    setResults((prev) => [
      ...prev,
      {
        problemId: currentProblem.id,
        selected: selectedAnswer,
        correct: currentProblem.answer,
        isCorrect: selectedAnswer === currentProblem.answer,
      },
    ])
  }

  const handleNext = () => {
    if (currentIndex + 1 >= totalProblems) {
      setIsFinished(true)
      return
    }
    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setIsSubmitted(false)
  }

  const handleRetry = () => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsSubmitted(false)
    setResults([])
    setIsFinished(false)
  }

  const correctCount = results.filter((r) => r.isCorrect).length
  const title = isComprehensive ? `${subjectTitle} 종합 문제` : conceptTitle

  // 결과 화면
  if (isFinished) {
    const scorePercent = Math.round((correctCount / totalProblems) * 100)
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(`/student/problems/${subjectId}`)}
          className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {subjectTitle} 개념 목록으로
        </button>

        <Card className="text-center py-10">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
            scorePercent >= 80 ? 'bg-green-100' : scorePercent >= 60 ? 'bg-amber-100' : 'bg-red-100'
          }`}>
            <Trophy className={`w-10 h-10 ${
              scorePercent >= 80 ? 'text-green-600' : scorePercent >= 60 ? 'text-amber-600' : 'text-red-600'
            }`} />
          </div>
          <h2 className="text-h2 font-bold text-gray-900 mb-2">{title} 완료!</h2>
          <p className="text-body text-gray-500 mb-6">
            {totalProblems}문제 중 <span className="font-bold text-gray-900">{correctCount}문제</span> 정답
          </p>

          <div className="max-w-xs mx-auto mb-8">
            <div className={`text-4xl font-bold mb-2 ${
              scorePercent >= 80 ? 'text-green-600' : scorePercent >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {scorePercent}점
            </div>
            <ProgressBar
              value={scorePercent}
              color={scorePercent >= 80 ? 'bg-green-500' : scorePercent >= 60 ? 'bg-amber-500' : 'bg-red-500'}
              showValue={false}
            />
          </div>

          {/* 문제별 결과 요약 */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {results.map((r, idx) => (
                <div
                  key={r.problemId}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-body-sm font-semibold ${
                    r.isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={handleRetry}
              icon={RotateCcw}
            >
              다시 풀기
            </Button>
            <Button
              onClick={() => navigate(`/student/problems/${subjectId}`)}
              className="bg-student-500 hover:bg-student-600"
            >
              개념 목록으로
            </Button>
          </div>
        </Card>

        {/* 오답 해설 */}
        {results.some((r) => !r.isCorrect) && (
          <Card>
            <h3 className="text-h3 font-bold text-gray-900 mb-4">오답 해설</h3>
            <div className="space-y-4">
              {results.filter((r) => !r.isCorrect).map((r, idx) => {
                const prob = problems.find((p) => p.id === r.problemId)
                return (
                  <div key={r.problemId} className="p-4 bg-red-50 rounded-xl">
                    <p className="text-body-sm font-semibold text-gray-900 mb-2">
                      Q. {prob.question}
                    </p>
                    <p className="text-caption text-red-600 mb-1">
                      내 답: {prob.choices[r.selected]}
                    </p>
                    <p className="text-caption text-green-600 mb-2">
                      정답: {prob.choices[r.correct]}
                    </p>
                    <p className="text-caption text-gray-600">{prob.explanation}</p>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    )
  }

  // 문제 풀기 화면
  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/student/problems/${subjectId}`)}
        className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {subjectTitle} 개념 목록으로
      </button>

      {/* 진행 상황 헤더 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-h2 font-bold text-gray-900">{title}</h1>
          <Badge variant="info">
            {currentIndex + 1} / {totalProblems}
          </Badge>
        </div>
        <ProgressBar
          value={progressPercent}
          color="bg-student-500"
          size="sm"
          showValue={false}
        />
      </div>

      {/* 문제 카드 */}
      <Card>
        <div className="mb-6">
          <span className="text-caption font-medium text-student-600 mb-2 block">
            문제 {currentIndex + 1}
          </span>
          <h2 className="text-body font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
            {currentProblem.question}
          </h2>
        </div>

        {/* 보기 */}
        <div className="space-y-3">
          {currentProblem.choices.map((choice, idx) => {
            let borderClass = 'border-gray-200 hover:border-gray-300'
            let bgClass = ''

            if (isSubmitted) {
              if (idx === currentProblem.answer) {
                borderClass = 'border-green-500'
                bgClass = 'bg-green-50'
              } else if (idx === selectedAnswer && idx !== currentProblem.answer) {
                borderClass = 'border-red-500'
                bgClass = 'bg-red-50'
              } else {
                borderClass = 'border-gray-100'
                bgClass = 'opacity-50'
              }
            } else if (selectedAnswer === idx) {
              borderClass = 'border-student-500'
              bgClass = 'bg-student-50'
            }

            return (
              <label
                key={idx}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${borderClass} ${bgClass} ${
                  isSubmitted ? 'pointer-events-none' : 'cursor-pointer'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isSubmitted ? (
                    idx === currentProblem.answer ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : idx === selectedAnswer ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                    )
                  ) : (
                    <input
                      type="radio"
                      name="answer"
                      value={idx}
                      checked={selectedAnswer === idx}
                      onChange={() => setSelectedAnswer(idx)}
                      className="mt-0.5 accent-student-500"
                    />
                  )}
                </div>
                <span className="text-body-sm text-gray-700">{choice}</span>
              </label>
            )
          })}
        </div>

        {/* 해설 (제출 후) */}
        {isSubmitted && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-body-sm font-semibold text-blue-800 mb-1">해설</h4>
            <p className="text-caption text-blue-700">{currentProblem.explanation}</p>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex((prev) => prev - 1)
              const prevResult = results[currentIndex - 1]
              if (prevResult) {
                setSelectedAnswer(prevResult.selected)
                setIsSubmitted(true)
              }
            }}
            icon={ChevronLeft}
          >
            이전
          </Button>

          {!isSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="bg-student-500 hover:bg-student-600 active:bg-student-700"
            >
              정답 확인
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-student-500 hover:bg-student-600 active:bg-student-700"
              icon={currentIndex + 1 >= totalProblems ? Trophy : ChevronRight}
            >
              {currentIndex + 1 >= totalProblems ? '결과 보기' : '다음 문제'}
            </Button>
          )}
        </div>
      </Card>

      {/* 문제 번호 네비게이션 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {problems.map((_, idx) => {
          const result = results.find((r) => r.problemId === problems[idx].id)
          let colorClass = 'bg-gray-100 text-gray-500'
          if (result) {
            colorClass = result.isCorrect
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          } else if (idx === currentIndex) {
            colorClass = 'bg-student-100 text-student-700 ring-2 ring-student-500'
          }

          return (
            <button
              key={idx}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-body-sm font-semibold transition-colors ${colorClass}`}
              disabled
            >
              {idx + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
