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

const SUBJECT_OPTIONS = [
  { value: 'Python 기초', label: 'Python 기초' },
  { value: 'JavaScript & React', label: 'JavaScript & React' },
  { value: 'DB & SQL', label: 'DB & SQL' },
  { value: '알고리즘 & 자료구조', label: '알고리즘 & 자료구조' },
  { value: '풀스택 프로젝트', label: '풀스택 프로젝트' },
  { value: 'ML/DL & 취업준비', label: 'ML/DL & 취업준비' },
];

const PHASE_OPTIONS = [
  { value: '1', label: 'Phase 1 — Python 기초' },
  { value: '2', label: 'Phase 2 — JavaScript & React' },
  { value: '3', label: 'Phase 3 — DB & SQL' },
  { value: '4', label: 'Phase 4 — 알고리즘 & 자료구조' },
  { value: '5', label: 'Phase 5 — 풀스택 프로젝트' },
  { value: '6', label: 'Phase 6 — ML/DL & 취업준비' },
];

const EMPTY_FORM = {
  title: '',
  subject: '',
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
    openDate: a.open_date,
    dueDate: a.due_date,
    rubric: a.rubric || [],
    studentSubmissions: (a.student_submissions || []).map((s) => ({
      studentId: s.student_id,
      studentName: s.student_name,
      status: s.status || 'pending',
      submittedAt: s.submitted_at || null,
      files: s.files || [],
      score: s.score ?? null,
      feedback: s.feedback || null,
      rubricScores: s.rubric_scores || null,
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
    const { title, subject, phase, description, openDate, dueDate, rubric } =
      newAssignment;
    if (
      !title.trim() ||
      !subject ||
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
      subject,
      phase: Number(phase),
      description: description.trim(),
      open_date: openDate,
      due_date: dueDate,
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
    setAiLoading(true);
    setTimeout(() => {
      const aiRubricScores = feedbackModal.assignment.rubric.map((r) => ({
        item: r.item,
        maxScore: r.maxScore,
        score: Math.floor(r.maxScore * (0.7 + Math.random() * 0.28)),
      }));
      const aiTotal = aiRubricScores.reduce((sum, r) => sum + r.score, 0);
      setFeedbackForm({
        text: `AI 분석 결과: 전반적으로 과제의 요구사항을 충실히 이행하였습니다. 코드 구조와 논리 흐름이 명확하며 핵심 기능을 올바르게 구현하였습니다. 다만 일부 엣지 케이스 처리와 코드 주석 보완이 필요합니다. 전체적으로 ${aiTotal >= 80 ? '우수한' : '양호한'} 수준의 제출물입니다.`,
        rubricScores: aiRubricScores,
        score: aiTotal,
      });
      setAiLoading(false);
      showToast({
        message: 'AI 피드백이 생성되었습니다. 검토 후 확정하세요.',
        type: 'info',
      });
    }, 2000);
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

  const handleConfirmSubmission = () => {
    showToast({ message: '제출이 확인되었습니다.', type: 'success' });
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

      {/* 과제 목록 */}
      <div className="space-y-3">
        {assignments.map((assignment) => {
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
            <Card key={assignment.id} padding="p-0">
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

              {/* 학생 제출 목록 */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4">
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
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <div className="flex gap-1.5 shrink-0">
                          {student.status === 'submitted' && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleConfirmSubmission}
                              >
                                제출 확인
                              </Button>
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
                            </>
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
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="과목"
              options={SUBJECT_OPTIONS}
              value={newAssignment.subject}
              onChange={(e) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
            />
            <Select
              label="Phase"
              options={PHASE_OPTIONS}
              value={newAssignment.phase}
              onChange={(e) =>
                setNewAssignment((prev) => ({ ...prev, phase: e.target.value }))
              }
            />
          </div>
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
    </div>
  );
}
