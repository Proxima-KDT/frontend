import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Clock, MapPin, GraduationCap, CalendarDays, BookOpen,
  X, Layers, Users,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';

const TRACK_LABELS = { main: '메인', sub: '서브' };
const STATUS_CONFIG = {
  upcoming:    { label: '예정',    variant: 'default' },
  in_progress: { label: '진행중',  variant: 'success' },
  completed:   { label: '완료',    variant: 'default' },
};
const FILTER_TABS = [
  { key: 'all',  label: '전체' },
  { key: 'main', label: '메인 과정' },
  { key: 'sub',  label: '서브 과정' },
];

function InputField({ label, required, children }) {
  return (
    <div>
      <label className="block text-body-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-error-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full h-10 px-3 rounded-xl border border-gray-200 text-body-sm outline-none focus:border-admin-400 focus:ring-2 focus:ring-admin-100 transition-all';
const selectCls = `${inputCls} bg-white`;

// ── 강의 추가/편집 모달 ─────────────────────────────
function CourseModal({ course, onClose, onSave }) {
  const isEdit = Boolean(course);
  const [form, setForm] = useState({
    id: course?.id ?? '',
    name: course?.name ?? '',
    track_type: course?.track_type ?? 'main',
    classroom: course?.classroom ?? '',
    duration_months: course?.duration_months ?? 6,
    daily_start_time: course?.daily_start_time ?? '09:00',
    daily_end_time: course?.daily_end_time ?? '17:50',
    description: course?.description ?? '',
    teacher_id: course?.teacher_id ?? '',
    start_date: course?.start_date ?? '',
    end_date: course?.end_date ?? '',
  });
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.getTeachers()
      .then(setTeachers)
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.id || !form.name || !form.classroom) {
      showToast({ type: 'error', message: '필수 항목을 모두 입력해주세요.' });
      return;
    }
    setSaving(true);
    try {
      const result = isEdit
        ? await adminApi.updateCourse(course.id, {
            name: form.name, track_type: form.track_type,
            classroom: form.classroom, duration_months: Number(form.duration_months),
            daily_start_time: form.daily_start_time, daily_end_time: form.daily_end_time,
            description: form.description || null,
            teacher_id: form.teacher_id || '',
          })
        : await adminApi.createCourse({
            ...form,
            duration_months: Number(form.duration_months),
            description: form.description || null,
            teacher_id: form.teacher_id || null,
          });
      onSave(result, isEdit);
    } catch (err) {
      showToast({ type: 'error', message: err?.response?.data?.detail ?? '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? '강의 수정' : '강의 추가'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="강의 ID" required>
            <input className={inputCls} value={form.id} disabled={isEdit}
              onChange={e => set('id', e.target.value)}
              placeholder="예: course-new" />
          </InputField>
          <InputField label="과정 구분" required>
            <select className={selectCls} value={form.track_type}
              onChange={e => set('track_type', e.target.value)}>
              <option value="main">메인 과정</option>
              <option value="sub">서브 과정</option>
            </select>
          </InputField>
        </div>

        <InputField label="강의명" required>
          <input className={inputCls} value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="예: 랭체인 AI 영상객체탐지분석 플랫폼구축" />
        </InputField>

        <div className="grid grid-cols-2 gap-3">
          <InputField label="강의실" required>
            <input className={inputCls} value={form.classroom}
              onChange={e => set('classroom', e.target.value)}
              placeholder="예: 301호" />
          </InputField>
          <InputField label="기간(개월)" required>
            <input className={inputCls} type="number" min="1" max="24"
              value={form.duration_months}
              onChange={e => set('duration_months', e.target.value)} />
          </InputField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputField label="수업 시작" required>
            <input className={inputCls} type="time" value={form.daily_start_time}
              onChange={e => set('daily_start_time', e.target.value)} />
          </InputField>
          <InputField label="수업 종료" required>
            <input className={inputCls} type="time" value={form.daily_end_time}
              onChange={e => set('daily_end_time', e.target.value)} />
          </InputField>
        </div>

        <InputField label="담당 강사">
          <select className={selectCls} value={form.teacher_id}
            onChange={e => set('teacher_id', e.target.value)}>
            <option value="">강사 선택 (선택)</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </InputField>

        {/* 서브 과정: 운영 기간 설정 */}
        {form.track_type === 'sub' && (
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
            <p className="text-caption font-semibold text-gray-600">과정 운영 기간 (서브 과정)</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="시작일">
                <input className={inputCls} type="date" value={form.start_date}
                  onChange={e => set('start_date', e.target.value)} />
              </InputField>
              <InputField label="종료일">
                <input className={inputCls} type="date" value={form.end_date}
                  onChange={e => set('end_date', e.target.value)} />
              </InputField>
            </div>
          </div>
        )}

        <InputField label="설명">
          <textarea className={`${inputCls} h-20 py-2 resize-none`}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="강의 소개 (선택)" />
        </InputField>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose} type="button">
            취소
          </Button>
          <Button variant="primary" size="md" className="flex-1" type="submit" disabled={saving}>
            {saving ? '저장 중...' : isEdit ? '수정 완료' : '강의 추가'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── 기수 추가/편집 모달 ─────────────────────────────
function CohortModal({ courseId, cohort, onClose, onSave }) {
  const isEdit = Boolean(cohort);
  const [form, setForm] = useState({
    cohort_number: cohort?.cohort_number ?? '',
    status: cohort?.status ?? 'upcoming',
    start_date: cohort?.start_date ?? '',
    end_date: cohort?.end_date ?? '',
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.cohort_number) {
      showToast({ type: 'error', message: '기수 번호를 입력해주세요.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cohort_number: Number(form.cohort_number),
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      const result = isEdit
        ? await adminApi.updateCohort(cohort.id, payload)
        : await adminApi.createCohort(courseId, payload);
      onSave(result, isEdit);
    } catch (err) {
      showToast({ type: 'error', message: err?.response?.data?.detail ?? '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? '기수 수정' : '기수 추가'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="기수 번호" required>
            <input className={inputCls} type="number" min="1"
              value={form.cohort_number}
              onChange={e => set('cohort_number', e.target.value)}
              placeholder="예: 4" />
          </InputField>
          <InputField label="상태" required>
            <select className={selectCls} value={form.status}
              onChange={e => set('status', e.target.value)}>
              <option value="upcoming">예정</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
            </select>
          </InputField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="시작일">
            <input className={inputCls} type="date" value={form.start_date}
              onChange={e => set('start_date', e.target.value)} />
          </InputField>
          <InputField label="종료일">
            <input className={inputCls} type="date" value={form.end_date}
              onChange={e => set('end_date', e.target.value)} />
          </InputField>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose} type="button">
            취소
          </Button>
          <Button variant="primary" size="md" className="flex-1" type="submit" disabled={saving}>
            {saving ? '저장 중...' : isEdit ? '기수 수정' : '기수 추가'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── 강의 카드 ───────────────────────────────────────
function CourseCard({ course, onEdit, onDelete, onCohortSave, onCohortDelete }) {
  const [open, setOpen] = useState(false);
  const [cohortModal, setCohortModal] = useState(null); // null | { cohort? }
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const inProgressCount = course.cohorts.filter(c => c.status === 'in_progress').length;
  const today = new Date().toISOString().slice(0, 10);
  const isSubInProgress = course.track_type === 'sub'
    && course.start_date && course.end_date
    && today >= course.start_date && today <= course.end_date;
  const canDeleteCourse = (course.student_count ?? 0) === 0;

  async function handleDeleteCourse() {
    if (!canDeleteCourse) return;
    if (!window.confirm(`"${course.name}" 강의를 삭제하시겠습니까?\n기수 데이터도 함께 삭제됩니다.`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteCourse(course.id);
      onDelete(course.id);
      showToast({ type: 'success', message: '강의가 삭제되었습니다.' });
    } catch (err) {
      showToast({ type: 'error', message: err?.response?.data?.detail ?? '강의 삭제에 실패했습니다.' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteCohort(cohort) {
    if ((cohort.student_count ?? 0) > 0) {
      showToast({ type: 'error', message: `${cohort.cohort_number}기에 ${cohort.student_count}명의 수강생이 있어 삭제할 수 없습니다.` });
      return;
    }
    if (!window.confirm(`${cohort.cohort_number}기를 삭제하시겠습니까?`)) return;
    try {
      await adminApi.deleteCohort(cohort.id);
      onCohortDelete(course.id, cohort.id);
      showToast({ type: 'success', message: '기수가 삭제되었습니다.' });
    } catch (err) {
      showToast({ type: 'error', message: err?.response?.data?.detail ?? '기수 삭제에 실패했습니다.' });
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-admin-50 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-admin-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-body font-bold text-gray-900 truncate">{course.name}</h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  course.track_type === 'main'
                    ? 'bg-admin-100 text-admin-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {TRACK_LABELS[course.track_type]}
                </span>
                {(inProgressCount > 0 || isSubInProgress) && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    진행중
                  </span>
                )}
              </div>
              <p className="text-caption text-gray-400">{course.id}</p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(course)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-admin-600 hover:bg-admin-50 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <div className="relative group">
              <button
                onClick={handleDeleteCourse}
                disabled={deleting || !canDeleteCourse}
                className={`p-1.5 rounded-lg transition-colors ${
                  canDeleteCourse
                    ? 'text-gray-400 hover:text-error-500 hover:bg-error-50'
                    : 'text-gray-200 cursor-not-allowed'
                } disabled:opacity-40`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {!canDeleteCourse && (
                <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded bg-gray-700 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  수강생 {course.student_count}명 등록됨
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 강의 정보 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-caption">
          <span className="flex items-center gap-1.5 text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {course.classroom}
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {course.daily_start_time} ~ {course.daily_end_time}
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {course.duration_months}개월 과정
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            총 {course.cohorts.length}기
          </span>
          <span className={`flex items-center gap-1.5 ${(course.student_count ?? 0) > 0 ? 'text-admin-600 font-medium' : 'text-gray-400'}`}>
            <Users className="w-3.5 h-3.5 shrink-0" />
            수강생 {course.student_count ?? 0}명
          </span>
          <span className="flex items-center gap-1.5 text-gray-600 col-span-2">
            <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {course.teacher_name
              ? <span className="font-medium text-admin-700">{course.teacher_name} 강사</span>
              : <span className="text-gray-400">담당강사 미배정</span>
            }
          </span>
        </div>

        {/* 과정 기간 아코디언 (서브 과정) */}
        {course.track_type === 'sub' && (
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setOpen(p => !p)}
              className="flex items-center justify-between w-full text-body-sm font-semibold text-gray-700 hover:text-admin-600 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                과정 기간
              </span>
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {open && (
              <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                {course.start_date && course.end_date ? (
                  <div className="flex items-center gap-2 text-body-sm text-gray-700">
                    <CalendarDays className="w-4 h-4 text-admin-400 shrink-0" />
                    <span className="font-medium">
                      {course.start_date.replaceAll('-', '.')}
                      {' ~ '}
                      {course.end_date.replaceAll('-', '.')}
                    </span>
                  </div>
                ) : (
                  <p className="text-caption text-gray-400 text-center py-2">
                    과정 기간이 설정되지 않았습니다.
                    <br />
                    <span className="text-[10px]">편집 버튼에서 시작일·종료일을 입력하세요.</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 기수 아코디언 (메인 과정만) */}
        {course.track_type === 'main' && (
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setOpen(p => !p)}
              className="flex items-center justify-between w-full text-body-sm font-semibold text-gray-700 hover:text-admin-600 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                기수 관리
              </span>
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {open && (
              <div className="mt-3 space-y-2">
                {course.cohorts.length === 0 ? (
                  <p className="text-caption text-gray-400 text-center py-3">등록된 기수가 없습니다.</p>
                ) : (
                  course.cohorts
                    .slice()
                    .sort((a, b) => a.cohort_number - b.cohort_number)
                    .map(cohort => (
                      <div key={cohort.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-body-sm font-bold text-admin-600 w-6 shrink-0">
                          {cohort.cohort_number}기
                        </span>
                        <span className="text-caption text-gray-500 flex-1 truncate">
                          {cohort.start_date && cohort.end_date
                            ? `${cohort.start_date.replaceAll('-', '.')} ~ ${cohort.end_date.replaceAll('-', '.')}`
                            : '날짜 미설정'}
                        </span>
                        {(cohort.student_count ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-admin-600 bg-admin-50 px-1.5 py-0.5 rounded-full shrink-0">
                            <Users className="w-2.5 h-2.5" />
                            {cohort.student_count}명
                          </span>
                        )}
                        <Badge variant={STATUS_CONFIG[cohort.status]?.variant ?? 'default'} size="sm">
                          {STATUS_CONFIG[cohort.status]?.label ?? cohort.status}
                        </Badge>
                        {cohort.status === 'upcoming' ? (
                          <>
                            <button onClick={() => setCohortModal({ cohort })}
                              className="p-1 rounded text-gray-400 hover:text-admin-600 hover:bg-white transition-colors"
                              title="기수 수정">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCohort(cohort)}
                              className={`p-1 rounded transition-colors ${
                                (cohort.student_count ?? 0) > 0
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-error-500 hover:bg-white'
                              }`}
                              title={(cohort.student_count ?? 0) > 0 ? `수강생 ${cohort.student_count}명 등록됨` : '기수 삭제'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span
                            className="text-[10px] text-gray-300 px-1"
                            title={cohort.status === 'in_progress' ? '진행중인 기수는 편집·삭제할 수 없습니다' : '완료된 기수는 편집·삭제할 수 없습니다'}
                          >
                            {cohort.status === 'in_progress' ? '진행중' : '완료'}
                          </span>
                        )}
                      </div>
                    ))
                )}
                <button
                  onClick={() => setCohortModal({})}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border-2 border-dashed border-admin-200 text-caption font-semibold text-admin-500 hover:border-admin-400 hover:bg-admin-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 기수 추가
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {cohortModal !== null && (
        <CohortModal
          courseId={course.id}
          cohort={cohortModal.cohort}
          onClose={() => setCohortModal(null)}
          onSave={(result, isEdit) => {
            onCohortSave(course.id, result, isEdit);
            setCohortModal(null);
          }}
        />
      )}
    </>
  );
}

// ── 메인 페이지 ─────────────────────────────────────
export default function CourseManagement() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [courseModal, setCourseModal] = useState(null); // null | { course? }

  useEffect(() => {
    adminApi.getCourses()
      .then(setCourses)
      .catch(() => showToast({ type: 'error', message: '강의 목록을 불러오지 못했습니다.' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    filter === 'all' ? true : c.track_type === filter,
  );

  const handleCourseSave = useCallback((result, isEdit) => {
    setCourses(prev =>
      isEdit
        ? prev.map(c => c.id === result.id ? { ...c, ...result } : c)
        : [...prev, { ...result, cohorts: [] }],
    );
    setCourseModal(null);
    showToast({ type: 'success', message: isEdit ? '강의가 수정되었습니다.' : '강의가 추가되었습니다.' });
  }, [showToast]);

  const handleCourseDelete = useCallback((courseId) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
  }, []);

  const handleCohortSave = useCallback((courseId, cohort, isEdit) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const cohorts = isEdit
        ? c.cohorts.map(ch => ch.id === cohort.id ? cohort : ch)
        : [...c.cohorts, cohort];
      return { ...c, cohorts };
    }));
  }, []);

  const handleCohortDelete = useCallback((courseId, cohortId) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, cohorts: c.cohorts.filter(ch => ch.id !== cohortId) }
        : c,
    ));
  }, []);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 font-bold text-gray-900">강의 목록 / 시간표</h1>
          <p className="text-body-sm text-gray-500 mt-0.5">
            진행 중인 강의를 조회하고 강의 및 기수를 관리하세요.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => setCourseModal({})}>
          강의 추가
        </Button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-body-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className={`ml-1.5 text-[10px] rounded-full px-1.5 py-0.5 ${
                filter === tab.key ? 'bg-admin-100 text-admin-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {courses.filter(c => c.track_type === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 강의 카드 그리드 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-body font-semibold text-gray-500">강의가 없습니다.</p>
          <button onClick={() => setCourseModal({})}
            className="mt-3 text-body-sm text-admin-500 hover:text-admin-700 font-medium transition-colors">
            첫 강의 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={c => setCourseModal({ course: c })}
              onDelete={handleCourseDelete}
              onCohortSave={handleCohortSave}
              onCohortDelete={handleCohortDelete}
            />
          ))}
        </div>
      )}

      {/* 강의 모달 */}
      {courseModal !== null && (
        <CourseModal
          course={courseModal.course}
          onClose={() => setCourseModal(null)}
          onSave={handleCourseSave}
        />
      )}
    </div>
  );
}
