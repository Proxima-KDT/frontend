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
  Bell,
  Search,
  Star,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Textarea from '@/components/common/Textarea';
import ProgressBar from '@/components/common/ProgressBar';
import { useToast } from '@/context/ToastContext';

// Phase ?좏깮 ?섎굹濡?怨쇰ぉ(subject)???먮룞 寃곗젙??const PHASE_OPTIONS = [
  { value: '1', label: 'Phase 1 ??Python 湲곗큹', subject: 'Python 湲곗큹' },
  {
    value: '2',
    label: 'Phase 2 ??JavaScript & React',
    subject: 'JavaScript & React',
  },
  { value: '3', label: 'Phase 3 ??DB & SQL', subject: 'DB & SQL' },
  {
    value: '4',
    label: 'Phase 4 ???뚭퀬由ъ쬁 & ?먮즺援ъ“',
    subject: '?뚭퀬由ъ쬁 & ?먮즺援ъ“',
  },
  {
    value: '5',
    label: 'Phase 5 ????ㅽ깮 ?꾨줈?앺듃',
    subject: '??ㅽ깮 ?꾨줈?앺듃',
  },
  {
    value: '6',
    label: 'Phase 6 ??ML/DL & 痍⑥뾽以鍮?,
    subject: 'ML/DL & 痍⑥뾽以鍮?,
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
    label: '誘몄젣異?,
    badgeClass: 'bg-gray-100 text-gray-500',
    Icon: Clock,
  },
  submitted: {
    label: '?쒖텧?꾨즺',
    badgeClass: 'bg-blue-100 text-blue-700',
    Icon: CheckCircle2,
  },
  graded: {
    label: '梨꾩젏?꾨즺',
    badgeClass: 'bg-green-100 text-green-700',
    Icon: CheckCircle2,
  },
  resubmit_required: {
    label: '?ъ젣異??붿껌',
    badgeClass: 'bg-orange-100 text-orange-700',
    Icon: RefreshCcw,
  },
};

