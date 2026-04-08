import { useState, useEffect, useRef, useCallback } from 'react'
import { mockInterviewHistory } from '@/data/mockData'
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
  Volume2,
  VolumeX,
  AlertCircle,
  Sparkles,
  CheckCircle,
} from 'lucide-react'

// ─── 드롭다운 선택지 ───────────────────────────────────────────────
const COMPANIES = [
  { value: 'naver', label: '네이버' },
  { value: 'kakao', label: '카카오' },
  { value: 'line', label: '라인' },
  { value: 'coupang', label: '쿠팡' },
  { value: 'samsung_sds', label: '삼성SDS' },
  { value: 'lg_cns', label: 'LG CNS' },
  { value: 'sk_telecom', label: 'SK텔레콤' },
  { value: 'toss', label: '토스' },
  { value: 'kakaobank', label: '카카오뱅크' },
  { value: 'startup', label: '스타트업 (일반)' },
]

const POSITIONS = [
  { value: 'frontend', label: '프론트엔드 개발자' },
  { value: 'backend', label: '백엔드 개발자' },
  { value: 'fullstack', label: '풀스택 개발자' },
  { value: 'data_engineer', label: '데이터 엔지니어' },
  { value: 'devops', label: 'DevOps/클라우드 엔지니어' },
  { value: 'mobile', label: '모바일 개발자' },
]

const INTERVIEW_TYPES = [
  { value: 'technical', label: '기술 면접' },
  { value: 'personality', label: '인성 면접' },
  { value: 'mixed', label: '복합 면접 (기술+인성)' },
]

const TOTAL_QUESTIONS = 7

// ─── 목 질문 (백엔드 연동 전) ─────────────────────────────────────
const MOCK_QUESTIONS = {
  technical: [
    '안녕하세요! AI 모의면접을 시작하겠습니다. 간단하게 자기소개를 해주세요.',
    '본인이 가장 자신 있는 기술 스택과 그 이유를 설명해주세요.',
    'REST API와 GraphQL의 차이점을 설명해주세요.',
    '데이터베이스에서 인덱스가 무엇이고, 언제 사용하면 좋은지 설명해주세요.',
    '동기(Synchronous)와 비동기(Asynchronous) 처리의 차이점을 설명해주세요.',
    '본인이 경험한 가장 어려웠던 기술적 문제와 해결 방법을 말씀해주세요.',
    '마지막으로 저희 회사에 지원하신 이유와 포부를 말씀해주세요.',
  ],
  personality: [
    '안녕하세요! AI 모의면접을 시작하겠습니다. 간단하게 자기소개와 지원 동기를 말씀해주세요.',
    '팀 프로젝트에서 갈등이 생겼을 때 어떻게 해결하셨나요? 구체적인 경험을 말씀해주세요.',
    '본인의 장점과 단점은 무엇인가요?',
    '5년 후 커리어 목표가 무엇인가요?',
    '스트레스를 받을 때 어떻게 관리하시나요?',
    '리더 또는 팀원으로서 가장 인상 깊었던 경험을 말씀해주세요.',
    '마지막으로 하고 싶은 말씀이 있으신가요?',
  ],
  mixed: [
    '안녕하세요! AI 모의면접을 시작하겠습니다. 간단하게 자기소개를 해주세요.',
    '본인이 가장 자신 있는 기술 스택과 그 이유를 설명해주세요.',
    '팀 프로젝트에서 기술적 의견 충돌이 있었을 때 어떻게 해결하셨나요?',
    'REST API 설계 시 중요하게 고려하는 원칙은 무엇인가요?',
    '본인의 장점이 이 포지션에서 어떻게 발휘될 수 있다고 생각하시나요?',
    '최근 관심 있는 기술 트렌드와 그것을 어떻게 학습하고 있는지 말씀해주세요.',
    '마지막으로 저희 회사에 입사하고 싶은 이유를 말씀해주세요.',
  ],
}

