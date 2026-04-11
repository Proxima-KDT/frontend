import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Camera,
  BriefcaseBusiness,
  ChevronDown,
  X,
  GraduationCap,
  Lightbulb,
} from 'lucide-react';
import { profileApi } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';

const JOB_POSITIONS = [
  { value: 'frontend_developer', label: '프론트엔드 개발자' },
  { value: 'backend_developer', label: '백엔드 개발자' },
  { value: 'fullstack_developer', label: '풀스택 개발자' },
  { value: 'data_engineer', label: '데이터 엔지니어' },
  { value: 'ai_ml_engineer', label: 'AI/ML 엔지니어' },
  { value: 'cloud_engineer', label: '클라우드 엔지니어' },
  { value: 'devops_engineer', label: 'DevOps 엔지니어' },
  { value: 'qa_engineer', label: 'QA 엔지니어' },
];

const SKILL_LABEL_MAP = {
  출석: '출결',
  출결: '출결',
  'AI 말하기': 'AI 말하기 학습',
};

function toDisplaySkillLabel(subject) {
  const s = SKILL_LABEL_MAP[subject] || subject;
  if (s.includes('출결') || subject === '출석') return '출결';
  if (s.includes('말하기')) return 'AI 말하기';
  if (s.includes('면접')) return 'AI 면접';
  if (s.includes('포트폴리오')) return '포트폴리오';
  if (s.includes('프로젝트') || s.includes('과제') || s.includes('시험'))
    return '프로젝트·과제·시험';
  return String(subject);
}

function isOliveSkillBar(subject) {
  const s = SKILL_LABEL_MAP[subject] || subject;
  return (
    s.includes('프로젝트') ||
    s.includes('과제') ||
    s.includes('시험') ||
    subject.includes('프로젝트')
  );
}

function getTierInfo(score) {
  if (score >= 80)
    return {
      label: 'MASTER',
      badgeClass: 'bg-[#2a2a2a]',
    };
  if (score >= 60)
    return {
      label: 'ADVANCED',
      badgeClass: 'bg-[#3d3d3d]',
    };
  if (score >= 40)
    return {
      label: 'INTERMEDIATE',
      badgeClass: 'bg-[#5c5c5c]',
    };
  return {
    label: 'BEGINNER',
    badgeClass: 'bg-[#6b6b6b]',
  };
}

function getRankHint(score) {
  if (score >= 80) return '전체 상위 약 5%';
  if (score >= 60) return '전체 상위 약 8%';
  if (score >= 40) return '전체 상위 약 25%';
  return '전체 상위 약 50%';
}

