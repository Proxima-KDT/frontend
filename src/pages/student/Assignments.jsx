import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileText,
  X,
  Download,
  Eye,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { assignmentsApi } from '@/api/assignments';
import Skeleton from '@/components/common/Skeleton';
import { useToast } from '@/context/ToastContext';

// ── 상수 ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: '미제출',
    icon: Clock,
    badgeClass: 'bg-gray-100 text-gray-600',
    iconClass: 'text-gray-400',
  },
  submitted: {
    label: '제출완료',
    icon: CheckCircle2,
    badgeClass: 'bg-blue-100 text-blue-700',
    iconClass: 'text-blue-500',
  },
  graded: {
    label: '채점완료',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-700',
    iconClass: 'text-green-500',
  },
  resubmit_required: {
    label: '재제출 요청',
    icon: RefreshCcw,
    badgeClass: 'bg-orange-100 text-orange-700',
    iconClass: 'text-orange-500',
  },
};

const FILTERS = ['전체', '미제출', '제출완료', '채점완료', '재제출 요청'];

// Phase 색상 팔레트 — subject는 DB의 assignment.subject를 사용하므로 여기선 색상만.
const PHASE_PALETTE = [
  {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    tab: 'bg-purple-500',
    stripe: 'bg-violet-600',
  },
  {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    tab: 'bg-blue-500',
    stripe: 'bg-blue-600',
  },
  {
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
    tab: 'bg-green-500',
    stripe: 'bg-emerald-600',
  },
  {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    tab: 'bg-orange-500',
    stripe: 'bg-amber-700',
  },
  {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    dot: 'bg-pink-500',
    tab: 'bg-pink-500',
    stripe: 'bg-rose-600',
  },
  {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    tab: 'bg-indigo-500',
    stripe: 'bg-indigo-600',
  },
];

function getPhaseCfg(phase) {
  const n = Number(phase);
  if (!n || n < 1) {
    return {
      label: `Phase ${phase}`,
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      tab: 'bg-gray-400',
      stripe: 'bg-slate-500',
    };
  }
  const color = PHASE_PALETTE[(n - 1) % PHASE_PALETTE.length];
  return { label: `Phase ${n}`, ...color };
}

function getAssignmentDueDate(a) {
  return a.due_date || a.dueDate || '';
}

function getAssignmentSubmittedAt(a) {
  return a.submitted_at || a.submittedAt || '';
}

