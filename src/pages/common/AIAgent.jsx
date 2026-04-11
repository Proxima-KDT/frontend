import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { aiAgentApi } from '@/api/ai-agent';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import * as Icons from 'lucide-react';

// ----------------------------------------------------------------------
// role 별 UI 설정 — title/chip/workflow 모두 여기서 분기
// ----------------------------------------------------------------------
const ROLE_CONFIG = {
  student: {
    title: 'AI 학습코치',
    subtitle: '내 출석·과제·점수를 자연어로 물어보세요',
    placeholder: '예) 내 출석률 알려줘',
    sideTitle: '내 학습 현황',
    chips: [
      '내 출석률 알려줘',
      '이번주 과제 뭐 있어?',
      '최근 점수 요약해줘',
      '앞으로 일정 뭐 있어?',
    ],
    workflows: [],
  },
  teacher: {
    title: 'AI 교수 브리핑',
    subtitle: '위험 학생·출석·과제를 즉시 파악하세요',
    placeholder: '예) 이번 주 위험 학생 알려줘',
    sideTitle: '오늘의 브리핑',
    chips: [
      '이번 주 위험 학생 알려줘',
      '오늘 결석 누구야?',
      '최근 과제 제출률',
      '상담 기록 요약해줘',
    ],
    workflows: [
      { name: 'teacher_daily_briefing', label: '일일 브리핑 생성', icon: 'Sparkles' },
      { name: 'proactive_risk_alert', label: '위험 학생 알림 제안', icon: 'Bell' },
    ],
  },
  admin: {
    title: 'AI 운영 모니터',
    subtitle: '코호트·장비·강의실 현황을 한눈에',
    placeholder: '예) 지금 사용 중인 장비 몇 대야',
    sideTitle: '운영 요약',
    chips: [
      '진행 중 코호트 진도',
      '장비 현황 요약',
      '강의실 사용률',
      '최근 시스템 경고',
    ],
    workflows: [
      { name: 'admin_weekly_report', label: '주간 리포트 생성', icon: 'FileText' },
    ],
  },
};

