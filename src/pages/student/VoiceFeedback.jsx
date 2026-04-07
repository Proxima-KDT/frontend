import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, RotateCcw } from 'lucide-react'
import { mockKeywords, mockVoiceFeedbackResult } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import ScoreGauge from '@/components/charts/ScoreGauge'

const keywordStatusConfig = {
  correct: { color: 'bg-green-100 text-green-700 border-green-300', label: '정확' },
  inaccurate: { color: 'bg-amber-100 text-amber-700 border-amber-300', label: '부정확' },
  missing: { color: 'bg-red-100 text-red-700 border-red-300', label: '누락' },
}

export default function VoiceFeedback() {
  const [isRecording, setIsRecording] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setShowResults(true)
    } else {
      setIsRecording(true)
      setShowResults(false)
      setSeconds(0)
    }
  }

  const resetRecording = () => {
    setIsRecording(false)
    setShowResults(false)
    setSeconds(0)
  }

  const formatTime = (s) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return min + ':' + sec
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-gray-900">음성 피드백</h1>

      {/* 오늘의 주제 */}
      <Card>
        <p className="text-caption font-medium text-gray-500 mb-1">오늘의 주제</p>
        <h2 className="text-h3 font-bold text-gray-900">
          {mockVoiceFeedbackResult.topic}
        </h2>
      </Card>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 왼쪽: 키워드 + 마이크 (40%) */}
        <div className="w-full md:w-[40%] space-y-6">
          {/* 키워드 */}
          <Card>
            <h3 className="text-body font-semibold text-gray-900 mb-4">핵심 키워드</h3>
            <div className="flex flex-wrap gap-2">
              {mockKeywords.map((kw) => {
                const config = keywordStatusConfig[kw.status]
                return (
                  <span
                    key={kw.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium border ${config.color}`}
                  >
                    {kw.word}
                    <span className="text-caption opacity-75">({config.label})</span>
                  </span>
                )
              })}
            </div>
          </Card>

          {/* 마이크 버튼 */}
          <Card className="flex flex-col items-center py-8">
            <div className="relative mb-6">
              <button
                onClick={toggleRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-student-500 hover:bg-student-600 shadow-lg shadow-student-500/30'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
              )}
            </div>

            <p className="text-h2 font-mono font-bold text-gray-900 mb-2">
              {formatTime(seconds)}
            </p>
            <p className="text-body-sm text-gray-500 mb-4">
              {isRecording ? '녹음 중... 버튼을 눌러 종료하세요' : '버튼을 눌러 녹음을 시작하세요'}
            </p>

            {showResults && (
              <Button
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={resetRecording}
              >
                다시 녹음하기
              </Button>
            )}
          </Card>
        </div>

        {/* 오른쪽: 결과 (60%) */}
        <div className="w-full md:w-[60%] space-y-6">
          {showResults ? (
            <>
              {/* 점수 */}
              <Card className="flex flex-col items-center py-6">
                <h3 className="text-body font-semibold text-gray-900 mb-4">종합 점수</h3>
                <ScoreGauge
                  score={mockVoiceFeedbackResult.score}
                  label="점"
                  color="#3B82F6"
                  size={160}
                />
              </Card>

              {/* 키워드 분석 */}
              <Card>
                <h3 className="text-body font-semibold text-gray-900 mb-4">키워드 분석</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-h3 font-bold text-green-600">
                      {mockVoiceFeedbackResult.correct}
                    </p>
                    <p className="text-caption text-green-600">정확</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-h3 font-bold text-amber-600">
                      {mockVoiceFeedbackResult.inaccurate}
                    </p>
                    <p className="text-caption text-amber-600">부정확</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-h3 font-bold text-red-600">
                      {mockVoiceFeedbackResult.missing}
                    </p>
                    <p className="text-caption text-red-600">누락</p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {mockKeywords.map((kw) => {
                    const config = keywordStatusConfig[kw.status]
                    return (
                      <li
                        key={kw.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-body-sm text-gray-700">{kw.word}</span>
                        <Badge
                          variant={
                            kw.status === 'correct'
                              ? 'success'
                              : kw.status === 'inaccurate'
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {config.label}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              </Card>

              {/* AI 피드백 */}
              <Card>
                <h3 className="text-body font-semibold text-gray-900 mb-3">AI 피드백</h3>
                <p className="text-body-sm text-gray-700 leading-relaxed">
                  {mockVoiceFeedbackResult.feedback}
                </p>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-h3 font-semibold text-gray-500 mb-2">
                녹음 결과가 여기에 표시됩니다
              </h3>
              <p className="text-body-sm text-gray-400">
                왼쪽의 마이크 버튼을 눌러 녹음을 시작하세요
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
