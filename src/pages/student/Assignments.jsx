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
    badgeClass: 'bg-[#ececec] text-[#4a4a4a]',
    iconClass: 'text-[#8a8a8a]',
  },
  submitted: {
    label: '제출완료',
    icon: CheckCircle2,
    badgeClass: 'bg-[#e4e8f0] text-[#2a405a]',
    iconClass: 'text-[#4a7aaa]',
  },
  graded: {
    label: '채점완료',
    icon: CheckCircle2,
    badgeClass: 'bg-[#e4ede6] text-[#2a4a30]',
    iconClass: 'text-[#4a8a58]',
  },
  resubmit_required: {
    label: '재제출 요청',
    icon: RefreshCcw,
    badgeClass: 'bg-[#f0e8d8] text-[#4a3820]',
    iconClass: 'text-[#b07840]',
  },
};

const FILTERS = ['전체', '미제출', '제출완료', '채점완료', '재제출 요청'];

// Phase 색상 팔레트 — subject는 DB의 assignment.subject를 사용하므로 여기선 색상만.
const PHASE_PALETTE = [
  {
    bg: 'bg-[#f0ebe0]',
    text: 'text-[#5a4a30]',
    dot: 'bg-[#c07a30]',
    tab: 'bg-[#c07a30]',
    stripe: 'bg-[#a86828]',
  },
  {
    bg: 'bg-[#e4ecf4]',
    text: 'text-[#2a405a]',
    dot: 'bg-[#4a7aaa]',
    tab: 'bg-[#4a7aaa]',
    stripe: 'bg-[#3a6890]',
  },
  {
    bg: 'bg-[#e4ede6]',
    text: 'text-[#2a4a30]',
    dot: 'bg-[#4a8a58]',
    tab: 'bg-[#4a8a58]',
    stripe: 'bg-[#3a7848]',
  },
  {
    bg: 'bg-[#f0e8d8]',
    text: 'text-[#4a3820]',
    dot: 'bg-[#b07840]',
    tab: 'bg-[#b07840]',
    stripe: 'bg-[#906030]',
  },
  {
    bg: 'bg-[#e0ece8]',
    text: 'text-[#2a4a40]',
    dot: 'bg-[#4a8a78]',
    tab: 'bg-[#4a8a78]',
    stripe: 'bg-[#3a7868]',
  },
  {
    bg: 'bg-[#eae4f0]',
    text: 'text-[#3a2a5a]',
    dot: 'bg-[#7a6aaa]',
    tab: 'bg-[#7a6aaa]',
    stripe: 'bg-[#6a5890]',
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

function formatKoDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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
    return <span className="text-xs font-bold text-[#c07a30]">오늘 마감</span>;
  if (dday <= 3)
    return <span className="text-xs font-semibold text-[#c07a30]">D-{dday}</span>;
  return (
    <span className="text-xs text-[#7a7a7a]">
      D-{dday} · {new Date(dueDate).toLocaleDateString('ko-KR')}
    </span>
  );
}

function RubricTable({ rubric, totalScore, isGraded }) {
  if (!rubric || rubric.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-body-sm font-semibold text-[#3a3a3a] mb-2">항목별 채점</p>
        <div className="rounded-xl border border-[#e0dbd0] bg-[#f8f5f0] px-4 py-3 text-[0.8rem] text-[#8a847a]">
          채점 항목이 설정되지 않은 과제입니다.
        </div>
      </div>
    );
  }
  const hasItemScores = rubric.some((r) => r.score != null);
  const total = hasItemScores
    ? rubric.reduce((s, r) => s + (r.score ?? 0), 0)
    : (isGraded && totalScore != null ? totalScore : 0);
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
                  ) : isGraded ? (
                    <span className="text-gray-400 font-normal">-</span>
                  ) : (
                    <span className="text-gray-400 font-normal">미채점</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-2.5 font-bold text-gray-800">
                합계
                {!hasItemScores && isGraded && (
                  <span className="ml-1.5 text-[11px] font-normal text-gray-400">(종합 채점)</span>
                )}
              </td>
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
        className="border-2 border-dashed border-[#d4cfc9] rounded-xl p-6 text-center hover:border-[#a89a8a] hover:bg-[#f8f5f0] transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input').click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-body-sm text-gray-600">
          파일을 드래그하거나{' '}
          <span className="text-[#5a4a38] font-semibold">
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
  const [deleteConfirmPath, setDeleteConfirmPath] = useState(null); // 삭제 확인 대기 중인 path
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
      className="relative overflow-hidden rounded-2xl border border-[#e0e0e0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
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
            <h3 className="text-[1.05rem] font-bold leading-snug text-[#2c2b28] sm:text-[1.2rem]">
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
              assignment.status === 'resubmit_required') &&
              urgent && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#c07a30] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
                      긴급
                    </span>
                    <span className="text-[11px] font-bold text-[#c07a30]">
                      D-{dday} 남음
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(true);
                    }}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold bg-[#c07a30] text-white shadow-sm hover:bg-[#a86828] transition-colors"
                  >
                    지금 제출
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
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#f0f0ef] border border-[#e0e0e0] text-body-sm text-[#3a3a3a]"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{file.name}</span>
                    {file.size && (
                      <span className="text-caption text-[#8a8a8a] shrink-0">
                        {file.size}
                      </span>
                    )}
                    {canDeleteFile && (
                      deletingPath === file.path ? (
                        <span className="ml-1 w-3.5 h-3.5 block border-2 border-[#4a4a4a] border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : deleteConfirmPath === file.path ? (
                        <div className="flex items-center gap-1 ml-1 shrink-0">
                          <span className="text-[11px] text-[#5a5a5a]">삭제?</span>
                          <button
                            onClick={() => {
                              handleDeleteFile(file.path);
                              setDeleteConfirmPath(null);
                            }}
                            className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#c04a4a] text-white hover:bg-[#a83838] transition-colors"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => setDeleteConfirmPath(null)}
                            className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#e4e4e4] text-[#5a5a5a] hover:bg-[#d4d4d4] transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmPath(file.path)}
                          className="ml-1 p-1 rounded-md hover:bg-[#e4e4e4] active:bg-[#d8d8d8] transition-colors"
                          title="파일 삭제"
                        >
                          <X className="w-3.5 h-3.5 text-[#6a6a6a]" />
                        </button>
                      )
                    )}
                  </div>
                ))}
                {getAssignmentSubmittedAt(assignment) && (
                  <p className="text-caption text-gray-400">
                    제출일시: {formatKoDateTime(getAssignmentSubmittedAt(assignment))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 루브릭 & 피드백 (채점 완료) */}
          {assignment.status === 'graded' && (
            <div className="space-y-4">
              <RubricTable
                rubric={assignment.rubric}
                totalScore={assignment.score}
                isGraded={assignment.status === 'graded'}
              />
              {assignment.feedback && (
                <div className="p-4 bg-[#f0f2ec] rounded-xl border border-[#dde0d6]">
                  <p className="text-body-sm font-semibold text-[#2a3a28] mb-1">
                    강사 피드백
                  </p>
                  <p className="text-body-sm text-[#3a4a36] leading-relaxed">
                    {assignment.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 재제출 요청 피드백 */}
          {assignment.status === 'resubmit_required' && assignment.feedback && (
            <div className="p-4 bg-[#f4f0e8] rounded-xl border border-[#e0d8c8]">
              <p className="text-body-sm font-semibold text-[#4a3820] mb-1">
                재제출 사유
              </p>
              <p className="text-body-sm text-[#5a4a2a] leading-relaxed">
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
                  <span className="ml-2 text-[#b07840] font-normal">
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
  const [phaseDropdownOpen, setPhaseDropdownOpen] = useState(false);
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
      className="mx-auto max-w-3xl space-y-6 rounded-3xl px-4 py-6 sm:px-5 md:px-8 md:py-8"
      style={{ backgroundColor: pageBg }}
    >
      {/* 헤더 */}
      <div>
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-[#2c2b28]">
          과제
        </h1>
        <p className="mt-1 text-[0.95rem] text-[#6b6560]">
          과제를 제출하고 피드백을 확인하세요.
        </p>
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ececec]">
            <AlertCircle className="h-5 w-5 text-[#4a4a4a]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums text-[#2a2a2a]">
              {stats.pending}
            </p>
            <p className="text-xs font-medium text-[#6a6a6a]">미제출</p>
            <span className="mt-1 inline-block rounded-full border border-[#d8d8d8] bg-[#efefef] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#4a4a4a]">
              대기
            </span>
          </div>
        </div>
      </div>

      {/* Phase 드롭다운 필터 */}
      {!loading && presentPhases.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setPhaseDropdownOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2a2a2a] shadow-sm hover:bg-[#fafafa] transition-colors"
          >
            <div className="flex items-center gap-2">
              {phaseFilter === 0 ? (
                <span className="text-[#2a2a2a]">전체 Phase</span>
              ) : (
                <>
                  <span className={`inline-block h-2 w-2 rounded-full ${getPhaseCfg(phaseFilter).dot}`} />
                  <span>{getPhaseCfg(phaseFilter).label}</span>
                  {getPhasePendingCount(phaseFilter) > 0 && (
                    <span className="rounded-full bg-[#e8e8e8] px-1.5 py-0.5 text-[10px] font-bold text-[#4a4a4a]">
                      미제출 {getPhasePendingCount(phaseFilter)}
                    </span>
                  )}
                </>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#6a6a6a] transition-transform duration-200 ${phaseDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {phaseDropdownOpen && (
            <>
              {/* 배경 클릭 시 닫기 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setPhaseDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-lg">
                <button
                  onClick={() => { setPhaseFilter(0); setPhaseDropdownOpen(false); }}
                  className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#f5f5f5] ${phaseFilter === 0 ? 'bg-[#f0f0f0] font-semibold text-[#2a2a2a]' : 'text-[#4a4a4a]'}`}
                >
                  전체 Phase
                </button>
                {presentPhases.map((p) => {
                  const cfg = getPhaseCfg(p);
                  const cnt = getPhasePendingCount(p);
                  return (
                    <button
                      key={p}
                      onClick={() => { setPhaseFilter(p); setPhaseDropdownOpen(false); }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#f5f5f5] ${phaseFilter === p ? 'bg-[#f0f0f0] font-semibold text-[#2a2a2a]' : 'text-[#4a4a4a]'}`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                      {cnt > 0 && (
                        <span className="ml-auto rounded-full bg-[#e8e8e8] px-1.5 py-0.5 text-[10px] font-bold text-[#4a4a4a]">
                          미제출 {cnt}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
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
