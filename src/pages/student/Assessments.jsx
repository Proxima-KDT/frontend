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
  RefreshCw,
} from 'lucide-react';
import { assessmentsApi } from '@/api/assessments';
import { useToast } from '@/context/ToastContext';
import Skeleton from '@/components/common/Skeleton';

const pageBg = '#F7F5F0';
const GOLD = '#c9a962';

const PHASE_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

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

function RubricTable({ rubric, totalScore }) {
  const max = rubric.reduce((s, r) => s + r.maxScore, 0);
  const isGraded = rubric.some((r) => r.score !== null);
  // totalScore는 AssessmentCard에서 전달받는 값 (DB의 채점 점수)
  // 없으면 rubric에서 계산한 값으로 fallback
  const total = totalScore ?? rubric.reduce((s, r) => s + (r.score ?? 0), 0);

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
          <span className="text-[#4e5a61] font-semibold">클릭하여 업로드</span>
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

function AssessmentCard({ assessment, colorClass, onSubmitted }) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const isLocked = assessment.status === 'locked';
  const isOpen = assessment.status === 'open';
  const isGraded = assessment.status === 'graded';
  const isSubmitted = assessment.status === 'submitted';

  // 마감기한 이내 재제출 가능 여부 (period.end 날짜까지 사용)
  const today = new Date().toISOString().split('T')[0];
  const canResubmit = isSubmitted && assessment.period.end >= today;

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) return;
    setSubmitting(true);
    const formData = new FormData();
    uploadedFiles.forEach((f) => formData.append('files', f));
    try {
      await assessmentsApi.submit(assessment.id, formData);
      setUploadedFiles([]);
      setResubmitting(false);
      showToast({
        type: 'success',
        message: resubmitting
          ? '평가 파일이 재제출되었습니다!'
          : '평가 파일이 성공적으로 제출되었습니다!',
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
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0`}
          >
            <span className="text-white font-bold text-body">
              {assessment.phase_id}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-caption text-gray-400 font-medium">
                Phase {assessment.phase_id}
              </span>
              <StatusBadge status={assessment.status} />
            </div>
            <h3 className="text-body font-bold text-gray-900 truncate">
              {assessment.phase_title}
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
            <RubricTable
              rubric={assessment.rubric}
              totalScore={isGraded ? assessment.score : undefined}
            />
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-body-sm font-semibold text-gray-700">
                    제출한 파일
                  </p>
                  {/* 마감기한 내 재제출 버튼 */}
                  {canResubmit && !resubmitting && (
                    <button
                      onClick={() => setResubmitting(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-semibold
                        text-amber-700 bg-amber-50 border border-amber-200
                        hover:bg-amber-100 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      파일 재제출하기
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {assessment.submitted_files.map((file, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-body-sm ${
                        resubmitting
                          ? 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                          : 'border-[#e3edf3] bg-[#f4f8fb] text-[#4f6475]'
                      }`}
                    >
                      <Paperclip className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-caption shrink-0 opacity-70">
                        {file.size}
                      </span>
                    </div>
                  ))}
                  {assessment.submitted_at && !resubmitting && (
                    <p className="text-caption text-gray-400">
                      제출일시: {assessment.submitted_at}
                    </p>
                  )}
                </div>

                {/* 재제출 업로드 영역 */}
                {resubmitting && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-caption text-amber-700">
                        새 파일을 업로드하면 기존 제출 파일이 교체됩니다. 마감:
                        {assessment.period.end} 23:59
                      </p>
                    </div>
                    <FileUploadArea
                      files={uploadedFiles}
                      onFilesChange={setUploadedFiles}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setResubmitting(false);
                          setUploadedFiles([]);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600
                          font-semibold text-body-sm hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={uploadedFiles.length === 0 || submitting}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-body-sm
                          hover:bg-amber-600 active:bg-amber-700 transition-colors
                          disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {submitting ? '교체 중..' : '파일 재제출'}
                      </button>
                    </div>
                  </div>
                )}
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-student-100 flex items-center justify-center">
          <Award className="w-5 h-5 text-student-600" />
        </div>
        <div>
          <h1 className="text-h2 font-bold text-gray-900">능력단위 평가</h1>
          <p className="text-caption text-gray-500">
            각 Phase 종료 후 해당 역량에 대한 평가를 실시합니다.
          </p>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-green-600">{passed.length}</p>
          <p className="text-caption text-gray-500 mt-0.5">
            통과 ({graded.length}/{assessments.length})
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-student-600">
            {avgScore !== null ? `${avgScore}점` : '-'}
          </p>
          <p className="text-caption text-gray-500 mt-0.5">평가점수</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-blue-600">
            {assessments.filter((a) => a.status === 'open').length}
          </p>
          <p className="text-caption text-gray-500 mt-0.5">제출 대기</p>
        </div>
      </div>

      {/* 프로그램 안내 */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-caption text-gray-500 text-center">
          능력단위평가는 각 Phase 마지막 주에 진행된다 ⏱️ 6개월 과정 총 6단계
        </p>
      </div>

      {/* 타임라인 안내 */}
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-bold text-[#2c2b28]">진행 중인 단계</h2>
        <p className="text-sm font-semibold text-[#8b857b]">
          총 {assessments.length}단계
        </p>
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
          {assessments.map((assessment, i) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              colorClass={PHASE_COLORS[i % PHASE_COLORS.length]}
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
