import { useState, useEffect, useRef, useCallback } from 'react'
import { interviewApi } from '@/api/interview'
import { useToast } from '@/context/ToastContext'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Select from '@/components/common/Select'
import ScoreGauge from '@/components/charts/ScoreGauge'
import CategoryScoreBar from '@/components/charts/CategoryScoreBar'
import {
  Mic,
  MicOff,
  ArrowLeft,
  Play,
  RotateCcw,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Pencil,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  Trophy,
} from 'lucide-react'

// ─── 기본 선택지 (옵션 로드 전 표시용) ───────────────────────────
const DEFAULT_OPTIONS = {
  companies: [],
  positions: [],
  interview_types: [],
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function MockInterview() {
  const [view, setView] = useState('setup')

  // Options from API
  const [options, setOptions] = useState(DEFAULT_OPTIONS)

  // Setup state
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [interviewType, setInterviewType] = useState('')

  // Interview state
  const [messages, setMessages] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [sessionId, setSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Voice state
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [sttSupported, setSttSupported] = useState(true)
  const [answerConfirmed, setAnswerConfirmed] = useState(false)

  // Report state
  const [report, setReport] = useState(null)
  const [isEnding, setIsEnding] = useState(false) // 면접 종료 후 분석 중 상태

  // History state
  const [setupTab, setSetupTab] = useState('new') // 'new' | 'history'
  const [historyList, setHistoryList] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [detailMap, setDetailMap] = useState({}) // id -> detail

  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')
  const messagesEndRef = useRef(null)

  // 드롭다운 옵션 로드
  useEffect(() => {
    interviewApi.getOptions()
      .then((data) => setOptions(data))
      .catch(() => setOptions(DEFAULT_OPTIONS))
  }, [])

  // 면접 기록 탭 전환 시 목록 로드
  useEffect(() => {
    if (setupTab !== 'history') return
    setHistoryLoading(true)
    interviewApi.getHistory()
      .then((data) => setHistoryList(data))
      .catch(() => setHistoryList([]))
      .finally(() => setHistoryLoading(false))
  }, [setupTab])

  // 기록 아이템 클릭 시 상세 로드
  const handleExpandHistory = async (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (detailMap[id]) return // 이미 로드된 경우
    try {
      const detail = await interviewApi.getHistoryDetail(id)
      setDetailMap((prev) => ({ ...prev, [id]: detail }))
    } catch { /* 실패 시 기본 정보만 표시 */ }
  }

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
      if (recognitionRef.current?._active) recognition.start()
    }

    recognitionRef.current = recognition
  }, [])

  // 메시지 끝으로 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { showToast } = useToast()

  // 녹음 시작/중지
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current._active = false
      recognitionRef.current.stop()
      setIsRecording(false)
      setAnswerConfirmed(false)
    } else {
      finalTranscriptRef.current = ''
      setTranscript('')
      setAnswerConfirmed(false)
      if (recognitionRef.current) {
        recognitionRef.current._active = true
        recognitionRef.current.start()
      }
      setIsRecording(true)
    }
  }, [isRecording])

  // 면접 시작
  const handleStartInterview = async () => {
    setIsLoading(true)
    try {
      const res = await interviewApi.start({ company, position, interview_type: interviewType })
      const { session_id, first_question, total_questions } = res

      setSessionId(session_id)
      setCurrentQuestion(first_question)
      setQuestionNumber(1)
      setTotalQuestions(total_questions ?? 10)
      setMessages([{ role: 'ai', content: first_question }])
      setTranscript('')
      setAnswerConfirmed(false)
      finalTranscriptRef.current = ''
      setView('interview')
    } catch {
      showToast({ type: 'error', message: '면접 시작에 실패했습니다. 다시 시도해주세요.' })
    } finally {
      setIsLoading(false)
    }
  }

  // 답변 제출
  const handleSubmitAnswer = async () => {
    if (!transcript.trim()) return
    setIsLoading(true)

    const userAnswer = transcript.trim()
    const updatedMessages = [...messages, { role: 'user', content: userAnswer }]
    setMessages(updatedMessages)

    try {
      const res = await interviewApi.answer({ session_id: sessionId, answer: userAnswer })
      const { next_question, question_number, is_finished } = res

      finalTranscriptRef.current = ''
      setTranscript('')
      setAnswerConfirmed(false)

      if (is_finished) {
        const finalMessages = [...updatedMessages, { role: 'ai', content: '면접이 종료되었습니다. 수고하셨습니다!' }]
        setMessages(finalMessages)
        setCurrentQuestion('')
        setIsEnding(true)
        try {
          const reportData = await interviewApi.end({ session_id: sessionId })
          setReport(reportData)
        } catch {
          setReport({ total_score: 0, categories: [], summary: '리포트를 불러오지 못했습니다.', improvements: [] })
        }
        setIsEnding(false)
        setView('report')
      } else {
        const newMessages = [...updatedMessages, { role: 'ai', content: next_question }]
        setMessages(newMessages)
        setCurrentQuestion(next_question)
        setQuestionNumber(question_number)
      }
    } catch {
      showToast({ type: 'error', message: '답변 제출에 실패했습니다. 다시 시도해주세요.' })
    } finally {
      setIsLoading(false)
    }
  }

  // 면접 강제 종료 → 리포트
  const handleEndInterview = async () => {
    if (recognitionRef.current) {
      recognitionRef.current._active = false
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    setIsEnding(true)
    try {
      const reportData = await interviewApi.end({ session_id: sessionId })
      setReport(reportData)
    } catch {
      setReport({ total_score: 0, categories: [], summary: '리포트를 불러오지 못했습니다.', improvements: [] })
    }
    setIsEnding(false)
    setView('report')
  }

  // 새 면접
  const handleNewInterview = () => {
    setCompany('')
    setPosition('')
    setInterviewType('')
    setMessages([])
    setCurrentQuestion('')
    setQuestionNumber(1)
    setSessionId(null)
    setTranscript('')
    setReport(null)
    setAnswerConfirmed(false)
    finalTranscriptRef.current = ''
    // 기록 탭 데이터 초기화 → 탭 전환 시 재조회
    setHistoryList([])
    setExpandedId(null)
    setDetailMap({})
    setSetupTab('new')
    setView('setup')
  }

  const companyLabel = options.companies?.find((c) => c.value === company)?.label ?? company
  const positionLabel = options.positions?.find((p) => p.value === position)?.label ?? position
  const typeLabel = options.interview_types?.find((t) => t.value === interviewType)?.label ?? ''

  // ─── 점수 색상 헬퍼 ──────────────────────────────────────────────
  function scoreColor(s) {
    if (s >= 80) return { ring: 'ring-green-400', text: 'text-green-600', bg: 'bg-green-50' }
    if (s >= 60) return { ring: 'ring-blue-400', text: 'text-blue-600', bg: 'bg-blue-50' }
    if (s >= 40) return { ring: 'ring-orange-400', text: 'text-orange-600', bg: 'bg-orange-50' }
    return { ring: 'ring-red-400', text: 'text-red-600', bg: 'bg-red-50' }
  }

  function getLabel(list, val) {
    return list?.find((o) => o.value === val)?.label ?? val
  }

  // ─── Setup View ──────────────────────────────────────────────────
  if (view === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 font-bold text-gray-900">AI 모의면접</h1>
          <p className="text-body-sm text-gray-500 mt-1">
            음성으로 실전처럼 면접을 연습하고 AI 피드백을 받아보세요.
          </p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {[
            { key: 'new', label: '새 면접', icon: Play },
            { key: 'history', label: '면접 기록', icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSetupTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-sm font-semibold transition-all ${
                setupTab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── 새 면접 탭 ── */}
        {setupTab === 'new' && (
          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-4">면접 설정</h2>

            {!sttSupported && (
              <div className="flex items-center gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-body-sm text-amber-700">
                  이 브라우저는 음성 인식을 지원하지 않습니다.{' '}
                  <strong>Chrome</strong>에서 이용해주세요.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Select
                label="지원 회사"
                options={options.companies ?? []}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="회사를 선택하세요"
              />
              <Select
                label="지원 포지션"
                options={options.positions ?? []}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="포지션을 선택하세요"
              />
              <Select
                label="면접 유형"
                options={options.interview_types ?? []}
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                placeholder="면접 유형을 선택하세요"
              />

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Mic className="w-4 h-4 text-blue-500" />
                  <span className="text-body-sm font-semibold text-blue-700">음성 면접</span>
                </div>
                <p className="text-body-sm text-blue-600">
                  마이크로 답변을 녹음하고, 인식된 텍스트를 직접 수정한 뒤 제출할 수 있습니다.
                </p>
              </div>

              <Button
                fullWidth
                icon={Play}
                onClick={handleStartInterview}
                disabled={!company || !position || !interviewType || isLoading}
                loading={isLoading}
              >
                면접 시작
              </Button>
            </div>
          </Card>
        )}

        {/* ── 면접 기록 탭 ── */}
        {setupTab === 'history' && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="w-5 h-5 text-student-400 animate-spin" />
                <span className="text-body-sm text-gray-400">기록을 불러오는 중...</span>
              </div>
            ) : historyList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-body text-gray-400">아직 면접 기록이 없습니다</p>
                <p className="text-caption text-gray-300 mt-1">새 면접을 시작해보세요</p>
              </div>
            ) : (
              historyList.map((item) => {
                const sc = scoreColor(item.score)
                const isOpen = expandedId === item.id
                const detail = detailMap[item.id]
                const compLabel = getLabel(options.companies, item.company)
                const posLabel = getLabel(options.positions, item.position)
                const typeLabel2 = getLabel(options.interview_types, item.interview_type)
                const dateStr = new Date(item.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })

                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* 헤더 행 */}
                    <button
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                      onClick={() => handleExpandHistory(item.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* 점수 원형 */}
                        <div className={`shrink-0 w-14 h-14 rounded-full ring-2 ${sc.ring} ${sc.bg} flex items-center justify-center`}>
                          <span className={`text-body font-extrabold ${sc.text}`}>{item.score}</span>
                        </div>
                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-body font-bold text-gray-900">{compLabel}</span>
                            <span className="text-caption text-gray-400">·</span>
                            <span className="text-body-sm text-gray-600">{posLabel}</span>
                            <span className={`text-caption px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500`}>
                              {typeLabel2}
                            </span>
                          </div>
                          <p className="text-caption text-gray-400">{dateStr}</p>
                        </div>
                        {/* 토글 */}
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        }
                      </div>
                    </button>

                    {/* 펼침 상세 */}
                    {isOpen && (
                      <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                        {/* 로딩 */}
                        {!detail ? (
                          <div className="flex items-center justify-center py-6 gap-2">
                            <Loader2 className="w-4 h-4 text-student-400 animate-spin" />
                            <span className="text-body-sm text-gray-400">상세 기록 불러오는 중...</span>
                          </div>
                        ) : (
                          <>
                            {/* 영역별 점수 */}
                            {(detail.categories?.length ?? 0) > 0 && (
                              <div>
                                <p className="text-body-sm font-semibold text-gray-700 mb-3">영역별 점수</p>
                                <div className="space-y-2">
                                  {detail.categories.map((cat) => {
                                    const catSc = scoreColor(cat.score)
                                    return (
                                      <div key={cat.name} className="flex items-center gap-3">
                                        <span className="text-body-sm text-gray-600 w-24 shrink-0">{cat.name}</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${catSc.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
                                            style={{ width: `${cat.score}%` }}
                                          />
                                        </div>
                                        <span className={`text-body-sm font-bold w-8 text-right ${catSc.text}`}>{cat.score}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* AI 총평 */}
                            {detail.summary && (
                              <div className="p-4 bg-student-50 rounded-xl border border-student-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Sparkles className="w-3.5 h-3.5 text-student-500" />
                                  <p className="text-body-sm font-semibold text-student-700">AI 총평</p>
                                </div>
                                <p className="text-body-sm text-gray-700 leading-relaxed">{detail.summary}</p>
                              </div>
                            )}

                            {/* 개선 포인트 */}
                            {detail.improvements?.length > 0 && (
                              <div>
                                <p className="text-body-sm font-semibold text-gray-700 mb-2">개선 포인트</p>
                                <ul className="space-y-1.5">
                                  {detail.improvements.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-body-sm text-gray-600">
                                      <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-caption font-bold mt-0.5">{i + 1}</span>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Q&A 기록 */}
                            {detail.questions?.length > 0 && (
                              <div>
                                <p className="text-body-sm font-semibold text-gray-700 mb-3">면접 Q&A</p>
                                <div className="space-y-3">
                                  {detail.questions.map((q, i) => (
                                    <div key={i} className="space-y-1.5">
                                      <div className="flex items-start gap-2">
                                        <span className="shrink-0 px-1.5 py-0.5 rounded text-caption font-bold bg-gray-100 text-gray-500">Q{i + 1}</span>
                                        <p className="text-body-sm text-gray-700 leading-relaxed">{q}</p>
                                      </div>
                                      {detail.answers?.[i] && (
                                        <div className="flex items-start gap-2 ml-1">
                                          <span className="shrink-0 px-1.5 py-0.5 rounded text-caption font-bold bg-student-100 text-student-600">A</span>
                                          <p className="text-body-sm text-gray-600 leading-relaxed">{detail.answers[i]}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Analyzing View (면접 분석 중 로딩 화면) ─────────────────────
  if (isEnding) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-student-100 flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-student-500" />
          </div>
          <Loader2 className="absolute -inset-2 w-24 h-24 text-student-400 animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-h3 font-bold text-gray-900">AI가 면접을 분석하고 있습니다</p>
          <p className="text-body-sm text-gray-500">답변 내용을 종합해 상세 리포트를 생성 중입니다...</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-student-400 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── Interview View ───────────────────────────────────────────────
  if (view === 'interview') {
    const isLastQuestion = questionNumber >= totalQuestions
    const canSubmit = transcript.trim().length > 0 && !isRecording && !isLoading

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
          <button
            onClick={() => setView('setup')}
            className="flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            설정
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="student">
              {questionNumber}/{totalQuestions}
            </Badge>
            <span className="text-body-sm text-gray-500 hidden sm:block">
              {companyLabel} · {positionLabel}
            </span>
            <Badge variant="default">{typeLabel}</Badge>
          </div>
          <Button variant="danger" size="sm" onClick={handleEndInterview}>
            면접 종료
          </Button>
        </div>

        {/* 대화 히스토리 */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef2f4]">
                  <Sparkles className="h-3.5 w-3.5 text-[#6f8391]" />
                </div>
              )}
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'rounded-br-md bg-[#4e5a61] text-white'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
              >
                <p className="text-body-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 음성 입력 영역 */}
        <div className="shrink-0 pt-3 border-t border-gray-200 space-y-3">
          {/* 실시간 transcript + 직접 편집 */}
          {(isRecording || transcript) && (
            <div
              className={`rounded-xl border overflow-hidden transition-colors ${
                isRecording
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-300 bg-white focus-within:border-student-400'
              }`}
            >
              {/* 상태 레이블 바 */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 border-b ${
                  isRecording
                    ? 'border-red-100 bg-red-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-caption font-medium text-red-500">녹음 중...</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-3 h-3 text-gray-400" />
                    <span className="text-caption font-medium text-gray-400">
                      인식된 답변 — 직접 수정 후 제출하세요
                    </span>
                  </>
                )}
              </div>
              {/* 편집 가능한 textarea */}
              <textarea
                value={transcript}
                readOnly={isRecording}
                onChange={(e) => {
                  finalTranscriptRef.current = e.target.value
                  setTranscript(e.target.value)
                }}
                rows={3}
                placeholder="(인식된 내용이 없습니다)"
                className={`w-full px-3 py-2.5 text-body-sm text-gray-800 leading-relaxed resize-none outline-none bg-transparent placeholder:text-gray-300 ${
                  isRecording ? 'cursor-default' : 'cursor-text'
                }`}
              />
            </div>
          )}

          {/* 컨트롤 영역 */}
          <div className="flex items-center justify-between gap-3">
            {/* 다시 녹음 버튼 */}
            {transcript && !isRecording && (
              <button
                onClick={() => {
                  finalTranscriptRef.current = ''
                  setTranscript('')
                  setAnswerConfirmed(false)
                }}
                className="flex items-center gap-1.5 text-body-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                다시
              </button>
            )}

            {/* 마이크 버튼 (중앙) */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <button
                  onClick={toggleRecording}
                  disabled={!sttSupported || isLoading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                      : 'bg-[#4e5a61] hover:bg-[#414b51] shadow-[#4e5a61]/30'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isRecording ? (
                    <MicOff className="w-7 h-7 text-white" />
                  ) : (
                    <Mic className="w-7 h-7 text-white" />
                  )}
                </button>
                {isRecording && (
                  <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping pointer-events-none" />
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <Button
              size="md"
              onClick={handleSubmitAnswer}
              disabled={!canSubmit}
              loading={isLoading}
            >
              {isLastQuestion ? '면접 완료' : '답변 제출'}
            </Button>
          </div>

          {!isRecording && !transcript && (
            <p className="text-caption text-gray-400 text-center pb-1">
              마이크 버튼을 눌러 답변을 시작하세요
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Report View ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-h2 font-bold text-gray-900">면접 리포트</h1>
        <Badge variant="student">{companyLabel}</Badge>
        <Badge variant="default">{positionLabel}</Badge>
        <Badge variant="info">{typeLabel}</Badge>
      </div>

      {/* 종합 점수 */}
      <Card className="flex flex-col items-center py-8">
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">종합 점수</h2>
        <ScoreGauge score={report.total_score} label="총점" size={160} />
      </Card>

      {/* 영역별 점수 */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">영역별 점수</h2>
        <CategoryScoreBar categories={report.categories} />
      </Card>

      {/* 총평 */}
      <Card>
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-student-500" />
          <h2 className="text-h3 font-semibold text-gray-900">AI 총평</h2>
        </div>
        <p className="text-body-sm text-gray-700 leading-relaxed">{report.summary}</p>
      </Card>

      {/* 개선 포인트 */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-3">개선 포인트</h2>
        <ul className="space-y-2">
          {report.improvements.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2 text-body-sm text-gray-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-student-100 text-student-600 flex items-center justify-center text-caption font-semibold mt-0.5">
                {idx + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <Button fullWidth icon={RotateCcw} onClick={handleNewInterview}>
        새 면접 시작
      </Button>
    </div>
  )
}
