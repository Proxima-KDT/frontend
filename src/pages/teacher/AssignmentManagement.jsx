import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  Clock,
  RefreshCcw,
  FileText,
  Sparkles,
  MessageSquare,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Textarea from '@/components/common/Textarea';
import ProgressBar from '@/components/common/ProgressBar';
import { useToast } from '@/context/ToastContext';

// Phase 선택 하나로 과목(subject)도 자동 결정됨
const PHASE_OPTIONS = [
  { value: '1', label: 'Phase 1 — Python 기초', subject: 'Python 기초' },
  {
    value: '2',
    label: 'Phase 2 — JavaScript & React',
    subject: 'JavaScript & React',
  },
  { value: '3', label: 'Phase 3 — DB & SQL', subject: 'DB & SQL' },
  {
    value: '4',
    label: 'Phase 4 — 알고리즘 & 자료구조',
    subject: '알고리즘 & 자료구조',
  },
  {
    value: '5',
    label: 'Phase 5 — 풀스택 프로젝트',
    subject: '풀스택 프로젝트',
  },
  {
    value: '6',
    label: 'Phase 6 — ML/DL & 취업준비',
    subject: 'ML/DL & 취업준비',
  },
];

const EMPTY_FORM = {
  title: '',
  phase: '',
  description: '',
  openDate: '',
  dueDate: '',
  rubric: [{ item: '', maxScore: '' }],
};

const STATUS_CONFIG = {
  pending: {
    label: '미제출',
    badgeClass: 'bg-gray-100 text-gray-500',
    Icon: Clock,
  },
  submitted: {
    label: '제출완료',
    badgeClass: 'bg-blue-100 text-blue-700',
    Icon: CheckCircle2,
  },
  graded: {
    label: '채점완료',
    badgeClass: 'bg-green-100 text-green-700',
    Icon: CheckCircle2,
  },
  resubmit_required: {
    label: '재제출 요청',
    badgeClass: 'bg-orange-100 text-orange-700',
    Icon: RefreshCcw,
  },
};

