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
} from 'lucide-react';
import { assignmentsApi } from '@/api/assignments';
import Skeleton from '@/components/common/Skeleton';
import { useToast } from '@/context/ToastContext';

const pageBg = '#F7F5F0';// ── 상수 ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: '미제출',
    icon: Clock,
    badgeClass: 'bg-[#efede7] text-[#8d877e]',
    iconClass: 'text-[#a39c92]',
  },
  submitted: {
    label: '제출완료',
    icon: CheckCircle2,
    badgeClass: 'bg-[#e9eff3] text-[#4f6475]',
    iconClass: 'text-[#6f8391]',
  },
  graded: {
    label: '채점완료',
    icon: CheckCircle2,
    badgeClass: 'bg-[#edf1e8] text-[#5e7455]',
    iconClass: 'text-[#7f9078]',
  },
  resubmit_required: {
    label: '재제출 요청',
    icon: RefreshCcw,
    badgeClass: 'bg-[#f7e5e3] text-[#a33b39]',
    iconClass: 'text-[#a33b39]',
  },
};

const FILTERS = ['전체', '미제출', '제출완료', '채점완료', '재제출 요청'];

function getDDay(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diff;
}

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

function DueDateBadge({ dueDate, status }) {
  if (status === 'graded') return null;
  const dday = getDDay(dueDate);
  if (dday < 0)
    return (
      <span className="text-xs text-gray-400">
        마감 {new Date(dueDate).toLocaleDateString('ko-KR')}
      </span>
    );
  if (dday === 0)
    return <span className="text-xs font-bold text-red-600">오늘 마감</span>;
  if (dday <= 3)
    return <span className="text-xs font-semibold text-red-500">D-{dday}</span>;
  return (
    <span className="text-xs text-gray-500">
      D-{dday} · {new Date(dueDate).toLocaleDateString('ko-KR')}
    </span>
  );
}

