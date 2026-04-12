import { useState, useEffect } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Trophy,
  BookOpen,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { curriculumApi } from '@/api/curriculum';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import ProgressBar from '@/components/common/ProgressBar';
import Skeleton from '@/components/common/Skeleton';

/* ── 상태별 스타일 ── */
const statusConfig = {
  completed: {
    color: 'bg-[#3d3d3d]',
    badgeVariant: 'soft-info',
    label: '완료',
    gradient: 'from-[#3d3d3d] to-[#5a5a5a]',
    ring: 'ring-[#c8c5bf]',
    road: '#3d3d3d',
    iconBg: 'bg-[#f0efeb]',
    iconColor: 'text-[#6b6560]',
  },
  in_progress: {
    color: 'bg-[#c9a227]',
    badgeVariant: 'soft-warning',
    label: '진행 중',
    gradient: 'from-[#c9a227] to-[#b8911f]',
    ring: 'ring-[#e8d9a0]',
    road: '#c9a227',
    iconBg: 'bg-[#faf4e8]',
    iconColor: 'text-[#9a6220]',
  },
  upcoming: {
    color: 'bg-[#a8a29e]',
    badgeVariant: 'default',
    label: '예정',
    gradient: 'from-[#a8a29e] to-[#928d88]',
    ring: 'ring-[#d6d3cf]',
    road: '#a8a29e',
    iconBg: 'bg-[#f0efeb]',
    iconColor: 'text-[#a8a29e]',
  },
};

/* ── 태스크 아이콘 ── */
function TaskStatusIcon({ progress }) {
  if (progress === 100)
    return <CheckCircle2 className="w-4 h-4 text-[#6f8391] shrink-0" />;
  if (progress > 0)
    return <Clock className="w-4 h-4 text-[#c9a227] shrink-0" />;
  return <Circle className="w-4 h-4 text-gray-300 shrink-0" />;
}