const MOCK_REPORT = {
  total_score: 78,
  categories: [
    { name: '기술 지식', score: 80 },
    { name: '문제 해결', score: 75 },
    { name: '커뮤니케이션', score: 82 },
    { name: '논리적 사고', score: 76 },
  ],
  summary:
    '전반적으로 기술 개념에 대한 이해도가 높고 답변이 명확합니다. 구체적인 경험 사례를 더 풍부하게 제시하면 더욱 좋은 평가를 받을 수 있습니다. 커뮤니케이션 능력이 뛰어나며 면접관과의 상호작용도 자연스럽습니다.',
  improvements: [
    '답변 시 구체적인 숫자와 성과 지표를 포함해보세요',
    '기술적 설명에 실제 코드나 구현 경험을 연결지어 말씀해보세요',
    '답변 구조를 STAR(상황-과제-행동-결과) 방식으로 정리해보세요',
  ],
}

// ─── TTS 헬퍼 ─────────────────────────────────────────────────────
function speakText(text, onEnd) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'ko-KR'
  utter.rate = 0.95
  utter.pitch = 1
  if (onEnd) utter.onend = onEnd
  window.speechSynthesis.speak(utter)
}

function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

// ─── 이전 면접 기록 카드 ───────────────────────────────────────────
function HistoryCard({ record }) {
  const typeLabel = { text: '텍스트', voice: '음성' }
  return (
    <Card hoverable>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-body font-semibold text-gray-900 truncate">{record.company}</span>
            <Badge variant={record.mode === 'voice' ? 'info' : 'default'}>
              {typeLabel[record.mode] ?? record.mode}
            </Badge>
          </div>
          <p className="text-body-sm text-gray-500">{record.position}</p>
          <p className="text-caption text-gray-400 mt-1">{record.date}</p>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <span className="text-h3 font-bold text-student-500">{record.score}</span>
          <span className="text-caption text-gray-400">점</span>
        </div>
      </div>
    </Card>
  )
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function MockInterview() {
  const [view, setView] = useState('setup')

  // Setup state
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [interviewType, setInterviewType] = useState('')

  // Interview state
  const [messages, setMessages] = useState([]) // [{role:'ai'|'user', content}]
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [sessionId, setSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Voice state
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [sttSupported, setSttSupported] = useState(true)
  const [isTtsEnabled, setIsTtsEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [answerConfirmed, setAnswerConfirmed] = useState(false)

  // Report state
  const [report, setReport] = useState(null)

  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')
  const messagesEndRef = useRef(null)

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

  // 새 질문 받을 때 TTS 실행
  useEffect(() => {
    if (currentQuestion && isTtsEnabled && view === 'interview') {
      setIsSpeaking(true)
      speakText(currentQuestion, () => setIsSpeaking(false))
    }
  }, [currentQuestion])

  // 메시지 끝으로 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 녹음 시작/중지
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current._active = false
      recognitionRef.current.stop()
      setIsRecording(false)
      setAnswerConfirmed(false)
    } else {
      stopSpeaking()
      setIsSpeaking(false)
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
      // TODO: 백엔드 연동 후 실제 API 호출로 교체
      // const res = await startInterviewApi({ company, position, interview_type: interviewType })
      // const { session_id, first_question } = res

      const questions = MOCK_QUESTIONS[interviewType] || MOCK_QUESTIONS.technical
      const firstQuestion = questions[0]
      const mockSessionId = `mock-${Date.now()}`

      setSessionId(mockSessionId)
      setCurrentQuestion(firstQuestion)
      setQuestionNumber(1)
      setMessages([{ role: 'ai', content: firstQuestion }])
      setTranscript('')
      setAnswerConfirmed(false)
      finalTranscriptRef.current = ''
      setView('interview')
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
      // TODO: 백엔드 연동 후 실제 API 호출로 교체
      // const res = await submitAnswerApi({ session_id: sessionId, answer: userAnswer })
      // const { next_question, question_number, is_finished } = res

      const questions = MOCK_QUESTIONS[interviewType] || MOCK_QUESTIONS.technical
      const nextNum = questionNumber + 1
      const isFinished = questionNumber >= TOTAL_QUESTIONS

      finalTranscriptRef.current = ''
      setTranscript('')
      setAnswerConfirmed(false)

      if (isFinished) {
        const finalMessages = [...updatedMessages, { role: 'ai', content: '면접이 종료되었습니다. 수고하셨습니다!' }]
        setMessages(finalMessages)
        setCurrentQuestion('')

        // 잠시 후 리포트로 이동
        setTimeout(() => {
          setReport(MOCK_REPORT)
          setView('report')
        }, 2000)
      } else {
        const nextQuestion = questions[nextNum - 1]
        const newMessages = [...updatedMessages, { role: 'ai', content: nextQuestion }]
        setMessages(newMessages)
        setCurrentQuestion(nextQuestion)
        setQuestionNumber(nextNum)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 면접 강제 종료 → 리포트
  const handleEndInterview = async () => {
    stopSpeaking()
    if (recognitionRef.current) {
      recognitionRef.current._active = false
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    setReport(MOCK_REPORT)
    setView('report')
  }

  // 새 면접
  const handleNewInterview = () => {
    stopSpeaking()
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
    setView('setup')
  }

  const companyLabel = COMPANIES.find((c) => c.value === company)?.label ?? company
  const positionLabel = POSITIONS.find((p) => p.value === position)?.label ?? position
  const typeLabel = INTERVIEW_TYPES.find((t) => t.value === interviewType)?.label ?? ''

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
              options={COMPANIES}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="회사를 선택하세요"
            />
            <Select
              label="지원 포지션"
              options={POSITIONS}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="포지션을 선택하세요"
            />
            <Select
              label="면접 유형"
              options={INTERVIEW_TYPES}
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              placeholder="면접 유형을 선택하세요"
            />

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Mic className="w-4 h-4 text-blue-500" />
                <span className="text-body-sm font-semibold text-blue-700">음성 전용 면접</span>
              </div>
              <p className="text-body-sm text-blue-600">
                마이크로 답변하고, AI가 질문을 음성으로 읽어줍니다. 실전 면접처럼 준비하세요.
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

        {mockInterviewHistory.length > 0 && (
          <div>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">이전 면접 기록</h2>
            <div className="space-y-3">
              {mockInterviewHistory.map((item) => (
                <HistoryCard key={item.id} record={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Interview View ───────────────────────────────────────────────
  if (view === 'interview') {
    const isLastQuestion = questionNumber >= TOTAL_QUESTIONS
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
              {questionNumber}/{TOTAL_QUESTIONS}
            </Badge>
            <span className="text-body-sm text-gray-500 hidden sm:block">
              {companyLabel} · {positionLabel}
            </span>
            <Badge variant="default">{typeLabel}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* TTS 토글 */}
            <button
              onClick={() => {
                if (isTtsEnabled) stopSpeaking()
                setIsTtsEnabled((v) => !v)
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={isTtsEnabled ? '음성 끄기' : '음성 켜기'}
            >
              {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <Button variant="danger" size="sm" onClick={handleEndInterview}>
              면접 종료
            </Button>
          </div>
        </div>

        {/* 대화 히스토리 */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-student-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-student-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-student-500 text-white rounded-br-md'
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
          {/* TTS 상태 표시 */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-student-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-body-sm text-student-500">면접관이 질문 중...</span>
            </div>
          )}

          {/* 실시간 transcript */}
          {(isRecording || transcript) && (
            <div
              className={`p-3 rounded-xl border text-body-sm leading-relaxed ${
                isRecording
                  ? 'bg-red-50 border-red-100 text-gray-700'
                  : answerConfirmed
                  ? 'bg-green-50 border-green-200 text-gray-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {isRecording ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-caption font-medium text-red-500">녹음 중...</span>
                  </>
                ) : answerConfirmed ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-caption font-medium text-green-600">답변 확정</span>
                  </>
                ) : (
                  <span className="text-caption font-medium text-gray-400">인식된 답변</span>
                )}
              </div>
              <p>{transcript || '(인식된 내용이 없습니다)'}</p>
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
                      : 'bg-student-500 hover:bg-student-600 shadow-student-500/30'
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
        <p className="text-body-sm text-gray-500 mt-3">백엔드 연동 후 실제 AI 평가 반영</p>
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
