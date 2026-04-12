import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Camera,
  BriefcaseBusiness,
  ChevronDown,
  X,
  GraduationCap,
  Lightbulb,
  CalendarDays,
  Hash,
} from 'lucide-react';
import { profileApi } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';
import {
  SKILL_LABEL_MAP,
  toDisplaySkillLabel,
  SKILL_BAR_BG_CLASSES,
} from '@/utils/skillDisplay';

const JOB_POSITIONS = [
  { value: 'frontend_developer', label: '?꾨줎?몄뿏??媛쒕컻?? },
  { value: 'backend_developer', label: '諛깆뿏??媛쒕컻?? },
  { value: 'fullstack_developer', label: '??ㅽ깮 媛쒕컻?? },
  { value: 'data_engineer', label: '?곗씠???붿??덉뼱' },
  { value: 'ai_ml_engineer', label: 'AI/ML ?붿??덉뼱' },
  { value: 'cloud_engineer', label: '?대씪?곕뱶 ?붿??덉뼱' },
  { value: 'devops_engineer', label: 'DevOps ?붿??덉뼱' },
  { value: 'qa_engineer', label: 'QA ?붿??덉뼱' },
];

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
  if (score >= 80) return '?꾩껜 ?곸쐞 ??5%';
  if (score >= 60) return '?꾩껜 ?곸쐞 ??8%';
  if (score >= 40) return '?꾩껜 ?곸쐞 ??25%';
  return '?꾩껜 ?곸쐞 ??50%';
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
            吏곷Т 異붽?
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
                  aria-label={`${opt.label} ?쒓굅`}
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

  const displayName =
    profile?.name?.trim() || user?.name?.trim() || '?대쫫 ?놁쓬';

  const radarChartData = useMemo(
    () =>
      chartScores.map((s) => ({
        ...s,
        subject: toDisplaySkillLabel(s.subject),
      })),
    [chartScores],
  );

  const coachMessage = useMemo(() => {
    const name = profile?.name?.trim()?.split(/\s+/)[0] ?? '?숈뒿??;
    if (!chartScores.length) {
      return `${name}?? ??웾 ?곗씠?곕? 遺덈윭?ㅻ㈃ 留욎땄 肄붿묶 硫붿떆吏媛 ?쒖떆?⑸땲??`;
    }
    const lowest = [...chartScores].sort((a, b) => a.score - b.score)[0];
    const focus = lowest.subject;
    return `${name}?섏쓽 ${focus} ??ぉ??議곌툑留??뚯뼱?щ━硫??ㅼ쓬 ?곗뼱???쒖링 媛源뚯썙吏묐땲?? ?ㅼ쓬 二???껜???뚰겕?띿뿉??AI 留먰븯湲??숈뒿 李몄뿬瑜??섎━??寃껊룄 醫뗭? 諛⑸쾿?댁뿉??`;
  }, [profile?.name, chartScores]);

  const tier = getTierInfo(overallScore);
  const rankHint = getRankHint(overallScore);
  const programInfo = useMemo(
    () => ({
      course:
        profile?.course_name?.trim() ||
        '??껜??AI ?곸긽 媛앹껜 ?먯? 遺꾩꽍 ?뚮옯??援ъ텞',
      period:
        profile?.course_start_date && profile?.course_end_date
          ? `${profile.course_start_date.replaceAll('-', '.')} ~ ${profile.course_end_date.replaceAll('-', '.')}`
          : '2025.12 ~ 2026.05.15',
      mentor: '源吏꾪샇',
      instructor: '瑜섏젙??,
      status: '?ы븰以?,
      cohort:
        profile?.cohort_number != null
          ? `${profile.cohort_number}湲?
          : "寃⑥슱 '24",
      credits: '142 / 160',
    }),
    [profile],
  );

  function handleImageClick() {
    fileInputRef.current?.click();
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await profileApi.uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatar_url: result.avatar_url }));
      showToast({ type: 'success', message: '?꾨줈???ъ쭊???낅뜲?댄듃?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '?대?吏 ?낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎.' });
    }
  }

  async function handleJobsChange(jobs) {
    setSelectedJobs(jobs);
    try {
      await profileApi.updateTargetJobs(jobs);
    } catch {
      showToast({ type: 'error', message: '吏곷Т ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.' });
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

  return (
    <div className="rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* ?? Left: profile & career ?? */}
          <div className="min-w-0 space-y-8">
            {/* ?ъ쭊 ????怨쇱젙쨌湲곌컙쨌?쇱젙? 紐⑤몢 ?ъ쭊 ?꾨옒 ?몃줈 諛곗튂 */}
            <div className="flex flex-col gap-6 sm:gap-7">
              <div className="relative mx-auto w-fit shrink-0 sm:mx-0">
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="group relative h-[250px] w-[188px] overflow-hidden rounded-2xl shadow-[0_12px_28px_rgba(45,42,38,0.12)] ring-1 ring-[#ebe8e3] focus:outline-none focus:ring-2 focus:ring-[#c5c2bc] sm:h-[260px] sm:w-[198px]"
                  aria-label="?꾨줈???ъ쭊 蹂寃?
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="?꾨줈??
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
                  aria-label="?꾨줈???ъ쭊 蹂寃?
                >
                  <Camera className="w-4 h-4 text-[#4a4640]" />
                </button>
              </div>

              <div className="w-full min-w-0 space-y-5">
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#7a756c] uppercase mb-2">
                    ?섍컯?앸챸
                  </p>
                  <h2
                    className={`text-[1.85rem] sm:text-[2rem] font-semibold text-[#1f1e1c] leading-tight`}
                  >
                    {displayName}
                  </h2>
                </div>

                <div className="flex items-start gap-2">
                  <GraduationCap className="w-5 h-5 text-[#5c6675] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-[#7a756c] uppercase mb-1">
                      怨쇱젙
                    </p>
                    <p className="text-[1.05rem] font-semibold text-[#2d2a26] leading-snug">
                      {programInfo.course}
                    </p>
                    {profile?.course_name && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.cohort_number != null && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e2dc] bg-white/90 px-2.5 py-1 text-[0.7rem] font-medium text-[#4a4640]">
                            <Hash className="h-3 w-3 shrink-0" />
                            {profile.cohort_number}湲?                          </span>
                        )}
                        {profile.course_start_date &&
                          profile.course_end_date && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e2dc] bg-white/90 px-2.5 py-1 text-[0.7rem] font-medium text-[#6b6560]">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              {profile.course_start_date.replaceAll('-', '.')} ~{' '}
                              {profile.course_end_date.replaceAll('-', '.')}
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-[#ebe8e3] pt-4 sm:grid-cols-4">
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      ?섍컯 ?곹깭
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      {programInfo.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      湲곗닔
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      {programInfo.cohort}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      ?댁닔 ?щ젅??                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      {programInfo.credits}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      ?숈뒿 ?쒓컙
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      ?됱씪 09:00 ~ 18:00
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#eae7df] bg-white/75 p-3 sm:p-4">
                  <p className="text-[0.84rem] text-[#5c5852] leading-relaxed">
                    ?섍컯 湲곌컙: {programInfo.period}
                    <span className="mx-2 text-[#c4beb3]">|</span>
                    硫섑넗: {programInfo.mentor}
                    <span className="mx-2 text-[#c4beb3]">|</span>
                    ?대떦媛뺤궗: {programInfo.instructor}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <BriefcaseBusiness className="w-5 h-5 text-[#5c6675]" />
                <span
                  className={`text-[1.15rem] font-semibold text-[#2d2a26]`}
                >
                  紐⑺몴 吏곷Т
                </span>
              </div>
              <JobMultiSelect
                options={JOB_POSITIONS}
                selected={selectedJobs}
                onChange={handleJobsChange}
              />
            </div>
          </div>

          {/* ?? Right: competency ?? */}
          <div className="rounded-3xl border border-[#ebe8e3] bg-white/95 p-6 sm:p-7 shadow-[0_20px_48px_rgba(45,42,38,0.06)]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2
                  className={`text-[1.5rem] sm:text-[1.65rem] font-semibold text-[#1f1e1c]`}
                >
                  ??웾 遺꾩꽍
                </h2>
                <p className="mt-1 text-[0.7rem] font-medium tracking-wide text-[#a39c92]">
                  Competency analysis
                </p>
              </div>
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
                    吏??                  </span>
                  <span className={`text-2xl font-semibold text-[#2d2a26]`}>
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
              <div className="flex flex-1 flex-col justify-center gap-3.5 lg:min-w-[220px]">
                {chartScores.map((skill, idx) => (
                  <ProgressBar
                    key={`${skill.subject}-${idx}`}
                    value={skill.score}
                    label={toDisplaySkillLabel(skill.subject)}
                    color={SKILL_BAR_BG_CLASSES[idx % SKILL_BAR_BG_CLASSES.length]}
                    size="md"
                    labelClassName="text-[0.78rem] font-semibold tracking-tight text-[#3d3a36] whitespace-normal break-keep leading-snug pr-1"
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#ebe5cf] bg-[#faf6e8] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex gap-3">
                <Lightbulb className="w-6 h-6 shrink-0 text-[#c9a227] opacity-90" />
                <div>
                  <p
                    className={`text-[1.05rem] italic font-medium text-[#3d3a36] mb-2`}
                  >
                    AI ?숈뒿 肄붿튂
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
