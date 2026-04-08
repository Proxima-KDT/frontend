import { useState, useMemo } from 'react';
import {
  mockCounselors,
  mockCounselingSlots,
  mockMyCounselingBookings,
} from '@/data/mockData';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import EmptyState from '@/components/common/EmptyState';
import {
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarCheck,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const TODAY = '2026-04-08';
const TODAY_DATE = new Date('2026-04-08');

const MONTH_NAMES = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];
const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
];

const statusConfig = {
  confirmed: { label: '예약 확정', variant: 'success' },
  pending: { label: '검토 중', variant: 'warning' },
  completed: { label: '완료', variant: 'default' },
  cancelled: { label: '취소됨', variant: 'error' },
};

function formatDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Mon-based: Sun(0)→6, Mon(1)→0, …
  const startDow = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

export default function CounselingBooking() {
  const [selectedCounselorId, setSelectedCounselorId] = useState(
    mockCounselors[0].id,
  );
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(3); // 0-indexed → April
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingReason, setBookingReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [bookings, setBookings] = useState(mockMyCounselingBookings);

  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // Dates that have available slots for the current counselor
  const availableDates = useMemo(() => {
    return Object.keys(mockCounselingSlots[selectedCounselorId] ?? {});
  }, [selectedCounselorId]);

  // Times available for the selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    return mockCounselingSlots[selectedCounselorId]?.[selectedDate] ?? [];
  }, [selectedCounselorId, selectedDate]);

  // "date_time" keys already booked by this student (active bookings only)
  const myBookedKeys = useMemo(() => {
    return new Set(
      bookings
        .filter(
          (b) =>
            b.counselor_id === selectedCounselorId && b.status !== 'cancelled',
        )
        .map((b) => `${b.date}_${b.time}`),
    );
  }, [bookings, selectedCounselorId]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function handleCounselorChange(id) {
    setSelectedCounselorId(id);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function handleDateClick(day) {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    if (!availableDates.includes(dateStr)) return;
    if (new Date(dateStr) < TODAY_DATE) return;
    setSelectedDate(dateStr);
    setSelectedTime(null);
  }

  function getSlotStatus(time) {
    if (myBookedKeys.has(`${selectedDate}_${time}`)) return 'mine';
    if (!availableTimes.includes(time)) return 'unavailable';
    return 'available';
  }

  function handleTimeClick(time) {
    if (getSlotStatus(time) !== 'available') return;
    setSelectedTime(time);
    setShowModal(true);
  }

  function handleBookingConfirm() {
    if (!selectedDate || !selectedTime || !bookingReason.trim()) return;
    const counselor = mockCounselors.find((c) => c.id === selectedCounselorId);
    setBookings((prev) => [
      ...prev,
      {
        id: Date.now(),
        counselor_id: selectedCounselorId,
        counselor_name: counselor.name,
        counselor_role: counselor.role,
        counselor_role_label: counselor.roleLabel,
        date: selectedDate,
        time: selectedTime,
        duration: 30,
        reason: bookingReason.trim(),
        status: 'confirmed',
      },
    ]);
    setShowModal(false);
    setSelectedTime(null);
    setBookingReason('');
  }

  function handleCloseModal() {
    setShowModal(false);
    setBookingReason('');
  }

  function handleCancelBooking(bookingId) {
    setCancelTargetId(bookingId);
  }

  function handleCancelConfirm() {
    setBookings((prev) => prev.filter((b) => b.id !== cancelTargetId));
    setCancelTargetId(null);
  }

  const selectedCounselor = mockCounselors.find(
    (c) => c.id === selectedCounselorId,
  );

  const activeBookings = bookings
    .filter((b) => b.status !== 'cancelled' && b.date >= TODAY)
    .sort((a, b) => (`${a.date}_${a.time}` < `${b.date}_${b.time}` ? -1 : 1));

  const pastBookings = bookings
    .filter((b) => b.status !== 'cancelled' && b.date < TODAY)
    .sort((a, b) => (`${a.date}_${a.time}` > `${b.date}_${b.time}` ? -1 : 1));

  return (
    <div className="space-y-6">
      {/* ── 헤더 ── */}
      <div>
        <h1 className="text-h2 font-bold text-gray-900">면담 신청</h1>
        <p className="text-body-sm text-gray-500 mt-1">
          담당 강사님 또는 멘토님과 1:1 면담을 예약하세요.
        </p>
      </div>

      {/* ── 상담사 선택 ── */}
      <div className="grid grid-cols-2 gap-3">
        {mockCounselors.map((counselor) => {
          const isSelected = selectedCounselorId === counselor.id;
          return (
            <button
              key={counselor.id}
              onClick={() => handleCounselorChange(counselor.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-student-500 bg-student-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-student-200' : 'bg-gray-100'
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${isSelected ? 'text-student-700' : 'text-gray-500'}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${isSelected ? 'text-student-800' : 'text-gray-800'}`}
                  >
                    {counselor.name}
                  </p>
                  <p
                    className={`text-xs ${isSelected ? 'text-student-600' : 'text-gray-400'}`}
                  >
                    {counselor.roleLabel}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 캘린더 + 시간 슬롯 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        {/* 캘린더 */}
        <Card>
          {/* 월 탐색 */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-body font-bold text-gray-900">
              {currentYear}년 {MONTH_NAMES[currentMonth]}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-2 ${
                  i === 5
                    ? 'text-blue-400'
                    : i === 6
                      ? 'text-red-400'
                      : 'text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;

              const dateStr = formatDateStr(currentYear, currentMonth, day);
              const isPast = new Date(dateStr) < TODAY_DATE;
              const isAvailable = availableDates.includes(dateStr) && !isPast;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === TODAY;
              const col = idx % 7;
              const isSat = col === 5;
              const isSun = col === 6;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={!isAvailable}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center
                    rounded-xl text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'bg-student-500 text-white shadow-md'
                        : isAvailable
                          ? 'bg-student-50 text-student-700 hover:bg-student-100 cursor-pointer'
                          : isPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : isSat
                              ? 'text-blue-300 cursor-not-allowed'
                              : isSun
                                ? 'text-red-300 cursor-not-allowed'
                                : 'text-gray-400 cursor-not-allowed'
                    }
                    ${isToday && !isSelected ? 'ring-2 ring-student-400' : ''}
                  `}
                >
                  <span>{day}</span>
                  {isAvailable && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-student-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-md bg-student-50 border border-student-200" />
              상담 가능
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-md bg-student-500" />
              선택된 날짜
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-md bg-white ring-2 ring-student-400" />
              오늘
            </div>
          </div>
        </Card>

        {/* 시간 슬롯 패널 */}
        <Card>
          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-student-500" />
                <span className="text-body-sm font-semibold text-gray-900">
                  {selectedDate.replace(/-/g, '.')} 예약 가능 시간
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((time) => {
                  const status = getSlotStatus(time);
                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeClick(time)}
                      disabled={status !== 'available'}
                      className={`
                        py-2.5 px-3 rounded-xl text-sm font-medium transition-all border
                        ${
                          status === 'available'
                            ? 'border-student-200 bg-student-50 text-student-700 hover:bg-student-100 hover:border-student-300'
                            : status === 'mine'
                              ? 'border-success-200 bg-success-50 text-success-700 cursor-default'
                              : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        }
                      `}
                    >
                      {time}
                      {status === 'mine' && (
                        <span className="block text-xs font-normal">
                          예약됨
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-body-sm font-medium text-gray-500">
                날짜를 선택하세요
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                캘린더에서 상담 가능한 날짜를
                <br />
                클릭하면 시간대가 표시됩니다.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── 내 면담 예약 내역 ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="w-5 h-5 text-student-500" />
          <h2 className="text-body font-semibold text-gray-900">
            내 면담 예약
          </h2>
        </div>

        {activeBookings.length === 0 && pastBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="면담 예약 내역이 없습니다"
            description="위의 캘린더에서 날짜를 선택해 면담을 예약해보세요."
          />
        ) : (
          <div className="space-y-3">
            {activeBookings.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  예정된 면담
                </p>
                {activeBookings.map((booking) => {
                  const cfg =
                    statusConfig[booking.status] ?? statusConfig.confirmed;
                  return (
                    <div
                      key={booking.id}
                      className="flex items-start justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {booking.counselor_name}
                          </span>
                          <Badge variant="default" size="sm">
                            {booking.counselor_role_label}
                          </Badge>
                          <Badge variant={cfg.variant} size="sm">
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {booking.date.replace(/-/g, '.')} · {booking.time} (
                          {booking.duration}분)
                        </p>
                        <p className="text-xs text-gray-600 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="truncate">{booking.reason}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-error-500 hover:text-error-600 hover:bg-error-50 shrink-0"
                      >
                        취소
                      </Button>
                    </div>
                  );
                })}
              </>
            )}

            {pastBookings.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                  지난 면담
                </p>
                {pastBookings.map((booking) => {
                  const cfg =
                    booking.status === 'cancelled'
                      ? statusConfig.cancelled
                      : statusConfig.completed;
                  return (
                    <div
                      key={booking.id}
                      className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 opacity-60"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {booking.counselor_name}
                          </span>
                          <Badge variant="default" size="sm">
                            {booking.counselor_role_label}
                          </Badge>
                          <Badge variant={cfg.variant} size="sm">
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {booking.date.replace(/-/g, '.')} · {booking.time} (
                          {booking.duration}분)
                        </p>
                        <p className="text-xs text-gray-600 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="truncate">{booking.reason}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </Card>

      {/* ── 취소 확인 모달 ── */}
      <Modal
        isOpen={cancelTargetId !== null}
        onClose={() => setCancelTargetId(null)}
        title="면담 예약 취소"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-gray-600">
            예약을 취소하면 되돌릴 수 없습니다.
            <br />
            정말 취소하시겠습니까?
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setCancelTargetId(null)}
            >
              돌아가기
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              onClick={handleCancelConfirm}
            >
              예약 취소
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 예약 확인 모달 ── */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="면담 예약 확인"
      >
        <div className="space-y-4">
          {/* 예약 요약 */}
          <div className="p-4 bg-student-50 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">상담 대상</span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedCounselor?.name}{' '}
                <span className="font-normal text-gray-500">
                  ({selectedCounselor?.roleLabel})
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">일시</span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedDate?.replace(/-/g, '.')} {selectedTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">소요 시간</span>
              <span className="text-sm font-semibold text-gray-900">30분</span>
            </div>
          </div>

          {/* 면담 사유 */}
          <Textarea
            label="면담 사유"
            placeholder="면담 목적이나 상담하고 싶은 내용을 간략히 작성해주세요."
            value={bookingReason}
            onChange={(e) => setBookingReason(e.target.value)}
            rows={3}
            maxLength={200}
          />

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={handleCloseModal}
            >
              닫기
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleBookingConfirm}
              disabled={!bookingReason.trim()}
            >
              예약 확정
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
