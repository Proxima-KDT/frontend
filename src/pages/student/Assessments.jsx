import { useState, useEffect } from 'react';
import {
  Award,
  Lock,
  CheckCircle2,
  Clock,
  Upload,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Paperclip,
  Download,
} from 'lucide-react';
import { assessmentsApi } from '@/api/assessments';
import { useToast } from '@/context/ToastContext';
import Skeleton from '@/components/common/Skeleton';

const pageBg = '#F7F5F0';const GOLD = '#c9a962';

// ── 상수 ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  locked: {
    label: '평가 예정',
    badgeClass: 'bg-gray-100 text-gray-500',
    icon: Lock,
    iconClass: 'text-gray-400',
  },
  open: {
    label: '제출 대기',
    badgeClass: 'bg-[#f7e5e3] text-[#a33b39]',
    icon: Clock,
    iconClass: 'text-[#a33b39]',
  },
  submitted: {
    label: '제출완료',
    badgeClass: 'bg-[#e9eff3] text-[#4f6475]',
    icon: CheckCircle2,
    iconClass: 'text-[#6f8391]',
  },
  graded: {
    label: '채점완료',
    badgeClass: 'bg-[#edf1e8] text-[#5e7455]',
    icon: CheckCircle2,
    iconClass: 'text-[#7f9078]',
  },
};

