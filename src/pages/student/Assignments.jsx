import { useState } from 'react';
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
import { mockAssignments } from '@/data/mockData';

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

function getDDay(dueDate) {
  const today = new Date('2026-04-08'); // mock 기준 오늘
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
    return (
      <span className="text-xs font-semibold text-red-500">D-{dday}</span>
    );
  return (
    <span className="text-xs text-gray-500">
      D-{dday} · {new Date(dueDate).toLocaleDateString('ko-KR')}
    </span>
  );
}

function RubricTable({ rubric }) {
  if (!rubric) return null;
  const total = rubric.reduce((s, r) => s + r.score, 0);
  const max = rubric.reduce((s, r) => s + r.maxScore, 0);
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
                  {r.maxScore}점
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-student-600">
                  {r.score}점
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
          <span className="text-student-600 font-semibold">클릭하여 업로드</span>
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

function AssignmentCard({ assignment }) {
  const [expanded, setExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    assignment.status === 'pending' || assignment.status === 'resubmit_required';

  const handleSubmit = () => {
    if (uploadedFiles.length === 0) return;
    // 실제 구현 시 API 호출
    setSubmitted(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <button
        className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
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
                  dueDate={assignment.dueDate}
                  status={assignment.status}
                />
              )}
            </div>
            <h3 className="text-body font-bold text-gray-900 truncate">
              {assignment.title}
            </h3>
            {assignment.status === 'graded' && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-h3 font-bold text-student-600">
                  {assignment.score}점
                </span>
                <span className="text-caption text-gray-400">
                  / {assignment.maxScore}점
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
          {assignment.attachments.length > 0 && (
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
          {assignment.submittedFiles.length > 0 && (
            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">
                제출한 파일
              </p>
              <div className="space-y-2">
                {assignment.submittedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-body-sm text-blue-700"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-caption text-blue-400 shrink-0">
                      {file.size}
                    </span>
                  </div>
                ))}
                {assignment.submittedAt && (
                  <p className="text-caption text-gray-400">
                    제출일시: {assignment.submittedAt}
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
          {canSubmit && !submitted && (
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
                disabled={uploadedFiles.length === 0}
                className="mt-3 w-full py-2.5 rounded-xl bg-student-600 text-white font-semibold text-body-sm
                  hover:bg-student-700 active:bg-student-800 transition-colors
                  disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                제출하기
              </button>
            </div>
          )}

          {/* 제출 성공 메시지 */}
          {submitted && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-body-sm text-blue-700 font-medium">
                과제가 성공적으로 제출되었습니다!
              </p>
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

  const filtered = mockAssignments.filter((a) => {
    if (filter === '전체') return true;
    return STATUS_CONFIG[a.status].label === filter;
  });

  const stats = {
    total: mockAssignments.length,
    graded: mockAssignments.filter((a) => a.status === 'graded').length,
    submitted: mockAssignments.filter((a) => a.status === 'submitted').length,
    pending: mockAssignments.filter(
      (a) => a.status === 'pending' || a.status === 'resubmit_required',
    ).length,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-student-100 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-student-600" />
        </div>
        <div>
          <h1 className="text-h2 font-bold text-gray-900">과제</h1>
          <p className="text-caption text-gray-500">
            과제를 제출하고 피드백을 확인하세요
          </p>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-gray-900">{stats.graded}</p>
          <p className="text-caption text-gray-500 mt-0.5">채점완료</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-blue-600">{stats.submitted}</p>
          <p className="text-caption text-gray-500 mt-0.5">제출완료</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-orange-500">{stats.pending}</p>
          <p className="text-caption text-gray-500 mt-0.5">미제출</p>
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
                ? 'bg-student-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 과제 목록 */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
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