// ----------------------------------------------------------------------
// 공용 서브 컴포넌트 (같은 파일 내에 정의)
// ----------------------------------------------------------------------

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        <p className="text-body-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <details className="mt-2 text-caption opacity-80">
            <summary className="cursor-pointer select-none">
              🔧 {message.toolCalls.length}개 데이터 조회
            </summary>
            <ul className="mt-1 space-y-0.5">
              {message.toolCalls.map((tc, i) => (
                <li key={i} className="font-mono text-[10px] break-all">
                  {tc.name}({JSON.stringify(tc.args)})
                </li>
              ))}
            </ul>
          </details>
        )}
        {message.durationMs != null && (
          <p className="text-caption opacity-60 mt-1">{message.durationMs}ms</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ card }) {
  const Icon = Icons[card.icon] || Icons.BarChart3;
  const colorMap = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };
  const klass = colorMap[card.color] || colorMap.slate;
  return (
    <div className={`rounded-xl border p-3 ${klass}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <p className="text-caption font-medium opacity-80">{card.title}</p>
      </div>
      <p className="text-h3 font-bold">{card.value}</p>
      {card.sub && <p className="text-caption opacity-70 mt-0.5">{card.sub}</p>}
    </div>
  );
}

function WorkflowResultModal({ result, loading, onApprove, onReject, onClose }) {
  const isInterrupted = Boolean(result?.interrupted);
  const drafts = result?.result?.draft_notifications || [];
  const summary = result?.result?.summary;
  const sentIds = result?.result?.sent_ids;
  const trace = result?.graph_trace || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-h3 font-bold text-gray-900 flex items-center gap-2">
            {isInterrupted ? (
              <>
                <Icons.BellRing className="w-5 h-5 text-amber-500" />
                알림 발송 승인 대기
              </>
            ) : (
              <>
                <Icons.FileCheck className="w-5 h-5 text-emerald-500" />
                Workflow 결과
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            title="닫기"
          >
            <Icons.X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {summary && (
            <section>
              <p className="text-caption font-semibold text-gray-500 uppercase mb-2">
                요약
              </p>
              <p className="text-body-sm whitespace-pre-wrap text-gray-900 leading-relaxed">
                {summary}
              </p>
            </section>
          )}

          {isInterrupted && drafts.length > 0 && (
            <section>
              <p className="text-caption font-semibold text-gray-500 uppercase mb-2">
                발송 예정 알림 ({drafts.length}건)
              </p>
              <ul className="space-y-2">
                {drafts.map((d, i) => (
                  <li
                    key={i}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-caption px-2 py-0.5 rounded font-medium ${
                          d.severity === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {d.severity}
                      </span>
                      <span className="text-body-sm font-semibold text-gray-900">
                        {d.student_name}
                      </span>
                    </div>
                    <p className="text-caption text-gray-600 leading-relaxed">
                      {d.message}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sentIds && (
            <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-body-sm font-semibold text-emerald-700 flex items-center gap-2">
                <Icons.CheckCircle2 className="w-4 h-4" />
                {sentIds.length}건 발송 완료
              </p>
            </section>
          )}

          {trace.length > 0 && (
            <details className="text-caption">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
                Graph trace ({trace.length} 노드, 총 {result?.duration_ms}ms)
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-[10px] bg-gray-50 p-2 rounded">
                {trace.map((t, i) => (
                  <li key={i} className="text-gray-700">
                    <span className="text-violet-600">{t.node}</span>
                    {t.duration_ms != null && (
                      <span className="text-gray-400"> ({t.duration_ms}ms)</span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {isInterrupted && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
            <button
              onClick={onReject}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              거절
            </button>
            <button
              onClick={onApprove}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 font-medium"
            >
              {loading ? '처리 중...' : '승인하고 발송'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 메인 페이지
// ----------------------------------------------------------------------

export default function AIAgent() {
  const { user, role } = useAuth();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  // 채팅 상태
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // 사이드 패널
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Workflow
  const [workflowResult, setWorkflowResult] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(null);

  const messagesEndRef = useRef(null);
  const speech = useSpeechRecognition();

  // ---- Effects ----
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSummaryLoading(true);
      try {
        const data = await aiAgentApi.summary();
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled) setSummary({ role, cards: [] });
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (speech.transcript) setInput(speech.transcript);
  }, [speech.transcript]);

  // ---- Handlers ----
  const sendMessage = useCallback(
    async (textOverride) => {
      const content = (textOverride ?? input).trim();
      if (!content || isSending) return;

      const userMsg = { role: 'user', content };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsSending(true);
      setError(null);

      try {
        // history 는 최근 10턴만 전달 (role/content 만)
        const history = messages
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));
        const data = await aiAgentApi.chat(content, history);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            toolCalls: data.tool_calls,
            durationMs: data.duration_ms,
          },
        ]);
      } catch (e) {
        const errMsg =
          e.response?.data?.detail || e.message || '응답 생성 실패';
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `❌ ${errMsg}` },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, messages],
  );

  const handleChip = useCallback(
    (chip) => {
      setInput(chip);
      sendMessage(chip);
    },
    [sendMessage],
  );

  const handleMic = useCallback(() => {
    if (!speech.isSupported) {
      alert(
        '이 브라우저는 음성 입력을 지원하지 않습니다. Chrome 또는 Edge 에서 이용해주세요.',
      );
      return;
    }
    if (speech.isListening) {
      speech.stop();
    } else {
      speech.reset();
      speech.start();
    }
  }, [speech]);

  const runWorkflow = useCallback(async (name) => {
    setWorkflowLoading(name);
    setError(null);
    try {
      const result = await aiAgentApi.runWorkflow(name, {});
      setWorkflowResult(result);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Workflow 실행 실패');
    } finally {
      setWorkflowLoading(null);
    }
  }, []);

  const approveWorkflow = useCallback(async () => {
    if (!workflowResult?.thread_id) return;
    setWorkflowLoading('resume');
    try {
      const result = await aiAgentApi.resumeWorkflow(
        workflowResult.thread_id,
        true,
      );
      setWorkflowResult(result);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || '승인 실패');
    } finally {
      setWorkflowLoading(null);
    }
  }, [workflowResult]);

  const rejectWorkflow = useCallback(async () => {
    if (!workflowResult?.thread_id) return;
    setWorkflowLoading('resume');
    try {
      const result = await aiAgentApi.resumeWorkflow(
        workflowResult.thread_id,
        false,
      );
      setWorkflowResult(result);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || '거절 실패');
    } finally {
      setWorkflowLoading(null);
    }
  }, [workflowResult]);

  const reloadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await aiAgentApi.summary();
      setSummary(data);
    } catch {
      /* keep old */
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ---- Render ----
  return (
    <div className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-gray-900 flex items-center gap-2">
            <Icons.Sparkles className="w-6 h-6 text-violet-500" />
            {config.title}
          </h1>
          <p className="text-body-sm text-gray-500 mt-0.5">
            {config.subtitle}
          </p>
        </div>
        {user?.name && (
          <div className="hidden md:block text-right shrink-0">
            <p className="text-caption text-gray-400">{user.email}</p>
            <p className="text-body-sm font-semibold text-gray-700">
              {user.name} · {role}
            </p>
          </div>
        )}
      </div>

      {/* Main layout: col on mobile, row on lg+ */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Chat Panel */}
        <div className="flex-1 lg:order-1 bg-white rounded-2xl border border-gray-200 flex flex-col min-h-[560px]">
          {/* Workflow buttons (강사/관리자만) */}
          {config.workflows.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap gap-2">
              {config.workflows.map((wf) => {
                const Icon = Icons[wf.icon] || Icons.Play;
                const running = workflowLoading === wf.name;
                return (
                  <button
                    key={wf.name}
                    onClick={() => runWorkflow(wf.name)}
                    disabled={workflowLoading !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white text-caption font-medium hover:from-violet-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
                    {running ? '실행 중...' : wf.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Icons.MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-body-sm text-gray-500 mb-4">
                  아래 예시 질문을 눌러보거나 직접 질문을 입력해보세요
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                  {config.chips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleChip(chip)}
                      disabled={isSending}
                      className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-body-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-caption text-gray-400 pl-2 mb-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
                <span>AI가 생각 중...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMic}
                disabled={!speech.isSupported}
                title={
                  speech.isSupported
                    ? speech.isListening
                      ? '녹음 중지'
                      : '음성 입력'
                    : '이 브라우저는 음성 입력을 지원하지 않습니다'
                }
                className={`p-2.5 rounded-lg transition-colors shrink-0 ${
                  speech.isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : speech.isSupported
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Icons.Mic className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={config.placeholder}
                disabled={isSending}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary-400 text-body-sm disabled:bg-gray-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isSending}
                className="px-4 py-2.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title="전송"
              >
                <Icons.Send className="w-5 h-5" />
              </button>
            </div>
            {speech.error && (
              <p className="text-caption text-rose-500 mt-1">
                음성 오류: {speech.error}
              </p>
            )}
            {error && (
              <p className="text-caption text-rose-500 mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:w-80 lg:shrink-0 lg:order-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-body font-bold text-gray-900">
                {config.sideTitle}
              </h2>
              <button
                onClick={reloadSummary}
                disabled={summaryLoading}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                title="새로고침"
              >
                <Icons.RefreshCw
                  className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
            {summaryLoading && (
              <div className="space-y-2">
                <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            )}
            {!summaryLoading && summary?.cards?.length > 0 && (
              <div className="space-y-2 lg:space-y-3">
                {summary.cards.map((card, i) => (
                  <SummaryCard key={i} card={card} />
                ))}
              </div>
            )}
            {!summaryLoading && !summary?.cards?.length && (
              <p className="text-caption text-gray-400 text-center py-6">
                요약 데이터가 없습니다
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Workflow result modal */}
      {workflowResult && (
        <WorkflowResultModal
          result={workflowResult}
          loading={workflowLoading === 'resume'}
          onApprove={approveWorkflow}
          onReject={rejectWorkflow}
          onClose={() => setWorkflowResult(null)}
        />
      )}
    </div>
  );
}
