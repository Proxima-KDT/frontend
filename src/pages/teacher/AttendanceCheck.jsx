import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  Minus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  LogOut,
  Users,
  GripVertical,
  Edit3,
  Check,
  X,
  RotateCcw,
  CalendarDays,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import Drawer from '@/components/common/Drawer';
import Skeleton from '@/components/common/Skeleton';
import { useToast } from '@/context/ToastContext';

// 실시간 오늘 날짜
const TODAY = new Date().toISOString().slice(0, 10);

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

// 평일 기준으로 delta일 이동 (주말 건너뜀)
function moveDateByWorkday(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  let moved = 0;
  const step = delta > 0 ? 1 : -1;
  while (moved < Math.abs(delta)) {
    d.setDate(d.getDate() + step);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) moved++;
  }
  return d.toISOString().slice(0, 10);
}

const STATUS_CONFIG = {
  present: {
    label: '출석',
    badgeVariant: 'success',
    bg: 'bg-[#eef4ea] border-[#d5e4cc] hover:bg-[#e6f0df]',
    icon: CheckCircle,
    iconClass: 'text-[#5d7a4d]',
  },
  late: {
    label: '지각',
    badgeVariant: 'warning',
    bg: 'bg-[#faf3e4] border-[#edd9b1] hover:bg-[#f4ead5]',
    icon: Clock,
    iconClass: 'text-[#9b7640]',
  },
  absent: {
    label: '결석',
    badgeVariant: 'error',
    bg: 'bg-[#f8ece9] border-[#ebcec5] hover:bg-[#f3e3de]',
    icon: XCircle,
    iconClass: 'text-[#a0675b]',
  },
  early_leave: {
    label: '조퇴',
    badgeVariant: 'warning',
    bg: 'bg-[#f6f0e4] border-[#e5d6bb] hover:bg-[#f0e7d6]',
    icon: LogOut,
    iconClass: 'text-[#8f7a52]',
  },
};

const NULL_CFG = {
  label: '미확인',
  badgeVariant: 'default',
  bg: 'bg-[#f3f1ed] border-[#e2ddd4] hover:bg-[#ece8e1]',
  icon: Minus,
  iconClass: 'text-[#9f978a]',
};

const getCfg = (status) => STATUS_CONFIG[status] ?? NULL_CFG;

