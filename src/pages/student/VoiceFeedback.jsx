import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { voiceApi } from '@/api/voice';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import ScoreGauge from '@/components/charts/ScoreGauge';
import Skeleton from '@/components/common/Skeleton';

const CATEGORIES = [
  '전체',
  '네트워크',
  '데이터베이스',
  '알고리즘',
  '웹개발',
  '백엔드',
  '버전관리',
  '보안',
  '운영체제',
];
const DIFFICULTIES = [
  { label: '전체', value: '' },
  { label: '초급', value: 'beginner' },
  { label: '중급', value: 'intermediate' },
  { label: '고급', value: 'advanced' },
];
const difficultyLabels = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};
const difficultyColors = {
  beginner: 'bg-[#e8f0e9] text-[#3d6b4f] border-[#c5d9c8]',
  intermediate: 'bg-[#faf4e8] text-[#9a6220] border-[#e8d9b8]',
  advanced: 'bg-[#f3e8e8] text-[#944848] border-[#e0c5c5]',
};
const softPortalCard =
  'rounded-3xl border border-[#e8e4dc] bg-white shadow-[0_8px_32px_rgba(45,42,38,0.05)]';
const pillActive = 'bg-[#2d2a26] text-white border-[#2d2a26] shadow-sm';
const pillIdle =
  'bg-white text-[#4a4640] border-[#e8e4dc] hover:border-[#cfc9c0] hover:bg-[#faf9f7]';

const keywordStatusConfig = {
  correct: {
    color: 'bg-[#e8f0e9] text-[#3d6b4f] border-[#c5d9c8]',
    label: '정확',
  },
  inaccurate: {
    color: 'bg-[#faf4e8] text-[#9a6220] border-[#e8d9b8]',
    label: '부정확',
  },
  missing: {
    color: 'bg-[#f3e8e8] text-[#944848] border-[#e0c5c5]',
    label: '누락',
  },
};

const scoreBadge = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};

