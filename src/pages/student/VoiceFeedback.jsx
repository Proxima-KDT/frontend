import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, RotateCcw, AlertCircle, ChevronDown, ChevronUp, Clock, Calendar, Sparkles } from 'lucide-react'
import { voiceApi } from '@/api/voice'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Tabs from '@/components/common/Tabs'
import ScoreGauge from '@/components/charts/ScoreGauge'
import Skeleton from '@/components/common/Skeleton'

const keywordStatusConfig = {
  correct: { color: 'bg-green-100 text-green-700 border-green-300', label: '정확' },
  inaccurate: { color: 'bg-amber-100 text-amber-700 border-amber-300', label: '부정확' },
  missing: { color: 'bg-red-100 text-red-700 border-red-300', label: '누락' },
}

const scoreBadge = (score) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

function HistoryCard({ record }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card padding="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-body-sm text-gray-400 mb-1.5">
            <Calendar className="w-4 h-4" />
            <span>{record.date} {record.time}</span>
            <Clock className="w-4 h-4 ml-1" />
            <span>{record.duration}</span>
          </div>
          <p className="text-body font-semibold text-gray-900 truncate">{record.topic}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={scoreBadge(record.score)}>
            {record.score}점
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-body-sm font-medium">정확 {record.correct}</span>
        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-body-sm font-medium">부정확 {record.inaccurate}</span>
        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-body-sm font-medium">누락 {record.missing}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(record.keywords ?? []).map((kw, i) => {
          const config = keywordStatusConfig[kw.status]
          return (
            <span
              key={i}
              className={`inline-flex items-center px-3 py-1 rounded-full text-body-sm font-medium border ${config?.color ?? ''}`}
            >
              {kw.word}
            </span>
          )
        })}
      </div>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-body-sm font-semibold text-blue-600">AI 피드백</span>
        </div>
        <p className="text-body-sm text-gray-700 leading-relaxed line-clamp-2">
          {record.feedback}
        </p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-body-sm text-primary-500 hover:text-primary-600 mt-3 transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {expanded ? '접기' : '인식된 발화 보기'}
      </button>

      {expanded && (
        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-body-sm font-medium text-gray-500 mb-1.5">인식된 발화</p>
          <p className="text-body-sm text-gray-700 leading-relaxed">{record.transcript}</p>
        </div>
      )}
    </Card>
  )
}

