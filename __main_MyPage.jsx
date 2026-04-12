import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Camera,
  BriefcaseBusiness,
  ChevronDown,
  X,
  BookOpen,
  CalendarDays,
  Hash,
  Clock,
  User,
  UserCheck,
  FileText,
  FolderOpen,
  Upload,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { profileApi } from '@/api/profile';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';

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

// ?먯닔???곕Ⅸ ?곗뼱 ?뺣낫 怨꾩궛 (0-39: Beginner, 40-59: Intermediate, 60-79: Advanced, 80-100: Master)
function getTierInfo(score) {
  if (score >= 80)
    return {
      label: 'MASTER',
      color: 'text-[#2a2a2a]',
      border: 'border-[#2a2a2a]',
      bg: 'bg-[#faf9f7]',
      score: 'text-[#2a2a2a]',
      badge: 'bg-[#2a2a2a]',
    };
  if (score >= 60)
    return {
      label: 'ADVANCED',
      color: 'text-[#3d3d3d]',
      border: 'border-[#3d3d3d]',
      bg: 'bg-[#faf9f7]',
      score: 'text-[#3d3d3d]',
      badge: 'bg-[#3d3d3d]',
    };
  if (score >= 40)
    return {
      label: 'INTERMEDIATE',
      color: 'text-[#5c5c5c]',
      border: 'border-[#5c5c5c]',
      bg: 'bg-[#faf9f7]',
      score: 'text-[#5c5c5c]',
      badge: 'bg-[#5c5c5c]',
    };
  return {
    label: 'BEGINNER',
    color: 'text-[#6b6b6b]',
    border: 'border-[#6b6b6b]',
    bg: 'bg-[#faf9f7]',
    score: 'text-[#6b6b6b]',
    badge: 'bg-[#6b6b6b]',
  };
}

// ??웾 ??ぉ蹂??꾨줈洹몃젅??諛??됱긽
const SKILL_COLORS = [
  'bg-[#4a5f7a]',
  'bg-[#5c7a4e]',
  'bg-[#7a5c7a]',
  'bg-[#9a6220]',
  'bg-[#944848]',
];

