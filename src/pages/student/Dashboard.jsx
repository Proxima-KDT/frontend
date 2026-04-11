import { useState, useEffect, useMemo, Fragment } from 'react';
import { Sparkles, CheckCircle2, Circle, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';
import { curriculumApi } from '@/api/curriculum';
import Skeleton from '@/components/common/Skeleton';

const statusUi = {
  completed: {
    card: 'bg-white border-[#e8e4dc] shadow-[0_4px_20px_rgba(45,42,38,0.06)]',
    badge: 'bg-[#3d3d3d] text-white',
    badgeMain: '완료',
    badgeSub: 'completed',
    bar: 'bg-[#3d3d3d]',
    dim: '',
  },
  in_progress: {
    card: 'bg-[#f3f1ed] border-[#d4cfc4] shadow-[0_8px_28px_rgba(45,42,38,0.1)] ring-1 ring-[#e0dbd2]',
    badge: 'bg-[#c9a227] text-[#1f1e1c]',
    badgeMain: '진행중',
    badgeSub: 'In progress',
    bar: 'bg-[#c9a227]',
    dim: '',
  },
  upcoming: {
    card: 'bg-white/70 border-[#ebe8e3] opacity-[0.72]',
    badge: 'bg-[#b8b3ab] text-white',
    badgeMain: '예정',
    badgeSub: 'planned',
    bar: 'bg-[#a8a29e]',
    dim: 'opacity-90',
  },
};

function TaskRow({ task }) {
  const Icon =
    task.progress === 100
      ? CheckCircle2
      : task.progress > 0
        ? Clock
        : Circle;
  const iconClass =
    task.progress === 100
      ? 'text-[#5c7a4e]'
      : task.progress > 0
        ? 'text-[#9a8b4a]'
        : 'text-[#c4c0b8]';

  return (
    <li className="flex items-center gap-3">
      <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
      <span className="w-40 shrink-0 text-[0.8125rem] text-[#3d3a36] sm:w-48">
        {task.name}
      </span>
      <div className="min-w-0 flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebe8e3]">
          <div
            className="h-full rounded-full bg-[#3d3d3d] transition-all duration-300"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>
      <span className="w-9 shrink-0 text-right text-[0.7rem] font-medium tabular-nums text-[#6b6560]">
        {task.progress}%
      </span>
    </li>
  );
}

function buildAiTip(phase) {
  if (!phase?.tasks?.length) {
    return 'AI Tip: 단계를 선택하면 맞춤 학습 팁이 표시됩니다.';
  }
  const tasks = [...phase.tasks].sort((a, b) => b.progress - a.progress);
  const strong = tasks[0];
  const weak = [...phase.tasks].find((t) => t.progress < 100) || tasks[tasks.length - 1];
  if (strong?.progress >= 80 && weak && weak.progress < 100) {
    return `AI Tip: ${strong.name}은(는) 잘하고 있어요! ${weak.name}은(는) 실습·예제로 조금만 더 다져 보면 다음 단계로 가기 좋아요.`;
  }
  return `AI Tip: 이번 주는 ${phase.title} 핵심 개념을 복습하고, 미완료 토픽부터 차근차근 채워 보세요.`;
}

function ModuleCard({ phase, selected, onSelect }) {
  const ui = statusUi[phase.status] || statusUi.upcoming;
  const PhaseIcon = Icons[phase.icon] || Icons.BookOpen;

  return (
    <button
      type="button"
      onClick={() => onSelect(phase.id)}
      className={`
        relative flex h-full w-full min-w-0 flex-col rounded-2xl border p-3 text-left transition-all sm:p-4
        ${ui.card}
        ${selected ? 'ring-2 ring-[#3d3d3d] ring-offset-2 ring-offset-[#F9F8F6]' : 'hover:border-[#c4bfb5]'}
        ${ui.dim}
      `}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0ede6] text-[#4a4640]">
          <PhaseIcon className="h-4 w-4" />
        </div>
        <span
          className={`flex min-w-[3.25rem] flex-col items-end gap-0 rounded-md px-2 py-1 text-right leading-tight ${ui.badge}`}
        >
          <span className="text-[0.62rem] font-bold tracking-wide">
            {ui.badgeMain}
          </span>
          <span className="text-[0.5rem] font-medium opacity-90">
            {ui.badgeSub}
          </span>
        </span>
      </div>
      <p
        className={`line-clamp-2 text-[0.85rem] font-semibold leading-snug text-[#1f1e1c] sm:text-[0.95rem]`}
      >
        {phase.phase}. {phase.title}
      </p>
      <p className="mt-1 line-clamp-2 text-[0.7rem] leading-relaxed text-[#6b6560]">
        {phase.description}
      </p>
      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#ebe8e3]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${ui.bar}`}
            style={{ width: `${phase.progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-[0.7rem] font-semibold tabular-nums text-[#4a4640]">
          {phase.progress}%
        </p>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);

  useEffect(() => {
    curriculumApi
      .getAll()
      .then((data) => {
        setCurriculum(data);
        const inProgress = data.find((c) => c.status === 'in_progress');
        setSelectedPhaseId(inProgress?.id ?? data[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completedPhases = curriculum.filter((c) => c.status === 'completed').length;
  const totalPhases = curriculum.length;
  const overallProgress =
    totalPhases > 0
      ? Math.round(curriculum.reduce((sum, c) => sum + c.progress, 0) / totalPhases)
      : 0;

  const selectedPhase = curriculum.find((c) => c.id === selectedPhaseId);
  const aiTip = useMemo(() => buildAiTip(selectedPhase), [selectedPhase]);

  const mid = Math.ceil(curriculum.length / 2) || 0;
  const row1 = curriculum.slice(0, mid);
  const row2 = curriculum.slice(mid);

  function renderModuleRow(phases) {
    if (!phases.length) return null;
    return (
      <div className="flex w-full min-w-0 items-stretch justify-center gap-2 sm:gap-3">
        {phases.map((phase, i) => (
            <Fragment key={phase.id}>
              <div className="min-w-0 flex-1 basis-0">
                <ModuleCard
                  phase={phase}
                  selected={selectedPhaseId === phase.id}
                  onSelect={setSelectedPhaseId}
                />
              </div>
              {i < phases.length - 1 && (
                <div
                  className="w-2 shrink-0 self-center border-t-2 border-dotted border-[#c4bfb5] sm:w-4 md:w-6"
                  aria-hidden
                />
              )}
            </Fragment>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 rounded-3xl bg-[#F9F8F6] p-6">
        <Skeleton width="280px" height="36px" rounded="rounded-lg" />
        <Skeleton width="100%" height="48px" rounded="rounded-xl" />
        <Skeleton width="100%" height="180px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="240px" rounded="rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-3xl bg-[#F9F8F6] px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className={`text-[1.75rem] font-semibold tracking-tight text-[#1f1e1c] sm:text-[2rem]`}
          >
            학습 과정
          </h1>
          <p className="mt-1 text-[0.875rem] text-[#6b6560]">
            6개월 과정 · {completedPhases}/{totalPhases}단계 완료
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[0.9375rem] font-semibold text-[#2d2a26]">진도율</p>
          <p className="mt-0.5 text-[0.65rem] font-medium tracking-wide text-[#a39c92]">
            Overall completion
          </p>
          <p className="mt-1 text-[1.75rem] font-semibold tabular-nums leading-tight text-[#2d2a26]">
            {overallProgress}%
          </p>
        </div>
      </div>

      {/* 전체 진행률 바 */}
      <div className="rounded-xl border border-[#e8e4dc] bg-white/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebe8e3]">
          <div
            className="h-full rounded-full bg-[#3d3d3d] transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 모듈 경로: 2줄 고정 (가로 스크롤 없음) */}
      <div className="flex flex-col gap-5 sm:gap-6">
        {renderModuleRow(row1)}
        {row2.length > 0 && (
          <>
            <div
              className="mx-auto h-5 w-0 shrink-0 border-l-2 border-dotted border-[#c4bfb5]"
              aria-hidden
            />
            {renderModuleRow(row2)}
          </>
        )}
      </div>

      {/* 현재 모듈 상세 */}
      {selectedPhase && (
        <div className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_12px_40px_rgba(45,42,38,0.07)] sm:p-7">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0ede6] text-[#4a4640]">
                  {(() => {
                    const Ic = Icons[selectedPhase.icon] || Icons.BookOpen;
                    return <Ic className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <h2
                    className={`text-[1.35rem] font-semibold text-[#1f1e1c] sm:text-[1.5rem]`}
                  >
                    {selectedPhase.phase}. {selectedPhase.title}
                  </h2>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-[#5c5852]">
                    {selectedPhase.description}
                  </p>
                  <p className="mt-2 text-[0.75rem] text-[#8a847a]">
                    {selectedPhase.start_date} ~ {selectedPhase.end_date}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <ul className="space-y-3.5">
                {(selectedPhase.tasks || []).map((task, idx) => (
                  <TaskRow key={`${task.name}-${idx}`} task={task} />
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[#ebe5cf] bg-[#faf6e8] px-4 py-3.5 sm:px-5">
                <div className="flex gap-2.5">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a227]" />
                  <p className="text-[0.8125rem] leading-relaxed text-[#4d5a38]">
                    {aiTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
