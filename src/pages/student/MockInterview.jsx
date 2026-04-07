import { useState } from 'react'
import {
  mockInterviewMessages,
  mockInterviewReport,
  mockInterviewHistory,
} from '@/data/mockData'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Badge from '@/components/common/Badge'
import Toggle from '@/components/common/Toggle'
import ScoreGauge from '@/components/charts/ScoreGauge'
import CategoryScoreBar from '@/components/charts/CategoryScoreBar'
import { MessageSquare, Mic, Send, ArrowLeft, Play, RotateCcw } from 'lucide-react'

export default function MockInterview() {
  const [view, setView] = useState('setup')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [inputMessage, setInputMessage] = useState('')

  const handleStartInterview = () => {
    if (company.trim() && position.trim()) {
      setView('interview')
    }
  }

  const handleEndInterview = () => {
    setView('report')
  }

  const handleNewInterview = () => {
    setCompany('')
    setPosition('')
    setIsVoiceMode(false)
    setInputMessage('')
    setView('setup')
  }

  // --- Setup View ---
  if (view === 'setup') {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 font-bold text-gray-900">AI 모의면접</h1>

        <Card>
          <h2 className="text-h3 font-semibold text-gray-900 mb-4">면접 설정</h2>
          <div className="space-y-4">
            <Input
              label="지원 회사"
              placeholder="예: 네이버, 카카오"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Input
              label="지원 포지션"
              placeholder="예: 프론트엔드 개발자"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <span className="text-body-sm text-gray-700">텍스트</span>
                <Toggle
                  checked={isVoiceMode}
                  onChange={setIsVoiceMode}
                />
                <span className="text-body-sm text-gray-700">음성</span>
                <Mic className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <Button
              fullWidth
              icon={Play}
              onClick={handleStartInterview}
              disabled={!company.trim() || !position.trim()}
            >
              면접 시작
            </Button>
          </div>
        </Card>

        <div>
          <h2 className="text-h3 font-semibold text-gray-900 mb-3">이전 면접 기록</h2>
          {mockInterviewHistory.length === 0 ? (
            <Card>
              <p className="text-body-sm text-gray-400 text-center py-4">
                면접 기록이 없습니다.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {mockInterviewHistory.map((interview) => (
                <Card key={interview.id} hoverable>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-body font-semibold text-gray-900 truncate">
                          {interview.company}
                        </span>
                        <Badge variant={interview.mode === 'voice' ? 'info' : 'default'}>
                          {interview.mode === 'voice' ? '음성' : '텍스트'}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-gray-500">{interview.position}</p>
                      <p className="text-caption text-gray-400 mt-1">{interview.date}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <span className="text-h3 font-bold text-student-500">
                        {interview.score}
                      </span>
                      <span className="text-caption text-gray-400">점</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Interview View (Chat UI) ---
  if (view === 'interview') {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <button
            onClick={() => setView('setup')}
            className="flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="student">
              {Math.ceil(mockInterviewMessages.length / 2)}/7
            </Badge>
            <span className="text-body-sm text-gray-500">
              {company} &middot; {position}
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={handleEndInterview}>
            면접 종료
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {mockInterviewMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
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
        </div>

        {/* Input Area (sticky bottom) */}
        <div className="sticky bottom-0 pt-3 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="답변을 입력하세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                  }
                }}
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-body text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors"
              />
            </div>
            <Button size="md" icon={Send} disabled={!inputMessage.trim()}>
              전송
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Report View ---
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-h2 font-bold text-gray-900">면접 리포트</h1>
        <Badge variant="student">{company}</Badge>
      </div>

      {/* Total Score */}
      <Card className="flex flex-col items-center py-8">
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">종합 점수</h2>
        <ScoreGauge
          score={mockInterviewReport.total_score}
          label="총점"
          size={160}
        />
      </Card>

      {/* Category Scores */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">영역별 점수</h2>
        <CategoryScoreBar categories={mockInterviewReport.categories} />
      </Card>

      {/* Summary */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-3">총평</h2>
        <p className="text-body-sm text-gray-700 leading-relaxed">
          {mockInterviewReport.summary}
        </p>
      </Card>

      {/* Improvement Tips */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-3">개선 포인트</h2>
        <ul className="space-y-2">
          {mockInterviewReport.improvements.map((tip, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-body-sm text-gray-700"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-student-100 text-student-600 flex items-center justify-center text-caption font-semibold mt-0.5">
                {idx + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      {/* New Interview Button */}
      <Button fullWidth icon={RotateCcw} onClick={handleNewInterview}>
        새 면접 시작
      </Button>
    </div>
  )
}