function RubricTable({ rubric }) {
  if (!rubric) return null;
  const total = rubric.reduce((s, r) => s + (r.score ?? 0), 0);
  const max = rubric.reduce((s, r) => s + (r.maxScore ?? 0), 0);
  return (
    <div className="mt-4">
      <p className="text-body-sm font-semibold text-gray-700 mb-2">
        항목별 채점
      </p>
      <div className="rounded-xl border border-[#eceae4] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#faf9f6]">
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
                  {r.maxScore ?? '-'}점
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#4e5a61]">
                  {r.score != null ? (
                    `${r.score}점`
                  ) : (
                    <span className="text-gray-400 font-normal">미채점</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#faf9f6] border-t border-[#eceae4]">
            <tr>
              <td className="px-4 py-2.5 font-bold text-gray-800">합계</td>
              <td className="px-4 py-2.5 text-right text-gray-500">{max}점</td>
              <td className="px-4 py-2.5 text-right font-bold text-[#2c2b28]">
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
        className="border-2 border-dashed border-[#d9d3c8] rounded-xl p-6 text-center hover:border-[#c9c1b4] hover:bg-[#fbfaf7] transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input').click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-body-sm text-gray-600">
          파일을 드래그하거나{' '}
          <span className="text-[#4e5a61] font-semibold">
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

function AssignmentCard({ assignment, onSubmitted }) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    assignment.status === 'pending' ||
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

  return (
    <div className="bg-white rounded-2xl border border-[#eceae4] shadow-[0_2px_20px_rgba(60,52,40,0.04)] overflow-hidden">
      {/* 카드 헤더 */}
      <button
        className="w-full text-left p-5 hover:bg-[#faf9f6] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-caption text-gray-400 font-medium">
                {assignment.subject}
              </span>
              <StatusBadge status={assignment.status} />
              {assignment.status !== 'graded' && (
                <DueDateBadge
                  dueDate={assignment.due_date}
                  status={assignment.status}
                />
              )}
            </div>
            <h3 className="text-body font-bold text-gray-900 truncate">
              {assignment.title}
            </h3>
            {assignment.status === 'graded' && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-h3 font-bold text-[#4e5a61]">
                  {assignment.score}점
                </span>
                <span className="text-caption text-gray-400">
                  / {assignment.max_score}점
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0 mt-0.5">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* 상세 영역 */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-5">
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
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-[#eceae4] hover:bg-[#faf9f6] transition-colors text-body-sm text-[#4e5a61] font-medium"
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
          {(assignment.submitted_files?.length ?? 0) > 0 && (
            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">
                제출한 파일
              </p>
              <div className="space-y-2">
                {assignment.submitted_files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#f4f8fb] border border-[#e3edf3] text-body-sm text-[#4f6475]"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-caption text-[#8aa0b1] shrink-0">
                      {file.size}
                    </span>
                  </div>
                ))}
                {assignment.submitted_at && (
                  <p className="text-caption text-gray-400">
                    제출일시: {assignment.submitted_at}
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
                <div className="p-4 bg-[#f3f6f1] rounded-xl border border-[#e5ece0]">
                  <p className="text-body-sm font-semibold text-[#5e7455] mb-1">
                    강사 피드백
                  </p>
                  <p className="text-body-sm text-[#667a5e] leading-relaxed">
                    {assignment.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 재제출 요청 피드백 */}
          {assignment.status === 'resubmit_required' && assignment.feedback && (
            <div className="p-4 bg-[#f9eeed] rounded-xl border border-[#eed6d3]">
              <p className="text-body-sm font-semibold text-[#a33b39] mb-1">
                재제출 사유
              </p>
              <p className="text-body-sm text-[#9b4a47] leading-relaxed">
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
                  <span className="ml-2 text-[#a33b39] font-normal">
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
                className="mt-3 w-full py-2.5 rounded-xl bg-[#4e5a61] text-white font-semibold text-body-sm
                  hover:bg-[#424d53] active:bg-[#384248] transition-colors
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
export default function Assignments() {
  const [filter, setFilter] = useState('전체');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentsApi
      .getList()
      .then((data) => setAssignments(data))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter((a) => {
    if (filter === '전체') return true;
    return STATUS_CONFIG[a.status]?.label === filter;
  });

  const stats = {
    total: assignments.length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    pending: assignments.filter(
      (a) => a.status === 'pending' || a.status === 'resubmit_required',
    ).length,
  };

  return (
    <div
      className="mx-auto max-w-3xl space-y-6 rounded-3xl px-4 py-6"
      style={{ backgroundColor: pageBg }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2f4]">
          <ClipboardList className="h-5 w-5 text-[#4e5a61]" />
        </div>
        <div>
          <h1 className={`text-[2rem] font-semibold text-[#2c2b28]`}>과제</h1>
          <p className="text-caption text-gray-500">
            과제를 제출하고 피드백을 확인하세요
          </p>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#eceae4] bg-white p-4 text-center shadow-[0_2px_18px_rgba(60,52,40,0.04)]">
          <p className={`text-[2rem] font-semibold text-[#2c2b28]`}>{stats.graded}</p>
          <p className="mt-0.5 text-caption text-[#8a847a]">채점완료</p>
        </div>
        <div className="rounded-2xl border border-[#eceae4] bg-white p-4 text-center shadow-[0_2px_18px_rgba(60,52,40,0.04)]">
          <p className={`text-[2rem] font-semibold text-[#4f6475]`}>{stats.submitted}</p>
          <p className="mt-0.5 text-caption text-[#8a847a]">제출완료</p>
        </div>
        <div className="rounded-2xl border border-[#eceae4] bg-white p-4 text-center shadow-[0_2px_18px_rgba(60,52,40,0.04)]">
          <p className={`text-[2rem] font-semibold text-[#a33b39]`}>{stats.pending}</p>
          <p className="mt-0.5 text-caption text-[#8a847a]">미제출</p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-body-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#4e5a61] text-white'
                : 'bg-[#efede7] text-[#7f786d] hover:bg-[#e5e1d8]'
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
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <XCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-body text-gray-400">해당 상태의 과제가 없습니다</p>
        </div>
      )}
    </div>
  );
}