// ── 날짜 선택 캘린더 팝오버 ──────────────────────────────────────────
function DatePickerPopover({ selectedDate, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    new Date(selectedDate + 'T00:00:00').getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(() =>
    new Date(selectedDate + 'T00:00:00').getMonth(),
  );
  const ref = useRef(null);

  // 외부 클릭시 닫힘
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // 선택 날짜가 화살표로 바뀌면 캘린더 뷰도 동기화
  useEffect(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    const todayD = new Date(TODAY + 'T00:00:00');
    const isLastAllowedMonth =
      viewYear === todayD.getFullYear() && viewMonth >= todayD.getMonth();
    if (isLastAllowedMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // 달력 셀 계산 (앞 공백 + 날짜들 + 뒤 공백)
  const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0=일
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function handleDayClick(day) {
    if (!day) return;
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dow = new Date(ds + 'T00:00:00').getDay();
    if (dow === 0 || dow === 6) return; // 주말 차단
    if (ds > TODAY) return; // 미래 차단
    onChange(ds);
    setOpen(false);
  }

  function goToday() {
    onChange(TODAY);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors group"
      >
        <span className="text-body font-semibold text-gray-900">
          {formatDateLabel(selectedDate)}
        </span>
        <CalendarDays
          size={16}
          className="text-gray-400 group-hover:text-[#7a6750] transition-colors"
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-72">
          {/* 월 이동 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-body-sm font-bold text-gray-800">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button
              onClick={nextMonth}
              disabled={(() => {
                const todayD = new Date(TODAY + 'T00:00:00');
                return (
                  viewYear === todayD.getFullYear() &&
                  viewMonth >= todayD.getMonth()
                );
              })()}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className={`text-center text-caption font-semibold py-1 ${
                  i === 0
                    ? 'text-error-400'
                    : i === 6
                      ? 'text-primary-400'
                      : 'text-gray-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="w-9 h-9" />;
              const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dow = new Date(ds + 'T00:00:00').getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isDayFuture = ds > TODAY;
              const isDisabled = isWeekend || isDayFuture;
              const isSelected = ds === selectedDate;
              const isToday = ds === TODAY;
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabled}
                  className={`w-9 h-9 mx-auto rounded-full text-caption font-medium transition-colors flex items-center justify-center
                    ${
                      isSelected
                        ? 'bg-[#7a6750] text-white'
                        : isToday
                          ? 'ring-2 ring-[#bba98f] text-[#7a6750] font-bold'
                          : isDisabled
                            ? 'text-gray-300 cursor-default'
                            : 'text-gray-700 hover:bg-[#f3ede3] hover:text-[#6a5845]'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* 하단 오늘로 이동 */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
            <button
              onClick={goToday}
              className="text-caption font-semibold text-[#7a6750] hover:text-[#5f4d3b] px-3 py-1 rounded-lg hover:bg-[#f3ede3] transition-colors"
            >
              오늘로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 좌석 그리드 컴포넌트 (일반 뷰 + 드래그앤드롭 편집 뷰 통합) ──────────
function SeatGrid({
  seats,
  editMode,
  attendanceData,
  draggedStudentId,
  dragOverSeatId,
  onStudentClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const maxRow = seats.reduce((m, s) => Math.max(m, s.row ?? 0), 0);
  const maxCol = seats.reduce((m, s) => Math.max(m, s.col ?? 0), 0);

  if (maxRow === 0) return null;

  return (
    <div
      className="grid gap-3 mb-4"
      style={{ gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: maxRow }, (_, ri) =>
        Array.from({ length: maxCol }, (_, ci) => {
          const row = ri + 1;
          const col = ci + 1;
          const seat = seats.find((s) => s.row === row && s.col === col);

          if (!seat) {
            return <div key={`gap-${row}-${col}`} className="min-h-20" />;
          }

          const isDragTarget = editMode && dragOverSeatId === seat.seat_id;
          const isBeingDragged =
            editMode &&
            draggedStudentId &&
            seat.student_id === draggedStudentId;

          // ── 빈 자리 ──
          if (!seat.student_id) {
            return (
              <div
                key={seat.seat_id}
                onDragOver={
                  editMode ? (e) => onDragOver(e, seat.seat_id) : undefined
                }
                onDragLeave={editMode ? onDragLeave : undefined}
                onDrop={editMode ? (e) => onDrop(e, seat.seat_id) : undefined}
                className={`border-2 border-dashed rounded-xl min-h-20 flex flex-col items-center justify-center gap-1 transition-all duration-150
                  ${
                    editMode
                      ? isDragTarget
                        ? 'border-[#b9a487] bg-[#f6efe4] scale-105'
                        : 'border-gray-300 bg-gray-50 hover:border-[#c8b49c] hover:bg-[#f7f2ea]'
                      : 'border-gray-300 bg-gray-50 opacity-50'
                  }`}
              >
                {editMode && isDragTarget ? (
                  <span className="text-caption text-[#7a6750] font-medium">
                    여기에 배정
                  </span>
                ) : (
                  <>
                    <span className="text-caption text-gray-400 font-medium">
                      {seat.seat_id}
                    </span>
                    <span className="text-caption text-gray-300">빈 자리</span>
                  </>
                )}
              </div>
            );
          }

          // ── 학생 배정된 자리 ──
          const attRecord = (attendanceData ?? []).find(
            (r) => r.student_id === seat.student_id,
          );
          const cfg = getCfg(attRecord?.status);
          const Icon = cfg.icon;

          if (editMode) {
            return (
              <div
                key={seat.seat_id}
                draggable
                onDragStart={(e) =>
                  onDragStart(
                    e,
                    seat.student_id,
                    seat.seat_id,
                    seat.student_name,
                  )
                }
                onDragEnd={onDragEnd}
                onDragOver={(e) => onDragOver(e, seat.seat_id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, seat.seat_id)}
                className={`border-2 rounded-xl p-3 min-h-20 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none transition-all duration-150
                  ${
                    isBeingDragged
                      ? 'opacity-40 scale-95 border-dashed border-gray-400'
                      : isDragTarget
                        ? 'border-[#b9a487] bg-[#f6efe4] scale-105 shadow-lg'
                        : 'border-gray-300 bg-white hover:border-[#c8b49c] hover:shadow-md'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-caption text-gray-400">
                    {seat.seat_id}
                  </span>
                  <GripVertical size={13} className="text-gray-300" />
                </div>
                <p className="text-body-sm font-semibold text-gray-800 truncate">
                  {seat.student_name}
                </p>
              </div>
            );
          }

          // 일반 출석 뷰
          return (
            <button
              key={seat.seat_id}
              onClick={() =>
                onStudentClick?.(
                  seat.student_id,
                  seat.student_name,
                  seat.seat_id,
                )
              }
              className={`border-2 rounded-xl p-3 text-left transition-colors cursor-pointer min-h-20 flex flex-col justify-between ${cfg.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-caption text-gray-500 font-medium">
                  {seat.seat_id}
                </span>
                <Icon size={14} className={cfg.iconClass} />
              </div>
              <p className="text-body-sm font-semibold text-gray-800 truncate">
                {seat.student_name}
              </p>
              <p className={`text-caption ${cfg.iconClass}`}>{cfg.label}</p>
            </button>
          );
        }),
      )}
    </div>
  );
}

export default function AttendanceCheck() {
  const { showToast } = useToast();
  const { selectedCourseId, selectedCourse } = useCourse();
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [seats, setSeats] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [seatsLoading, setSeatsLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // 드래그앤드롭 편집 모드
  const [editMode, setEditMode] = useState(false);
  const [localSeats, setLocalSeats] = useState([]); // 편집 중 임시 상태
  const [draggedStudentId, setDraggedStudentId] = useState(null);
  const [draggedFromSeatId, setDraggedFromSeatId] = useState(null);
  const [dragOverSeatId, setDragOverSeatId] = useState(null);
  const [seatSaving, setSeatSaving] = useState(false);
  const [draggedStudentName, setDraggedStudentName] = useState(null);
  const pendingChangesRef = useRef({}); // { seatId: studentId | null }

  const loadSeats = useCallback(() => {
    if (!selectedCourseId) return;
    setSeatsLoading(true);
    teacherApi
      .getClassroomSeats(selectedCourseId)
      .then((data) => {
        setSeats(data);
        setLocalSeats(data);
      })
      .catch(() =>
        showToast({
          message: '좌석 정보를 불러오지 못했습니다.',
          type: 'error',
        }),
      )
      .finally(() => setSeatsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  useEffect(() => {
    // 과정이 바뀌면 좌석 재로드. 좌석이 없으면 10개 자동 초기화 후 로드.
    if (!selectedCourseId) {
      setSeats([]);
      setLocalSeats([]);
      setSeatsLoading(false);
      return;
    }
    setSeatsLoading(true);
    teacherApi
      .getClassroomSeats(selectedCourseId)
      .then((data) => {
        if (data.length === 0) {
          return teacherApi
            .initClassroomSeats(selectedCourseId)
            .then(() => teacherApi.getClassroomSeats(selectedCourseId));
        }
        return data;
      })
      .then((data) => {
        setSeats(data);
        setLocalSeats(data);
      })
      .catch(() =>
        showToast({
          message: '좌석 정보를 불러오지 못했습니다.',
          type: 'error',
        }),
      )
      .finally(() => setSeatsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  // 과정 변경 시 출결 캐시 초기화 → 이전 과정 데이터가 남지 않게
  useEffect(() => {
    setAttendanceData({});
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedDate > TODAY) return; // 미래 날짜는 API 호출 불필요
    if (!selectedCourseId) return;
    if (attendanceData[selectedDate] !== undefined) return;
    setAttendanceLoading(true);
    teacherApi
      .getAttendanceByDate(selectedDate, selectedCourseId)
      .then((records) =>
        setAttendanceData((prev) => ({ ...prev, [selectedDate]: records })),
      )
      .catch(() => {
        showToast({
          message: '출석 정보를 불러오지 못했습니다.',
          type: 'error',
        });
        setAttendanceData((prev) => ({ ...prev, [selectedDate]: [] }));
      })
      .finally(() => setAttendanceLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedCourseId, attendanceData]);

  // 편집 모드 진입 — localSeats를 현재 seats로 초기화
  function enterEditMode() {
    setLocalSeats([...seats]);
    pendingChangesRef.current = {};
    setEditMode(true);
  }

  // 편집 취소
  function cancelEditMode() {
    setLocalSeats([...seats]);
    pendingChangesRef.current = {};
    setEditMode(false);
    setDraggedStudentName(null);
  }

  // 편집 저장 — pendingChanges를 순차 API 호출
  async function saveEditMode() {
    const changes = Object.entries(pendingChangesRef.current);
    if (changes.length === 0) {
      setEditMode(false);
      return;
    }
    setSeatSaving(true);
    try {
      for (const [seatId, studentId] of changes) {
        await teacherApi.assignSeat(seatId, studentId, selectedCourseId);
      }
      // 저장 후 최신 데이터 다시 로드
      const fresh = await teacherApi.getClassroomSeats(selectedCourseId);
      setSeats(fresh);
      setLocalSeats(fresh);
      pendingChangesRef.current = {};
      setEditMode(false);
      showToast({ message: '좌석 배치가 저장되었습니다.', type: 'success' });
    } catch {
      showToast({ message: '저장에 실패했습니다.', type: 'error' });
    } finally {
      setSeatSaving(false);
    }
  }

  // ── 드래그앤드롭 핸들러 ──────────────────────────
  function handleDragStart(e, studentId, fromSeatId, studentName) {
    setDraggedStudentId(studentId);
    setDraggedFromSeatId(fromSeatId);
    setDraggedStudentName(studentName ?? null);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, targetSeatId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSeatId(targetSeatId);
  }

  function handleDragLeave() {
    setDragOverSeatId(null);
  }

  function handleDrop(e, targetSeatId) {
    e.preventDefault();
    setDragOverSeatId(null);
    if (!draggedStudentId || targetSeatId === draggedFromSeatId) {
      setDraggedStudentId(null);
      setDraggedFromSeatId(null);
      setDraggedStudentName(null);
      return;
    }

    const nameToAssign = draggedStudentName;
    setLocalSeats((prev) => {
      return prev.map((s) => {
        if (draggedFromSeatId && s.seat_id === draggedFromSeatId) {
          // 좌석에서 드래그한 경우에만 원래 자리 비움
          pendingChangesRef.current[s.seat_id] = null;
          return { ...s, student_id: null, student_name: null };
        }
        if (s.seat_id === targetSeatId) {
          pendingChangesRef.current[s.seat_id] = draggedStudentId;
          return {
            ...s,
            student_id: draggedStudentId,
            student_name: nameToAssign ?? null,
          };
        }
        return s;
      });
    });

    setDraggedStudentId(null);
    setDraggedFromSeatId(null);
    setDraggedStudentName(null);
  }

  function handleDragEnd() {
    setDraggedStudentId(null);
    setDraggedFromSeatId(null);
    setDraggedStudentName(null);
    setDragOverSeatId(null);
  }

  // 선택된 날짜의 출석 레코드 (없는 날짜는 좌석 기반 미확인으로 초기화)
  const todayRecords =
    attendanceData[selectedDate] ??
    seats
      .filter((s) => s.student_id)
      .map((s) => ({
        student_id: s.student_id,
        student_name: s.student_name,
        seat_id: s.seat_id,
        status: null,
        check_in_time: null,
      }));

  // 좌석 배치 계획 존재 여부 (student_id가 배정된 좌석이 있는지)
  const hasSeatingPlan = seats.some((s) => s.student_id);

  // 좌석에 배정되지 않은 학생 목록 (편집 모드 중에는 localSeats 기준)
  const assignedStudentIds = new Set(
    (editMode ? localSeats : seats)
      .filter((s) => s.student_id)
      .map((s) => s.student_id),
  );
  const unassignedStudents = todayRecords.filter(
    (r) => !assignedStudentIds.has(r.student_id),
  );

  // 좌석 그리드 크기 동적 계산
  const maxRow = seats.reduce((m, s) => Math.max(m, s.row ?? 0), 0);
  const maxCol = seats.reduce((m, s) => Math.max(m, s.col ?? 0), 0);

  // 통계
  const total = todayRecords.length;
  const stats = {
    present: todayRecords.filter((r) => r.status === 'present').length,
    late: todayRecords.filter((r) => r.status === 'late').length,
    absent: todayRecords.filter((r) => r.status === 'absent').length,
    early_leave: todayRecords.filter((r) => r.status === 'early_leave').length,
    unknown: todayRecords.filter((r) => r.status === null).length,
  };
  const confirmed = total - stats.unknown;

  function getRecordForStudent(studentId) {
    return todayRecords.find((r) => r.student_id === studentId) ?? null;
  }

  function handleStudentClick(studentId, studentName, seatId) {
    if (isFuture) return; // 미래 날짜는 수정 불가
    const record = getRecordForStudent(studentId);
    setSelectedRecord({
      seat_id: seatId,
      student_id: studentId,
      student_name: studentName,
      status: record?.status ?? null,
      check_in_time: record?.check_in_time ?? null,
    });
    setPendingStatus(record?.status ?? null);
  }

  function handleSave() {
    setSaving(true);
    teacherApi
      .updateAttendanceStatus(
        selectedDate,
        selectedRecord.student_id,
        pendingStatus,
      )
      .then(() => {
        setAttendanceData((prev) => {
          const existing = prev[selectedDate] ?? todayRecords;
          const updated = existing.map((r) =>
            r.student_id === selectedRecord.student_id
              ? { ...r, status: pendingStatus }
              : r,
          );
          return { ...prev, [selectedDate]: updated };
        });
        showToast({
          message: `${selectedRecord.student_name} 출석 상태가 수정되었습니다.`,
          type: 'success',
        });
        setSelectedRecord(null);
        setPendingStatus(null);
      })
      .catch(() =>
        showToast({ message: '저장에 실패했습니다.', type: 'error' }),
      )
      .finally(() => setSaving(false));
  }

  // 목록 탭 필터
  const tabList = [
    { key: 'all', label: '전체', count: total },
    { key: 'present', label: '출석', count: stats.present },
    { key: 'late', label: '지각', count: stats.late },
    { key: 'absent', label: '결석', count: stats.absent },
    { key: 'early_leave', label: '조퇴', count: stats.early_leave },
    { key: 'unknown', label: '미확인', count: stats.unknown },
  ];

  const filteredRecords = todayRecords.filter((r) => {
    if (activeTab === 'present') return r.status === 'present';
    if (activeTab === 'late') return r.status === 'late';
    if (activeTab === 'absent') return r.status === 'absent';
    if (activeTab === 'early_leave') return r.status === 'early_leave';
    if (activeTab === 'unknown') return r.status === null;
    return true;
  });

  const tableColumns = [
    {
      key: 'student_name',
      label: '학생명',
      render: (val) => (
        <span className="text-body-sm font-medium text-gray-800">{val}</span>
      ),
    },
    {
      key: 'seat_id',
      label: '좌석',
      render: (val) => (
        <span className="text-body-sm text-gray-500">{val ?? '미배정'}</span>
      ),
    },
    {
      key: 'check_in_time',
      label: '체크인',
      render: (val) => (
        <span className="text-body-sm text-gray-500">{val ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (val) => {
        const cfg = getCfg(val);
        return <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>;
      },
    },
  ];

  const isFuture = selectedDate > TODAY;
  const isLoading = seatsLoading || attendanceLoading;

  return (
    <div className="rounded-3xl bg-[#eeefed] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[2.05rem] font-semibold text-[#2a2d33]">
            출결 확인
          </h1>
          <p className="mt-1 text-[0.95rem] text-[#6f747b]">
            오늘의 출결과 강의실 상태를 확인하고 관리합니다.
          </p>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-[0_1px_4px_rgba(45,42,38,0.08)]">
            <Users size={16} className="text-[#6b7280]" />
            <span className="text-body-sm font-semibold text-[#374151]">
              전체 {total}명
            </span>
          </div>
        )}
      </div>

      {/* 날짜 네비게이션 */}
      <div className="mb-5 flex items-center gap-1">
        <button
          onClick={() => setSelectedDate((d) => moveDateByWorkday(d, -1))}
          className="rounded-lg p-2 text-[#6b6f76] transition-colors hover:bg-[#e3e5e2]"
        >
          <ChevronLeft size={20} />
        </button>
        <DatePickerPopover
          selectedDate={selectedDate}
          onChange={setSelectedDate}
        />
        <button
          onClick={() => setSelectedDate((d) => moveDateByWorkday(d, 1))}
          disabled={selectedDate >= TODAY}
          className="rounded-lg p-2 text-[#6b6f76] transition-colors hover:bg-[#e3e5e2] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
        {selectedDate === TODAY ? (
          <span className="ml-1 rounded-full bg-[#e4e6e3] px-2 py-0.5 text-caption font-medium text-[#5e636a]">
            오늘
          </span>
        ) : (
          <button
            onClick={() => setSelectedDate(TODAY)}
            className="ml-1 rounded-full bg-[#e4e6e3] px-3 py-1 text-caption font-medium text-[#5e636a] transition-colors hover:bg-[#d9dcd8]"
          >
            오늘로 이동
          </button>
        )}
      </div>

      {/* 통계 카드 (전체 포함 6개) */}
      {isLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-3 gap-3 md:grid-cols-6">
          <Card padding="p-4" className="rounded-2xl border border-[#e5e6e4] bg-[#f8f9f8] shadow-none">
            <p className="mb-1 text-caption text-[#9aa0a8]">전체</p>
            <p className="text-h2 font-bold text-[#3f4752]">{total}명</p>
            <div className="mt-2 h-1 rounded-full bg-[#c4c9d0]" />
          </Card>
          <Card padding="p-4" className="rounded-2xl border border-[#e5e6e4] bg-[#f8f9f8] shadow-none">
            <p className="mb-1 text-caption text-[#9aa0a8]">출석</p>
            <p className="text-h2 font-bold text-[#2f7b50]">
              {stats.present}명
            </p>
            <div className="mt-2 h-1 rounded-full bg-[#66768f]" />
          </Card>
          <Card padding="p-4" className="rounded-2xl border border-[#e5e6e4] bg-[#f8f9f8] shadow-none">
            <p className="mb-1 text-caption text-[#9aa0a8]">지각</p>
            <p className="text-h2 font-bold text-[#9a7a2b]">{stats.late}명</p>
            <div className="mt-2 h-1 rounded-full bg-[#eab308]" />
          </Card>
          <Card padding="p-4" className="rounded-2xl border border-[#e5e6e4] bg-[#f8f9f8] shadow-none">
            <p className="mb-1 text-caption text-[#9aa0a8]">결석</p>
            <p className="text-h2 font-bold text-[#b44a56]">{stats.absent}명</p>
            <div className="mt-2 h-1 rounded-full bg-[#db727c]" />
          </Card>
          <Card padding="p-4" className="rounded-2xl border border-[#e5e6e4] bg-[#f8f9f8] shadow-none">
            <p className="mb-1 text-caption text-[#9aa0a8]">조퇴</p>
            <p className="text-h2 font-bold text-[#a1762e]">
              {stats.early_leave}명
            </p>
            <div className="mt-2 h-1 rounded-full bg-[#e7cfd0]" />
          </Card>
          <Card padding="p-4" className="rounded-2xl border border-[#e5e6e4] bg-[#f8f9f8] shadow-none">
            <p className="mb-1 text-caption text-[#9aa0a8]">미확인</p>
            <p className="text-h2 font-bold text-[#56606b]">{stats.unknown}명</p>
            <div className="mt-2 h-1 rounded-full bg-[#c4c9d0]" />
          </Card>
        </div>
      )}

      {/* 메인 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── 강의실 배치도 ── */}
        <Card className="flex flex-col">
          {/* 카드 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-body-sm font-semibold text-gray-700">
              강의실 배치도
            </p>
            <div className="flex items-center gap-2">
              {!editMode && !isLoading && total > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7a6750] rounded-full transition-all duration-300"
                      style={{
                        width: `${total > 0 ? (confirmed / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-caption text-gray-500 font-medium">
                    {confirmed}/{total}명
                  </span>
                </div>
              )}
              {/* 편집 모드 토글 버튼 */}
              {!seatsLoading &&
                (editMode ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={cancelEditMode}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-caption font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <X size={13} />
                      취소
                    </button>
                    <button
                      onClick={saveEditMode}
                      disabled={seatSaving}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-caption font-medium text-white bg-[#7a6750] hover:bg-[#665440] transition-colors disabled:opacity-60"
                    >
                      <Check size={13} />
                      {seatSaving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={enterEditMode}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-caption font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <Edit3 size={13} />
                    자리 배치 편집
                  </button>
                ))}
            </div>
          </div>

          {/* 편집 모드 안내 */}
          {editMode && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#f3ede3] border border-[#d9cbb5] rounded-lg">
              <GripVertical size={14} className="text-[#7a6750] shrink-0" />
              <p className="text-caption text-[#6a5845]">
                학생 카드를 드래그해서 다른 자리로 이동하세요. 빈 자리에
                드롭하면 배정됩니다.
              </p>
            </div>
          )}

          {/* 미배정 학생 풀 (편집 모드) */}
          {editMode && unassignedStudents.length > 0 && (
            <div className="mb-3 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
              <p className="text-caption text-gray-500 font-medium mb-2">
                미배정 학생 — 자리로 드래그해서 배정하세요
              </p>
              <div className="flex flex-wrap gap-2">
                {unassignedStudents.map((r) => (
                  <div
                    key={r.student_id}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, r.student_id, null, r.student_name)
                    }
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-1.5 px-3 py-2 bg-white border-2 rounded-xl cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                      draggedStudentId === r.student_id
                        ? 'opacity-40 scale-95 border-dashed border-gray-400'
                        : 'border-gray-300 hover:border-[#c8b49c] hover:shadow-sm'
                    }`}
                  >
                    <GripVertical size={13} className="text-gray-300" />
                    <span className="text-body-sm font-semibold text-gray-800">
                      {r.student_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 좌석 그리드 */}
          {seatsLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <SeatGrid
              seats={editMode ? localSeats : seats}
              editMode={editMode}
              attendanceData={attendanceData[selectedDate]}
              draggedStudentId={draggedStudentId}
              dragOverSeatId={dragOverSeatId}
              onStudentClick={editMode ? null : handleStudentClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          )}

          {/* 미배정 학생 (일반 뷰) */}
          {!editMode && !seatsLoading && unassignedStudents.length > 0 && (
            <div className="mb-3 pt-3 border-t border-dashed border-gray-200">
              <p className="text-caption text-gray-400 font-medium mb-2">
                좌석 미배정
              </p>
              <div className="flex flex-wrap gap-2">
                {unassignedStudents.map((r) => {
                  const cfg = getCfg(r.status);
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={r.student_id}
                      onClick={() =>
                        handleStudentClick(r.student_id, r.student_name, null)
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 border-2 rounded-xl transition-colors ${cfg.bg}`}
                    >
                      <Icon size={13} className={cfg.iconClass} />
                      <span className="text-body-sm font-semibold text-gray-800">
                        {r.student_name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 강사석 */}
          <div className="bg-[#efe5d6] text-[#6a5845] text-caption font-medium text-center py-2 rounded-lg tracking-widest mt-auto">
            강 사 석
          </div>

          {/* 범례 (출석 모드에서만 표시) */}
          {!editMode && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <Icon size={13} className={cfg.iconClass} />
                    <span className="text-caption text-gray-500">
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5">
                <Minus size={13} className="text-gray-400" />
                <span className="text-caption text-gray-500">미확인</span>
              </div>
            </div>
          )}
        </Card>

        {/* ── 출석 목록 ── */}
        <Card>
          <p className="text-body-sm font-semibold text-gray-700 mb-4">
            출석 목록
          </p>
          <Tabs
            tabs={tabList}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="mb-4"
          />
          {attendanceLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <Table
              columns={tableColumns}
              data={filteredRecords}
              onRowClick={(record) =>
                handleStudentClick(
                  record.student_id,
                  record.student_name,
                  record.seat_id,
                )
              }
              emptyMessage="해당하는 학생이 없습니다."
            />
          )}
        </Card>
      </div>

      {/* 출석 상세 / 수정 Drawer */}
      <Drawer
        isOpen={selectedRecord !== null}
        onClose={() => {
          setSelectedRecord(null);
          setPendingStatus(null);
        }}
        title="출석 상세"
        width="w-[400px]"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* 학생 정보 */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-[#efe5d6] flex items-center justify-center shrink-0">
                <UserCheck size={22} className="text-[#7a6750]" />
              </div>
              <div>
                <p className="text-body font-bold text-gray-900">
                  {selectedRecord.student_name}
                </p>
                <p className="text-body-sm text-gray-500">
                  {selectedRecord.seat_id
                    ? `좌석 ${selectedRecord.seat_id}`
                    : '좌석 미배정'}
                </p>
              </div>
            </div>

            {/* 체크인 시간 */}
            <div>
              <p className="text-caption font-medium text-gray-400 uppercase tracking-wider mb-2">
                체크인 시간
              </p>
              <p className="text-body font-semibold text-gray-800">
                {selectedRecord.check_in_time ?? '미서명'}
              </p>
            </div>

            {/* 상태 선택 */}
            <div>
              <p className="text-caption font-medium text-gray-400 uppercase tracking-wider mb-3">
                출석 상태 수정
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['present', 'late', 'absent', 'early_leave'].map((s) => {
                  const cfg = getCfg(s);
                  const isSelected = pendingStatus === s;
                  const selectedStyle =
                    s === 'present'
                      ? 'bg-success-500 border-success-500 text-white'
                      : s === 'late'
                        ? 'bg-warning-500 border-warning-500 text-white'
                        : s === 'absent'
                          ? 'bg-error-500 border-error-500 text-white'
                          : 'bg-amber-500 border-amber-500 text-white';
                  return (
                    <button
                      key={s}
                      onClick={() => setPendingStatus(s)}
                      className={`py-2.5 rounded-xl text-body-sm font-semibold border-2 transition-colors ${
                        isSelected
                          ? selectedStyle
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              loading={saving}
              disabled={pendingStatus === selectedRecord.status}
            >
              저장
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

