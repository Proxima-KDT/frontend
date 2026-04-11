import { useState, useMemo, useEffect } from 'react';
import { counselingManageApi } from '@/api/counseling_manage';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import Drawer from '@/components/common/Drawer';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, ChevronRight, User, X, Circle } from 'lucide-react';

const TODAY = new Date().toISOString().slice(0, 10);
const BOOKING_PAGE_SIZE = 8;

const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];
const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const STATUS_CONFIG = {
  pending:   { label: '대기중', variant: 'warning' },
  confirmed: { label: '확정',   variant: 'success' },
  completed: { label: '완료',   variant: 'info'    },
  cancelled: { label: '취소됨', variant: 'error'   },
};

function formatDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

function formatDayOfWeek(dateStr) {
  const d = new Date(dateStr);
  return DAYS_OF_WEEK[(d.getDay() + 6) % 7];
}

export default function CounselingSchedule() {
  const { showToast } = useToast();
  const [currentYear,  setCurrentYear]  = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [blockedSlots, setBlockedSlots] = useState({});
  const [bookings,     setBookings]     = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab,    setActiveTab]    = useState('all');
  const [bookingPage,  setBookingPage]  = useState(1);

  useEffect(() => {
    counselingManageApi
      .getBookings()
      .then((data) => setBookings(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (blockedSlots[selectedDate] !== undefined) return;
    counselingManageApi
      .getBlockedSlots(selectedDate)
      .then((slots) =>
        setBlockedSlots((prev) => ({ ...prev, [selectedDate]: slots })),
      )
      .catch(() =>
        setBlockedSlots((prev) => ({ ...prev, [selectedDate]: [] })),
      );
  }, [selectedDate]);

  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const datesWithBookings = useMemo(
    () => new Set(bookings.filter((b) => b.status !== 'cancelled').map((b) => b.date)),
    [bookings],
  );
  const datesWithBlocked = useMemo(
    () => new Set(Object.keys(blockedSlots).filter((d) => blockedSlots[d]?.length > 0)),
    [blockedSlots],
  );

  function getSlotStatus(slot) {
    const booking = bookings.find(
      (b) => b.date === selectedDate && b.time === slot && b.status !== 'cancelled',
    );
    if (booking) return { type: 'booked', booking };
    if (blockedSlots[selectedDate]?.includes(slot)) return { type: 'blocked' };
    return { type: 'available' };
  }

  function handleSlotClick(slot) {
    const status = getSlotStatus(slot);
    if (status.type === 'booked') {
      setSelectedBooking(status.booking);
      return;
    }
    const isBlocked = status.type === 'blocked';
    const prevSlots = blockedSlots[selectedDate] || [];
    const updatedSlots = isBlocked
      ? prevSlots.filter((s) => s !== slot)
      : [...prevSlots, slot];

    setBlockedSlots((prev) => ({ ...prev, [selectedDate]: updatedSlots }));

    counselingManageApi
      .updateBlockedSlots(selectedDate, updatedSlots)
      .then(() => {
        showToast({
          message: isBlocked ? `${slot} 차단이 해제되었습니다.` : `${slot} 슬롯이 차단되었습니다.`,
          type: isBlocked ? 'info' : 'warning',
        });
      })
      .catch(() => {
        setBlockedSlots((prev) => ({ ...prev, [selectedDate]: prevSlots }));
        showToast({ message: '슬롯 상태 변경에 실패했습니다.', type: 'error' });
      });
  }

  function handleConfirmBooking(booking) {
    const target = booking ?? selectedBooking;
    counselingManageApi
      .updateBooking(target.id, 'confirm')
      .then(() => {
        setBookings((prev) =>
          prev.map((b) => (b.id === target.id ? { ...b, status: 'confirmed' } : b)),
        );
        showToast({ message: '면담이 확정되었습니다.', type: 'success' });
        if (!booking) setSelectedBooking(null);
      })
      .catch(() => showToast({ message: '확정에 실패했습니다.', type: 'error' }));
  }

  function handleCancelBooking() {
    counselingManageApi
      .updateBooking(selectedBooking.id, 'cancel')
      .then(() => {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b,
          ),
        );
        showToast({ message: '면담이 취소되었습니다.', type: 'warning' });
        setSelectedBooking(null);
      })
      .catch(() => showToast({ message: '취소에 실패했습니다.', type: 'error' }));
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11); }
    else setCurrentMonth((m) => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0); }
    else setCurrentMonth((m) => m + 1);
  }

  const totalCount     = bookings.length;
  const pendingCount   = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'pending')   return b.status === 'pending';
    if (activeTab === 'confirmed') return b.status === 'confirmed';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const tabs = [
    { key: 'all',       label: '전체',   count: totalCount     },
    { key: 'pending',   label: '대기중', count: pendingCount   },
    { key: 'confirmed', label: '확정',   count: confirmedCount },
    { key: 'completed', label: '완료',   count: completedCount },
    { key: 'cancelled', label: '취소',   count: cancelledCount },
  ];

  const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / BOOKING_PAGE_SIZE));
  const safeBookingPage   = Math.min(bookingPage, totalBookingPages);
  const pagedBookings     = filteredBookings.slice(
    (safeBookingPage - 1) * BOOKING_PAGE_SIZE,
    safeBookingPage * BOOKING_PAGE_SIZE,
  );

  const handleTabChange = (tab) => { setActiveTab(tab); setBookingPage(1); };

  const tableColumns = [
    {
      key: 'student_name',
      label: '학생명',
      render: (val) => (
        <span className="text-body-sm font-medium text-gray-800">{val}</span>
      ),
    },
    {
      key: 'date',
      label: '날짜·시간',
      render: (val, row) => (
        <span className="text-body-sm text-gray-600">
          {val} {row.time ? row.time.slice(0, 5) : ''}
        </span>
      ),
    },
    {
      key: 'reason',
      label: '신청 사유',
      render: (val) => (
        <p className="text-body-sm text-gray-600 line-clamp-1">{val}</p>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (val) => (
        <Badge variant={STATUS_CONFIG[val]?.variant ?? 'default'}>
          {STATUS_CONFIG[val]?.label ?? val}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: '액션',
      render: (val, row) =>
        row.status === 'pending' ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmBooking(row);
            }}
          >
            확정
          </Button>
        ) : null,
    },
  ];

  const selectedMonth = parseInt(selectedDate.split('-')[1]);
  const selectedDay   = parseInt(selectedDate.split('-')[2]);
  const selectedDow   = formatDayOfWeek(selectedDate);

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">상담일정</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card>
          <p className="text-caption text-gray-500 mb-1">전체 신청</p>
          <p className="text-h2 font-bold text-gray-900">{totalCount}건</p>
        </Card>
        <Card>
          <p className="text-caption text-gray-500 mb-1">대기중</p>
          <p className="text-h2 font-bold text-warning-600">{pendingCount}건</p>
        </Card>
        <Card>
          <p className="text-caption text-gray-500 mb-1">확정</p>
          <p className="text-h2 font-bold text-success-600">{confirmedCount}건</p>
        </Card>
        <Card>
          <p className="text-caption text-gray-500 mb-1">완료</p>
          <p className="text-h2 font-bold text-admin-600">{completedCount}건</p>
        </Card>
      </div>

      {/* 캘린더 + 슬롯 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 월간 캘린더 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-body font-semibold text-gray-900">
              {currentYear}년 {MONTH_NAMES[currentMonth]}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((d, i) => (
              <div
                key={d}
                className={`text-center text-caption font-medium py-1 ${
                  i === 5 ? 'text-admin-400' : i === 6 ? 'text-red-400' : 'text-gray-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr    = formatDateStr(currentYear, currentMonth, day);
              const isToday    = dateStr === TODAY;
              const isSelected = dateStr === selectedDate;
              const isPast     = dateStr < TODAY;
              const dow        = idx % 7;
              const hasBooking = datesWithBookings.has(dateStr);
              const hasBlocked = datesWithBlocked.has(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
                  disabled={isPast}
                  className={`
                    relative flex flex-col items-center justify-center h-9 rounded-xl text-body-sm font-medium
                    transition-colors cursor-pointer
                    ${isPast ? 'text-gray-300 cursor-default' : ''}
                    ${!isPast && !isSelected ? 'hover:bg-admin-50' : ''}
                    ${isSelected ? 'bg-admin-500 text-white' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-admin-300 text-admin-600' : ''}
                    ${!isPast && !isSelected && dow === 5 ? 'text-admin-400' : ''}
                    ${!isPast && !isSelected && dow === 6 ? 'text-red-400' : ''}
                  `}
                >
                  {day}
                  {!isPast && (hasBooking || hasBlocked) && (
                    <span
                      className={`absolute bottom-1 w-1 h-1 rounded-full ${
                        hasBooking
                          ? isSelected ? 'bg-white' : 'bg-admin-400'
                          : isSelected ? 'bg-white/60' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-admin-400" />
              <span className="text-caption text-gray-500">면담 신청</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-caption text-gray-500">차단된 날짜</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full ring-2 ring-admin-300 inline-block" />
              <span className="text-caption text-gray-500">오늘</span>
            </div>
          </div>
        </Card>

        {/* 시간 슬롯 패널 */}
        <Card>
          <h2 className="text-h3 font-semibold text-gray-900 mb-1">
            {selectedMonth}월 {selectedDay}일 ({selectedDow})
          </h2>
          <p className="text-caption text-gray-400 mb-4">
            슬롯을 클릭해 차단/해제할 수 있습니다
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {TIME_SLOTS.map((slot) => {
              const status = getSlotStatus(slot);

              if (status.type === 'booked') {
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                      bg-admin-50 border border-admin-200
                      hover:bg-admin-100 transition-colors cursor-pointer text-left"
                  >
                    <User className="w-3.5 h-3.5 text-admin-500 shrink-0" />
                    <span className="text-body-sm font-medium text-admin-700 shrink-0">
                      {slot}
                    </span>
                    <span className="text-body-sm text-admin-600 truncate">
                      {status.booking.student_name}
                    </span>
                  </button>
                );
              }

              if (status.type === 'blocked') {
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                      bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer text-left"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-body-sm text-gray-400 shrink-0 line-through">
                      {slot}
                    </span>
                    <span className="text-body-sm text-gray-400">차단</span>
                  </button>
                );
              }

              return (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                    border border-transparent hover:bg-admin-50 hover:border-admin-100
                    transition-colors cursor-pointer text-left"
                >
                  <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <span className="text-body-sm text-gray-700 shrink-0">{slot}</span>
                  <span className="text-body-sm text-gray-400">가능</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 하단 면담 신청 목록 */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">신청된 면담</h2>
        <div className="overflow-x-auto">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} className="mb-4" />
        </div>
        <Table
          columns={tableColumns}
          data={pagedBookings}
          onRowClick={(row) => setSelectedBooking(row)}
          emptyMessage="신청된 면담이 없습니다."
        />

        {filteredBookings.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-caption text-gray-400">
              {(safeBookingPage - 1) * BOOKING_PAGE_SIZE + 1}–
              {Math.min(safeBookingPage * BOOKING_PAGE_SIZE, filteredBookings.length)}
              {' '}/ 전체 {filteredBookings.length}건
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                disabled={safeBookingPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: totalBookingPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalBookingPages ||
                    Math.abs(p - safeBookingPage) <= 2,
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-body-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setBookingPage(p)}
                      className={`min-w-8 h-8 rounded-lg text-body-sm font-medium transition-colors ${
                        p === safeBookingPage
                          ? 'bg-admin-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
                disabled={safeBookingPage === totalBookingPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* 면담 상세 Drawer */}
      <Drawer
        isOpen={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        title="면담 신청 상세"
        width="w-[440px]"
      >
        {selectedBooking && (
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-admin-100 flex items-center justify-center">
                <User className="w-8 h-8 text-admin-500" />
              </div>
              <div>
                <p className="text-h3 font-bold text-gray-900 mb-1">
                  {selectedBooking.student_name}
                </p>
                <p className="text-body-sm text-gray-400">수강생</p>
              </div>
              <Badge variant={STATUS_CONFIG[selectedBooking.status]?.variant ?? 'default'}>
                {STATUS_CONFIG[selectedBooking.status]?.label}
              </Badge>
            </div>

            <div>
              <p className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">
                면담 일시
              </p>
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-8">
                  <span className="text-body-sm text-gray-500 shrink-0">날짜</span>
                  <span className="text-body font-semibold text-gray-900">
                    {selectedBooking.date}&nbsp;
                    <span className="text-body-sm font-normal text-gray-500">
                      ({formatDayOfWeek(selectedBooking.date)})
                    </span>
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between gap-8">
                  <span className="text-body-sm text-gray-500 shrink-0">시간</span>
                  <span className="text-body font-semibold text-gray-900">
                    {selectedBooking.time ? selectedBooking.time.slice(0, 5) : '-'}&nbsp;
                    {selectedBooking.duration && (
                      <span className="text-body-sm font-normal text-gray-500">
                        ({selectedBooking.duration}분)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">
                신청 사유
              </p>
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-body text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedBooking.reason}
                </p>
              </div>
            </div>

            {selectedBooking.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={handleCancelBooking}>
                  면담 취소
                </Button>
                <Button className="flex-1" onClick={() => handleConfirmBooking()}>
                  확정하기
                </Button>
              </div>
            )}
            {selectedBooking.status === 'confirmed' && (
              <div className="pt-2">
                <Button variant="secondary" className="w-full" onClick={handleCancelBooking}>
                  면담 취소
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