function JobMultiSelect({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function remove(value, e) {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  }

  const selectedLabels = options.filter((o) => selected.includes(o.value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full min-h-11 rounded-2xl border border-[#d4e6f7] bg-white/90 px-3 py-2.5 text-left flex items-center gap-2 flex-wrap focus:outline-none focus:ring-2 focus:ring-[#b8d4f0]/60 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
      >
        {selectedLabels.length === 0 ? (
          <span className="text-[0.8125rem] text-[#7a756c] flex-1 tracking-wide">
            직무 추가
          </span>
        ) : (
          <span className="flex flex-wrap gap-1.5 flex-1">
            {selectedLabels.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#dcebf9] text-[#1e4a6e] text-[0.75rem] font-semibold border border-[#c5ddf5]"
              >
                {opt.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => remove(opt.value, e)}
                  onKeyDown={(e) => e.key === 'Enter' && remove(opt.value, e)}
                  className="hover:text-[#0f2d44] cursor-pointer opacity-70"
                  aria-label={`${opt.label} 제거`}
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))}
          </span>
        )}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#c5ddf5] bg-[#eef6fc] text-[#2563a8] text-lg font-light leading-none">
          +
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#7a9eb8] shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-[#e5e2dc] bg-white shadow-[0_16px_40px_rgba(45,42,38,0.12)] py-1">
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#f9f8f6] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="w-4 h-4 rounded border-[#c5c2bc] accent-[#4a5f7a]"
                />
                <span
                  className={`text-[0.875rem] ${checked ? 'font-semibold text-[#2d2a26]' : 'text-[#4a4640]'}`}
                >
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyPage() {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [skillScores, setSkillScores] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([profileApi.getMe(), profileApi.getSkillScores()])
      .then(([prof, scores]) => {
        setProfile(prof);
        setSkillScores(scores);
        setSelectedJobs(prof.target_jobs ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const overallScore = useMemo(() => {
    if (!skillScores.length) return 0;
    return Math.round(
      skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length,
    );
  }, [skillScores]);

  const chartScores = useMemo(() => {
    const normalized = skillScores.map((item) => ({
      ...item,
      subject: SKILL_LABEL_MAP[item.subject] || item.subject,
    }));
    const sorted = normalized
      .map((item, idx) => ({ idx, score: item.score }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((v) => v.idx);
    const lowSet = new Set(sorted);
    return normalized.map((item, idx) => ({
      ...item,
      isLow: lowSet.has(idx),
    }));
  }, [skillScores]);

  const loginId = useMemo(() => {
    const emailId = user?.email?.split('@')?.[0];
    return emailId || user?.name || profile?.name || 'user';
  }, [user?.email, user?.name, profile?.name]);

  const radarChartData = useMemo(
    () =>
      chartScores.map((s) => ({
        ...s,
        subject: toDisplaySkillLabel(s.subject),
      })),
    [chartScores],
  );

  const coachMessage = useMemo(() => {
    const name = profile?.name?.trim()?.split(/\s+/)[0] ?? '학습자';
    if (!chartScores.length) {
      return `${name}님, 역량 데이터를 불러오면 맞춤 코칭 메시지가 표시됩니다.`;
    }
    const lowest = [...chartScores].sort((a, b) => a.score - b.score)[0];
    const focus = lowest.subject;
    return `${name}님의 ${focus} 항목을 조금만 끌어올리면 다음 티어에 한층 가까워집니다. 다음 주 랭체인 워크숍에서 AI 말하기 학습 참여를 늘리는 것도 좋은 방법이에요.`;
  }, [profile?.name, chartScores]);

  const tier = getTierInfo(overallScore);
  const rankHint = getRankHint(overallScore);
  const programInfo = {
    course: '랭체인 AI 영상 객체 탐지 분석 플랫폼 구축',
    period: '2025.12 ~ 2026.05.15',
    mentor: '김진호',
    instructor: '류정원',
    status: '재학중',
    cohort: "겨울 '24",
    credits: '142 / 160',
  };

  function handleImageClick() {
    fileInputRef.current?.click();
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await profileApi.uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatar_url: result.avatar_url }));
      showToast({ type: 'success', message: '프로필 사진이 업데이트되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '이미지 업로드에 실패했습니다.' });
    }
  }

  async function handleJobsChange(jobs) {
    setSelectedJobs(jobs);
    try {
      await profileApi.updateTargetJobs(jobs);
    } catch {
      showToast({ type: 'error', message: '직무 저장에 실패했습니다.' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 rounded-3xl bg-[#F9F8F6] p-6">
        <Skeleton width="160px" height="32px" rounded="rounded-lg" />
        <Skeleton width="100%" height="200px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      </div>
    );
  }

  const editorialFont = "font-['Playfair_Display',Georgia,serif]";

  return (
    <div className="rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* ── Left: profile & career ── */}
          <div className="min-w-0 space-y-8">
            {/* 사진 위 → 과정·기간·일정은 모두 사진 아래 세로 배치 */}
            <div className="flex flex-col gap-6 sm:gap-7">
              <div className="relative mx-auto w-fit shrink-0 sm:mx-0">
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="group relative h-[250px] w-[188px] overflow-hidden rounded-2xl shadow-[0_12px_28px_rgba(45,42,38,0.12)] ring-1 ring-[#ebe8e3] focus:outline-none focus:ring-2 focus:ring-[#c5c2bc] sm:h-[260px] sm:w-[198px]"
                  aria-label="프로필 사진 변경"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="프로필"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#8a9aae] to-[#5c6675] flex items-center justify-center">
                      <span className="text-white text-3xl font-semibold">
                        {profile?.name?.charAt(0) ?? '?'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white shadow-md ring-1 ring-[#ebe8e3] flex items-center justify-center hover:bg-[#faf9f7] transition-colors"
                  aria-label="프로필 사진 변경"
                >
                  <Camera className="w-4 h-4 text-[#4a4640]" />
                </button>
              </div>

              <div className="w-full min-w-0 space-y-5">
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#7a756c] uppercase mb-2">
                    로그인 아이디
                  </p>
                  <h2
                    className={`${editorialFont} text-[1.85rem] sm:text-[2rem] font-semibold text-[#1f1e1c] leading-tight`}
                  >
                    {loginId}
                  </h2>
                </div>

                <div className="flex items-start gap-2">
                  <GraduationCap className="w-5 h-5 text-[#5c6675] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-[#7a756c] uppercase mb-1">
                      과정
                    </p>
                    <p className="text-[1.05rem] font-semibold text-[#2d2a26] leading-snug">
                      {programInfo.course}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-[#ebe8e3] pt-4 sm:grid-cols-4">
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      수강 상태
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      {programInfo.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      기수
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      {programInfo.cohort}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      이수 크레딧
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      {programInfo.credits}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      학습 시간
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      평일 09:00 ~ 18:00
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#eae7df] bg-white/75 p-3 sm:p-4">
                  <p className="text-[0.84rem] text-[#5c5852] leading-relaxed">
                    수강 기간: {programInfo.period}
                    <span className="mx-2 text-[#c4beb3]">|</span>
                    멘토: {programInfo.mentor}
                    <span className="mx-2 text-[#c4beb3]">|</span>
                    담당강사: {programInfo.instructor}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <BriefcaseBusiness className="w-5 h-5 text-[#5c6675]" />
                <span
                  className={`${editorialFont} text-[1.15rem] font-semibold text-[#2d2a26]`}
                >
                  목표 직무
                </span>
              </div>
              <JobMultiSelect
                options={JOB_POSITIONS}
                selected={selectedJobs}
                onChange={handleJobsChange}
              />
            </div>
          </div>

          {/* ── Right: competency ── */}
          <div className="rounded-3xl border border-[#ebe8e3] bg-white/95 p-6 sm:p-7 shadow-[0_20px_48px_rgba(45,42,38,0.06)]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h2
                className={`${editorialFont} text-[1.5rem] sm:text-[1.65rem] font-semibold text-[#1f1e1c]`}
              >
                역량 분석
              </h2>
              <div className="flex flex-wrap items-start justify-end gap-3">
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-[0.7rem] font-bold tracking-[0.12em] text-white ${tier.badgeClass}`}
                  >
                    {tier.label}
                  </span>
                  <p className="text-[0.7rem] text-[#6b6560] mt-1.5 tracking-wide">
                    {rankHint}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center min-w-[4.5rem] rounded-xl border border-[#e3e0da] bg-[#faf9f7] px-3 py-2">
                  <span className="text-[0.6rem] font-bold tracking-[0.15em] text-[#7a756c] uppercase">
                    지수
                  </span>
                  <span className={`${editorialFont} text-2xl font-semibold text-[#2d2a26]`}>
                    {overallScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-5">
              <div className="min-h-[280px] min-w-0 flex-1 lg:max-w-[58%]">
                <SkillRadarChart
                  data={radarChartData}
                  variant="editorial"
                  color="#4a4845"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3.5 lg:min-w-[200px]">
                {chartScores.map((skill) => {
                  const barColor = isOliveSkillBar(skill.subject)
                    ? 'bg-[#6f7749]'
                    : 'bg-[#4a4643]';
                  return (
                    <ProgressBar
                      key={skill.subject}
                      value={skill.score}
                      label={toDisplaySkillLabel(skill.subject)}
                      color={barColor}
                      size="md"
                      labelClassName="text-[0.7rem] font-bold tracking-[0.03em] text-[#4a4640]"
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#ebe5cf] bg-[#faf6e8] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex gap-3">
                <Lightbulb className="w-6 h-6 shrink-0 text-[#c9a227] opacity-90" />
                <div>
                  <p
                    className={`${editorialFont} text-[1.05rem] italic font-medium text-[#3d3a36] mb-2`}
                  >
                    AI 학습 코치
                  </p>
                  <p className="text-[0.9rem] sm:text-[0.9375rem] leading-relaxed text-[#4d5a38]">
                    {coachMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