const PHASE_COLORS = [
  'bg-[#dce8ea] text-[#5b7480]',
  'bg-[#e4e1ef] text-[#6b648a]',
  'bg-[#e6eddc] text-[#667a4f]',
  'bg-[#f1e6d3] text-[#8a6a39]',
  'bg-[#efe1df] text-[#8a5f59]',
  'bg-[#e2e5eb] text-[#5f6d82]',
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
  const { selectedCourseId, selectedCourse } = useCourse();
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
  const [phaseFilter, setPhaseFilter] = useState(0); // 0 = ?꾩껜
  const [deleteConfirm, setDeleteConfirm] = useState(null); // assignment

  useEffect(() => {
    if (!selectedCourseId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    teacherApi
      .getAssignments(selectedCourseId)
      .then((data) => setAssignments(normalizeAssignments(data)))
      .catch(() =>
        showToast({
          message: '怨쇱젣 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??',
          type: 'error',
        }),
      )
      .finally(() => setLoading(false));
  }, [selectedCourseId, showToast]);

  const rubricTotal = newAssignment.rubric.reduce(
    (sum, r) => sum + (Number(r.maxScore) || 0),
    0,
  );

  // ?? 怨쇱젣 異붽? ?몃뱾????????????????????????????????
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
    // Phase?먯꽌 subject ?먮룞 ?꾩텧
    const phaseOption = PHASE_OPTIONS.find((p) => p.value === String(phase));
    if (
      !title.trim() ||
      !phase ||
      !description.trim() ||
      !openDate ||
      !dueDate
    ) {
      showToast({ message: '紐⑤뱺 ?꾩닔 ??ぉ???낅젰?섏꽭??', type: 'error' });
      return;
    }
    const validRubric = rubric.filter(
      (r) => r.item.trim() && Number(r.maxScore) > 0,
    );
    if (validRubric.length === 0) {
      showToast({
        message: '猷⑤툕由???ぉ??理쒖냼 1媛??댁긽 ?낅젰?섏꽭??',
        type: 'error',
      });
      return;
    }
    if (!selectedCourseId) {
      showToast({
        message: '?ъ씠?쒕컮?먯꽌 怨쇱젙??癒쇱? ?좏깮?섏꽭??',
        type: 'error',
      });
      return;
    }
    const payload = {
      title: title.trim(),
      // subject??諛깆뿏?쒓? (course_id, phase) ??curriculum.title濡??먮룞 ?꾩텧.
      // ?꾨줎?몄쓽 PHASE_OPTIONS 湲곕컲 fallback? course-langchain ?꾩슜?대씪 ?쒕툕 怨쇱젙???섎せ??
      subject: phaseOption?.subject ?? '',
      phase: Number(phase),
      courseId: selectedCourseId,
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
        showToast({ message: '怨쇱젣媛 異붽??섏뿀?듬땲??', type: 'success' });
      })
      .catch(() =>
        showToast({ message: '怨쇱젣 異붽????ㅽ뙣?덉뒿?덈떎.', type: 'error' }),
      );
  };

  const handleDeleteAssignment = (assignment) => {
    teacherApi
      .deleteAssignment(assignment.id)
      .then(() => {
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
        setDeleteConfirm(null);
        if (expandedId === assignment.id) setExpandedId(null);
        showToast({ message: '怨쇱젣媛 ??젣?섏뿀?듬땲??', type: 'success' });
      })
      .catch(() =>
        showToast({ message: '??젣???ㅽ뙣?덉뒿?덈떎.', type: 'error' }),
      );
  };

  // Phase ?ㅻ쫫李⑥닚 ?뺣젹 ???꾪꽣 ?곸슜
  const filteredAssignments = assignments
    .slice()
    .sort((a, b) => (a.phase ?? 99) - (b.phase ?? 99))
    .filter((a) => phaseFilter === 0 || a.phase === phaseFilter);
  const focusAssignment = filteredAssignments[0] ?? null;
  const focusTotal = focusAssignment?.studentSubmissions?.length ?? 0;
  const focusSubmitted =
    focusAssignment?.studentSubmissions?.filter((s) => s.status !== 'pending')
      .length ?? 0;
  const focusGraded =
    focusAssignment?.studentSubmissions?.filter((s) => s.status === 'graded')
      .length ?? 0;

  const totalSubmissionCount = assignments.reduce(
    (acc, a) =>
      acc + a.studentSubmissions.filter((s) => s.status !== 'pending').length,
    0,
  );
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
  const groupedAssignments = filteredAssignments.reduce((acc, assignment) => {
    const key = assignment.phase || 0;
    if (!acc[key]) acc[key] = [];
    acc[key].push(assignment);
    return acc;
  }, {});

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
        // 諛깆뿏?쒓? 諛섑솚??猷⑤툕由??먯닔濡???媛깆떊
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
              ? `AI ?쇰뱶諛깆씠 ?앹꽦?섏뿀?듬땲?? (?뚯씪 ${filesRead}媛?遺꾩꽍)`
              : 'AI ?쇰뱶諛깆씠 ?앹꽦?섏뿀?듬땲?? (?쒖텧 ?뚯씪 ?놁쓬 ??怨쇱젣 ?뺣낫 湲곕컲)',
          type: 'info',
        });
      })
      .catch(() => {
        showToast({ message: 'AI ?쇰뱶諛??앹꽦???ㅽ뙣?덉뒿?덈떎.', type: 'error' });
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
            ? '?ъ젣異??붿껌???꾨떖?섏뿀?듬땲??'
            : '梨꾩젏???꾨즺?섏뿀?듬땲??',
          type: 'success',
        });
      })
      .catch(() =>
        showToast({ message: '??μ뿉 ?ㅽ뙣?덉뒿?덈떎.', type: 'error' }),
      );
  };

  const handleDownload = (assignment, student) => {
    teacherApi
      .getSubmissionDownloadUrls(assignment.id, student.studentId)
      .then(({ files }) => {
        if (!files?.length) {
          showToast({ message: '?ㅼ슫濡쒕뱶???뚯씪???놁뒿?덈떎.', type: 'info' });
          return;
        }
        // fetch ??Blob ??objectURL 諛⑹떇?쇰줈 ?щ줈???ㅻ━吏??ㅼ슫濡쒕뱶 泥섎━
        // (a.download ?띿꽦? ?숈씪 異쒖쿂?먯꽌留??숈옉 ??supabase.co URL ?먯꽌??????쑝濡??대┝)
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
                message: `${name} ?ㅼ슫濡쒕뱶???ㅽ뙣?덉뒿?덈떎.`,
                type: 'error',
              }),
            );
        });
      })
      .catch(() =>
        showToast({ message: '?뚯씪 ?ㅼ슫濡쒕뱶???ㅽ뙣?덉뒿?덈떎.', type: 'error' }),
      );
  };

  return (
    <div className="relative rounded-3xl bg-[#efede8] px-4 py-5 sm:px-6 md:-mx-2 md:px-8 md:py-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#d8d5cf] pb-3">
        <div>
          <h1 className="text-[2rem] leading-tight text-[#2a2a2a]">
            怨쇱젣 愿由?          </h1>
          <p className="mt-1 text-[0.8rem] font-medium tracking-wide text-[#a39c92]">
            Assignment Management
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7e7a74]">
          <button className="rounded-full px-3 py-1.5 hover:bg-[#e2dfd8]">Dashboard</button>
          <button className="rounded-full border border-[#bab7b0] bg-[#e8e5de] px-3 py-1.5 text-[#343230]">
            Evaluations
          </button>
          <button className="rounded-full px-3 py-1.5 hover:bg-[#e2dfd8]">Analytics</button>
          <button className="rounded-full px-3 py-1.5 hover:bg-[#e2dfd8]">Resources</button>
          <Search className="h-4 w-4 text-[#7b7871]" />
          <Bell className="h-4 w-4 text-[#7b7871]" />
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowAddModal(true)}
            className="rounded-full !bg-[#69717a] px-5 !text-white hover:!bg-[#535a62]"
          >
            Create Evaluation
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="relative rounded-[26px] border border-[#e1ded8] bg-[#f7f6f2]">
          <p className="text-sm font-semibold text-[#5c5852]">
            ?꾩껜 ?쒖텧 ??' '}
            <span className="text-xl font-bold tabular-nums text-[#1f2f43]">
              {totalSubmissionCount}
            </span>
          </p>
          <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8d877e]">
            Total Assignments
          </p>
          <p className="mt-1 text-5xl text-[#1f2f43]">{assignments.length}</p>
          <ClipboardList className="absolute bottom-5 right-5 h-14 w-14 text-[#d8d6d0]" />
        </Card>
        <Card className="relative rounded-[26px] border border-[#e1ded8] bg-[#f7f6f2]">
          <p className="text-sm font-semibold text-[#5c5852]">?쒖텧 ?湲?/p>
          <p className="mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8d877e]">
            Pending Submissions
          </p>
          <p className="mt-1 text-5xl text-[#1f2f43]">{totalPending}</p>
          <FileText className="absolute bottom-5 right-5 h-14 w-14 text-[#d8d6d0]" />
        </Card>
        <Card className="relative rounded-[26px] border border-[#e1ded8] bg-[#f7f6f2]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8d877e]">
            Grading Requests
          </p>
          <p className="mt-1 text-5xl text-[#1f2f43]">{totalResubmit}</p>
          <span className="mt-3 inline-flex rounded-full bg-[#d9bf63] px-3 py-1 text-[10px] font-bold uppercase text-[#4a3a14]">
            High Priority
          </span>
          <Star className="absolute bottom-5 right-5 h-14 w-14 text-[#d8d6d0]" />
        </Card>
      </div>

      <div className="mb-6 flex gap-2 rounded-full bg-[#e2dfd8] p-1.5 w-fit flex-wrap">
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                phaseFilter === p
                  ? 'bg-[#262626] text-white'
                  : 'text-[#69645c] hover:bg-white/70'
              }`}
            >
              {p === 0 ? `ALL ${count}` : `PHASE ${p} 쨌 ${count}`}
            </button>
          );
        })}
      </div>

      <div className="space-y-8">
        {Object.entries(groupedAssignments)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([phase, phaseAssignments]) => {
            const minOpen = phaseAssignments
              .map((a) => a.openDate)
              .filter(Boolean)
              .sort()[0];
            const maxDue = phaseAssignments
              .map((a) => a.dueDate)
              .filter(Boolean)
              .sort()
              .slice(-1)[0];
            return (
              <section key={phase}>
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#dbd7d0] pb-2">
                  <h2 className="text-[2rem] text-[#202020]">
                    Phase {String(phase).padStart(2, '0')}
                  </h2>
                  <span className="text-sm italic text-[#7c7870]">
                    {(minOpen || '').replaceAll('-', '.')} - {(maxDue || '').replaceAll('-', '.')}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {phaseAssignments.map((assignment) => {
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
            <Card key={assignment.id} padding="p-0" className="relative rounded-[24px] border border-[#ddd9d2] bg-[#f7f6f2]">
              <button
                className="w-full cursor-pointer rounded-[24px] p-6 text-left transition-colors hover:bg-[#f2f0ea]"
                onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${PHASE_COLORS[(assignment.phase - 1) % 6]}`}>
                    {assignment.subject || `Phase ${assignment.phase}`}
                  </span>
                </div>
                <p className="text-[2rem] leading-tight text-[#1f2f43]">
                    {assignment.title}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#e0ddd6] pt-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8d877e]">
                      ?쒖텧
                    </p>
                    <p className="text-[1.6rem] font-semibold text-[#1f2f43]">{submitted}/{total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8d877e]">
                      梨꾩젏 ?꾨즺
                    </p>
                    <p className="text-[1.6rem] font-semibold text-[#1f2f43]">{graded}/{total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8d877e]">
                      ?쒖텧 湲고븳
                    </p>
                    <p className="text-[1.6rem] font-semibold text-[#884c3a]">{assignment.dueDate || '-'}</p>
                  </div>
                </div>
              </button>

              {/* ??젣 踰꾪듉 ??移대뱶 ?곗긽??*/}
              <button
                className="absolute top-3 right-10 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="怨쇱젣 ??젣"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(assignment);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* ?숈깮 ?쒖텧 紐⑸줉 */}
              {isExpanded && (
                <div className="border-t border-[#e2ddd4]">
                  {/* ?? 怨쇱젣 ?뺣낫 ?⑤꼸 ?? */}
                  <div className="p-4 bg-[#f7f5f0] border-b border-[#ece8e1] space-y-3">
                    {/* 湲곌컙 */}
                    <div className="flex items-center gap-4 text-caption text-gray-500">
                      <span>
                        <span className="font-semibold text-gray-700">
                          怨듦컻
                        </span>{' '}
                        {assignment.openDate || '??}
                      </span>
                      <span className="text-gray-300">??/span>
                      <span>
                        <span className="font-semibold text-gray-700">
                          留덇컧
                        </span>{' '}
                        {assignment.dueDate || '??}
                      </span>
                    </div>

                    {/* 怨쇱젣 ?ㅻ챸 */}
                    {assignment.description && (
                      <p className="text-body-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {assignment.description}
                      </p>
                    )}

                    {/* 猷⑤툕由?*/}
                    {assignment.rubric?.length > 0 && (
                      <div>
                        <p className="text-caption font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          梨꾩젏 湲곗?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.rubric.map((r) => (
                            <span
                              key={r.item}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-caption text-gray-700"
                            >
                              <span className="font-semibold">{r.item}</span>
                              <span className="text-gray-400">
                                {r.maxScore}??                              </span>
                            </span>
                          ))}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#edeae3] border border-[#dfd9cf] text-caption font-semibold text-[#4b5563]">
                            珥?' '}
                            {assignment.rubric.reduce(
                              (s, r) => s + (r.maxScore ?? 0),
                              0,
                            )}
                            ??                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* ?쒖텧瑜??꾨줈洹몃젅??*/}
                    <div className="mb-4">
                      <ProgressBar
                        value={
                          total > 0 ? Math.round((submitted / total) * 100) : 0
                        }
                        label="?쒖텧瑜?
                        color="bg-[#6b7280]"
                        size="sm"
                      />
                    </div>

                    {/* ?숈깮 ??*/}
                    <div className="space-y-2">
                      {assignment.studentSubmissions.map((student) => (
                        <div
                          key={student.studentId}
                          className="flex items-center gap-3 rounded-xl bg-[#eceae4] p-3 transition-colors hover:bg-[#e4e1db]"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#e8eef2] flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#4b5563]">
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
                              {student.score}??                            </span>
                          )}
                          {student.files.length > 0 && (
                            <button
                              className="p-1.5 rounded-lg hover:bg-white text-gray-500 cursor-pointer transition-colors"
                              title="?뚯씪 ?ㅼ슫濡쒕뱶"
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
                                className="!bg-[#59606a] !text-white hover:!bg-[#444b55]"
                                onClick={() =>
                                  openFeedbackModal(assignment, student)
                                }
                              >
                                ?쇰뱶諛?                              </Button>
                            )}
                            {student.status === 'graded' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openFeedbackModal(assignment, student)
                                }
                              >
                                ?섏젙
                              </Button>
                            )}
                            {student.status === 'resubmit_required' && (
                              <span className="text-xs text-orange-600 font-medium px-1">
                                ?ъ젣異??湲곗쨷
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
              </section>
            );
          })}
      </div>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#69717a] text-white shadow-[0_12px_30px_rgba(49,53,58,0.35)] transition-colors hover:bg-[#565e67]"
        title="怨쇱젣 異붽?"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 怨쇱젣 異붽? 紐⑤떖 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewAssignment({ ...EMPTY_FORM });
        }}
        title="怨쇱젣 異붽?"
        persistent
        maxWidth="max-w-[560px]"
      >
        <div className="space-y-4">
          <Input
            label="怨쇱젣 ?쒕ぉ"
            placeholder="?? Python ?대옒???ㅺ퀎 怨쇱젣"
            value={newAssignment.title}
            onChange={(e) =>
              setNewAssignment((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <Select
            label="Phase (怨쇰ぉ ?먮룞 ?ㅼ젙)"
            options={PHASE_OPTIONS}
            value={newAssignment.phase}
            onChange={(e) =>
              setNewAssignment((prev) => ({ ...prev, phase: e.target.value }))
            }
          />
          <Textarea
            label="怨쇱젣 ?ㅻ챸"
            placeholder="怨쇱젣???붽뎄?ы빆???곸꽭???묒꽦?섏꽭??"
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
              label="怨듦컻??
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
              label="留덇컧??
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
                梨꾩젏 湲곗? (猷⑤툕由?
              </p>
              <span className="text-xs text-gray-500">
                珥?諛곗젏: {rubricTotal}??              </span>
            </div>
            <div className="space-y-2">
              {newAssignment.rubric.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="?됯? ??ぉ紐?
                    value={r.item}
                    onChange={(e) =>
                      handleRubricChange(idx, 'item', e.target.value)
                    }
                    className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <input
                    type="number"
                    placeholder="諛곗젏"
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
              ??ぉ 異붽?
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              怨쇱젣媛 異붽??섎㈃ ?꾩껜 ?섍컯?앹뿉寃??먮룞?쇰줈 諛곗젙?⑸땲??
            </p>
          </div>
          <Button variant="primary" fullWidth className="!bg-[#59606a] !text-white hover:!bg-[#444b55]" onClick={handleCreateAssignment}>
            怨쇱젣 異붽??섍린
          </Button>
        </div>
      </Modal>

      {/* ?쇰뱶諛?紐⑤떖 */}
      {feedbackModal && (
        <Modal
          isOpen={!!feedbackModal}
          onClose={() => {
            setFeedbackModal(null);
            setAiLoading(false);
          }}
          title={`?쇰뱶諛??묒꽦 ??${feedbackModal.student.studentName}`}
          persistent
          maxWidth="max-w-[560px]"
        >
          <div className="space-y-5">
            {/* 猷⑤툕由?梨꾩젏 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                猷⑤툕由?梨꾩젏
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
                <span className="font-semibold text-gray-700">珥앹젏</span>
                <span className="text-h3 font-bold text-primary-600">
                  {feedbackForm.score}??                </span>
              </div>
            </div>

            {/* ?쇰뱶諛??띿뒪??*/}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">?쇰뱶諛?/p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Sparkles}
                  onClick={handleAiFeedback}
                  loading={aiLoading}
                >
                  {aiLoading ? 'AI ?앹꽦以?..' : 'AI ?쇰뱶諛??앹꽦'}
                </Button>
              </div>
              <Textarea
                value={feedbackForm.text}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="?쇰뱶諛깆쓣 ?낅젰?섏꽭?? 'AI ?쇰뱶諛??앹꽦' 踰꾪듉?쇰줈 AI 珥덉븞???앹꽦?????덉뒿?덈떎."
                rows={4}
              />
              {aiLoading && (
                <p className="text-caption text-gray-500 mt-1.5">
                  AI媛 肄붾뱶瑜?遺꾩꽍?섍퀬 ?덉뒿?덈떎...
                </p>
              )}
            </div>

            {/* ?≪뀡 踰꾪듉 */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                className="flex-1"
                icon={RotateCcw}
                onClick={() => handleSubmitFeedback(true)}
              >
                ?ъ젣異??붿껌
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-[#59606a] !text-white hover:!bg-[#444b55]"
                onClick={() => handleSubmitFeedback(false)}
                disabled={!feedbackForm.text.trim()}
              >
                梨꾩젏 ?뺤젙
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ??젣 ?뺤씤 紐⑤떖 */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="怨쇱젣 ??젣"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <p className="text-body-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {deleteConfirm.title}
              </span>{' '}
              怨쇱젣瑜???젣?섎㈃ 紐⑤뱺 ?쒖텧 湲곕줉???④퍡 ??젣?⑸땲??
              <br />
              ?뺣쭚 ??젣?섏떆寃좎뒿?덇퉴?
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                痍⑥냼
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleDeleteAssignment(deleteConfirm)}
              >
                ??젣
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
