import { useRef, useMemo } from 'react';
import {
  Camera,
  GraduationCap,
  Lightbulb,
  CalendarDays,
  Hash,
  FileText,
  FolderOpen,
  Upload,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import {
  toDisplaySkillLabel,
  SKILL_BAR_BG_CLASSES,
} from '@/utils/skillDisplay';

function getTierInfo(score) {
  if (score >= 80)
    return { label: 'MASTER', badgeClass: 'bg-[#2a2a2a]' };
  if (score >= 60)
    return { label: 'ADVANCED', badgeClass: 'bg-[#3d3d3d]' };
  if (score >= 40)
    return { label: 'INTERMEDIATE', badgeClass: 'bg-[#5c5c5c]' };
  return { label: 'BEGINNER', badgeClass: 'bg-[#6b6b6b]' };
}

function getRankHint(score) {
  if (score >= 80) return '전체 상위 약 5%';
  if (score >= 60) return '전체 상위 약 8%';
  if (score >= 40) return '전체 상위 약 25%';
  return '전체 상위 약 50%';
}

/**
 * StudentProfileView
 *
 * props:
 *   profile       - { name, email, avatar_url, overall_score, tier,
 *                     course_name, cohort_number, course_start_date, course_end_date,
 *                     teacher_name, mentor_name,
 *                     daily_start_time, daily_end_time }
 *   skillScores   - [{ subject, score }]  (display-label strings already OK)
 *   files         - [{ id, name, url, type, uploaded_at }]
 *   readOnly      - boolean (default false)
 *   onAvatarUpload  - (file) => void  (only used when !readOnly)
 *   onFileUpload    - (file, fileType) => void
 *   onFileDelete    - (fileId) => void
 *   fileUploading   - boolean
 */
export default function StudentProfileView({
  profile,
  skillScores = [],
  files = [],
  readOnly = false,
  onAvatarUpload,
  onFileUpload,
  onFileDelete,
  fileUploading = false,
}) {
  const fileInputRef = useRef(null);

  const overallScore = useMemo(() => {
    if (!skillScores.length) return 0;
    return Math.round(
      skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length,
    );
  }, [skillScores]);

  const chartScores = useMemo(() => {
    const sorted = skillScores
      .map((item, idx) => ({ idx, score: item.score }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((v) => v.idx);
    const lowSet = new Set(sorted);
    return skillScores.map((item, idx) => ({
      ...item,
      isLow: lowSet.has(idx),
    }));
  }, [skillScores]);

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

  const displayName = profile?.name?.trim() || '이름 없음';

  const programInfo = useMemo(
    () => ({
      course:
        profile?.course_name?.trim() ||
        '랭체인 AI 영상 객체 탐지 분석 플랫폼 구축',
      period:
        profile?.course_start_date && profile?.course_end_date
          ? `${profile.course_start_date.replaceAll('-', '.')} ~ ${profile.course_end_date.replaceAll('-', '.')}`
          : '2025.12 ~ 2026.05.15',
      mentor: profile?.mentor_name || '—',
      instructor: profile?.teacher_name || '—',
      status: '재학중',
      cohort:
        profile?.cohort_number != null
          ? `${profile.cohort_number}기`
          : "겨울 '24",
      studyTime:
        profile?.daily_start_time && profile?.daily_end_time
          ? `평일 ${profile.daily_start_time} ~ ${profile.daily_end_time}`
          : '평일 09:00 ~ 18:00',
    }),
    [profile],
  );

  function handleImageClick() {
    if (readOnly) return;
    fileInputRef.current?.click();
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onAvatarUpload?.(file);
  }

  return (
    <div className="rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* ── Left: profile & career ── */}
          <div className="min-w-0 space-y-8">
            <div className="flex flex-col gap-6 sm:gap-7">
              <div className="relative mx-auto w-fit shrink-0 sm:mx-0">
                {readOnly ? (
                  /* readOnly: 아바타는 클릭 불가, 카메라 버튼 숨김 */
                  <div className="h-[250px] w-[188px] overflow-hidden rounded-2xl shadow-[0_12px_28px_rgba(45,42,38,0.12)] ring-1 ring-[#ebe8e3] sm:h-[260px] sm:w-[198px]">
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
                  </div>
                ) : (
                  /* editable: 클릭으로 업로드 */
                  <>
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
                  </>
                )}
              </div>

              <div className="w-full min-w-0 space-y-5">
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#7a756c] uppercase mb-2">
                    수강생명
                  </p>
                  <h2 className="text-[1.85rem] sm:text-[2rem] font-semibold text-[#1f1e1c] leading-tight">
                    {displayName}
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
                    {profile?.course_name && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.cohort_number != null && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e2dc] bg-white/90 px-2.5 py-1 text-[0.7rem] font-medium text-[#4a4640]">
                            <Hash className="h-3 w-3 shrink-0" />
                            {profile.cohort_number}기
                          </span>
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

                <div className="grid grid-cols-3 gap-3 border-t border-[#ebe8e3] pt-4">
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
                      학습 시간
                    </p>
                    <p className="text-[0.9375rem] text-[#3d3a36] font-medium">
                      {programInfo.studyTime}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#eae7df] bg-white/75 px-4 py-3">
                    <p className="text-[0.6rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      멘토
                    </p>
                    <p className="text-[0.9375rem] font-semibold text-[#3d3a36]">
                      {programInfo.mentor}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#eae7df] bg-white/75 px-4 py-3">
                    <p className="text-[0.6rem] font-semibold tracking-[0.12em] text-[#7a756c] uppercase mb-1">
                      담당강사
                    </p>
                    <p className="text-[0.9375rem] font-semibold text-[#3d3a36]">
                      {programInfo.instructor}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: competency ── */}
          <div className="rounded-3xl border border-[#ebe8e3] bg-white/95 p-6 sm:p-7 shadow-[0_20px_48px_rgba(45,42,38,0.06)]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[1.5rem] sm:text-[1.65rem] font-semibold text-[#1f1e1c]">
                  역량 분석
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
                    지수
                  </span>
                  <span className="text-2xl font-semibold text-[#2d2a26]">
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
                    color={
                      SKILL_BAR_BG_CLASSES[idx % SKILL_BAR_BG_CLASSES.length]
                    }
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
                  <p className="text-[1.05rem] italic font-medium text-[#3d3a36] mb-2">
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

        {/* 이력서 / 포트폴리오 (cohort_number가 있는 수강생만) */}
        {profile?.cohort_number && (
          <div className="mt-8 rounded-3xl border border-[#ebe8e3] bg-white/95 p-6 sm:p-7 shadow-[0_20px_48px_rgba(45,42,38,0.06)]">
            <h2 className="text-[1.5rem] font-semibold text-[#1f1e1c] mb-5">
              이력서 / 포트폴리오
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  type: 'resume',
                  label: '이력서',
                  icon: FileText,
                  accept: '.pdf,.doc,.docx',
                },
                {
                  type: 'portfolio',
                  label: '포트폴리오',
                  icon: FolderOpen,
                  accept: '.pdf,.doc,.docx,.ppt,.pptx',
                },
              ].map(({ type, label, icon: Icon, accept }) => {
                const typeFiles = files.filter((f) => f.type === type);
                return (
                  <div
                    key={type}
                    className="rounded-2xl border border-gray-200 bg-gray-50/30 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-body-sm font-semibold text-[#2d2a26]">
                          {label}
                        </span>
                        <span className="text-caption px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                          {typeFiles.length}
                        </span>
                      </div>
                      {!readOnly && (
                        <label
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-semibold cursor-pointer transition-colors ${fileUploading ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-100'} text-gray-700 bg-white border border-gray-200`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          업로드
                          <input
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) onFileUpload?.(f, type);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {typeFiles.length === 0 ? (
                      <p className="text-caption text-gray-400 text-center py-4">
                        아직 업로드된 파일이 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {typeFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-200"
                          >
                            <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="flex-1 text-body-sm text-gray-700 truncate">
                              {file.name}
                            </span>
                            {file.url && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                              </a>
                            )}
                            {!readOnly && (
                              <button
                                onClick={() => onFileDelete?.(file.id)}
                                className="p-1 rounded hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
