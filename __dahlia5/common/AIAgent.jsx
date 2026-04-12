import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/context/CourseContext';
import { aiAgentApi } from '@/api/ai-agent';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import * as Icons from 'lucide-react';

// localStorage ?? ai-briefing-{wfName}-{YYYY-MM-DD}
const today = () => new Date().toISOString().slice(0, 10);
const briefingKey = (name) => `ai-briefing-${name}-${today()}`;

// ----------------------------------------------------------------------
// role 蹂?UI ?ㅼ젙 ??title/chip/workflow 紐⑤몢 ?ш린??遺꾧린
// ----------------------------------------------------------------------
const ROLE_CONFIG = {
  student: {
    title: 'AI ?숈뒿肄붿튂',
    subtitle: '??異쒖꽍쨌怨쇱젣쨌?먯닔瑜??먯뿰?대줈 臾쇱뼱蹂댁꽭??,
    placeholder: '?? ??異쒖꽍瑜??뚮젮以?,
    sideTitle: '???숈뒿 ?꾪솴',
    chips: [
      '??異쒖꽍瑜??뚮젮以?,
      '?대쾲二?怨쇱젣 萸??덉뼱?',
      '理쒓렐 ?먯닔 ?붿빟?댁쨾',
      '?욎쑝濡??쇱젙 萸??덉뼱?',
    ],
    workflows: [],
  },
  teacher: {
    title: 'AI 援먯닔 釉뚮━??,
    subtitle: '?꾪뿕 ?숈깮쨌異쒖꽍쨌怨쇱젣瑜?利됱떆 ?뚯븙?섏꽭??,
    placeholder: '?? ?대쾲 二??꾪뿕 ?숈깮 ?뚮젮以?,
    sideTitle: '?ㅻ뒛??釉뚮━??,
    chips: [
      '?대쾲 二??꾪뿕 ?숈깮 ?뚮젮以?,
      '?ㅻ뒛 寃곗꽍 ?꾧뎄??',
      '理쒓렐 怨쇱젣 ?쒖텧瑜?,
      '?곷떞 湲곕줉 ?붿빟?댁쨾',
    ],
    workflows: [
      { name: 'teacher_daily_briefing', label: '?쇱씪 釉뚮━???앹꽦', icon: 'Sparkles' },
      { name: 'proactive_risk_alert', label: '?꾪뿕 ?숈깮 ?뚮┝ ?쒖븞', icon: 'Bell' },
    ],
  },
  admin: {
    title: 'AI ?댁쁺 紐⑤땲??,
    subtitle: '肄뷀샇?맞룹옣鍮꽷룰컯?섏떎 ?꾪솴???쒕늿??,
    placeholder: '?? 吏湲??ъ슜 以묒씤 ?λ퉬 紐????,
    sideTitle: '?댁쁺 ?붿빟',
    chips: [
      '吏꾪뻾 以?肄뷀샇??吏꾨룄',
      '?λ퉬 ?꾪솴 ?붿빟',
      '媛뺤쓽???ъ슜瑜?,
      '理쒓렐 ?쒖뒪??寃쎄퀬',
    ],
    workflows: [
      { name: 'admin_weekly_report', label: '二쇨컙 由ы룷???앹꽦', icon: 'FileText' },
    ],
  },
};

// ----------------------------------------------------------------------
// 寃쎈웾 留덊겕?ㅼ슫 ?뚮뜑??(?몃? ?쇱씠釉뚮윭由??놁씠 **bold**, - 遺덈┸, 以꾨컮轅?泥섎━)
// ----------------------------------------------------------------------

function applyInline(text, key) {
  // **bold** 泥섎━
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function MarkdownContent({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 遺덈┸ 由ъ뒪??(- ?먮뒗 *)
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="text-body-sm leading-relaxed">
              {applyInline(item, j)}
            </li>
          ))}
        </ul>,
      );
    } else if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-1.5" />);
      i++;
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-body-sm leading-relaxed break-words">
          {applyInline(line, i)}
        </p>,
      );
      i++;
    }
  }
  return <div className="space-y-0.5">{elements}</div>;
}

