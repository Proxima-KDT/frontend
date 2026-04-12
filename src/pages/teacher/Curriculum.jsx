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
    color: 'bg-green-500',
    badgeVariant: 'success',
    label: '완료',
    gradient: 'from-green-400 to-emerald-500',
    ring: 'ring-green-200',
    road: '#22c55e',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  in_progress: {
    color: 'bg-teacher-500',
    badgeVariant: 'teacher',
    label: '진행 중',
    gradient: 'from-teacher-400 to-teacher-600',
    ring: 'ring-teacher-200',
    road: '#0ea5e9',
    iconBg: 'bg-teacher-100',
    iconColor: 'text-teacher-600',
  },
  upcoming: {
    color: 'bg-gray-300',
    badgeVariant: 'default',
    label: '예정',
    gradient: 'from-gray-300 to-gray-400',
    ring: 'ring-gray-200',
    road: '#d1d5db',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-400',
  },
};

/* ── 태스크 아이콘 ── */
function TaskStatusIcon({ progress }) {
  if (progress === 100)
    return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
  if (progress > 0)
    return <Clock className="w-4 h-4 text-teacher-500 shrink-0" />;
  return <Circle className="w-4 h-4 text-gray-300 shrink-0" />;
}

/* ── Phase 상세 패널 ── */
function PhaseDetail({ phase }) {
  const config = statusConfig[phase.status];
  const completedTasks = phase.tasks.filter((t) => t.progress === 100).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
                    ? 'bg-green-500'
                    : task.progress > 0
                      ? 'bg-teacher-500'
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
                ? 'bg-white border-2 border-teacher-300 shadow-md hover:shadow-lg hover:scale-102'
                : phase.status === 'completed'
                  ? 'bg-white border-2 border-green-200 shadow-sm hover:shadow-md hover:scale-102'
                  : 'bg-gray-50 border-2 border-gray-200 hover:shadow-md hover:scale-102'
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
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teacher-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teacher-500" />
          </div>
        )}
      </div>

      {/* 연결 기둥 */}
      <div
        className={`w-0.5 ${isSelected ? 'h-6' : 'h-8'} ${
          phase.status === 'completed'
            ? 'bg-green-300'
            : phase.status === 'in_progress'
              ? 'bg-teacher-300'
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
              ? 'border-green-500 bg-green-50'
              : phase.status === 'in_progress'
                ? 'border-teacher-500 bg-teacher-50'
                : 'border-gray-300 bg-gray-50'
          }
          ${isSelected ? `ring-4 ${config.ring}` : ''}
        `}
      >
        {phase.status === 'completed' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        ) : phase.status === 'in_progress' ? (
          <div className="w-2 h-2 rounded-full bg-teacher-500" />
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
        <Badge variant="teacher">{overallProgress}% 진행</Badge>
      </div>

      {/* ── 전체 진행률 ── */}
      <Card>
        <ProgressBar
          value={overallProgress}
          color="bg-teacher-500"
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
                  <Flag className="w-5 h-5 text-green-500" />
                  <span className="text-[10px] font-bold text-green-600">
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
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#0ea5e9" />
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
                      stroke="#22c55e"
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
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#d1d5db" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* GOAL 깃발 */}
                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 -ml-2 flex flex-col items-center gap-0.5">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-[10px] font-bold text-yellow-600">
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
              className="w-1 bg-linear-to-b from-green-500 to-teacher-500 rounded-full transition-all duration-500"
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
                          ? 'border-green-500 bg-green-50'
                          : phase.status === 'in_progress'
                            ? 'border-teacher-500 bg-teacher-50'
                            : 'border-gray-300 bg-gray-50'
                      }
                    `}
                  >
                    {phase.status === 'completed' && (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    )}
                    {phase.status === 'in_progress' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-teacher-500" />
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
                            ? 'border-teacher-300 bg-white shadow-md'
                            : phase.status === 'completed'
                              ? 'border-green-200 bg-white shadow-sm'
                              : 'border-gray-200 bg-gray-50'
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
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teacher-400 opacity-50" />
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
  );
}