const PHASE_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeClass}`}
    >
      {cfg.label}
    </span>
  );
}

function normalizeAssignments(data) {
  return data.map((a) => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    phase: a.phase,
    description: a.description,
    openDate: a.openDate ?? a.open_date ?? '',
    dueDate: a.dueDate ?? a.due_date ?? '',
    rubric: a.rubric || [],
    studentSubmissions: (
      a.studentSubmissions ??
      a.student_submissions ??
      []
    ).map((s) => ({
      studentId: s.studentId ?? s.student_id,
      studentName: s.studentName ?? s.student_name,
      status: s.status || 'pending',
      submittedAt: s.submittedAt ?? s.submitted_at ?? null,
      files: s.files || [],
      score: s.score ?? null,
      feedback: s.feedback || null,
      rubricScores: s.rubricScores ?? s.rubric_scores ?? null,
    })),
  }));
}

export default function AssignmentManagement() {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null); // { assignment, student }
  const [aiLoading, setAiLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    text: '',
    rubricScores: [],
    score: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ ...EMPTY_FORM });
  const [phaseFilter, setPhaseFilter] = useState(0); // 0 = 전체
  const [deleteConfirm, setDeleteConfirm] = useState(null); // assignment

  useEffect(() => {
    teacherApi
      .getAssignments()
      .then((data) => setAssignments(normalizeAssignments(data)))
      .catch(() =>
        showToast({
          message: '과제 정보를 불러오지 못했습니다.',
          type: 'error',
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const rubricTotal = newAssignment.rubric.reduce(
    (sum, r) => sum + (Number(r.maxScore) || 0),
    0,
  );

  // ── 과제 추가 핸들러 ──────────────────────────────
  const handleAddRubricRow = () =>
    setNewAssignment((prev) => ({
      ...prev,
      rubric: [...prev.rubric, { item: '', maxScore: '' }],
    }));

  const handleRemoveRubricRow = (index) =>
    setNewAssignment((prev) => ({
      ...prev,
      rubric: prev.rubric.filter((_, i) => i !== index),
    }));

  const handleRubricChange = (index, field, value) =>
    setNewAssignment((prev) => ({
      ...prev,
      rubric: prev.rubric.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      ),
    }));

  const handleCreateAssignment = () => {
    const { title, phase, description, openDate, dueDate, rubric } =
      newAssignment;
    // Phase에서 subject 자동 도출
    const phaseOption = PHASE_OPTIONS.find((p) => p.value === String(phase));
    if (
      !title.trim() ||
      !phase ||
      !description.trim() ||
      !openDate ||
      !dueDate
    ) {
      showToast({ message: '모든 필수 항목을 입력하세요.', type: 'error' });
      return;
    }
    const validRubric = rubric.filter(
      (r) => r.item.trim() && Number(r.maxScore) > 0,
    );
    if (validRubric.length === 0) {
      showToast({
        message: '루브릭 항목을 최소 1개 이상 입력하세요.',
        type: 'error',
      });
      return;
    }
    const payload = {
      title: title.trim(),
      subject: phaseOption?.subject ?? '',
      phase: Number(phase),
      description: description.trim(),
      openDate,
      dueDate,
      rubric: validRubric.map((r) => ({
        item: r.item.trim(),
        maxScore: Number(r.maxScore),
      })),
    };
    teacherApi
      .createAssignment(payload)
      .then((created) => {
        setAssignments((prev) => [...prev, ...normalizeAssignments([created])]);
        setNewAssignment({ ...EMPTY_FORM });
        setShowAddModal(false);
        showToast({ message: '과제가 추가되었습니다.', type: 'success' });
      })
      .catch(() =>
        showToast({ message: '과제 추가에 실패했습니다.', type: 'error' }),
      );
  };

  const handleDeleteAssignment = (assignment) => {
    teacherApi
      .deleteAssignment(assignment.id)
      .then(() => {
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
        setDeleteConfirm(null);
        if (expandedId === assignment.id) setExpandedId(null);
        showToast({ message: '과제가 삭제되었습니다.', type: 'success' });
      })
      .catch(() =>
        showToast({ message: '삭제에 실패했습니다.', type: 'error' }),
      );
  };

  // Phase 오름차순 정렬 후 필터 적용
  const filteredAssignments = assignments
    .slice()
    .sort((a, b) => (a.phase ?? 99) - (b.phase ?? 99))
    .filter((a) => phaseFilter === 0 || a.phase === phaseFilter);

  const totalPending = assignments.reduce(
    (acc, a) =>
      acc + a.studentSubmissions.filter((s) => s.status === 'submitted').length,
    0,
  );
  const totalResubmit = assignments.reduce(
    (acc, a) =>
      acc +
      a.studentSubmissions.filter((s) => s.status === 'resubmit_required')
        .length,
    0,
  );

  const openFeedbackModal = (assignment, student) => {
    const rubricScores = assignment.rubric.map((r) => ({
      item: r.item,
      maxScore: r.maxScore,
      score: student.rubricScores?.find((rs) => rs.item === r.item)?.score ?? 0,
    }));
    setFeedbackForm({
      text: student.feedback || '',
      rubricScores,
      score: rubricScores.reduce((sum, r) => sum + r.score, 0),
    });
    setFeedbackModal({ assignment, student });
  };

  const handleAiFeedback = () => {
    const { assignment, student } = feedbackModal;
    setAiLoading(true);
    teacherApi
      .getAiAssignmentFeedback(assignment.id, student.studentId)
      .then((result) => {
        // 백엔드가 반환한 루브릭 점수로 폼 갱신
        const merged = assignment.rubric.map((r) => {
          const ai = result.rubricScores?.find((s) => s.item === r.item);
          return {
            item: r.item,
            maxScore: r.maxScore,
            score: ai ? ai.score : 0,
          };
        });
        setFeedbackForm({
          text: result.feedback || '',
          rubricScores: merged,
          score: merged.reduce((sum, r) => sum + r.score, 0),
        });
        const filesRead = result.filesRead ?? 0;
        showToast({
          message:
            filesRead > 0
              ? `AI 피드백이 생성되었습니다. (파일 ${filesRead}개 분석)`
              : 'AI 피드백이 생성되었습니다. (제출 파일 없음 — 과제 정보 기반)',
          type: 'info',
        });
      })
      .catch(() => {
        showToast({ message: 'AI 피드백 생성에 실패했습니다.', type: 'error' });
      })
      .finally(() => setAiLoading(false));
  };

  const handleRubricScoreChange = (item, value) => {
    const updated = feedbackForm.rubricScores.map((r) =>
      r.item === item
        ? { ...r, score: Math.min(r.maxScore, Math.max(0, Number(value))) }
        : r,
    );
    setFeedbackForm((prev) => ({
      ...prev,
      rubricScores: updated,
      score: updated.reduce((sum, r) => sum + r.score, 0),
    }));
  };

  const handleSubmitFeedback = (requireResubmit = false) => {
    const { assignment, student } = feedbackModal;
    teacherApi
      .gradeAssignmentSubmission(assignment.id, student.studentId, {
        status: requireResubmit ? 'resubmit_required' : 'graded',
        score: requireResubmit ? null : feedbackForm.score,
        feedback: feedbackForm.text,
        rubric_scores: requireResubmit ? null : feedbackForm.rubricScores,
        require_resubmit: requireResubmit,
      })
      .then(() => {
        setAssignments((prev) =>
          prev.map((a) =>
            a.id !== assignment.id
              ? a
              : {
                  ...a,
                  studentSubmissions: a.studentSubmissions.map((s) =>
                    s.studentId !== student.studentId
                      ? s
                      : {
                          ...s,
                          status: requireResubmit
                            ? 'resubmit_required'
                            : 'graded',
                          score: requireResubmit ? null : feedbackForm.score,
                          feedback: feedbackForm.text,
                          rubricScores: requireResubmit
                            ? null
                            : feedbackForm.rubricScores,
                        },
                  ),
                },
          ),
        );
        setFeedbackModal(null);
        showToast({
          message: requireResubmit
            ? '재제출 요청이 전달되었습니다.'
            : '채점이 완료되었습니다.',
          type: 'success',
        });
      })
      .catch(() =>
        showToast({ message: '저장에 실패했습니다.', type: 'error' }),
      );
  };

  const handleDownload = (assignment, student) => {
    teacherApi
      .getSubmissionDownloadUrls(assignment.id, student.studentId)
      .then(({ files }) => {
        if (!files?.length) {
          showToast({ message: '다운로드할 파일이 없습니다.', type: 'info' });
          return;
        }
        // fetch → Blob → objectURL 방식으로 크로스 오리진 다운로드 처리
        // (a.download 속성은 동일 출처에서만 동작 — supabase.co URL 에서는 새 탭으로 열림)
        files.forEach(({ name, url }) => {
          fetch(url)
            .then((res) => res.blob())
            .then((blob) => {
              const objectUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = objectUrl;
              a.download = name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(objectUrl);
            })
            .catch(() =>
              showToast({
                message: `${name} 다운로드에 실패했습니다.`,
                type: 'error',
              }),
            );
        });
      })
      .catch(() =>
        showToast({ message: '파일 다운로드에 실패했습니다.', type: 'error' }),
      );
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 font-bold text-gray-900">과제 관리</h1>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setShowAddModal(true)}
        >
          과제 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-caption text-gray-500">전체 과제</p>
              <p className="text-h3 font-bold text-gray-900">
                {assignments.length}개
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-caption text-gray-500">채점 대기</p>
              <p className="text-h3 font-bold text-gray-900">
                {totalPending}건
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <RefreshCcw className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-caption text-gray-500">재제출 요청</p>
              <p className="text-h3 font-bold text-gray-900">
                {totalResubmit}건
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Phase 탭 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[0, 1, 2, 3, 4, 5, 6].map((p) => {
          const count =
            p === 0
              ? assignments.length
              : assignments.filter((a) => a.phase === p).length;
          if (p !== 0 && count === 0) return null;
          return (
            <button
              key={p}
              onClick={() => setPhaseFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                phaseFilter === p
                  ? p === 0
                    ? 'bg-gray-800 text-white'
                    : `${PHASE_COLORS[(p - 1) % 6]} ring-2 ring-offset-1 ring-current`
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {p === 0 ? `전체 (${count})` : `Phase ${p} (${count})`}
            </button>
          );
        })}
      </div>

      {/* 과제 목록 */}
      <div className="space-y-3">
        {filteredAssignments.map((assignment) => {
          const submitted = assignment.studentSubmissions.filter(
            (s) => s.status !== 'pending',
          ).length;
          const total = assignment.studentSubmissions.length;
          const graded = assignment.studentSubmissions.filter(
            (s) => s.status === 'graded',
          ).length;
          const pendingGrade = assignment.studentSubmissions.filter(
            (s) => s.status === 'submitted',
          ).length;
          const isExpanded = expandedId === assignment.id;

          return (
            <Card key={assignment.id} padding="p-0" className="relative">
              {/* 과제 헤더 */}
              <button
                className="w-full flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
              >
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${PHASE_COLORS[(assignment.phase - 1) % 6]}`}
                >
                  Phase {assignment.phase}
                </span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">
                    {assignment.title}
                  </p>
                  <p className="text-caption text-gray-500">
                    {assignment.subject} · 마감 {assignment.dueDate}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-4 mr-2">
                  <div className="text-right">
                    <p className="text-caption text-gray-500">제출 현황</p>
                    <p className="font-semibold text-gray-900">
                      {submitted}/{total}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-caption text-gray-500">채점 완료</p>
                    <p className="font-semibold text-gray-900">
                      {graded}/{total}
                    </p>
                  </div>
                  {pendingGrade > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      채점 대기 {pendingGrade}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>

              {/* 삭제 버튼 — 카드 우상단 */}
              <button
                className="absolute top-3 right-10 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="과제 삭제"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(assignment);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* 학생 제출 목록 */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* ── 과제 정보 패널 ── */}
                  <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
                    {/* 기간 */}
                    <div className="flex items-center gap-4 text-caption text-gray-500">
                      <span>
                        <span className="font-semibold text-gray-700">
                          공개
                        </span>{' '}
                        {assignment.openDate || '—'}
                      </span>
                      <span className="text-gray-300">→</span>
                      <span>
                        <span className="font-semibold text-gray-700">
                          마감
                        </span>{' '}
                        {assignment.dueDate || '—'}
                      </span>
                    </div>

                    {/* 과제 설명 */}
                    {assignment.description && (
                      <p className="text-body-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {assignment.description}
                      </p>
                    )}

                    {/* 루브릭 */}
                    {assignment.rubric?.length > 0 && (
                      <div>
                        <p className="text-caption font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          채점 기준
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.rubric.map((r) => (
                            <span
                              key={r.item}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-caption text-gray-700"
                            >
                              <span className="font-semibold">{r.item}</span>
                              <span className="text-gray-400">
                                {r.maxScore}점
                              </span>
                            </span>
                          ))}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-100 text-caption font-semibold text-primary-600">
                            총{' '}
                            {assignment.rubric.reduce(
                              (s, r) => s + (r.maxScore ?? 0),
                              0,
                            )}
                            점
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* 제출률 프로그레스 */}
                    <div className="mb-4">
                      <ProgressBar
                        value={
                          total > 0 ? Math.round((submitted / total) * 100) : 0
                        }
                        label="제출률"
                        color="bg-primary-500"
                        size="sm"
                      />
                    </div>

                    {/* 학생 행 */}
                    <div className="space-y-2">
                      {assignment.studentSubmissions.map((student) => (
                        <div
                          key={student.studentId}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary-600">
                              {student.studentName[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {student.studentName}
                            </p>
                            {student.submittedAt && (
                              <p className="text-caption text-gray-500">
                                {student.submittedAt}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={student.status} />
                          {student.score !== null && (
                            <span className="font-bold text-gray-900 text-sm">
                              {student.score}점
                            </span>
                          )}
                          {student.files.length > 0 && (
                            <button
                              className="p-1.5 rounded-lg hover:bg-white text-gray-500 cursor-pointer transition-colors"
                              title="파일 다운로드"
                              onClick={() =>
                                handleDownload(assignment, student)
                              }
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex gap-1.5 shrink-0">
                            {student.status === 'submitted' && (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={MessageSquare}
                                onClick={() =>
                                  openFeedbackModal(assignment, student)
                                }
                              >
                                피드백
                              </Button>
                            )}
                            {student.status === 'graded' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openFeedbackModal(assignment, student)
                                }
                              >
                                수정
                              </Button>
                            )}
                            {student.status === 'resubmit_required' && (
                              <span className="text-xs text-orange-600 font-medium px-1">
                                재제출 대기중
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 과제 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewAssignment({ ...EMPTY_FORM });
        }}
        title="과제 추가"
        persistent
        maxWidth="max-w-[560px]"
      >
        <div className="space-y-4">
          <Input
            label="과제 제목"
            placeholder="예: Python 클래스 설계 과제"
            value={newAssignment.title}
            onChange={(e) =>
              setNewAssignment((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <Select
            label="Phase (과목 자동 설정)"
            options={PHASE_OPTIONS}
            value={newAssignment.phase}
            onChange={(e) =>
              setNewAssignment((prev) => ({ ...prev, phase: e.target.value }))
            }
          />
          <Textarea
            label="과제 설명"
            placeholder="과제의 요구사항을 상세히 작성하세요."
            value={newAssignment.description}
            onChange={(e) =>
              setNewAssignment((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="공개일"
              type="date"
              value={newAssignment.openDate}
              onChange={(e) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  openDate: e.target.value,
                }))
              }
            />
            <Input
              label="마감일"
              type="date"
              value={newAssignment.dueDate}
              onChange={(e) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                채점 기준 (루브릭)
              </p>
              <span className="text-xs text-gray-500">
                총 배점: {rubricTotal}점
              </span>
            </div>
            <div className="space-y-2">
              {newAssignment.rubric.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="평가 항목명"
                    value={r.item}
                    onChange={(e) =>
                      handleRubricChange(idx, 'item', e.target.value)
                    }
                    className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <input
                    type="number"
                    placeholder="배점"
                    min={1}
                    value={r.maxScore}
                    onChange={(e) =>
                      handleRubricChange(idx, 'maxScore', e.target.value)
                    }
                    className="w-20 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-center text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  {newAssignment.rubric.length > 1 && (
                    <button
                      onClick={() => handleRemoveRubricRow(idx)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleAddRubricRow}
              className="mt-2 flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              항목 추가
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              과제가 추가되면 전체 수강생에게 자동으로 배정됩니다.
            </p>
          </div>
          <Button variant="primary" fullWidth onClick={handleCreateAssignment}>
            과제 추가하기
          </Button>
        </div>
      </Modal>

      {/* 피드백 모달 */}
      {feedbackModal && (
        <Modal
          isOpen={!!feedbackModal}
          onClose={() => {
            setFeedbackModal(null);
            setAiLoading(false);
          }}
          title={`피드백 작성 — ${feedbackModal.student.studentName}`}
          persistent
          maxWidth="max-w-[560px]"
        >
          <div className="space-y-5">
            {/* 루브릭 채점 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                루브릭 채점
              </p>
              <div className="space-y-2">
                {feedbackForm.rubricScores.map((r) => (
                  <div key={r.item} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-gray-700">
                      {r.item}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={r.maxScore}
                        value={r.score}
                        onChange={(e) =>
                          handleRubricScoreChange(r.item, e.target.value)
                        }
                        className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-caption text-gray-400">
                        /{r.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="font-semibold text-gray-700">총점</span>
                <span className="text-h3 font-bold text-primary-600">
                  {feedbackForm.score}점
                </span>
              </div>
            </div>

            {/* 피드백 텍스트 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">피드백</p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Sparkles}
                  onClick={handleAiFeedback}
                  loading={aiLoading}
                >
                  {aiLoading ? 'AI 생성중...' : 'AI 피드백 생성'}
                </Button>
              </div>
              <Textarea
                value={feedbackForm.text}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="피드백을 입력하세요. 'AI 피드백 생성' 버튼으로 AI 초안을 생성할 수 있습니다."
                rows={4}
              />
              {aiLoading && (
                <p className="text-caption text-gray-500 mt-1.5">
                  AI가 코드를 분석하고 있습니다...
                </p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                className="flex-1"
                icon={RotateCcw}
                onClick={() => handleSubmitFeedback(true)}
              >
                재제출 요청
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleSubmitFeedback(false)}
                disabled={!feedbackForm.text.trim()}
              >
                채점 확정
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="과제 삭제"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <p className="text-body-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {deleteConfirm.title}
              </span>{' '}
              과제를 삭제하면 모든 제출 기록도 함께 삭제됩니다.
              <br />
              정말 삭제하시겠습니까?
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                취소
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleDeleteAssignment(deleteConfirm)}
              >
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
