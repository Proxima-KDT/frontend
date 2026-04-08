import { useState } from 'react';
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
import { mockAssessments } from '@/data/mockData';

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
    badgeClass: 'bg-blue-100 text-blue-700',
    icon: Clock,
    iconClass: 'text-blue-500',
  },
  submitted: {
    label: '제출완료',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    icon: CheckCircle2,
    iconClass: 'text-indigo-500',
  },
  graded: {
    label: '채점완료',
    badgeClass: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
    iconClass: 'text-green-500',
  },
};

const PHASE_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

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
          passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                <td className="px-4 py-2.5 text-right font-semibold text-student-600">
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
              <td className="px-4 py-2.5 text-right font-bold text-student-700">
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
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center
          hover:border-student-400 hover:bg-student-50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('assess-file-input').click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-body-sm text-gray-600">
          파일을 드래그하거나{' '}
          <span className="text-student-600 font-semibold">클릭하여 업로드</span>
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

function AssessmentCard({ assessment, colorClass }) {
  const [expanded, setExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const isLocked = assessment.status === 'locked';
  const isOpen = assessment.status === 'open';
  const isGraded = assessment.status === 'graded';
  const isSubmitted = assessment.status === 'submitted';

  const handleSubmit = () => {
    if (uploadedFiles.length === 0) return;
    setSubmitted(true);
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        isLocked ? 'border-gray-200 opacity-70' : 'border-gray-200'
      }`}
    >
      {/* 카드 헤더 */}
      <button
        className={`w-full text-left ${isLocked ? 'cursor-default' : 'hover:bg-gray-50'} transition-colors`}
        onClick={() => !isLocked && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 p-5">
          {/* Phase 번호 배지 */}
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0`}
          >
            <span className="text-white font-bold text-body">
              {assessment.phaseId}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-caption text-gray-400 font-medium">
                Phase {assessment.phaseId}
              </span>
              <StatusBadge status={assessment.status} />
            </div>
            <h3 className="text-body font-bold text-gray-900 truncate">
              {assessment.phaseTitle}
            </h3>
            <p className="text-caption text-gray-400 mt-0.5">
              평가 기간: {assessment.period.start} ~ {assessment.period.end}
            </p>
          </div>

          {/* 점수 (채점완료) */}
          {isGraded && (
            <div className="text-right shrink-0">
              <p className="text-h2 font-bold text-student-600">
                {assessment.score}
                <span className="text-body text-gray-400 font-normal">
                  점
                </span>
              </p>
              <span
                className={`text-xs font-bold ${
                  assessment.passed ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {assessment.passed ? '✓ 통과' : '✗ 미통과'}
              </span>
            </div>
          )}

          {/* 잠금 아이콘 */}
          {isLocked && <Lock className="w-5 h-5 text-gray-300 shrink-0" />}

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
          <div className="p-4 bg-student-50 rounded-xl border border-student-100">
            <p className="text-caption font-semibold text-student-500 uppercase tracking-wide mb-1">
              평가 주제
            </p>
            <p className="text-body font-bold text-student-900 mb-2">
              {assessment.subject}
            </p>
            <p className="text-body-sm text-student-800 leading-relaxed">
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
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-student-100 text-student-700 text-[11px] font-bold flex items-center justify-center shrink-0">
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
              {assessment.coverageTopics.map((topic, i) => (
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
                maxScore={assessment.maxScore}
                passed={assessment.passed}
              />
              {assessment.feedback && (
                <div className="flex-1 p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-body-sm font-semibold text-green-800 mb-1">
                    강사 피드백
                  </p>
                  <p className="text-body-sm text-green-700 leading-relaxed">
                    {assessment.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 제출된 파일 */}
          {(isSubmitted || isGraded) && assessment.submittedFiles.length > 0 && (
            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">
                제출한 파일
              </p>
              <div className="space-y-2">
                {assessment.submittedFiles.map((file, i) => (
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
                {assessment.submittedAt && (
                  <p className="text-caption text-gray-400">
                    제출일시: {assessment.submittedAt}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 파일 업로드 (오픈 상태) */}
          {isOpen && !submitted && (
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
                disabled={uploadedFiles.length === 0}
                className="mt-3 w-full py-2.5 rounded-xl bg-student-600 text-white font-semibold text-body-sm
                  hover:bg-student-700 active:bg-student-800 transition-colors
                  disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                제출하기
              </button>
            </div>
          )}

          {/* 제출 성공 */}
          {submitted && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-body-sm text-blue-700 font-medium">
                평가 파일이 성공적으로 제출되었습니다!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function Assessments() {
  const graded = mockAssessments.filter((a) => a.status === 'graded');
  const passed = graded.filter((a) => a.passed);
  const avgScore =
    graded.length > 0
      ? Math.round(graded.reduce((s, a) => s + a.score, 0) / graded.length)
      : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-student-100 flex items-center justify-center">
          <Award className="w-5 h-5 text-student-600" />
        </div>
        <div>
          <h1 className="text-h2 font-bold text-gray-900">능력단위평가</h1>
          <p className="text-caption text-gray-500">
            각 Phase 종료 후 해당 월의 학습 내용을 평가합니다
          </p>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-green-600">{passed.length}</p>
          <p className="text-caption text-gray-500 mt-0.5">
            통과 ({graded.length}/{mockAssessments.length})
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-student-600">
            {avgScore !== null ? `${avgScore}점` : '-'}
          </p>
          <p className="text-caption text-gray-500 mt-0.5">평균 점수</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-h2 font-bold text-blue-600">
            {mockAssessments.filter((a) => a.status === 'open').length}
          </p>
          <p className="text-caption text-gray-500 mt-0.5">제출 대기</p>
        </div>
      </div>

      {/* 타임라인 안내 */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-caption text-gray-500 text-center">
          능력단위평가는 각 Phase 마지막 주에 열립니다 · 6개월 과정 총 6회
        </p>
      </div>

      {/* 평가 목록 */}
      <div className="space-y-3">
        {mockAssessments.map((assessment, i) => (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            colorClass={PHASE_COLORS[i % PHASE_COLORS.length]}
          />
        ))}
      </div>
    </div>
  );
}