function HistoryCard({ record }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      padding="p-5"
      className={`!rounded-3xl !border-[#e8e4dc] shadow-[0_8px_32px_rgba(45,42,38,0.05)]`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-body-sm text-gray-400 mb-1.5">
            <Calendar className="w-4 h-4" />
            <span>
              {record.date} {record.time}
            </span>
            <Clock className="w-4 h-4 ml-1" />
            <span>{record.duration}</span>
          </div>
          <p className="text-body font-semibold text-gray-900 truncate">
            {record.topic}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={scoreBadge(record.score)}>{record.score}점</Badge>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <span className="px-3 py-1 rounded-full text-body-sm font-medium bg-[#e8f0e9] text-[#3d6b4f]">
          정확 {record.correct}
        </span>
        <span className="px-3 py-1 rounded-full text-body-sm font-medium bg-[#faf4e8] text-[#9a6220]">
          부정확 {record.inaccurate}
        </span>
        <span className="px-3 py-1 rounded-full text-body-sm font-medium bg-[#f3e8e8] text-[#944848]">
          누락 {record.missing}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(record.keywords ?? []).map((kw, i) => {
          const config = keywordStatusConfig[kw.status];
          return (
            <span
              key={i}
              className={`inline-flex items-center px-3 py-1 rounded-full text-body-sm font-medium border ${config?.color ?? ''}`}
            >
              {kw.word}
            </span>
          );
        })}
      </div>

      <div className="p-3 rounded-xl border border-[#e8e4dc] bg-[#faf9f7]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-4 h-4 text-[#6b7a8c]" />
          <span className="text-body-sm font-semibold text-[#2d2a26]">
            AI 피드백
          </span>
        </div>
        <p className="text-body-sm text-[#4a4640] leading-relaxed">
          {record.feedback}
        </p>
        {record.tip && (
          <div className="mt-2 pt-2 border-t border-[#ebe8e3]">
            <p className="text-caption font-semibold text-[#9a6220] mb-1">
              이렇게 말해보세요
            </p>
            <p className="text-body-sm text-[#3d3a36] leading-relaxed italic">
              "{record.tip}"
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-body-sm text-[#4a4640] hover:text-[#2d2a26] mt-3 transition-colors"
      >
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {expanded ? '접기' : '인식된 발화 보기'}
      </button>

      {expanded && (
        <div className="mt-3 p-4 rounded-xl border border-[#e8e4dc] bg-[#faf9f7]">
          <p className="text-body-sm font-medium text-[#8a847a] mb-1.5">
            인식된 발화
          </p>
          <p className="text-body-sm text-[#3d3a36] leading-relaxed">
            {record.transcript}
          </p>
        </div>
      )}
    </Card>
  );
}

export default function VoiceFeedback() {
  const [activeTab, setActiveTab] = useState('practice');
  const [isRecording, setIsRecording] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [currentTopic, setCurrentTopic] = useState(null);
  const [topicVisible, setTopicVisible] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [topicLoading, setTopicLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const tabs = [
    { key: 'practice', label: '학습하기' },
    { key: 'history', label: '학습 기록' },
  ];

  // Web Speech API 초기화
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      if (recognitionRef.current?._active) {
        recognition.start();
      } else {
        setEditedTranscript(finalTranscriptRef.current);
        setShowReview(true);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  // 타이머
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(
        () => setSeconds((prev) => prev + 1),
        1000,
      );
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // 히스토리 탭 전환 시 로드
  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryLoading(true);
      voiceApi
        .getHistory()
        .then((data) => setHistory(data))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab]);

  const fetchRandomTopic = async () => {
    // 현재 주제가 있으면 fade-out 후 교체, 없으면 즉시 로드
    if (currentTopic) {
      setTopicVisible(false);
      await new Promise((r) => setTimeout(r, 220));
    }
    setTopicLoading(true);
    try {
      const topic = await voiceApi.getRandomTopic(
        categoryFilter,
        difficultyFilter,
      );
      setCurrentTopic(topic);
      // 새 주제 뽑을 때 이전 결과 초기화
      setShowResults(false);
      setShowReview(false);
      setAnalysisResult(null);
      finalTranscriptRef.current = '';
      setTranscript('');
      setEditedTranscript('');
      setSeconds(0);
    } catch {
      // 조건에 맞는 주제 없음 → 필터 없이 재시도
      try {
        const topic = await voiceApi.getRandomTopic('전체', '');
        setCurrentTopic(topic);
      } catch {
        /* ignore */
      }
    } finally {
      setTopicLoading(false);
      // 약간의 딜레이 후 fade-in (DOM 교체 후 transition이 트리거되도록)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTopicVisible(true));
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current._active = false;
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      finalTranscriptRef.current = '';
      setTranscript('');
      setEditedTranscript('');
      setSeconds(0);
      setShowResults(false);
      setShowReview(false);
      setAnalysisResult(null);
      if (recognitionRef.current) {
        recognitionRef.current._active = true;
        recognitionRef.current.start();
      }
      setIsRecording(true);
    }
  };

  const resetRecording = () => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setEditedTranscript('');
    setIsRecording(false);
    setShowResults(false);
    setShowReview(false);
    setAnalysisResult(null);
    setSeconds(0);
    // currentTopic은 유지 (같은 주제로 재시도 가능)
  };

  const handleSubmitAnalysis = async () => {
    setShowReview(false);
    setAnalyzing(true);
    try {
      const result = await voiceApi.analyze({
        transcript: editedTranscript,
        topic: currentTopic?.question || '자유 주제',
        topic_id: currentTopic?.id || null,
      });
      setAnalysisResult(result);
      setShowResults(true);
    } catch {
      setShowResults(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (s) => {
    const min = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  return (
    <div className="space-y-8 rounded-3xl bg-[#F9F7F2] px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8">
      <header>
        <h1
          className={`text-[1.75rem] font-semibold tracking-tight text-[#1f1e1c] sm:text-[2rem]`}
        >
          AI 말하기 연습
        </h1>
        <p className="mt-0.5 text-[0.7rem] font-semibold tracking-[0.2em] text-[#8a847a] uppercase">
          AI Speaking Practice
        </p>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-[#6b6560]">
          주제를 고르고 말하기를 연습하면 AI가 발음·어휘·문장을 참고해 피드백을
          드립니다.
        </p>
      </header>

      <div className="flex gap-10 border-b border-[#e8e4dc]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative pb-3 text-[0.9375rem] font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[#1f1e1c]'
                : 'text-[#8a847a] hover:text-[#4a4640]'
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#2d2a26]" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'practice' && (
        <>
          {!sttSupported && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#e8d9b8] bg-[#faf4e8] p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-[#9a6220]" />
              <p className="text-body-sm text-[#6b4f20]">
                이 브라우저는 음성 인식을 지원하지 않습니다.{' '}
                <strong>Chrome</strong>에서 이용해주세요.
              </p>
            </div>
          )}

          {/* 주제 선택 + 키워드 */}
          <div className={`${softPortalCard} p-5 sm:p-6`}>
            <p className="mb-2 text-[0.65rem] font-bold tracking-[0.14em] text-[#8a847a]">
              SUBJECTS · 과목
            </p>
            <div className="mb-5 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    !isRecording && !showReview && setCategoryFilter(cat)
                  }
                  disabled={isRecording || showReview}
                  className={`rounded-full border px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    categoryFilter === cat ? pillActive : pillIdle
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="mb-2 text-[0.65rem] font-bold tracking-[0.14em] text-[#8a847a]">
              PROFICIENCY · 난이도
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() =>
                    !isRecording && !showReview && setDifficultyFilter(d.value)
                  }
                  disabled={isRecording || showReview}
                  className={`rounded-full border px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    difficultyFilter === d.value ? pillActive : pillIdle
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* 문제 카드 or 문제 뽑기 버튼 */}
            {currentTopic ? (
              <div
                className={`transition-all duration-300 ${
                  topicVisible && !topicLoading
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-1'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className="rounded-full border border-[#d4e0e8] bg-[#eef3f7] px-2.5 py-1 text-caption font-medium text-[#3d5a6e]">
                      {topicLoading ? (
                        <span className="inline-block h-3 w-12 animate-pulse rounded bg-[#d4e0e8]" />
                      ) : (
                        currentTopic.category
                      )}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-caption font-medium border ${difficultyColors[currentTopic.difficulty]}`}
                    >
                      {difficultyLabels[currentTopic.difficulty]}
                    </span>
                  </div>
                  {!isRecording && !showReview && !analyzing && (
                    <button
                      type="button"
                      onClick={fetchRandomTopic}
                      disabled={topicLoading}
                      className="flex shrink-0 items-center gap-1 text-body-sm text-[#8a847a] transition-colors hover:text-[#2d2a26]"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${topicLoading ? 'animate-spin' : ''}`}
                      />
                      다른 문제
                    </button>
                  )}
                </div>
                <h2 className="mb-1 text-[1.125rem] font-bold leading-snug text-[#1f1e1c] sm:text-h3">
                  {currentTopic.question}
                </h2>
                {currentTopic.description && (
                  <p className="mb-3 text-body-sm text-[#6b6560]">
                    {currentTopic.description}
                  </p>
                )}
                {/* 키워드 */}
                <div className="flex flex-wrap gap-2">
                  {(showResults
                    ? (analysisResult?.keywords ?? [])
                    : currentTopic.keywords.map((k) => ({
                        word: k,
                        status: null,
                      }))
                  ).map((kw, i) => {
                    const config =
                      showResults && kw.status
                        ? keywordStatusConfig[kw.status]
                        : null;
                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption font-medium transition-colors duration-300
                          ${config ? config.color : 'border-[#e8e4dc] bg-[#f3f1ed] text-[#6b6560]'}`}
                      >
                        {kw.word}
                        {showResults && config && (
                          <span className="opacity-75">({config.label})</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={fetchRandomTopic}
                disabled={topicLoading}
                className="flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#cfd6dc] bg-[#faf9f7] py-10 transition-colors hover:border-[#b8c4cc] hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4ebf0] text-[#5a6d7e]">
                  {topicLoading ? (
                    <RefreshCw className="h-7 w-7 animate-spin" />
                  ) : (
                    <BookOpen className="h-7 w-7" />
                  )}
                </div>
                <div className="text-center px-4">
                  <p className={`text-lg font-semibold text-[#1f1e1c]`}>
                    주제 선택
                  </p>
                  <p className="mt-2 max-w-md text-[0.8125rem] leading-relaxed text-[#6b6560]">
                    위에서 과목·난이도를 고른 뒤, 여기를 눌러 연습 문제를 뽑으세요
                    (문제 뽑기).
                  </p>
                </div>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
            {/* 왼쪽: 타이머 · 마이크 */}
            <div
              className={`${softPortalCard} flex h-full flex-col items-center px-5 py-8 sm:px-8`}
            >
              <p className="mb-6 font-mono text-[2rem] font-semibold tabular-nums tracking-tight text-[#1f1e1c]">
                {formatTime(seconds)}
              </p>
              <div className="relative mb-5">
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={!sttSupported || !currentTopic}
                  className={`flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full transition-all ${
                    isRecording
                      ? 'animate-pulse bg-[#8b5348] shadow-lg shadow-[#8b5348]/25 hover:bg-[#7a483f]'
                      : 'bg-[#2d2a26] shadow-lg shadow-black/15 hover:bg-[#1f1e1c]'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {isRecording ? (
                    <MicOff className="h-10 w-10 text-white" />
                  ) : (
                    <Mic className="h-10 w-10 text-white" />
                  )}
                </button>
                {isRecording && (
                  <div className="pointer-events-none absolute inset-0 animate-ping rounded-full border-4 border-[#c97a6a]/50" />
                )}
              </div>
              <p className="mb-1 text-center text-[0.8125rem] font-medium text-[#4a4640]">
                {isRecording
                  ? '녹음 중... 버튼을 눌러 종료하세요'
                  : analyzing
                    ? 'AI가 분석 중입니다...'
                    : showReview
                      ? '발화 내용을 확인해주세요'
                      : showResults
                        ? '녹음 완료'
                        : !currentTopic
                          ? '먼저 위에서 주제를 뽑아 주세요'
                          : '마이크를 눌러 말하기를 시작하세요'}
              </p>
              <p className="mb-5 text-center text-[0.75rem] text-[#8a847a]">
                마이크에 맑게 말하면 인식과 분석이 더 정확해져요.
              </p>

              <div className="w-full max-w-md flex-1 space-y-3">
                {(showResults || showReview) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    onClick={resetRecording}
                    className="mb-1 w-full text-[#4a4640] hover:bg-[#f3f1ed]"
                  >
                    다시 녹음하기
                  </Button>
                )}

                {isRecording && transcript && (
                  <div className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f7] p-3">
                    <p className="mb-1 text-caption font-medium text-[#8a847a]">
                      인식 중...
                    </p>
                    <p className="text-body-sm leading-relaxed text-[#3d3a36]">
                      {transcript}
                    </p>
                  </div>
                )}

                {showReview && (
                  <div className="w-full space-y-3">
                    <div className="rounded-xl border border-[#e8d9b8] bg-[#faf4e8] p-3">
                      <p className="mb-2 text-caption font-medium text-[#9a6220]">
                        인식된 발화 — 내용을 확인하고 수정할 수 있습니다
                      </p>
                      <textarea
                        value={editedTranscript}
                        onChange={(e) => setEditedTranscript(e.target.value)}
                        className="w-full resize-none rounded-lg border border-[#e8d9b8] bg-white p-2.5 text-body-sm leading-relaxed text-[#3d3a36] focus:outline-none focus:ring-2 focus:ring-[#e8d9b8]"
                        rows={4}
                        placeholder="인식된 텍스트가 없습니다."
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full !bg-[#2d2a26] hover:!bg-[#1f1e1c] !text-white"
                      loading={analyzing}
                      onClick={handleSubmitAnalysis}
                    >
                      분석 요청
                    </Button>
                  </div>
                )}

                {showResults && (
                  <div className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f7] p-3">
                    <p className="mb-1 text-caption font-medium text-[#6b7a8c]">
                      인식된 발화
                    </p>
                    <p className="max-h-32 overflow-y-auto text-body-sm leading-relaxed text-[#3d3a36]">
                      {editedTranscript || '인식된 텍스트가 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 결과 */}
            <div className="flex min-h-[320px] flex-col gap-4 lg:min-h-[420px]">
              {showReview ? (
                <div
                  className={`${softPortalCard} flex h-full min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center lg:min-h-[420px]`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#faf4e8]">
                    <Sparkles className="h-8 w-8 text-[#c9a227]" />
                  </div>
                  <h3 className="mb-2 text-h3 font-semibold text-[#4a4640]">
                    발화 내용을 확인해주세요
                  </h3>
                  <p className="max-w-sm text-body-sm text-[#8a847a]">
                    왼쪽에서 내용을 확인한 뒤 분석 요청을 눌러주세요
                  </p>
                </div>
              ) : showResults && analysisResult ? (
                <div className="flex h-full flex-col gap-4">
                  <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                    <div
                      className={`${softPortalCard} flex flex-col items-center p-4 sm:p-5`}
                    >
                      <h3 className="mb-2 text-body font-semibold text-[#1f1e1c]">
                        종합 점수
                      </h3>
                      <ScoreGauge
                        score={analysisResult.score ?? 0}
                        label="점"
                        color="#2d2a26"
                        size={120}
                      />
                    </div>

                    <div className={`${softPortalCard} p-4 sm:p-5`}>
                      <h3 className="mb-3 text-body font-semibold text-[#1f1e1c]">
                        키워드 분석
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-[#e8f0e9] p-3 text-center">
                          <p className="text-h2 font-bold text-[#3d6b4f]">
                            {analysisResult.correct ?? 0}
                          </p>
                          <p className="mt-0.5 text-caption text-[#3d6b4f]">
                            정확
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#faf4e8] p-3 text-center">
                          <p className="text-h2 font-bold text-[#9a6220]">
                            {analysisResult.inaccurate ?? 0}
                          </p>
                          <p className="mt-0.5 text-caption text-[#9a6220]">
                            부정확
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#f3e8e8] p-3 text-center">
                          <p className="text-h2 font-bold text-[#944848]">
                            {analysisResult.missing ?? 0}
                          </p>
                          <p className="mt-0.5 text-caption text-[#944848]">
                            누락
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`${softPortalCard} p-4 sm:p-5`}>
                    <h3 className="mb-2 text-body font-semibold text-[#1f1e1c]">
                      AI 피드백
                    </h3>
                    <p className="text-body-sm leading-relaxed text-[#4a4640]">
                      {analysisResult.feedback}
                    </p>
                    {analysisResult.tip && (
                      <div className="mt-3 rounded-xl border border-[#ebe5cf] bg-[#faf6e8] p-3">
                        <p className="mb-1 text-caption font-semibold text-[#9a6220]">
                          이렇게 말해보세요
                        </p>
                        <p className="text-body-sm italic leading-relaxed text-[#3d3a36]">
                          "{analysisResult.tip}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : analyzing ? (
                <div
                  className={`${softPortalCard} flex h-full min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center lg:min-h-[420px]`}
                >
                  <div className="relative mb-6 h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-[#ebe8e3]" />
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#2d2a26] border-t-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-[#8a847a]" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-h3 font-semibold text-[#4a4640]">
                    AI 분석 중...
                  </h3>
                  <p className="mb-4 text-body-sm text-[#8a847a]">
                    답변 내용을 평가하고 있어요
                  </p>
                  <div className="flex gap-1.5">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#2d2a26]"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#2d2a26]"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#2d2a26]"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`${softPortalCard} flex h-full min-h-[320px] flex-col items-center justify-center px-8 py-16 text-center lg:min-h-[420px]`}
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3f7]">
                    <BarChart3 className="h-8 w-8 text-[#7a8fa3]" />
                  </div>
                  <h3
                    className={`mb-2 text-xl font-semibold text-[#1f1e1c] sm:text-2xl`}
                  >
                    학습 결과가 여기에 표시됩니다
                  </h3>
                  <p className="mb-8 max-w-sm text-[0.8125rem] leading-relaxed text-[#6b6560]">
                    마이크 버튼으로 말하기를 시작하면 AI가 발음·어휘·문법을
                    실시간으로 분석해 요약합니다.
                  </p>
                  <div className="flex w-full max-w-xs flex-col gap-2">
                    <div className="h-2.5 rounded-full bg-[#ebe8e3]" />
                    <div className="h-2.5 w-4/5 rounded-full bg-[#ebe8e3]" />
                    <div className="h-2.5 w-3/5 rounded-full bg-[#ebe8e3]" />
                  </div>
                </div>
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
            <div
              className={`${softPortalCard} flex flex-col items-center justify-center py-16 text-center`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3f7]">
                <Mic className="h-8 w-8 text-[#7a8fa3]" />
              </div>
              <h3 className={`mb-2 text-xl font-semibold text-[#4a4640]`}>
                학습 기록이 없습니다
              </h3>
              <p className="mb-5 max-w-sm text-body-sm text-[#8a847a]">
                말하기 학습을 완료하면 여기에 기록이 저장됩니다.
              </p>
              <Button
                size="sm"
                onClick={() => setActiveTab('practice')}
                className="!bg-[#2d2a26] hover:!bg-[#1f1e1c] !text-white"
              >
                학습 시작하기
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-body-sm text-[#6b6560]">
                  총 {history.length}개의 학습 기록
                </p>
                <p className="text-caption text-[#8a847a]">
                  평균 점수:{' '}
                  {Math.round(
                    history.reduce((s, r) => s + r.score, 0) / history.length,
                  )}
                  점
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
  );
}