// ----------------------------------------------------------------------
// 怨듭슜 ?쒕툕 而댄룷?뚰듃 (媛숈? ?뚯씪 ?댁뿉 ?뺤쓽)
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
        {isUser ? (
          <p className="text-body-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <MarkdownContent text={message.content} />
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <details className="mt-2 text-caption opacity-80">
            <summary className="cursor-pointer select-none">
              ?뵩 {message.toolCalls.length}媛??곗씠??議고쉶
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

function WorkflowResultModal({ result, loading, onApprove, onReject, onClose, onRerun }) {
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
                ?뚮┝ 諛쒖넚 ?뱀씤 ?湲?              </>
            ) : (
              <>
                <Icons.FileCheck className="w-5 h-5 text-emerald-500" />
                Workflow 寃곌낵
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            title="?リ린"
          >
            <Icons.X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {summary && (
            <section>
              <p className="text-caption font-semibold text-gray-500 uppercase mb-2">
                ?붿빟
              </p>
              <p className="text-body-sm whitespace-pre-wrap text-gray-900 leading-relaxed">
                {summary}
              </p>
            </section>
          )}

          {isInterrupted && drafts.length > 0 && (
            <section>
              <p className="text-caption font-semibold text-gray-500 uppercase mb-2">
                諛쒖넚 ?덉젙 ?뚮┝ ({drafts.length}嫄?
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
                {sentIds.length}嫄?諛쒖넚 ?꾨즺
              </p>
            </section>
          )}

          {trace.length > 0 && (
            <details className="text-caption">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
                Graph trace ({trace.length} ?몃뱶, 珥?{result?.duration_ms}ms)
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

        <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-between">
          {/* ?ㅼ떆 ?앹꽦 ??罹먯떆 ??젣 ???ъ떎??*/}
          {!isInterrupted && onRerun && (
            <button
              onClick={onRerun}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 text-sm flex items-center gap-1"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5" />
              ?ㅼ떆 ?앹꽦
            </button>
          )}
          {isInterrupted ? (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={onReject}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                嫄곗젅
              </button>
              <button
                onClick={onApprove}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 font-medium"
              >
                {loading ? '泥섎━ 以?..' : '?뱀씤?섍퀬 諛쒖넚'}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm ml-auto"
            >
              ?リ린
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 硫붿씤 ?섏씠吏
// ----------------------------------------------------------------------

export default function AIAgent() {
  const { user, role } = useAuth();
  const { selectedCourseId } = useCourse();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  // 梨꾪똿 ?곹깭
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ?ъ씠???⑤꼸
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Workflow ??activeModal: ?꾩옱 ?대┛ 紐⑤떖 { result, name }
  //            cachedResults: localStorage 湲곕컲 ?ㅻ뒛 寃곌낵 罹먯떆 { [wfName]: result }
  const [activeModal, setActiveModal] = useState(null);
  const [cachedResults, setCachedResults] = useState({});
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

  // ?ㅻ뒛 workflow 寃곌낵 罹먯떆 蹂듭썝 (role 諛붾뚭굅???좎쭨 諛붾뚮㈃ ?щ줈??
  useEffect(() => {
    const loaded = {};
    (config.workflows || []).forEach((wf) => {
      try {
        const raw = localStorage.getItem(briefingKey(wf.name));
        if (raw) loaded[wf.name] = JSON.parse(raw);
      } catch {
        /* noop */
      }
    });
    setCachedResults(loaded);
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // ?댁쟾 ????대젰 蹂듭썝 (role 諛붾??뚮쭏???대떦 role ?대젰 ?ㅼ떆 濡쒕뱶)
  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setMessages([]);
    aiAgentApi
      .history(20)
      .then((data) => {
        if (cancelled) return;
        if (data.messages?.length > 0) {
          setMessages(
            data.messages.map((m) => ({
              role: m.role,
              content: m.content,
              toolCalls: m.tool_calls || [],
              durationMs: m.duration_ms,
            })),
          );
        }
      })
      .catch(() => {/* ?대젰 濡쒕뱶 ?ㅽ뙣 ??鍮?梨꾪똿?쇰줈 ?쒖옉 */})
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
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
        // history ??理쒓렐 10?대쭔 ?꾨떖 (role/content 留?
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
          e.response?.data?.detail || e.message || '?묐떟 ?앹꽦 ?ㅽ뙣';
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `??${errMsg}` },
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
        '??釉뚮씪?곗????뚯꽦 ?낅젰??吏?먰븯吏 ?딆뒿?덈떎. Chrome ?먮뒗 Edge ?먯꽌 ?댁슜?댁＜?몄슂.',
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

  const runWorkflow = useCallback(
    async (name) => {
      setWorkflowLoading(name);
      setError(null);
      try {
        const params = selectedCourseId ? { course_id: selectedCourseId } : {};
        const result = await aiAgentApi.runWorkflow(name, params);
        // ?ㅻ뒛 ?좎쭨 ?ㅻ줈 localStorage ???        try {
          localStorage.setItem(briefingKey(name), JSON.stringify(result));
        } catch {
          /* noop */
        }
        setCachedResults((prev) => ({ ...prev, [name]: result }));
        setActiveModal({ result, name });
      } catch (e) {
        setError(e.response?.data?.detail || e.message || 'Workflow ?ㅽ뻾 ?ㅽ뙣');
      } finally {
        setWorkflowLoading(null);
      }
    },
    [selectedCourseId],
  );

  const approveWorkflow = useCallback(async () => {
    if (!activeModal?.result?.thread_id) return;
    setWorkflowLoading('resume');
    try {
      const result = await aiAgentApi.resumeWorkflow(
        activeModal.result.thread_id,
        true,
      );
      setActiveModal((prev) => ({ ...prev, result }));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || '?뱀씤 ?ㅽ뙣');
    } finally {
      setWorkflowLoading(null);
    }
  }, [activeModal]);

  const rejectWorkflow = useCallback(async () => {
    if (!activeModal?.result?.thread_id) return;
    setWorkflowLoading('resume');
    try {
      const result = await aiAgentApi.resumeWorkflow(
        activeModal.result.thread_id,
        false,
      );
      setActiveModal((prev) => ({ ...prev, result }));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || '嫄곗젅 ?ㅽ뙣');
    } finally {
      setWorkflowLoading(null);
    }
  }, [activeModal]);

  const rerunWorkflow = useCallback(
    (name) => {
      // 罹먯떆 ??젣 ???ъ떎??      try {
        localStorage.removeItem(briefingKey(name));
      } catch {
        /* noop */
      }
      setCachedResults((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setActiveModal(null);
      runWorkflow(name);
    },
    [runWorkflow],
  );

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
    <div className="p-4 md:p-6 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-4 shrink-0 flex items-start justify-between gap-4">
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
              {user.name} 쨌 {role}
            </p>
          </div>
        )}
      </div>

      {/* Main layout: col on mobile, row on lg+ */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Chat Panel */}
        <div className="flex-1 lg:order-1 bg-white rounded-2xl border border-gray-200 flex flex-col min-h-0">
          {/* Workflow buttons (媛뺤궗/愿由ъ옄留? */}
          {config.workflows.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap gap-2 items-center">
              {config.workflows.map((wf) => {
                const Icon = Icons[wf.icon] || Icons.Play;
                const running = workflowLoading === wf.name;
                const cached = cachedResults[wf.name];

                if (cached) {
                  // ?ㅻ뒛 寃곌낵 ?덉쓬 ??珥덈줉 "?꾨즺" 踰꾪듉 (?대┃ ??紐⑤떖 ?ъ삤??
                  return (
                    <button
                      key={wf.name}
                      onClick={() => setActiveModal({ result: cached, name: wf.name })}
                      disabled={workflowLoading !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-caption font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                      {wf.label} ?꾨즺
                    </button>
                  );
                }

                return (
                  <button
                    key={wf.name}
                    onClick={() => runWorkflow(wf.name)}
                    disabled={workflowLoading !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white text-caption font-medium hover:from-violet-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
                    {running ? '?ㅽ뻾 以?..' : wf.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50/50">
            {historyLoading ? (
              <div className="space-y-3 py-4">
                {[80, 55, 90, 60].map((w, i) => (
                  <div
                    key={i}
                    className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="h-10 rounded-2xl bg-gray-200 animate-pulse"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                ))}
                <p className="text-center text-caption text-gray-400 pt-2">
                  ?댁쟾 ??붾? 遺덈윭?ㅻ뒗 以?..
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <Icons.MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-body-sm text-gray-500 mb-4">
                  ?꾨옒 ?덉떆 吏덈Ц???뚮윭蹂닿굅??吏곸젒 吏덈Ц???낅젰?대낫?몄슂
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
            ) : null}
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
                <span>AI媛 ?앷컖 以?..</span>
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
                      ? '?뱀쓬 以묒?'
                      : '?뚯꽦 ?낅젰'
                    : '??釉뚮씪?곗????뚯꽦 ?낅젰??吏?먰븯吏 ?딆뒿?덈떎'
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
                title="?꾩넚"
              >
                <Icons.Send className="w-5 h-5" />
              </button>
            </div>
            {speech.error && (
              <p className="text-caption text-rose-500 mt-1">
                ?뚯꽦 ?ㅻ쪟: {speech.error}
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
                title="?덈줈怨좎묠"
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
                ?붿빟 ?곗씠?곌? ?놁뒿?덈떎
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Workflow result modal */}
      {activeModal && (
        <WorkflowResultModal
          result={activeModal.result}
          loading={workflowLoading === 'resume'}
          onApprove={approveWorkflow}
          onReject={rejectWorkflow}
          onClose={() => setActiveModal(null)}
          onRerun={() => rerunWorkflow(activeModal.name)}
        />
      )}
    </div>
  );
}