/* ── Phase 상세 패널 ── */
function PhaseDetail({ phase }) {
  const config = statusConfig[phase.status];
  const completedTasks = phase.tasks.filter((t) => t.progress === 100).length;

  return (
    <div className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] p-5 shadow-none">
      <div className="flex flex-col gap-1 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-body font-bold text-gray-900">{phase.title}</h3>
          <p className="text-caption text-gray-500">{phase.description}</p>
        </div>
        <div className="flex items-center gap-3 text-caption text-gray-400 mt-1 sm:mt-0 shrink-0">
          <span>
            {phase.start_date} ~ {phase.end_date}
          </span>
          <Badge variant={config.badgeVariant}>
            {completedTasks}/{phase.tasks.length} 완료
          </Badge>
        </div>
      </div>
      <ul className="space-y-3">
        {phase.tasks.map((task, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <TaskStatusIcon progress={task.progress} />
            <span
              className={`text-body-sm w-36 shrink-0 ${task.progress === 100 ? 'text-gray-400' : 'text-gray-700'}`}
            >
              {task.name}
            </span>
            <div className="flex-1">
              <ProgressBar
                value={task.progress}
                color={
                  task.progress === 100
                    ? 'bg-[#6f8391]'
                    : task.progress > 0
                      ? 'bg-[#c9a227]'
                      : 'bg-gray-300'
                }
                size="sm"
              />
            </div>
            <span className="text-caption text-gray-400 w-10 text-right shrink-0">
              {task.progress}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 도로 위 Phase 카드(데스크톱) ── */
function RoadPhaseCard({ phase, isSelected, onClick, position }) {
  const config = statusConfig[phase.status];
  const PhaseIcon = Icons[phase.icon] || Icons.BookOpen;
  const isTop = position === 'top';

  return (
    <div
      className={`flex flex-col items-center ${isTop ? '' : 'flex-col-reverse'}`}
    >
      {/* 카드 */}
      <div
        onClick={onClick}
        className={`
          relative w-40 rounded-2xl p-4 transition-all duration-300 cursor-pointer
          ${
            isSelected
              ? `bg-linear-to-br ${config.gradient} text-white shadow-lg scale-105`
              : phase.status === 'in_progress'
                ? 'bg-[#f8f7f4] border-2 border-[#e8d9a0] shadow-md hover:shadow-lg hover:scale-102'
                : phase.status === 'completed'
                  ? 'bg-[#f8f7f4] border-2 border-[#d6d3cf] shadow-sm hover:shadow-md hover:scale-102'
                  : 'bg-[#f0efeb] border-2 border-[#e2ded7] hover:shadow-md hover:scale-102'
          }
        `}
      >
        {/* 아이콘 */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
            isSelected ? 'bg-white/25' : config.iconBg
          }`}
        >
          <PhaseIcon
            className={`w-5 h-5 ${isSelected ? 'text-white' : config.iconColor}`}
          />
        </div>
        <h3
          className={`text-sm font-bold mb-1 leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}
        >
          {phase.title}
        </h3>
        <div className="flex items-center gap-1 mb-2">
          <Badge
            variant={isSelected ? 'default' : config.badgeVariant}
            size="sm"
          >
            {config.label}
          </Badge>
        </div>
        {/* 미니 진행률 */}
        <div className="w-full bg-black/10 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${isSelected ? 'bg-white/80' : config.color}`}
            style={{ width: `${phase.progress}%` }}
          />
        </div>
        <span
          className={`text-xs mt-1 block ${isSelected ? 'text-white/80' : 'text-gray-400'}`}
        >
          {phase.progress}%
        </span>

        {/* 진행 중 펄스 */}
        {phase.status === 'in_progress' && !isSelected && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9a227] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#c9a227]" />
          </div>
        )}
      </div>

      {/* 연결 기둥 */}
      <div
        className={`w-0.5 ${isSelected ? 'h-6' : 'h-8'} ${
          phase.status === 'completed'
            ? 'bg-[#c8c5bf]'
            : phase.status === 'in_progress'
              ? 'bg-[#e8d9a0]'
              : 'bg-gray-200'
        }`}
      />

      {/* 도로 위 동그라미 */}
      <div
        className={`
          w-6 h-6 rounded-full border-[3px] flex items-center justify-center
          transition-all duration-300
          ${
            phase.status === 'completed'
              ? 'border-[#6b6560] bg-[#f0efeb]'
              : phase.status === 'in_progress'
                ? 'border-[#c9a227] bg-[#faf4e8]'
                : 'border-gray-300 bg-gray-50'
          }
          ${isSelected ? `ring-4 ${config.ring}` : ''}
        `}
      >
        {phase.status === 'completed' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-[#6b6560]" />
        ) : phase.status === 'in_progress' ? (
          <div className="w-2 h-2 rounded-full bg-[#c9a227]" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   메인 Curriculum (Teacher)
   ══════════════════════════════════════════════════ */
export default function Curriculum() {
  const { selectedCourseId, selectedCourse } = useCourse();
  const [curriculum, setCurriculum] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhaseId, setSelectedPhaseId] = useState(null)
  const [coursePeriod, setCoursePeriod] = useState(null)

  useEffect(() => {
    if (!selectedCourseId) {
      setCurriculum([])
      setCoursePeriod(null)
      setSelectedPhaseId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      curriculumApi.getByCourse(selectedCourseId).catch(() => []),
      curriculumApi.getCoursePeriodByCourse(selectedCourseId).catch(() => null),
    ]).then(([data, period]) => {
      setCurriculum(data)
      setCoursePeriod(period)
      const inProgress = data.find((c) => c.status === 'in_progress')
      setSelectedPhaseId(inProgress?.id ?? data[0]?.id ?? null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selectedCourseId])

  const completedPhases = curriculum.filter((c) => c.status === 'completed').length;
  const totalPhases = curriculum.length;
  const overallProgress = totalPhases > 0
    ? Math.round(curriculum.reduce((sum, c) => sum + c.progress, 0) / totalPhases)
    : 0;

  // 커리큘럼 실제 기간: phase들의 start_date 최솟값 ~ end_date 최댓값
  const curriculumDates = curriculum.filter((c) => c.start_date && c.end_date);
  const curriculumStart = curriculumDates.length > 0
    ? curriculumDates.reduce((min, c) => c.start_date < min ? c.start_date : min, curriculumDates[0].start_date)
    : null;
  const curriculumEnd = curriculumDates.length > 0
    ? curriculumDates.reduce((max, c) => c.end_date > max ? c.end_date : max, curriculumDates[0].end_date)
    : null;

  const togglePhase = (id) =>
    setSelectedPhaseId((prev) => (prev === id ? null : id));

  const selectedPhase = curriculum.find((c) => c.id === selectedPhaseId);

  // 도로 행 분할: 3개씩 나누고 짝수 행은 역순
  const row1 = curriculum.slice(0, 3); // → 방향
  const row2 = [...curriculum.slice(3, 6)].reverse(); // ← 역방향

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="240px" height="32px" rounded="rounded-lg" />
        <Skeleton width="100%" height="60px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      </div>
    )
  }

  if (!selectedCourseId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
        <BookOpen className="w-12 h-12" />
        <p className="text-body">담당 과정을 선택해주세요</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
    <div className="space-y-6">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 font-bold text-gray-900">과정 커리큘럼</h1>
          <p className="text-body-sm text-gray-500 mt-1">
            {selectedCourse ? selectedCourse.name : ''}
            {curriculumStart && curriculumEnd
              ? ` · ${curriculumStart} ~ ${curriculumEnd}${coursePeriod?.cohort_number ? ` · ${coursePeriod.cohort_number}기` : ''}`
              : coursePeriod?.duration_months
                ? ` · ${coursePeriod.duration_months}개월 과정`
                : ''}
            {totalPhases > 0 ? ` · ${completedPhases}/${totalPhases} 단계 완료` : ''}
          </p>
        </div>
        <Badge variant="soft-warning">{overallProgress}% 진행</Badge>
      </div>

      {/* ── 전체 진행률 ── */}
      <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
        <ProgressBar
          value={overallProgress}
          color="bg-[#c9a227]"
          label="전체 진행률"
        />
      </Card>

      {/* ════════════ 커리큘럼 없을 때 빈 상태 ════════════ */}
      {curriculum.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <BookOpen className="w-12 h-12" />
          <p className="text-body">이 과정의 커리큘럼 데이터가 없습니다</p>
        </div>
      )}

      {/* ════════════ 데스크톱 도로형 타임라인 ════════════ */}
      {curriculum.length > 0 && <div className="hidden md:block">
        <Card className="overflow-hidden">
          <div className="relative py-4">
            {/* ─── 1행: 왼→오 (카드 위, 도로 아래) ─── */}
            <div className="relative">
              {/* 카드 + 기둥 + 도트 */}
              <div className="flex justify-around items-end px-8">
                {row1.map((phase) => (
                  <RoadPhaseCard
                    key={phase.id}
                    phase={phase}
                    isSelected={selectedPhaseId === phase.id}
                    onClick={() => togglePhase(phase.id)}
                    position="top"
                  />
                ))}
              </div>
              {/* 도로 */}
              <div className="relative mx-8 -mt-3">
                {/* START 깃발 */}
                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 -ml-2 flex flex-col items-center gap-0.5">
                  <Flag className="w-5 h-5 text-[#6f8391]" />
                  <span className="text-[10px] font-bold text-[#4f6475]">
                    START
                  </span>
                </div>
                <svg
                  viewBox="0 0 800 20"
                  className="w-full h-5"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1="10"
                    x2="800"
                    y2="10"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* 진행 표시 선 */}
                  <line
                    x1="0"
                    y1="10"
                    x2={(() => {
                      const completedInRow = row1.filter(
                        (p) => p.status === 'completed',
                      ).length;
                      const inProgressInRow = row1.find(
                        (p) => p.status === 'in_progress',
                      );
                      const base = (completedInRow / row1.length) * 800;
                      const extra = inProgressInRow
                        ? ((inProgressInRow.progress / 100) * 800) / row1.length
                        : 0;
                      return base + extra;
                    })()}
                    y2="10"
                    stroke="url(#roadGrad1)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* 점선 무늬 */}
                  <line
                    x1="0"
                    y1="10"
                    x2="800"
                    y2="10"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="12 10"
                    opacity="0.6"
                  />
                  <defs>
                    <linearGradient id="roadGrad1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3d3d3d" />
                      <stop offset="100%" stopColor="#c9a227" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* ─── 커브 연결 (우측) ─── */}
            <div className="flex justify-end px-8">
              <svg width="60" height="80" viewBox="0 0 60 80" className="mr-6">
                <path
                  d="M 30 0 Q 30 40, 30 80"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                />
                {(() => {
                  const allRow1Done = row1.every(
                    (p) => p.status === 'completed',
                  );
                  if (!allRow1Done) return null;
                  return (
                    <path
                      d="M 30 0 Q 30 40, 30 80"
                      stroke="#3d3d3d"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })()}
                <line
                  x1="30"
                  y1="0"
                  x2="30"
                  y2="80"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="12 10"
                  opacity="0.6"
                />
              </svg>
            </div>

            {/* ─── 2행: 오→왼 (도로 위, 카드 아래) ─── */}
            <div className="relative">
              {/* 도로 */}
              <div className="relative mx-8 mb-0">
                <svg
                  viewBox="0 0 800 20"
                  className="w-full h-5"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1="10"
                    x2="800"
                    y2="10"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* 진행 표시 (역방향: 오→왼) */}
                  {(() => {
                    const origRow = curriculum.slice(3, 6);
                    const completedInRow = origRow.filter(
                      (p) => p.status === 'completed',
                    ).length;
                    const inProgressInRow = origRow.find(
                      (p) => p.status === 'in_progress',
                    );
                    const base = (completedInRow / origRow.length) * 800;
                    const extra = inProgressInRow
                      ? ((inProgressInRow.progress / 100) * 800) /
                        origRow.length
                      : 0;
                    const filled = base + extra;
                    if (filled <= 0) return null;
                    return (
                      <line
                        x1="800"
                        y1="10"
                        x2={800 - filled}
                        y2="10"
                        stroke="url(#roadGrad2)"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                    );
                  })()}
                  <line
                    x1="0"
                    y1="10"
                    x2="800"
                    y2="10"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="12 10"
                    opacity="0.6"
                  />
                  <defs>
                    <linearGradient id="roadGrad2" x1="1" y1="0" x2="0" y2="0">
                      <stop offset="0%" stopColor="#c9a227" />
                      <stop offset="50%" stopColor="#e8d9a0" />
                      <stop offset="100%" stopColor="#a8a29e" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* GOAL 깃발 */}
                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 -ml-2 flex flex-col items-center gap-0.5">
                  <Trophy className="w-5 h-5 text-[#c9a227]" />
                  <span className="text-[10px] font-bold text-[#9a6220]">
                    GOAL
                  </span>
                </div>
              </div>
              {/* 카드 + 기둥 + 도트 */}
              <div className="flex justify-around items-start px-8 -mt-3">
                {row2.map((phase) => (
                  <RoadPhaseCard
                    key={phase.id}
                    phase={phase}
                    isSelected={selectedPhaseId === phase.id}
                    onClick={() => togglePhase(phase.id)}
                    position="bottom"
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 선택된 Phase 상세 */}
        {selectedPhase && (
          <div className="mt-4">
            <PhaseDetail phase={selectedPhase} />
          </div>
        )}
      </div>}

      {/* ════════════ 모바일 세로 타임라인 ════════════ */}
      {curriculum.length > 0 && <div className="flex flex-col md:hidden">
        <div className="relative">
          {/* 세로 도로 */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200 rounded-full">
            <div
              className="w-1 bg-linear-to-b from-[#3d3d3d] to-[#c9a227] rounded-full transition-all duration-500"
              style={{
                height: `${
                  (curriculum.filter((c) => c.status === 'completed')
                    .length /
                    totalPhases) *
                    100 +
                  (curriculum.find((c) => c.status === 'in_progress')
                    ?.progress ?? 0) /
                    totalPhases
                }%`,
              }}
            />
          </div>

          <div className="space-y-4 pl-14">
            {curriculum.map((phase) => {
              const config = statusConfig[phase.status];
              const PhaseIcon = Icons[phase.icon] || Icons.BookOpen;
              const isSelected = selectedPhaseId === phase.id;
              return (
                <div key={phase.id} className="relative">
                  {/* 도로 위 도트 */}
                  <div
                    className={`
                      absolute -left-11 top-5 w-5 h-5 rounded-full border-[3px]
                      flex items-center justify-center
                      ${
                        phase.status === 'completed'
                          ? 'border-[#6b6560] bg-[#f0efeb]'
                          : phase.status === 'in_progress'
                            ? 'border-[#c9a227] bg-[#faf4e8]'
                            : 'border-gray-300 bg-gray-50'
                      }
                    `}
                  >
                    {phase.status === 'completed' && (
                      <CheckCircle2 className="w-3 h-3 text-[#6b6560]" />
                    )}
                    {phase.status === 'in_progress' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c9a227]" />
                    )}
                  </div>

                  {/* 카드 */}
                  <div
                    onClick={() => togglePhase(phase.id)}
                    className={`
                      rounded-xl border-2 p-4 transition-all cursor-pointer
                      ${
                        isSelected
                          ? `bg-linear-to-br ${config.gradient} text-white shadow-lg`
                          : phase.status === 'in_progress'
                            ? 'border-[#e8d9a0] bg-[#f8f7f4] shadow-md'
                            : phase.status === 'completed'
                              ? 'border-[#d6d3cf] bg-[#f8f7f4] shadow-sm'
                              : 'border-[#e2ded7] bg-[#f0efeb]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-white/25' : config.iconBg
                          }`}
                        >
                          <PhaseIcon
                            className={`w-4 h-4 ${isSelected ? 'text-white' : config.iconColor}`}
                          />
                        </div>
                        <div>
                          <h3
                            className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}
                          >
                            {phase.title}
                          </h3>
                          <span
                            className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}
                          >
                            Phase {phase.phase}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isSelected ? 'default' : config.badgeVariant}
                          size="sm"
                        >
                          {config.label}
                        </Badge>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isSelected ? 'text-white/70 rotate-180' : 'text-gray-400'}`}
                        />
                      </div>
                    </div>
                    <div
                      className={`w-full rounded-full h-1.5 ${isSelected ? 'bg-white/20' : 'bg-gray-200'}`}
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${isSelected ? 'bg-white/80' : config.color}`}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs mt-1 block ${isSelected ? 'text-white/80' : 'text-gray-400'}`}
                    >
                      {phase.progress}%
                    </span>

                    {/* 진행 중 펄스 */}
                    {phase.status === 'in_progress' && !isSelected && (
                      <div className="absolute -left-11 top-3 w-5 h-5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9a227] opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* 상세 */}
                  {isSelected && (
                    <div className="mt-3">
                      <PhaseDetail phase={phase} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>}
    </div>
    </div>
  );
}