function formatKoDate(iso) {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function subjectCategoryLine(subject) {
  if (!subject) return '과제';
  if (/[가-힣]/.test(subject)) return subject;
  return String(subject).toUpperCase();
}

// 특정 phase의 첫 assignment subject를 그룹 라벨로 사용.
function getPhaseSubject(assignments, phase) {
  const found = assignments.find((a) => Number(a.phase) === Number(phase));
  return found?.subject || '';
}

function getDDay(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diff;
}

// ── 서브 컴포넌트 ──────────────────────────────────────────
function DueDateBadge({ dueDate, status }) {
  if (status === 'graded') return null;
  const dday = getDDay(dueDate);
  if (dday < 0)
    return (
      <span className="text-xs text-[#9a9a9a]">
        마감 {new Date(dueDate).toLocaleDateString('ko-KR')}
      </span>
    );
  if (dday === 0)
    return <span className="text-xs font-bold text-red-600">오늘 마감</span>;
  if (dday <= 3)
    return <span className="text-xs font-semibold text-red-500">D-{dday}</span>;
  return (
    <span className="text-xs text-[#7a7a7a]">
      D-{dday} · {new Date(dueDate).toLocaleDateString('ko-KR')}
    </span>
  );
}

function RubricTable({ rubric }) {
  if (!rubric) return null;
  const total = rubric.reduce((s, r) => s + (r.score ?? 0), 0);
  const max = rubric.reduce(
    (s, r) => s + (r.maxScore ?? r.max_score ?? 0),
    0,
  );
  return (
    <div className="mt-4">
      <p className="text-body-sm font-semibold text-gray-700 mb-2">
        항목별 채점
      </p>
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
              <th className="text-right px-4 py-2.5 text-gray-600 font-semibold">
                득점
              </th>
            </tr>
          </thead>
          <tbody>
            {rubric.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2.5 text-gray-700">{r.item}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">
                  {r.maxScore ?? r.max_score ?? '-'}점
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-student-600">
                  {r.score != null ? (
                    `${r.score}점`
                  ) : (
                    <span className="text-gray-400 font-normal">미채점</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-2.5 font-bold text-gray-800">합계</td>
              <td className="px-4 py-2.5 text-right text-gray-500">{max}점</td>
              <td className="px-4 py-2.5 text-right font-bold text-student-700">
                {total}점
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function FileUploadArea({ files, onFilesChange }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...dropped]);
  };

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    onFilesChange([...files, ...selected]);
  };

  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-student-400 hover:bg-student-50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input').click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-body-sm text-gray-600">
          파일을 드래그하거나{' '}
          <span className="text-student-600 font-semibold">
            클릭하여 업로드
          </span>
        </p>
        <p className="text-caption text-gray-400 mt-1">
          PDF, ZIP, PY, SQL 등 최대 50MB
        </p>
        <input
          id="file-input"
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
              <FileText className="w-4 h-4 text-student-500 shrink-0" />
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

function AssignmentCard({ assignment, onSubmitted, onFileDeleted }) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingPath, setDeletingPath] = useState(null); // 삭제 중인 파일 path
  // 제출 파일 목록은 로컬에서 관리 (삭제 후 즉시 반영)
  const [localSubmittedFiles, setLocalSubmittedFiles] = useState(
    assignment.submitted_files ?? assignment.submittedFiles ?? [],
  );

  const canSubmit =
    assignment.status === 'pending' ||
    assignment.status === 'resubmit_required';

  // 파일 삭제 가능 조건: 채점 완료가 아닌 제출 상태
  const canDeleteFile =
    assignment.status === 'submitted' ||
    assignment.status === 'resubmit_required';

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) return;
    setSubmitting(true);
    const formData = new FormData();
    uploadedFiles.forEach((f) => formData.append('files', f));
    try {
      await assignmentsApi.submit(assignment.id, formData);
      setUploadedFiles([]);
      showToast({
        type: 'success',
        message: '과제가 성공적으로 제출되었습니다!',
      });
      onSubmitted?.(assignment.id);
    } catch {
      showToast({ type: 'error', message: '과제 제출에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFile = async (filePath) => {
    setDeletingPath(filePath);
    try {
      const result = await assignmentsApi.deleteFile(assignment.id, filePath);
      setLocalSubmittedFiles(result.submitted_files);
      showToast({ type: 'success', message: '파일이 삭제되었습니다.' });
      // 부모에게 상태 변경 알림 (모두 삭제 시 pending으로 복원 등)
      onFileDeleted?.(assignment.id, result.status, result.submitted_files);
    } catch {
      showToast({ type: 'error', message: '파일 삭제에 실패했습니다.' });
    } finally {
      setDeletingPath(null);
    }
  };

  const dueStr = getAssignmentDueDate(assignment);
  const dday = dueStr ? getDDay(dueStr) : 99;
  const urgent =
    (assignment.status === 'pending' ||
      assignment.status === 'resubmit_required') &&
    dday >= 0 &&
    dday <= 3;
  const maxScr = assignment.max_score ?? assignment.maxScore ?? 100;

  const statusPill = {
    graded: 'bg-[#e8e8e8] text-[#3a3a3a] border border-[#d0d0d0]',
    submitted: 'bg-[#e4e4e4] text-[#2f2f2f] border border-[#c8c8c8]',
    pending: 'bg-[#ededed] text-[#4a4a4a] border border-[#d4d4d4]',
    resubmit_required:
      'bg-[#ebe8e4] text-[#5c4a38] border border-[#d8d4ce]',
  }[assignment.status];

  const statusPillLabel = {
    graded: '채점완료',
    submitted: '검토 중',
    pending: '미제출',
    resubmit_required: '재제출',
  }[assignment.status];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#e0e0e0] border-l-[3px] border-t-[3px] bg-white shadow-[2px_3px_0_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[3px_4px_0_rgba(0,0,0,0.06)] ${
        urgent
          ? 'border-l-[#8b2f2f] border-t-[#8b2f2f]'
          : 'border-l-[#2a2a2a] border-t-[#2a2a2a]'
      }`}
    >
      <div className="relative">
        <div className="flex items-stretch gap-2 sm:gap-4">
          <button
            type="button"
            className="min-w-0 flex-1 px-4 py-4 pl-5 text-left transition-colors hover:bg-[#fafafa] sm:px-5 sm:py-5"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#8c8c8c]">
                {subjectCategoryLine(assignment.subject)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${statusPill}`}
              >
                {statusPillLabel}
              </span>
              {assignment.status !== 'graded' && (
                <DueDateBadge dueDate={dueStr} status={assignment.status} />
              )}
            </div>
            <h3 className="text-[1.05rem] font-bold leading-snug text-[#2a2a2a] sm:text-[1.2rem]">
              {assignment.title}
            </h3>
            <p className="mt-1.5 text-[0.8rem] text-[#7a7a7a]">
              {assignment.status === 'graded' ? (
                <>
                  완료일{' '}
                  {formatKoDate(
                    getAssignmentSubmittedAt(assignment) || dueStr,
                  )}
                </>
              ) : (
                <>마감 {formatKoDate(dueStr) || '—'}</>
              )}
            </p>
          </button>

          <div className="flex shrink-0 flex-col items-end justify-center gap-2 pr-3 sm:pr-4">
            {assignment.status === 'graded' && (
              <div className="text-right">
                <p className="text-[1.35rem] font-bold tabular-nums leading-none text-[#2c2b28] sm:text-[1.5rem]">
                  {assignment.score}
                  <span className="text-base font-semibold text-[#8a8a8a]">
                    {' '}
                    / {maxScr}
                  </span>
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-wide text-[#8a8a8a]">
                  현재 점수
                </p>
              </div>
            )}
            {assignment.status === 'submitted' && (
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs font-semibold text-[#5a5a5a]">
                  검토 중
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d0d0d0] bg-white text-[#4a4a4a] shadow-sm">
                  <Eye className="h-4 w-4" aria-hidden />
                </span>
              </div>
            )}
            {(assignment.status === 'pending' ||
              assignment.status === 'resubmit_required') && (
              <div className="flex flex-col items-end gap-2">
                {urgent && (
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#9b3d3d] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
                      긴급
                    </span>
                    <span className="text-[11px] font-bold text-[#9b3d3d]">
                      D-{dday} 남음
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    urgent
                      ? 'bg-[#8b2f2f] text-white shadow-sm hover:bg-[#732828]'
                      : 'border border-[#c8c8c8] bg-white text-[#333333] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {urgent ? '지금 제출' : '상세 보기'}
                </button>
              </div>
            )}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d0d0d0] bg-white text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5]"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 상세 영역 */}
      {expanded && (
        <div className="space-y-5 border-t border-[#e8e8e8] bg-[#fafafa] p-5">
          {/* 과제 설명 */}
          <div>
            <p className="text-body-sm font-semibold text-gray-700 mb-1.5">
              과제 설명
            </p>
            <p className="text-body-sm text-gray-600 leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* 참고 자료 */}
          {(assignment.attachments?.length ?? 0) > 0 && (
            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">
                참고 자료
              </p>
              <div className="space-y-2">
                {assignment.attachments.map((file, i) => (
                  <a
                    key={i}
                    href={file.url}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-body-sm text-student-600 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    {file.name}
                    <span className="text-gray-400 text-caption font-normal ml-auto">
                      {file.size}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 제출된 파일 (이미 제출한 경우) */}
          {localSubmittedFiles.length > 0 && (
            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">
                제출한 파일
              </p>
              <div className="space-y-2">
                {localSubmittedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-body-sm text-blue-700"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{file.name}</span>
                    {file.size && (
                      <span className="text-caption text-blue-400 shrink-0">
                        {file.size}
                      </span>
                    )}
                    {canDeleteFile && (
                      <button
                        onClick={() => handleDeleteFile(file.path)}
                        disabled={deletingPath === file.path}
                        className="ml-1 p-1 rounded-md hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-40"
                        title="파일 삭제"
                      >
                        {deletingPath === file.path ? (
                          <span className="w-3.5 h-3.5 block border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
                {getAssignmentSubmittedAt(assignment) && (
                  <p className="text-caption text-gray-400">
                    제출일시: {getAssignmentSubmittedAt(assignment)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 루브릭 & 피드백 (채점 완료) */}
          {assignment.status === 'graded' && (
            <div className="space-y-4">
              <RubricTable rubric={assignment.rubric} />
              {assignment.feedback && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-body-sm font-semibold text-green-800 mb-1">
                    강사 피드백
                  </p>
                  <p className="text-body-sm text-green-700 leading-relaxed">
                    {assignment.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 재제출 요청 피드백 */}
          {assignment.status === 'resubmit_required' && assignment.feedback && (
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <p className="text-body-sm font-semibold text-orange-800 mb-1">
                재제출 사유
              </p>
              <p className="text-body-sm text-orange-700 leading-relaxed">
                {assignment.feedback}
              </p>
            </div>
          )}

          {/* 파일 업로드 (제출 가능한 경우) */}
          {canSubmit && (
            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">
                파일 제출
                {assignment.status === 'resubmit_required' && (
                  <span className="ml-2 text-orange-500 font-normal">
                    (재제출)
                  </span>
                )}
              </p>
              <FileUploadArea
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />
              <button
                onClick={handleSubmit}
                disabled={uploadedFiles.length === 0 || submitting}
                className="mt-3 w-full py-2.5 rounded-xl bg-student-600 text-white font-semibold text-body-sm
                  hover:bg-student-700 active:bg-student-800 transition-colors
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

// ── Phase 그룹 헤더 ───────────────────────────────────────
function PhaseGroupHeader({ phase, allItems }) {
  const cfg = getPhaseCfg(phase);
  const subject = allItems[0]?.subject || '';
  const total = allItems.length;
  const done = allItems.filter((a) => a.status === 'graded').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#dedede] bg-[#ececec] px-2.5 py-1 text-xs font-bold text-[#333333]">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
        {cfg.label}
        {subject && (
          <span className="font-medium text-[#5a5a5a]">· {subject}</span>
        )}
      </span>
      <div className="h-px flex-1 bg-[#dcdcdc]" />
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-caption text-[#888888]">
          {done}/{total} 완료
        </span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#e0e0e0]">
          <div
            className={`h-full rounded-full transition-all ${cfg.dot}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
const STATUS_FILTER_VALUES = {
  미제출: 'pending',
  제출완료: 'submitted',
  채점완료: 'graded',
  '재제출 요청': 'resubmit_required',
};

export default function Assignments() {
  const [statusFilter, setStatusFilter] = useState('전체');
  const [phaseFilter, setPhaseFilter] = useState(0); // 0 = 전체
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentsApi
      .getList()
      .then((data) => setAssignments(data))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  // Phase 탭에 표시할 Phase 목록 (데이터 기반)
  const presentPhases = [
    ...new Set(assignments.map((a) => Number(a.phase)).filter(Boolean)),
  ].sort((a, b) => a - b);

  const filtered = assignments.filter((a) => {
    const phaseMatch = phaseFilter === 0 || Number(a.phase) === phaseFilter;
    const statusMatch =
      statusFilter === '전체' ||
      STATUS_FILTER_VALUES[statusFilter] === a.status;
    return phaseMatch && statusMatch;
  });

  const stats = {
    total: assignments.length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    pending: assignments.filter(
      (a) => a.status === 'pending' || a.status === 'resubmit_required',
    ).length,
  };

  // Phase 탭별 미완료 과제 수
  function getPhasePendingCount(phase) {
    return assignments.filter(
      (a) =>
        Number(a.phase) === phase &&
        (a.status === 'pending' || a.status === 'resubmit_required'),
    ).length;
  }

  const activePhaseCfg = phaseFilter > 0 ? getPhaseCfg(phaseFilter) : null;
  const activePhaseSubject =
    phaseFilter > 0 ? getPhaseSubject(assignments, phaseFilter) : '';

  // 파일 삭제 후 부모 상태 동기화
  const handleFileDeleted = (assignmentId, newStatus, newFiles) => {
    setAssignments((prev) =>
      prev.map((a) =>
        String(a.id) === String(assignmentId)
          ? { ...a, status: newStatus, submitted_files: newFiles }
          : a,
      ),
    );
  };

  // 전체 뷰용 Phase별 그룹핑 (phase 오름차순, 내부는 due_date 순 유지)
  const phaseGroups =
    phaseFilter === 0
      ? (() => {
          const map = new Map();
          filtered.forEach((a) => {
            const p = Number(a.phase) || 0;
            if (!map.has(p)) map.set(p, []);
            map.get(p).push(a);
          });
          return [...map.entries()]
            .sort(([a], [b]) => a - b)
            .map(([phase, items]) => ({ phase, items }));
        })()
      : [];

  const pageBg = '#F3F3F2';

  return (
    <div
      className="mx-auto max-w-3xl space-y-6 rounded-3xl px-4 py-6 sm:px-5 md:-mx-2 md:px-8 md:py-8"
      style={{ backgroundColor: pageBg }}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e0e0e0] bg-white shadow-sm">
          <ClipboardList className="h-5 w-5 text-[#4a4a4a]" />
        </div>
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-[#2a2a2a] sm:text-[2rem]">
            과제
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6a6a6a]">
            과제를 제출하고 피드백을 확인하세요
          </p>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ececec]">
            <CheckCircle2 className="h-5 w-5 text-[#4a4a4a]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums text-[#2a2a2a]">
              {stats.graded}
            </p>
            <p className="text-xs font-medium text-[#6a6a6a]">채점완료</p>
            <span className="mt-1 inline-block rounded-full border border-[#d8d8d8] bg-[#efefef] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#4a4a4a]">
              완료
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4e4e4]">
            <FileText className="h-5 w-5 text-[#3d3d3d]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums text-[#2a2a2a]">
              {stats.submitted}
            </p>
            <p className="text-xs font-medium text-[#6a6a6a]">제출완료</p>
            <span className="mt-1 inline-block rounded-full border border-[#d0d0d0] bg-[#ececec] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#3d3d3d]">
              검토중
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ebe4e4]">
            <AlertCircle className="h-5 w-5 text-[#8b2f2f]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums text-[#8b2f2f]">
              {stats.pending}
            </p>
            <p className="text-xs font-medium text-[#6a6a6a]">미제출</p>
            <span className="mt-1 inline-block rounded-full border border-[#ddd4d4] bg-[#f5eded] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#6b3030]">
              대기
            </span>
          </div>
        </div>
      </div>

      {/* Phase 탭 필터 */}
      {!loading && presentPhases.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setPhaseFilter(0)}
            className={`shrink-0 rounded-full px-4 py-2 text-body-sm font-semibold transition-all ${
              phaseFilter === 0
                ? 'bg-[#2a2a2a] text-white shadow-sm'
                : 'border border-[#dedede] bg-[#e8e8e8] text-[#333333] hover:bg-[#dedede]'
            }`}
          >
            전체
          </button>
          {presentPhases.map((p) => {
            const cfg = getPhaseCfg(p);
            const pendingCnt = getPhasePendingCount(p);
            const isActive = phaseFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPhaseFilter(p)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-body-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2a2a2a] text-white shadow-sm'
                    : 'border border-[#dedede] bg-[#e8e8e8] text-[#333333] hover:bg-[#dedede]'
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot} ${isActive ? 'ring-2 ring-white/40' : ''}`}
                />
                {cfg.label}
                {pendingCnt > 0 && (
                  <span
                    className={`ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-[#9a9a9a] text-white'
                    }`}
                  >
                    {pendingCnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 선택된 Phase 설명 배너 */}
      {activePhaseCfg && (
        <div className="flex items-center gap-2 rounded-xl border border-[#dedede] bg-[#ececec] px-3 py-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${activePhaseCfg.dot}`}
          />
          <span className="text-body-sm font-semibold text-[#2a2a2a]">
            {activePhaseCfg.label}
            {activePhaseSubject ? ` — ${activePhaseSubject}` : ''}
          </span>
          <span className="ml-auto text-caption text-[#5a5a5a]">
            {assignments.filter((a) => Number(a.phase) === phaseFilter).length}
            개 과제
          </span>
        </div>
      )}

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-body-sm font-semibold transition-colors ${
              statusFilter === f
                ? 'bg-[#2a2a2a] text-white shadow-sm'
                : 'border border-[#dedede] bg-[#e8e8e8] text-[#333333] hover:bg-[#dedede]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 과제 목록 */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton width="100%" height="80px" rounded="rounded-2xl" />
          <Skeleton width="100%" height="80px" rounded="rounded-2xl" />
          <Skeleton width="100%" height="80px" rounded="rounded-2xl" />
        </div>
      ) : filtered.length > 0 ? (
        phaseFilter === 0 ? (
          /* 전체 뷰: Phase 그룹 헤더 + 카드 */
          <div className="space-y-6">
            {phaseGroups.map(({ phase, items }) => (
              <div key={phase} className="space-y-3">
                <PhaseGroupHeader
                  phase={phase}
                  allItems={assignments.filter((a) => Number(a.phase) === phase)}
                />
                {items.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onSubmitted={(id) =>
                      setAssignments((prev) =>
                        prev.map((a) =>
                          String(a.id) === String(id)
                            ? { ...a, status: 'submitted' }
                            : a,
                        ),
                      )
                    }
                    onFileDeleted={handleFileDeleted}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* 특정 Phase 뷰: 기존 플랫 리스트 */
          <div className="space-y-3">
            {filtered.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onSubmitted={(id) =>
                  setAssignments((prev) =>
                    prev.map((a) =>
                      String(a.id) === String(id)
                        ? { ...a, status: 'submitted' }
                        : a,
                    ),
                  )
                }
                onFileDeleted={handleFileDeleted}
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-12 text-center shadow-sm">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-[#c4c4c4]" />
          <p className="text-body text-[#888888]">해당하는 과제가 없습니다</p>
        </div>
      )}
    </div>
  );
}
