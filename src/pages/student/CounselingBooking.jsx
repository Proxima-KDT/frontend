import { useState, useMemo, useEffect } from 'react';
import { counselingApi } from '@/api/counseling';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import EmptyState from '@/components/common/EmptyState';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarCheck,
  Calendar,
  MessageSquare,
  GraduationCap,
  Shield,
} from 'lucide-react';

const pageBg = '#F7F5F0';
const _now = new Date();
const TODAY = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
const TODAY_DATE = new Date(TODAY);

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

const roleMeta = {
  teacher: {
    icon: GraduationCap,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    selectedBg: 'bg-blue-100',
    selectedIconColor: 'text-blue-700',
    border: 'border-blue-400',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    nameColor: 'text-blue-900',
    subColor: 'text-blue-600',
  },
  admin: {
    icon: Shield,
    bg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    selectedBg: 'bg-purple-100',
    selectedIconColor: 'text-purple-700',
    border: 'border-purple-400',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    nameColor: 'text-purple-900',
    subColor: 'text-purple-600',
  },
};

const defaultRoleMeta = roleMeta.teacher;

const statusConfig = {
  confirmed: { label: '예약 확정', variant: 'success' },
  pending: { label: '검토 중', variant: 'warning' },
  completed: { label: '완료', variant: 'default' },
  cancelled: { label: '취소됨', variant: 'error' },
};

