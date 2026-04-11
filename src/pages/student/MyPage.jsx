import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Camera,
  BriefcaseBusiness,
  ChevronDown,
  X,
  BookOpen,
  CalendarDays,
  Hash,
} from 'lucide-react';
import { profileApi } from '@/api/profile';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
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

// 점수에 따른 티어 정보 계산 (0-39: Beginner, 40-59: Intermediate, 60-79: Advanced, 80-100: Master)
function getTierInfo(score) {
  if (score >= 80)
    return {
      label: 'MASTER',
      color: 'text-amber-500',
      border: 'border-amber-400',
      bg: 'bg-amber-50',
      score: 'text-amber-600',
      badge: 'bg-amber-500',
    };
  if (score >= 60)
    return {
      label: 'ADVANCED',
      color: 'text-purple-500',
      border: 'border-purple-400',
      bg: 'bg-purple-50',
      score: 'text-purple-600',
      badge: 'bg-purple-500',
    };
  if (score >= 40)
    return {
      label: 'INTERMEDIATE',
      color: 'text-blue-500',
      border: 'border-blue-400',
      bg: 'bg-blue-50',
      score: 'text-blue-600',
      badge: 'bg-blue-500',
    };
  return {
    label: 'BEGINNER',
    color: 'text-gray-500',
    border: 'border-gray-400',
    bg: 'bg-gray-50',
    score: 'text-gray-600',
    badge: 'bg-gray-500',
  };
}

// 역량 항목별 프로그레스 바 색상
const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
];

// 목표 직무 다중 선택 드롭다운
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
        className="w-full min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left flex items-center gap-2 flex-wrap focus:outline-none focus:border-student-500 focus:ring-2 focus:ring-student-100 transition-colors"
      >
        {selectedLabels.length === 0 ? (
          <span className="text-body-sm text-gray-400 flex-1">
            직무를 선택하세요 (복수 선택 가능)
          </span>
        ) : (
          <span className="flex flex-wrap gap-1 flex-1">
            {selectedLabels.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-student-100 text-student-700 text-caption font-semibold"
              >
                {opt.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => remove(opt.value, e)}
                  onKeyDown={(e) => e.key === 'Enter' && remove(opt.value, e)}
                  className="hover:text-student-900 cursor-pointer"
                  aria-label={`${opt.label} 제거`}
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg py-1">
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="w-4 h-4 rounded accent-student-500"
                />
                <span
                  className={`text-body-sm ${checked ? 'font-semibold text-student-700' : 'text-gray-700'}`}
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
    return Math.round(skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length);
  }, [skillScores]);

  const tier = getTierInfo(overallScore);

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
      <div className="space-y-6">
        <Skeleton width="160px" height="32px" rounded="rounded-lg" />
        <Skeleton width="100%" height="200px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-gray-900">마이페이지</h1>

      {/* ── 프로필 카드 ── */}
      <Card className={`border-2 ${tier.border}`}>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* 프로필 사진 */}
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <button
              type="button"
              onClick={handleImageClick}
              className="group relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg focus:outline-none"
              aria-label="프로필 사진 변경"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="프로필"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-student-400 to-student-600 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {profile?.name?.charAt(0) ?? '?'}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="프로필 사진 변경"
            >
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 이름 + 티어 + 목표 직무 */}
          <div className="flex-1 w-full min-w-0">
            <p className="text-caption text-gray-500 mb-1">수강생</p>
            <h2 className="text-h2 font-bold text-gray-900 mb-2">
              {profile?.name}
            </h2>
            {/* 교과 과정 정보 */}
            {profile?.course_name && (
              <div className="mb-3 p-3 rounded-xl bg-student-50 border border-student-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-student-500 shrink-0" />
                  <span className="text-caption font-semibold text-student-700">
                    {profile.course_name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.cohort_number && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-student-200 text-caption text-student-600 font-medium">
                      <Hash className="w-3 h-3" />
                      {profile.cohort_number}기
                    </span>
                  )}
                  {profile.course_start_date && profile.course_end_date && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-student-200 text-caption text-gray-500">
                      <CalendarDays className="w-3 h-3" />
                      {profile.course_start_date.replaceAll('-', '.')} ~ {profile.course_end_date.replaceAll('-', '.')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 종합 점수 + 티어 배지 */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-2xl ${tier.bg} border-2 ${tier.border}`}
              >
                <span className={`text-2xl font-extrabold ${tier.score}`}>
                  {overallScore}
                </span>
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-white text-body-sm font-bold tracking-wider ${tier.badge}`}
                >
                  {tier.label}
                </span>
                <p className="text-caption text-gray-400 mt-1">
                  종합 역량 지수
                </p>
              </div>
            </div>

            {/* 목표 직무 다중 선택 */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BriefcaseBusiness className="w-4 h-4 text-student-500" />
                <span className="text-body-sm font-semibold text-gray-700">
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
        </div>
      </Card>

      {/* ── 역량 분석 ── */}
      <Card>
        <h2 className="text-h3 font-bold text-gray-900 mb-5">역량 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkillRadarChart data={skillScores} color="#3B82F6" />

          <div className="flex flex-col justify-center gap-4">
            {skillScores.map((skill, idx) => (
              <ProgressBar
                key={skill.subject}
                value={skill.score}
                label={skill.subject}
                color={SKILL_COLORS[idx]}
                size="md"
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