// 紐⑺몴 吏곷Т ?ㅼ쨷 ?좏깮 ?쒕∼?ㅼ슫
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
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [skillScores, setSkillScores] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    Promise.all([profileApi.getMe(), profileApi.getSkillScores()])
      .then(([prof, scores]) => {
        setProfile(prof);
        setSkillScores(scores);
        setSelectedJobs(prof.target_jobs ?? []);
        // 硫붿씤 怨쇱젙(湲곗닔 ?덈뒗) ?숈깮留??뚯씪 濡쒕뱶
        if (prof.cohort_number) {
          profileApi.getFiles().then(setFiles).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleFileUpload(file, fileType) {
    setFileUploading(true);
    try {
      const newFile = await profileApi.uploadFile(file, fileType);
      setFiles((prev) => [newFile, ...prev]);
      showToast({ type: 'success', message: '?뚯씪???낅줈?쒕릺?덉뒿?덈떎.' });
    } catch {
      showToast({ type: 'error', message: '?뚯씪 ?낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎.' });
    } finally {
      setFileUploading(false);
    }
  }

  async function handleFileDelete(fileId) {
    try {
      await profileApi.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      showToast({ type: 'success', message: '?뚯씪????젣?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '?뚯씪 ??젣???ㅽ뙣?덉뒿?덈떎.' });
    }
  }

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
    <div className="space-y-6 rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1f1e1c]">留덉씠?섏씠吏</h1>

      {/* ?? ?꾨줈??移대뱶 ?? */}
      <Card className={`border ${tier.border} !rounded-3xl !border-[#e8e4dc] shadow-[0_8px_32px_rgba(45,42,38,0.05)]`}>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* ?꾨줈???ъ쭊 */}
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <button
              type="button"
              onClick={handleImageClick}
              className="group relative w-32 h-32 rounded-2xl overflow-hidden shadow-[0_12px_28px_rgba(45,42,38,0.12)] ring-1 ring-[#ebe8e3] focus:outline-none"
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

          {/* ?대쫫 + ?곗뼱 + 紐⑺몴 吏곷Т */}
          <div className="flex-1 w-full min-w-0">
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#7a756c] uppercase mb-1">?섍컯??/p>
            <h2 className="text-[1.85rem] font-semibold text-[#1f1e1c] leading-tight mb-2">
              {profile?.name}
            </h2>
            {/* 援먭낵 怨쇱젙 ?뺣낫 */}
            {profile?.course_name && (
              <div className="mb-3 p-3 rounded-xl bg-[#faf9f7] border border-[#ebe8e3]">
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#5c6675] shrink-0" />
                  <span className="text-caption font-semibold text-[#2d2a26]">
                    {profile.course_name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.cohort_number && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e2dc] text-[0.7rem] font-medium text-[#4a4640]">
                      <Hash className="w-3 h-3" />
                      {profile.cohort_number}湲?                    </span>
                  )}
                  {profile.course_start_date && profile.course_end_date && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e2dc] text-[0.7rem] font-medium text-[#6b6560]">
                      <CalendarDays className="w-3 h-3" />
                      {profile.course_start_date.replaceAll('-', '.')} ~ {profile.course_end_date.replaceAll('-', '.')}
                    </span>
                  )}
                  {profile.daily_start_time && profile.daily_end_time && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e2dc] text-[0.7rem] font-medium text-[#6b6560]">
                      <Clock className="w-3 h-3" />
                      {profile.daily_start_time} ~ {profile.daily_end_time}
                    </span>
                  )}
                </div>
                {(profile.teacher_name || profile.mentor_name) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.teacher_name && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e2dc] text-[0.7rem] text-[#4a4640]">
                        <User className="w-3 h-3 text-[#5c6675]" />
                        <span className="text-[#8a847a]">?대떦媛뺤궗</span>
                        <span className="font-medium">{profile.teacher_name}</span>
                      </span>
                    )}
                    {profile.mentor_name && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-[#e5e2dc] text-[0.7rem] text-[#4a4640]">
                        <UserCheck className="w-3 h-3 text-[#5c6675]" />
                        <span className="text-[#8a847a]">?대떦硫섑넗</span>
                        <span className="font-medium">{profile.mentor_name}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 醫낇빀 ?먯닔 + ?곗뼱 諛곗? */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-2xl ${tier.bg} border border-[#e3e0da]`}
              >
                <span className={`text-2xl font-semibold ${tier.score}`}>
                  {overallScore}
                </span>
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-md text-white text-[0.7rem] font-bold tracking-[0.12em] ${tier.badge}`}
                >
                  {tier.label}
                </span>
                <p className="text-[0.7rem] text-[#6b6560] mt-1">
                  醫낇빀 ??웾 吏??                </p>
              </div>
            </div>

            {/* 紐⑺몴 吏곷Т ?ㅼ쨷 ?좏깮 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BriefcaseBusiness className="w-5 h-5 text-[#5c6675]" />
                <span className="text-[1.15rem] font-semibold text-[#2d2a26]">
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
        </div>
      </Card>

      {/* ?? ??웾 遺꾩꽍 ?? */}
      <Card className="!rounded-3xl !border-[#ebe8e3] shadow-[0_8px_32px_rgba(45,42,38,0.05)]">
        <h2 className="text-[1.5rem] font-semibold text-[#1f1e1c] mb-5">??웾 遺꾩꽍</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkillRadarChart data={skillScores} color="#4a4845" />

          <div className="flex flex-col justify-center gap-4">
            {skillScores.map((skill, idx) => (
              <ProgressBar
                key={skill.subject}
                value={skill.score}
                label={skill.subject}
                color={SKILL_COLORS[idx % SKILL_COLORS.length]}
                size="md"
              />
            ))}
          </div>
        </div>
      </Card>

      {/* ?? ?대젰??/ ?ы듃?대━??(硫붿씤 怨쇱젙 ?숈깮留? ?? */}
      {profile?.cohort_number && (
        <Card className="!rounded-3xl !border-[#ebe8e3] shadow-[0_8px_32px_rgba(45,42,38,0.05)]">
          <h2 className="text-[1.5rem] font-semibold text-[#1f1e1c] mb-5">?대젰??/ ?ы듃?대━??/h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { type: 'resume', label: '?대젰??, icon: FileText, color: 'blue', accept: '.pdf,.doc,.docx' },
              { type: 'portfolio', label: '?ы듃?대━??, icon: FolderOpen, color: 'purple', accept: '.pdf,.doc,.docx,.ppt,.pptx' },
            ].map(({ type, label, icon: Icon, color, accept }) => {
              const typeFiles = files.filter((f) => f.type === type);
              return (
                <div key={type} className={`rounded-2xl border-2 border-${color}-100 bg-${color}-50/30 p-4`}>
                  {/* ?뱀뀡 ?ㅻ뜑 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                      </div>
                      <span className="text-body-sm font-semibold text-[#2d2a26]">{label}</span>
                      <span className={`text-caption px-1.5 py-0.5 rounded-full bg-${color}-100 text-${color}-700 font-medium`}>
                        {typeFiles.length}
                      </span>
                    </div>
                    {/* ?낅줈??踰꾪듉 */}
                    <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-${color}-500 text-white text-caption font-medium cursor-pointer hover:bg-${color}-600 transition-colors ${fileUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-3 h-3" />
                      ?낅줈??                      <input
                        type="file"
                        accept={accept}
                        className="hidden"
                        disabled={fileUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, type);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {/* ?뚯씪 紐⑸줉 */}
                  {typeFiles.length > 0 ? (
                    <div className="space-y-2">
                      {typeFiles.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#ebe8e3] group">
                          <div className={`w-7 h-7 rounded-lg bg-${color}-50 flex items-center justify-center shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 text-${color}-500`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-caption font-medium text-[#2d2a26] truncate">{f.name}</p>
                            {f.uploaded_at && (
                              <p className="text-[10px] text-[#8a847a]">{f.uploaded_at.replaceAll('-', '.')}</p>
                            )}
                          </div>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-[#8a847a] hover:text-[#4a5f7a] hover:bg-[#eef3f7] transition-colors"
                            title="蹂닿린"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleFileDelete(f.id)}
                            className="p-1 rounded-md text-[#c4bfb5] hover:text-[#944848] hover:bg-[#f3e8e8] transition-colors"
                            title="??젣"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Icon className="w-8 h-8 text-[#c4bfb5] mb-2" />
                      <p className="text-caption text-[#8a847a]">?깅줉??{label}媛 ?놁뒿?덈떎</p>
                      <p className="text-[10px] text-[#c4bfb5] mt-0.5">
                        {type === 'resume' ? 'PDF, DOC, DOCX' : 'PDF, DOC, DOCX, PPT, PPTX'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#8a847a] mt-3 text-center">
            ?뚯씪??理쒕? 10MB 쨌 媛뺤궗 諛?硫섑넗?먭쾶 怨듦컻?⑸땲??          </p>
        </Card>
      )}
    </div>
  );
}