function formatMonthTitle(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

function toAmPm(timeHHMM) {
  const [h, m] = String(timeHHMM).split(':').map((v) => parseInt(v, 10));
  const hh = String(((h + 11) % 12) + 1).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${hh}:${mm} ${ap}`;
}

function chipClass(active) {
  return active
    ? 'bg-[#4e5a61] text-white shadow-[0_10px_24px_rgba(78,90,97,0.24)]'
    : 'bg-white text-[#6b6560] hover:bg-[#faf9f7]';
}

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
  const { showToast } = useToast();
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState(null);
  const [slots, setSlots] = useState({});
  const [loadedMonths, setLoadedMonths] = useState(new Set());
  const now = new Date();
  const THIS_YEAR = now.getFullYear();
  const THIS_MONTH = now.getMonth();
  // 다음달까지만 예약 가능
  const MAX_YEAR = THIS_MONTH === 11 ? THIS_YEAR + 1 : THIS_YEAR;
  const MAX_MONTH = THIS_MONTH === 11 ? 0 : THIS_MONTH + 1;
  const [currentYear, setCurrentYear] = useState(THIS_YEAR);
  const [currentMonth, setCurrentMonth] = useState(THIS_MONTH);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingReason, setBookingReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [myResTab, setMyResTab] = useState('upcoming');

  // 슬롯을 특정 월단위로 가져와 누적하는 함수
  const fetchMonthSlots = (counselorId, y, m) => {
    const key = `${y}-${m}`;
    counselingApi
      .getSlots(counselorId, y, m + 1) // JS month 0-based → API 1-based
      .then((data) => {
        setSlots((prev) => ({ ...prev, ...data }));
        setLoadedMonths((prev) => new Set([...prev, key]));
      })
      .catch(() => {});
  };

  useEffect(() => {
    counselingApi
      .getCounselors()
      .then((data) => {
        setCounselors(data);
        if (data.length > 0) setSelectedCounselorId(data[0].id);
      })
      .catch(() => {});
    counselingApi
      .getMyBookings()
      .then(setBookings)
      .catch(() => {});
  }, []);

  // 상담사 변경 시: 현재월 + 다음달 슬롯 모두 로드
  useEffect(() => {
    if (!selectedCounselorId) return;
    setSlots({});
    setLoadedMonths(new Set());
    fetchMonthSlots(selectedCounselorId, THIS_YEAR, THIS_MONTH);
    fetchMonthSlots(selectedCounselorId, MAX_YEAR, MAX_MONTH);
  }, [selectedCounselorId]);

  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // Dates that have available slots for the current counselor
  const availableDates = useMemo(() => Object.keys(slots), [slots]);

  // Times available for the selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    return slots[selectedDate] ?? [];
  }, [slots, selectedDate]);

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
    // 현재월보다 이전으로 못 감
    if (currentYear === THIS_YEAR && currentMonth === THIS_MONTH) return;
    let newYear = currentYear;
    let newMonth = currentMonth;
    if (currentMonth === 0) {
      newYear = currentYear - 1;
      newMonth = 11;
    } else {
      newMonth = currentMonth - 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function nextMonth() {
    // 다음달보다 이후로 못 감
    if (currentYear === MAX_YEAR && currentMonth === MAX_MONTH) return;
    let newYear = currentYear;
    let newMonth = currentMonth;
    if (currentMonth === 11) {
      newYear = currentYear + 1;
      newMonth = 0;
    } else {
      newMonth = currentMonth + 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setSelectedTime(null);
    // 해당 월이 캐시되지 않았으면 페치
    const key = `${newYear}-${newMonth}`;
    if (selectedCounselorId && !loadedMonths.has(key)) {
      fetchMonthSlots(selectedCounselorId, newYear, newMonth);
    }
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

  async function handleBookingConfirm() {
    if (!selectedDate || !selectedTime || !bookingReason.trim()) return;
    setBookingLoading(true);
    try {
      const newBooking = await counselingApi.book(
        selectedCounselorId,
        selectedDate,
        selectedTime,
        bookingReason.trim(),
      );
      setBookings((prev) => [...prev, newBooking]);
      showToast({ type: 'success', message: '상담 예약이 완료되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '예약에 실패했습니다.' });
    } finally {
      setBookingLoading(false);
      setShowModal(false);
      setSelectedTime(null);
      setBookingReason('');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setBookingReason('');
  }

  function handleCancelBooking(bookingId) {
    setCancelTargetId(bookingId);
  }

  async function handleCancelConfirm() {
    try {
      await counselingApi.cancel(cancelTargetId);
      setBookings((prev) => prev.filter((b) => b.id !== cancelTargetId));
      showToast({ type: 'success', message: '예약이 취소되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '예약 취소에 실패했습니다.' });
    }
    setCancelTargetId(null);
  }

  const selectedCounselor = counselors.find(
    (c) => c.id === selectedCounselorId,
  );

  const activeBookings = bookings
    .filter((b) => b.status !== 'cancelled' && b.date >= TODAY)
    .sort((a, b) => (`${a.date}_${a.time}` < `${b.date}_${b.time}` ? -1 : 1));

  const pastBookings = bookings
    .filter((b) => b.status !== 'cancelled' && b.date < TODAY)
    .sort((a, b) => (`${a.date}_${a.time}` > `${b.date}_${b.time}` ? -1 : 1));

  return (
    <div
      className="space-y-8 rounded-3xl px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8"
      style={{ backgroundColor: pageBg }}
    >
      <header>
        <h1
          className={`text-[2.1rem] font-semibold tracking-tight text-[#2c2b28]`}
        >
          면담 신청
        </h1>
        <p className="mt-1 text-[0.95rem] text-[#6b6560]">
          멘토 및 학업 매니저와의 1:1 세션을 통해 학습 방향을 설계하고 필요한 지원을 받으세요.
        </p>
      </header>

      {/* ── 멘토 선택 ── */}
      <section>
        <div className="mb-3">
          <h2
            className={`text-[1.4rem] font-semibold text-[#2c2b28]`}
          >
            멘토 선택
          </h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {counselors.map((c) => {
            const isSelected = selectedCounselorId === c.id;
            const meta = roleMeta[c.role] || defaultRoleMeta;
            const RoleIcon = meta.icon;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCounselorChange(c.id)}
                className={`min-w-[220px] rounded-2xl border bg-white p-4 text-left shadow-[0_2px_18px_rgba(60,52,40,0.04)] transition ${
                  isSelected
                    ? 'border-[#c9a962] ring-1 ring-[#c9a962]/30'
                    : 'border-[#eceae4] hover:border-[#ddd9cf]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#ece9e3]">
                    <RoleIcon className="h-5 w-5 text-[#6b6560]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#2c2b28]">
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-[#9c988e]">
                      {c.role_label}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#f0eeeb] px-2 py-0.5 text-[0.62rem] font-semibold text-[#6b6560]">
                        {c.role === 'teacher' ? '학업 상담' : '진로 상담'}
                      </span>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#c9a962]" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 캘린더 + 시간 선택 ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card className="!rounded-3xl !border-[#eceae4] !bg-white shadow-[0_2px_22px_rgba(60,52,40,0.04)]">
          <div className="mb-4 flex items-center justify-between px-1">
            <h3 className={`text-[1.25rem] font-semibold text-[#2c2b28]`}>
              {formatMonthTitle(currentYear, currentMonth)}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                disabled={currentYear === THIS_YEAR && currentMonth === THIS_MONTH}
                className="rounded-xl p-2 hover:bg-[#faf9f7] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-5 w-5 text-[#8a847a]" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                disabled={currentYear === MAX_YEAR && currentMonth === MAX_MONTH}
                className="rounded-xl p-2 hover:bg-[#faf9f7] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="다음 달"
              >
                <ChevronRight className="h-5 w-5 text-[#8a847a]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  i === 5
                    ? 'text-blue-400'
                    : i === 6
                      ? 'text-red-400'
                      : 'text-[#b0aaa1]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
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
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={!isAvailable}
                  className={`
                    relative aspect-square rounded-2xl text-sm font-semibold transition-all
                    flex items-center justify-center
                    ${
                      isSelected
                        ? 'bg-[#4e5a61] text-white shadow-[0_10px_24px_rgba(78,90,97,0.22)]'
                        : isAvailable
                          ? 'bg-[#f7f6f2] text-[#2c2b28] hover:bg-[#efede7] cursor-pointer'
                          : isPast
                            ? 'text-[#d3cec6] cursor-not-allowed'
                            : isSat
                              ? 'text-blue-300 cursor-not-allowed'
                              : isSun
                                ? 'text-red-300 cursor-not-allowed'
                                : 'text-[#c9c4bc] cursor-not-allowed'
                    }
                    ${isToday && !isSelected ? 'ring-2 ring-[#c9a962]' : ''}
                  `}
                >
                  <span>{day}</span>
                  {isAvailable && !isSelected ? (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#c9a962]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#f0ede8] pt-4">
            <div className="flex items-center gap-1.5 text-xs text-[#9c988e]">
              <div className="h-3 w-3 rounded-md border border-[#e6e2d9] bg-[#f7f6f2]" />
              예약 가능
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9c988e]">
              <div className="h-3 w-3 rounded-md bg-[#4e5a61]" />
              선택됨
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9c988e]">
              <div className="h-3 w-3 rounded-md bg-white ring-2 ring-[#c9a962]" />
              오늘
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="!rounded-3xl !border-[#eceae4] !bg-white shadow-[0_2px_22px_rgba(60,52,40,0.04)]">
            <h3 className={`mb-3 text-[1.25rem] font-semibold text-[#2c2b28]`}>
              시간 선택
            </h3>
            {selectedDate ? (
              <div className="space-y-2">
                {availableTimes.slice(0, 10).map((t) => {
                  const isSelected = selectedTime === t;
                  const status = getSlotStatus(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTimeClick(t)}
                      disabled={status !== 'available'}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        status !== 'available'
                          ? 'border-[#efede8] bg-[#f8f7f4] text-[#c9c4bc] cursor-not-allowed'
                          : isSelected
                            ? 'border-[#4e5a61] bg-[#f2f1ef] text-[#2c2b28]'
                            : 'border-[#eceae4] bg-white text-[#2c2b28] hover:bg-[#faf9f7]'
                      }`}
                    >
                      <span>{toAmPm(t)}</span>
                      {isSelected ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#4e5a61] bg-[#4e5a61] text-white">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <p className="pt-2 text-[0.72rem] text-[#a8a29e]">
                  선택: {selectedDate?.replace(/-/g, '.')}
                  {selectedTime ? ` ${toAmPm(selectedTime)}` : ''}
                  {selectedCounselor?.name ? ` · ${selectedCounselor.name}` : ''}
                </p>

                <div className="pt-2">
                  <Button
                    fullWidth
                    size="md"
                    className="!rounded-2xl !bg-[#4e5a61] hover:!bg-[#414b51] active:!bg-[#394248]"
                    onClick={() => {
                      if (!selectedTime) return;
                      setShowModal(true);
                    }}
                    disabled={!selectedTime}
                  >
                    예약 확정하기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#efede8] bg-[#fbfaf7] p-6 text-center">
                <Calendar className="mx-auto mb-3 h-9 w-9 text-[#c9c4bc]" />
                <p className="text-sm font-semibold text-[#6b6560]">
                  날짜를 먼저 선택해 주세요
                </p>
                <p className="mt-1 text-xs text-[#a8a29e]">
                  선택 가능한 날짜에만 시간 목록이 표시됩니다.
                </p>
              </div>
            )}
          </Card>

          <Card className="!rounded-3xl !border-[#f1d16a] !bg-[#f3c94a] shadow-[0_2px_22px_rgba(60,52,40,0.04)]">
            <p className="text-[0.75rem] font-bold tracking-[0.12em] text-[#5c4a1a]">
              Quick Guide
            </p>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-[#4a3b12]">
              준비물: 질문 리스트를 미리 작성해 오시면 면담이 더 효율적입니다.
            </p>
          </Card>
        </div>
      </section>

      {/* ── 내 면담 예약 내역 ── */}
      <Card className="!rounded-3xl !border-[#eceae4] !bg-white shadow-[0_2px_22px_rgba(60,52,40,0.04)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className={`text-[1.7rem] font-semibold text-[#2c2b28]`}>
            내 면담 예약
          </h2>
          <div className="flex gap-1 rounded-full border border-[#eceae4] bg-[#fbfaf7] p-1">
            <button
              onClick={() => setMyResTab('upcoming')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${chipClass(
                myResTab === 'upcoming',
              )}`}
            >
              예정
            </button>
            <button
              onClick={() => setMyResTab('past')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${chipClass(
                myResTab === 'past',
              )}`}
            >
              지난 면담
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr_0.5fr] gap-3 px-3 pb-2 text-[0.72rem] font-semibold tracking-[0.08em] text-[#a8a29e] sm:grid">
          <span>멘토</span>
          <span>일시</span>
          <span>유형</span>
          <span>상태</span>
          <span>액션</span>
        </div>

        <div className="space-y-2">
          {(myResTab === 'upcoming' ? activeBookings : pastBookings).length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={
                myResTab === 'upcoming'
                  ? '예정된 면담이 없습니다'
                  : '지난 면담 기록이 없습니다'
              }
              description="면담 예약 내역이 여기에 표시됩니다."
            />
          ) : (
            (myResTab === 'upcoming' ? activeBookings : pastBookings).map((b) => {
              const isUpcoming = myResTab === 'upcoming';
              const cfg = statusConfig[b.status] ?? statusConfig.confirmed;
              return (
                <div
                  key={b.id}
                  className={`grid grid-cols-1 gap-2 rounded-2xl border border-[#f0ede8] bg-[#fbfaf7] p-3 sm:grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr_0.5fr] sm:items-center sm:gap-3 ${
                    !isUpcoming ? 'opacity-75' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#2c2b28]">
                      {b.counselor_name}
                    </p>
                    <p className="text-[0.72rem] text-[#a8a29e]">
                      {b.counselor_role_label}
                    </p>
                  </div>
                  <p className="text-sm text-[#3d3a36]">
                    {b.date.replace(/-/g, '.')} {b.time}
                  </p>
                  <p className="text-sm text-[#3d3a36]">{b.reason || '진로 상담'}</p>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[0.62rem] font-bold tracking-wide ${
                        cfg.variant === 'success'
                          ? 'bg-[#e8eef8] text-[#2d4a7c]'
                          : cfg.variant === 'warning'
                            ? 'bg-[#faf4e0] text-[#7a6120]'
                            : cfg.variant === 'error'
                              ? 'bg-[#f5e8e8] text-[#8b2f2d]'
                              : 'bg-[#efeeeb] text-[#6b6860]'
                      }`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex justify-end sm:justify-start">
                    {isUpcoming ? (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(b.id)}
                        className="rounded-lg px-2 py-1 text-sm text-[#8a847a] hover:bg-[#f2f1ed] hover:text-[#5c5852]"
                        title="취소"
                      >
                        ⋯
                      </button>
                    ) : (
                      <span className="text-[#c1bcb3]">-</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
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
          <div className="space-y-2.5 rounded-2xl border border-[#e8edf3] bg-[#f5f9fd] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7d8ea6]">상담 대상</span>
              <span className="text-sm font-semibold text-[#1f2f46]">
                {selectedCounselor?.name}{' '}
                <span className="font-normal text-[#6f7f96]">
                  ({selectedCounselor?.role_label})
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7d8ea6]">일시</span>
              <span className="text-sm font-semibold text-[#1f2f46]">
                {selectedDate?.replace(/-/g, '.')} {selectedTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7d8ea6]">소요 시간</span>
              <span className="text-sm font-semibold text-[#1f2f46]">30분</span>
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
              size="md"
              className="flex-1 !rounded-2xl !border !border-[#d7dfe8] !bg-white !text-[#4e5a61] hover:!bg-[#f7f9fb]"
              onClick={handleCloseModal}
            >
              닫기
            </Button>
            <Button
              size="md"
              className="flex-1 !rounded-2xl !bg-[#4e5a61] hover:!bg-[#414b51] active:!bg-[#394248]"
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
