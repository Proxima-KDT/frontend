import { useState, useEffect, useRef, useCallback } from 'react'
import { interviewApi } from '@/api/interview'
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

// ??? 湲곕낯 ?좏깮吏 (?듭뀡 濡쒕뱶 ???쒖떆?? ???????????????????????????
const DEFAULT_OPTIONS = {
  companies: [],
  positions: [],
  interview_types: [],
}

// ??? TTS ?ы띁 ?????????????????????????????????????????????????????
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

// ??? 硫붿씤 而댄룷?뚰듃 ?????????????????????????????????????????????????
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
  const [totalQuestions, setTotalQuestions] = useState(7)
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

  // ?쒕∼?ㅼ슫 ?듭뀡 濡쒕뱶
  useEffect(() => {
    interviewApi.getOptions()
      .then((data) => setOptions(data))
      .catch(() => setOptions(DEFAULT_OPTIONS))
  }, [])

  // Web Speech API 珥덇린??  useEffect(() => {
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

  // ??吏덈Ц 諛쏆쓣 ??TTS ?ㅽ뻾
  useEffect(() => {
    if (currentQuestion && isTtsEnabled && view === 'interview') {
      setIsSpeaking(true)
      speakText(currentQuestion, () => setIsSpeaking(false))
    }
  }, [currentQuestion])

  // 硫붿떆吏 ?앹쑝濡??먮룞 ?ㅽ겕濡?  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ?뱀쓬 ?쒖옉/以묒?
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

  // 硫댁젒 ?쒖옉
  const handleStartInterview = async () => {
    setIsLoading(true)
    try {
      const res = await interviewApi.start({ company, position, interview_type: interviewType })
      const { session_id, first_question, total_questions } = res

      setSessionId(session_id)
      setCurrentQuestion(first_question)
      setQuestionNumber(1)
      setTotalQuestions(total_questions ?? 7)
      setMessages([{ role: 'ai', content: first_question }])
      setTranscript('')
      setAnswerConfirmed(false)
      finalTranscriptRef.current = ''
      setView('interview')
    } catch {
      // ?쒖옉 ?ㅽ뙣 ???먮윭??Axios interceptor?먯꽌 泥섎━??    } finally {
      setIsLoading(false)
    }
  }

  // ?듬? ?쒖텧
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
        const finalMessages = [...updatedMessages, { role: 'ai', content: '硫댁젒??醫낅즺?섏뿀?듬땲?? ?섍퀬?섏뀲?듬땲??' }]
        setMessages(finalMessages)
        setCurrentQuestion('')

        setTimeout(async () => {
          try {
            const reportData = await interviewApi.end({ session_id: sessionId })
            setReport(reportData)
          } catch {
            setReport({ total_score: 0, categories: [], summary: '由ы룷?몃? 遺덈윭?ㅼ? 紐삵뻽?듬땲??', improvements: [] })
          }
          setView('report')
        }, 2000)
      } else {
        const newMessages = [...updatedMessages, { role: 'ai', content: next_question }]
        setMessages(newMessages)
        setCurrentQuestion(next_question)
        setQuestionNumber(question_number)
      }
    } catch {
      // ?쒖텧 ?ㅽ뙣
    } finally {
      setIsLoading(false)
    }
  }

  // 硫댁젒 媛뺤젣 醫낅즺 ??由ы룷??  const handleEndInterview = async () => {
    stopSpeaking()
    if (recognitionRef.current) {
      recognitionRef.current._active = false
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    try {
      const reportData = await interviewApi.end({ session_id: sessionId })
      setReport(reportData)
    } catch {
      setReport({ total_score: 0, categories: [], summary: '由ы룷?몃? 遺덈윭?ㅼ? 紐삵뻽?듬땲??', improvements: [] })
    }
    setView('report')
  }

  // ??硫댁젒
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

  const companyLabel = options.companies?.find((c) => c.value === company)?.label ?? company
  const positionLabel = options.positions?.find((p) => p.value === position)?.label ?? position
  const typeLabel = options.interview_types?.find((t) => t.value === interviewType)?.label ?? ''

  // ??? Setup View ??????????????????????????????????????????????????
  if (view === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 font-bold text-gray-900">AI 紐⑥쓽硫댁젒</h1>
          <p className="text-body-sm text-gray-500 mt-1">
            ?뚯꽦?쇰줈 ?ㅼ쟾泥섎읆 硫댁젒???곗뒿?섍퀬 AI ?쇰뱶諛깆쓣 諛쏆븘蹂댁꽭??
          </p>
        </div>

        <Card>
          <h2 className="text-h3 font-semibold text-gray-900 mb-4">硫댁젒 ?ㅼ젙</h2>

          {!sttSupported && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-body-sm text-amber-700">
                ??釉뚮씪?곗????뚯꽦 ?몄떇??吏?먰븯吏 ?딆뒿?덈떎.{' '}
                <strong>Chrome</strong>?먯꽌 ?댁슜?댁＜?몄슂.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Select
              label="吏???뚯궗"
              options={options.companies ?? []}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="?뚯궗瑜??좏깮?섏꽭??
            />
            <Select
              label="吏???ъ???
              options={options.positions ?? []}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="?ъ??섏쓣 ?좏깮?섏꽭??
            />
            <Select
              label="硫댁젒 ?좏삎"
              options={options.interview_types ?? []}
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              placeholder="硫댁젒 ?좏삎???좏깮?섏꽭??
            />

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Mic className="w-4 h-4 text-blue-500" />
                <span className="text-body-sm font-semibold text-blue-700">?뚯꽦 ?꾩슜 硫댁젒</span>
              </div>
              <p className="text-body-sm text-blue-600">
                留덉씠?щ줈 ?듬??섍퀬, AI媛 吏덈Ц???뚯꽦?쇰줈 ?쎌뼱以띾땲?? ?ㅼ쟾 硫댁젒泥섎읆 以鍮꾪븯?몄슂.
              </p>
            </div>

            <Button
              fullWidth
              variant="warm"
              icon={Play}
              onClick={handleStartInterview}
              disabled={!company || !position || !interviewType || isLoading}
              loading={isLoading}
            >
              硫댁젒 ?쒖옉
            </Button>
          </div>
        </Card>

      </div>
    )
  }

  // ??? Interview View ???????????????????????????????????????????????
  if (view === 'interview') {
    const isLastQuestion = questionNumber >= totalQuestions
    const canSubmit = transcript.trim().length > 0 && !isRecording && !isLoading

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* ?ㅻ뜑 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
          <button
            onClick={() => setView('setup')}
            className="flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ?ㅼ젙
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="student">
              {questionNumber}/{totalQuestions}
            </Badge>
            <span className="text-body-sm text-gray-500 hidden sm:block">
              {companyLabel} 쨌 {positionLabel}
            </span>
            <Badge variant="default">{typeLabel}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* TTS ?좉? */}
            <button
              onClick={() => {
                if (isTtsEnabled) stopSpeaking()
                setIsTtsEnabled((v) => !v)
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={isTtsEnabled ? '?뚯꽦 ?꾧린' : '?뚯꽦 耳쒓린'}
            >
              {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <Button variant="danger" size="sm" onClick={handleEndInterview}>
              硫댁젒 醫낅즺
            </Button>
          </div>
        </div>

        {/* ????덉뒪?좊━ */}
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

        {/* ?뚯꽦 ?낅젰 ?곸뿭 */}
        <div className="shrink-0 pt-3 border-t border-gray-200 space-y-3">
          {/* TTS ?곹깭 ?쒖떆 */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-4 w-1 animate-bounce rounded-full bg-[#8aa0b1]"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-body-sm text-[#6f8391]">硫댁젒愿??吏덈Ц 以?..</span>
            </div>
          )}

          {/* ?ㅼ떆媛?transcript */}
          {(isRecording || transcript) && (
            <div
              className={`p-3 rounded-xl border text-body-sm leading-relaxed ${
                isRecording
                  ? 'bg-red-50 border-red-100 text-gray-700'
                  : answerConfirmed
                  ? 'border-[#e3edf3] bg-[#f4f8fb] text-gray-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {isRecording ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-caption font-medium text-red-500">?뱀쓬 以?..</span>
                  </>
                ) : answerConfirmed ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-[#6f8391]" />
                    <span className="text-caption font-medium text-[#4f6475]">?듬? ?뺤젙</span>
                  </>
                ) : (
                  <span className="text-caption font-medium text-gray-400">?몄떇???듬?</span>
                )}
              </div>
              <p>{transcript || '(?몄떇???댁슜???놁뒿?덈떎)'}</p>
            </div>
          )}

          {/* 而⑦듃濡??곸뿭 */}
          <div className="flex items-center justify-between gap-3">
            {/* ?ㅼ떆 ?뱀쓬 踰꾪듉 */}
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
                ?ㅼ떆
              </button>
            )}

            {/* 留덉씠??踰꾪듉 (以묒븰) */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <button
                  onClick={toggleRecording}
                  disabled={!sttSupported || isLoading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                      : 'bg-[#4e5a61] hover:bg-[#424d53] shadow-[#4e5a61]/30'
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

            {/* ?쒖텧 踰꾪듉 */}
            <Button
              size="md"
              onClick={handleSubmitAnswer}
              disabled={!canSubmit}
              loading={isLoading}
            >
              {isLastQuestion ? '硫댁젒 ?꾨즺' : '?듬? ?쒖텧'}
            </Button>
          </div>

          {!isRecording && !transcript && (
            <p className="text-caption text-gray-400 text-center pb-1">
              留덉씠??踰꾪듉???뚮윭 ?듬????쒖옉?섏꽭??            </p>
          )}
        </div>
      </div>
    )
  }

  // ??? Report View ??????????????????????????????????????????????????
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-h2 font-bold text-gray-900">硫댁젒 由ы룷??/h1>
        <Badge variant="student">{companyLabel}</Badge>
        <Badge variant="default">{positionLabel}</Badge>
        <Badge variant="info">{typeLabel}</Badge>
      </div>

      {/* 醫낇빀 ?먯닔 */}
      <Card className="flex flex-col items-center py-8">
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">醫낇빀 ?먯닔</h2>
        <ScoreGauge score={report.total_score} label="珥앹젏" size={160} />
      </Card>

      {/* ?곸뿭蹂??먯닔 */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">?곸뿭蹂??먯닔</h2>
        <CategoryScoreBar categories={report.categories} />
      </Card>

      {/* 珥앺룊 */}
      <Card>
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-[#6f8391]" />
          <h2 className="text-h3 font-semibold text-gray-900">AI 珥앺룊</h2>
        </div>
        <p className="text-body-sm text-gray-700 leading-relaxed">{report.summary}</p>
      </Card>

      {/* 媛쒖꽑 ?ъ씤??*/}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-3">媛쒖꽑 ?ъ씤??/h2>
        <ul className="space-y-2">
          {report.improvements.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2 text-body-sm text-gray-700">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#eef2f4] text-caption font-semibold text-[#4e5a61]">
                {idx + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <Button fullWidth icon={RotateCcw} onClick={handleNewInterview}>
        ??硫댁젒 ?쒖옉
      </Button>
    </div>
  )
}