// ── 서브 컴포넌트 ──────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeClass}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ScoreRing({ score, maxScore, passed }) {
  const pct = Math.round((score / maxScore) * 100);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={passed ? '#16a34a' : '#dc2626'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{score}</span>
          <span className="text-[10px] text-gray-400">/ {maxScore}</span>
        </div>
      </div>
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          passed ? 'bg-[#edf1e8] text-[#5e7455]' : 'bg-[#f7e5e3] text-[#a33b39]'
        }`}
      >
        {passed ? '통과' : '미통과'}
      </span>
    </div>
  );
}

function RubricTable({ rubric }) {
  const total = rubric.reduce((s, r) => s + (r.score ?? 0), 0);
  const max = rubric.reduce((s, r) => s + r.maxScore, 0);
  const isGraded = rubric.some((r) => r.score !== null);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2.5 text-gray-600 font-semibold">
              평가 항목
            </th>
            <th className="text-right px-4 py-2.5 text-gray-600 font-semibold">
              배점
            </th>
            {isGraded && (
              <th className="text-right px-4 py-2.5 text-gray-600 font-semibold">
                득점
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rubric.map((r, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-4 py-2.5 text-gray-700">{r.item}</td>
              <td className="px-4 py-2.5 text-right text-gray-500">
                {r.maxScore}점
              </td>
              {isGraded && (
                <td className="px-4 py-2.5 text-right font-semibold text-[#4e5a61]">
                  {r.score !== null ? `${r.score}점` : '-'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {isGraded && (
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-2.5 font-bold text-gray-800">합계</td>
              <td className="px-4 py-2.5 text-right text-gray-500">{max}점</td>
              <td className="px-4 py-2.5 text-right font-bold text-[#2c2b28]">
                {total}점
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function FileUploadArea({ files, onFilesChange }) {
  const handleDrop = (e) => {
    e.preventDefault();
    onFilesChange([...files, ...Array.from(e.dataTransfer.files)]);
  };
  const handleChange = (e) => {
    onFilesChange([...files, ...Array.from(e.target.files)]);
  };
  const removeFile = (i) => onFilesChange(files.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-[#d9d3c8] rounded-xl p-6 text-center
          hover:border-[#c9c1b4] hover:bg-[#fbfaf7] transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('assess-file-input').click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-body-sm text-gray-600">
          파일을 드래그하거나{' '}
          <span className="text-[#4e5a61] font-semibold">
            클릭하여 업로드
          </span>
        </p>
        <p className="text-caption text-gray-400 mt-1">
          PDF, ZIP, 이미지 등 최대 100MB
        </p>
        <input
          id="assess-file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <FileText className="w-4 h-4 text-[#6f8391] shrink-0" />
              <span className="text-body-sm text-gray-700 flex-1 truncate">
                {file.name}
              </span>
              <span className="text-caption text-gray-400 shrink-0">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={() => removeFile(i)}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentCard({ assessment, onSubmitted }) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isLocked = assessment.status === 'locked';
  const isOpen = assessment.status === 'open';
  const isGraded = assessment.status === 'graded';
  const isSubmitted = assessment.status === 'submitted';

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) return;
    setSubmitting(true);
    const formData = new FormData();
    uploadedFiles.forEach((f) => formData.append('files', f));
    try {
      await assessmentsApi.submit(assessment.id, formData);
      setUploadedFiles([]);
      showToast({
        type: 'success',
        message: '평가 파일이 성공적으로 제출되었습니다!',
      });
      onSubmitted?.(assessment.id);
    } catch {
      showToast({ type: 'error', message: '평가 제출에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-[0_2px_20px_rgba(60,52,40,0.04)] overflow-hidden transition-all ${
        isLocked ? 'border-[#e8e4dc] opacity-70' : 'border-[#eceae4]'
      }`}
      style={isSubmitted ? { borderLeft: `3px solid ${GOLD}` } : undefined}
    >
      {/* 카드 헤더 */}
      <button
        className={`w-full text-left ${isLocked ? 'cursor-default' : 'hover:bg-[#faf9f6]'} transition-colors`}
        onClick={() => !isLocked && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 p-5">
          {/* Phase 번호 배지 */}
          <div
            className={`w-12 h-12 rounded-2xl ${isLocked ? 'bg-[#ebe9e4]' : isSubmitted ? 'bg-[#faf6e8]' : isOpen ? 'bg-[#e8eef5]' : 'bg-[#e8e6e1]'} flex items-center justify-center shrink-0`}
          >
            <span className={`${isLocked ? 'text-[#b5b1a8]' : isSubmitted ? 'text-[#7a6220]' : isOpen ? 'text-[#2d5588]' : 'text-[#5c5852]'} font-bold text-body`}>
              {assessment.phase_id}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={assessment.status} />
            </div>
            <h3 className="text-body font-bold text-gray-900 truncate">
              {isLocked ? `Phase ${assessment.phase_id}: ${assessment.phase_title}` : assessment.phase_title}
            </h3>
            <p className="text-caption text-gray-400 mt-0.5">
              평가 기간: {assessment.period.start} ~ {assessment.period.end}
            </p>
          </div>

          {/* 점수 (채점완료) */}
          {isGraded && (
            <div className="text-right shrink-0">
              <p className="text-h2 font-bold text-[#4e5a61]">
                {assessment.score}
                <span className="text-body text-gray-400 font-normal">점</span>
              </p>
              <span
                className={`text-xs font-bold ${
                  assessment.passed ? 'text-[#5e7455]' : 'text-[#a33b39]'
                }`}
              >
                {assessment.passed ? '✓ 통과' : '✗ 미통과'}
              </span>
            </div>
          )}

          {/* 잠금 아이콘 */}
          {isLocked && <Lock className="w-5 h-5 text-[#c5c2ba] shrink-0" />}

          {/* 펼치기 아이콘 */}
          {!isLocked && (
            <div className="shrink-0">
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </button>

      {/* 상세 영역 */}
      {!isLocked && expanded && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* 평가 주제 + 설명 */}
          <div className="rounded-xl border border-[#e3edf3] bg-[#f4f8fb] p-4">
            <p className="mb-1 text-caption font-semibold uppercase tracking-wide text-[#6f8391]">
              평가 주제
            </p>
            <p className="mb-2 text-body font-bold text-[#2c2b28]">
              {assessment.subject}
            </p>
            <p className="text-body-sm leading-relaxed text-[#4f6475]">
              {assessment.description}
            </p>
          </div>

          {/* 제출 요구사항 */}
          <div>
            <p className="text-body-sm font-semibold text-gray-700 mb-2">
              제출 요구사항
            </p>
            <ul className="space-y-2">
              {assessment.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef2f4] text-[11px] font-bold text-[#4e5a61]">
                    {i + 1}
                  </span>
                  <span className="text-body-sm text-gray-700 leading-relaxed">
                    {req}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 평가 범위 */}
          <div>
            <p className="text-body-sm font-semibold text-gray-700 mb-2">
              평가 범위
            </p>
            <div className="flex flex-wrap gap-2">
              {(assessment.coverage_topics || []).map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-caption font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* 루브릭 */}
          <div>
            <p className="text-body-sm font-semibold text-gray-700 mb-2">
              {isGraded ? '항목별 채점 결과' : '평가 기준 (루브릭)'}
            </p>
            <RubricTable rubric={assessment.rubric} />
          </div>

          {/* 채점완료: 결과 요약 + 피드백 */}
          {isGraded && (
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <ScoreRing
                score={assessment.score}
                maxScore={assessment.max_score}
                passed={assessment.passed}
              />
              {assessment.feedback && (
                  <div className="flex-1 rounded-xl border border-[#e5ece0] bg-[#f3f6f1] p-4">
                  <p className="mb-1 text-body-sm font-semibold text-[#5e7455]">
                    강사 피드백
                  </p>
                  <p className="text-body-sm leading-relaxed text-[#667a5e]">
                    {assessment.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 제출된 파일 */}
          {(isSubmitted || isGraded) &&
            (assessment.submitted_files?.length ?? 0) > 0 && (
              <div>
                <p className="text-body-sm font-semibold text-gray-700 mb-2">
                  제출한 파일
                </p>
                <div className="space-y-2">
                  {assessment.submitted_files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-[#e3edf3] bg-[#f4f8fb] p-2.5 text-body-sm text-[#4f6475]"
                    >
                      <Paperclip className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-caption shrink-0 text-[#8aa0b1]">
                        {file.size}
                      </span>
                    </div>
                  ))}
                  {assessment.submitted_at && (
                    <p className="text-caption text-gray-400">
                      제출일시: {assessment.submitted_at}
                    </p>
                  )}
                </div>
              </div>
            )}

          {/* 파일 업로드 (오픈 상태) */}
          {isOpen && (
            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">
                평가 파일 제출
              </p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mb-3">
                <p className="text-caption text-amber-700">
                  제출 기한: {assessment.period.end} 23:59까지
                </p>
              </div>
              <FileUploadArea
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />
              <button
                onClick={handleSubmit}
                disabled={uploadedFiles.length === 0 || submitting}
                className="mt-3 w-full rounded-xl bg-[#4e5a61] py-2.5 text-body-sm font-semibold text-white
                  transition-colors hover:bg-[#424d53] active:bg-[#384248]
                  disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assessmentsApi
      .getList()
      .then((data) => setAssessments(data))
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, []);

  const graded = assessments.filter((a) => a.status === 'graded');
  const passed = graded.filter((a) => a.passed);
  const avgScore =
    graded.length > 0
      ? Math.round(graded.reduce((s, a) => s + a.score, 0) / graded.length)
      : null;

  return (
    <div
      className="mx-auto max-w-3xl space-y-6 rounded-3xl px-4 py-6"
      style={{ backgroundColor: pageBg }}
    >
      {/* 헤더 */}
      <div>
        <p className={`text-[1.85rem] text-[#5e666a]`}>Competency Evaluation</p>
        <h1 className="mt-1 text-h1 font-bold text-[#2c2b28]">능력단위평가</h1>
        <p className="mt-1 text-sm text-[#7a746b]">
          학습 성취도를 확인하고 역량 평가 현황을 관리하세요.
        </p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#eceae4] bg-white p-5 shadow-[0_2px_18px_rgba(60,52,40,0.04)]">
          <p className="text-xs font-semibold text-[#8b857b] tracking-wide">
            PASSED UNITS (통과)
          </p>
          <p className="mt-1 text-[2.2rem] leading-none font-semibold text-[#2c2b28]">
            {passed.length}
            <span className="ml-1 text-base font-medium text-[#9d978d]">개</span>
          </p>
        </div>
        <div
          className="rounded-2xl border border-[#eceae4] bg-white p-5 shadow-[0_2px_18px_rgba(60,52,40,0.04)]"
          style={{ borderLeft: `3px solid ${GOLD}` }}
        >
          <p className="text-xs font-semibold text-[#8b857b] tracking-wide">
            AVERAGE SCORE (평균 점수)
          </p>
          <p className="mt-1 text-[2.2rem] leading-none font-semibold text-[#2c2b28]">
            {avgScore ?? 0}
            <span className="ml-1 text-base font-medium text-[#9d978d]">점</span>
          </p>
        </div>
        <div className="rounded-2xl border border-[#eceae4] bg-white p-5 shadow-[0_2px_18px_rgba(60,52,40,0.04)]">
          <p className="text-xs font-semibold text-[#8b857b] tracking-wide">
            AWAITING SUBMISSION (제출 대기)
          </p>
          <p className="mt-1 text-[2.2rem] leading-none font-semibold text-[#9d4a4a]">
            {assessments.filter((a) => a.status === 'open').length}
            <span className="ml-1 text-base font-medium text-[#9d978d]">건</span>
          </p>
        </div>
      </div>

      {/* 타임라인 안내 */}
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-bold text-[#2c2b28]">진행 중인 단계</h2>
        <p className="text-sm font-semibold text-[#8b857b]">총 {assessments.length}단계</p>
      </div>

      {/* 평가 목록 */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton width="100%" height="80px" rounded="rounded-2xl" />
          <Skeleton width="100%" height="80px" rounded="rounded-2xl" />
          <Skeleton width="100%" height="80px" rounded="rounded-2xl" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-body text-gray-400">등록된 평가가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onSubmitted={(id) =>
                setAssessments((prev) =>
                  prev.map((a) =>
                    String(a.id) === String(id)
                      ? { ...a, status: 'submitted' }
                      : a,
                  ),
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