export default function VoiceFeedback() {
  const [activeTab, setActiveTab] = useState('practice')
  const [isRecording, setIsRecording] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [editedTranscript, setEditedTranscript] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [sttSupported, setSttSupported] = useState(true)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  const tabs = [
    { key: 'practice', label: '학습하기' },
    { key: 'history', label: '학습 기록' },
  ]

  // Web Speech API 초기화
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += e.results[i][0].transcript
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setTranscript(finalTranscriptRef.current + interim)
    }

    recognition.onend = () => {
      if (recognitionRef.current?._active) {
        recognition.start()
      } else {
        setEditedTranscript(finalTranscriptRef.current)
        setShowReview(true)
      }
    }

    recognitionRef.current = recognition
  }, [])

  // 타이머
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  // 히스토리 탭 전환 시 로드
  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryLoading(true)
      voiceApi.getHistory()
        .then((data) => setHistory(data))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false))
    }
  }, [activeTab])

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current._active = false
        recognitionRef.current.stop()
      }
      setIsRecording(false)
    } else {
      finalTranscriptRef.current = ''
      setTranscript('')
      setEditedTranscript('')
      setSeconds(0)
      setShowResults(false)
      setShowReview(false)
      setAnalysisResult(null)
      if (recognitionRef.current) {
        recognitionRef.current._active = true
        recognitionRef.current.start()
      }
      setIsRecording(true)
    }
  }

  const resetRecording = () => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setEditedTranscript('')
    setIsRecording(false)
    setShowResults(false)
    setShowReview(false)
    setAnalysisResult(null)
    setSeconds(0)
  }

  const handleSubmitAnalysis = async () => {
    setShowReview(false)
    setAnalyzing(true)
    try {
      const result = await voiceApi.analyze({
        transcript: editedTranscript,
        topic: topicInput || '자유 주제',
      })
      setAnalysisResult(result)
      setShowResults(true)
    } catch {
      setShowResults(true)
    } finally {
      setAnalyzing(false)
    }
  }

  const formatTime = (s) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  const keywords = analysisResult?.keywords ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1 font-bold text-gray-900">AI 말하기 학습</h1>
        <p className="text-body-sm text-gray-500 mt-1">
          오늘의 주제로 자유롭게 말하고, AI가 핵심 키워드 포함 여부를 분석해 학습 피드백을 제공합니다.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'practice' && (
        <>
          {!sttSupported && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-body-sm text-amber-700">
                이 브라우저는 음성 인식을 지원하지 않습니다. <strong>Chrome</strong>에서 이용해주세요.
              </p>
            </div>
          )}

          {/* 주제 입력 + 키워드 */}
          <Card padding="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-caption font-medium text-gray-500 mb-0.5">학습 주제</p>
                {showResults && analysisResult?.topic ? (
                  <h2 className="text-h3 font-bold text-gray-900">{analysisResult.topic}</h2>
                ) : (
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="학습할 주제를 입력하세요 (예: REST API 설명)"
                    disabled={isRecording || showReview || showResults}
                    className="w-full text-body-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-student-300 disabled:bg-gray-50"
                  />
                )}
              </div>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {keywords.map((kw, i) => {
                  const config = showResults ? keywordStatusConfig[kw.status] : null
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-medium border transition-colors duration-300
                        ${config ? config.color : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                    >
                      {kw.word}
                      {showResults && config && (
                        <span className="opacity-75">({config.label})</span>
                      )}
                    </span>
                  )
                })}
              </div>
            )}
          </Card>

          <div className="flex flex-col md:flex-row gap-4">
            {/* 왼쪽: 마이크 */}
            <div className="w-full md:w-[40%]">
              <Card className="flex flex-col items-center py-6 h-full">
                <div className="relative mb-4">
                  <button
                    onClick={toggleRecording}
                    disabled={!sttSupported}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30'
                        : 'bg-student-500 hover:bg-student-600 shadow-lg shadow-student-500/30'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? (
                      <MicOff className="w-10 h-10 text-white" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </button>
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping pointer-events-none" />
                  )}
                </div>

                <p className="text-h2 font-mono font-bold text-gray-900 mb-1">{formatTime(seconds)}</p>
                <p className="text-body-sm text-gray-500 mb-3">
                  {isRecording ? '녹음 중... 버튼을 눌러 종료하세요' : showReview ? '발화 내용을 확인해주세요' : showResults ? '녹음 완료' : '버튼을 눌러 녹음을 시작하세요'}
                </p>

                {(showResults || showReview) && (
                  <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetRecording} className="mb-3">
                    다시 녹음하기
                  </Button>
                )}

                {isRecording && transcript && (
                  <div className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-caption font-medium text-gray-400 mb-1">인식 중...</p>
                    <p className="text-body-sm text-gray-700 leading-relaxed">{transcript}</p>
                  </div>
                )}

                {showReview && (
                  <div className="w-full space-y-3">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-caption font-medium text-amber-600 mb-2">
                        인식된 발화 — 내용을 확인하고 수정할 수 있습니다
                      </p>
                      <textarea
                        value={editedTranscript}
                        onChange={(e) => setEditedTranscript(e.target.value)}
                        className="w-full text-body-sm text-gray-700 bg-white border border-amber-200 rounded-lg p-2.5 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-300"
                        rows={4}
                        placeholder="인식된 텍스트가 없습니다."
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      loading={analyzing}
                      onClick={handleSubmitAnalysis}
                    >
                      분석 요청
                    </Button>
                  </div>
                )}

                {showResults && (
                  <div className="w-full p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-caption font-medium text-blue-500 mb-1">인식된 발화</p>
                    <p className="text-body-sm text-gray-700 max-h-32 overflow-y-auto leading-relaxed">
                      {editedTranscript || '인식된 텍스트가 없습니다.'}
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* 오른쪽: 결과 */}
            <div className="w-full md:w-[60%] space-y-4">
              {showReview ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-h3 font-semibold text-gray-600 mb-2">발화 내용을 확인해주세요</h3>
                  <p className="text-body-sm text-gray-400">왼쪽에서 내용 확인 후 분석 요청을 눌러주세요</p>
                </Card>
              ) : showResults && analysisResult ? (
                <>
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <Card padding="p-4" className="flex flex-col items-center">
                      <h3 className="text-body font-semibold text-gray-900 mb-1">종합 점수</h3>
                      <ScoreGauge score={analysisResult.score ?? 0} label="점" color="#3B82F6" size={120} />
                    </Card>

                    <Card padding="p-4">
                      <h3 className="text-body font-semibold text-gray-900 mb-3">키워드 분석</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                          <p className="text-h2 font-bold text-green-600">{analysisResult.correct ?? 0}</p>
                          <p className="text-caption text-green-600 mt-0.5">정확</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-xl">
                          <p className="text-h2 font-bold text-amber-600">{analysisResult.inaccurate ?? 0}</p>
                          <p className="text-caption text-amber-600 mt-0.5">부정확</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                          <p className="text-h2 font-bold text-red-600">{analysisResult.missing ?? 0}</p>
                          <p className="text-caption text-red-600 mt-0.5">누락</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card padding="p-4">
                    <h3 className="text-body font-semibold text-gray-900 mb-1">AI 피드백</h3>
                    <p className="text-body-sm text-gray-700 leading-relaxed">{analysisResult.feedback}</p>
                  </Card>
                </>
              ) : (
                <Card className="flex flex-col items-center justify-center py-16 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Mic className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-h3 font-semibold text-gray-500 mb-2">학습 결과가 여기에 표시됩니다</h3>
                  <p className="text-body-sm text-gray-400">마이크 버튼을 눌러 말하기를 시작하세요</p>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {historyLoading ? (
            <>
              <Skeleton width="100%" height="120px" rounded="rounded-2xl" />
              <Skeleton width="100%" height="120px" rounded="rounded-2xl" />
            </>
          ) : history.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-h3 font-semibold text-gray-500 mb-2">학습 기록이 없습니다</h3>
              <p className="text-body-sm text-gray-400 mb-4">말하기 학습을 완료하면 여기에 기록이 저장됩니다.</p>
              <Button size="sm" onClick={() => setActiveTab('practice')}>학습 시작하기</Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-gray-500">총 {history.length}개의 학습 기록</p>
                <p className="text-caption text-gray-400">
                  평균 점수: {Math.round(history.reduce((s, r) => s + r.score, 0) / history.length)}점
                </p>
              </div>
              {history.map((record) => (
                <HistoryCard key={record.id} record={record} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
