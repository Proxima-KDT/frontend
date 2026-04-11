import { useState, useMemo, useEffect } from 'react';
import { counselingManageApi } from '@/api/counseling_manage';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import Drawer from '@/components/common/Drawer';
import { useToast } from '@/context/ToastContext';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  Bell,
  Plus,
  SlidersHorizontal,
  Download,
} from 'lucide-react';

const TODAY = new Date().toISOString().slice(0, 10);
const BOOKING_PAGE_SIZE = 8;

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

const STATUS_CONFIG = {
  pending: { label: '대기중', variant: 'soft-warning' },
  confirmed: { label: '확정', variant: 'soft-success' },
  completed: { label: '완료', variant: 'soft-info' },
  cancelled: { label: '취소됨', variant: 'soft-error' },
};

function formatDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
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
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [blockedSlots, setBlockedSlots] = useState({});
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);

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
    () =>
      new Set(
        bookings.filter((b) => b.status !== 'cancelled').map((b) => b.date),
      ),
    [bookings],
  );
  const datesWithBlocked = useMemo(
    () =>
      new Set(
        Object.keys(blockedSlots).filter((d) => blockedSlots[d]?.length > 0),
      ),
    [blockedSlots],
  );

  function getSlotStatus(slot) {
    const booking = bookings.find(
      (b) =>
        b.date === selectedDate && b.time === slot && b.status !== 'cancelled',
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
          message: isBlocked
            ? `${slot} 차단이 해제되었습니다.`
            : `${slot} 슬롯이 차단되었습니다.`,
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
          prev.map((b) =>
            b.id === target.id ? { ...b, status: 'confirmed' } : b,
          ),
        );
        showToast({ message: '면담이 확정되었습니다.', type: 'success' });
        if (!booking) setSelectedBooking(null);
      })
      .catch(() =>
        showToast({ message: '확정에 실패했습니다.', type: 'error' }),
      );
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
      .catch(() =>
        showToast({ message: '취소에 실패했습니다.', type: 'error' }),
      );
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
  }

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter(
    (b) => b.status === 'confirmed',
  ).length;
  const completedCount = bookings.filter(
    (b) => b.status === 'completed',
  ).length;
  const cancelledCount = bookings.filter(
    (b) => b.status === 'cancelled',
  ).length;

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'confirmed') return b.status === 'confirmed';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const tabs = [
    { key: 'all', label: '전체', count: totalCount },
    { key: 'pending', label: '대기중', count: pendingCount },
    { key: 'confirmed', label: '확정', count: confirmedCount },
    { key: 'completed', label: '완료', count: completedCount },
    { key: 'cancelled', label: '취소', count: cancelledCount },
  ];

  const totalBookingPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / BOOKING_PAGE_SIZE),
  );
  const safeBookingPage = Math.min(bookingPage, totalBookingPages);
  const pagedBookings = filteredBookings.slice(
    (safeBookingPage - 1) * BOOKING_PAGE_SIZE,
    safeBookingPage * BOOKING_PAGE_SIZE,
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setBookingPage(1);
  };

  const tableColumns = [
    {
      key: 'student_name',
      label: '학생명',
      render: (val) => (
        <span className="text-body-sm font-medium text-[#2c2b28]">{val}</span>
      ),
    },
    {
      key: 'date',
      label: '날짜·시간',
      render: (val, row) => (
        <span className="text-body-sm text-[#6b6560]">
          {val} {row.time ? row.time.slice(0, 5) : ''}
        </span>
      ),
    },
    {
      key: 'reason',
      label: '신청 사유',
      render: (val) => (
        <p className="line-clamp-1 text-body-sm text-[#6b6560]">{val}</p>
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
            className="rounded-lg !bg-[#5f6972] !text-white hover:!bg-[#4e5760]"
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
  const selectedDay = parseInt(selectedDate.split('-')[2]);
  const selectedDow = formatDayOfWeek(selectedDate);

  return (
    <div className="relative rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a968e]" />
          <input
            readOnly
            value=""
            placeholder="상담 검색 (Search consultations)"
            className="h-10 w-full rounded-full border border-[#e4e1db] bg-[#f7f6f2] pl-10 pr-4 text-sm text-[#6f6b64] placeholder:text-[#b4b0a8]"
          />
        </div>
        <div className="flex items-center gap-3 text-[#7e7a74]">
          <Bell className="h-4 w-4" />
          <h1 className="text-[1.65rem] text-[#999792]">
            상담일정 관리
          </h1>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">전체 신청 (Total Requests)</p>
          <p className="text-4xl font-semibold text-[#2f3f54]">{totalCount}</p>
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">승인 대기 (Pending)</p>
          <p className="text-4xl font-semibold text-[#7d661e]">{pendingCount}</p>
          <div className="mt-2 h-1 rounded-full bg-[#8f7728]" />
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">오늘 확정 (Confirmed)</p>
          <p className="text-4xl font-semibold text-[#2f3f54]">{confirmedCount}</p>
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">완료 (Completed)</p>
          <p className="text-4xl font-semibold text-[#2f3f54]">{completedCount}</p>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="rounded-[28px] border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[2.1rem] text-[#262a31]">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </p>
              <p className="text-sm text-[#7f7b72]">
                학사 분기 일정 · Curator Schedule
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg p-1.5 transition-colors hover:bg-[#e7e3dd]"
              >
                <ChevronLeft className="h-4 w-4 text-[#5f5b53]" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg p-1.5 transition-colors hover:bg-[#e7e3dd]"
              >
                <ChevronRight className="h-4 w-4 text-[#5f5b53]" />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 rounded-t-xl bg-[#f8f7f4]">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f8a80]"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 overflow-hidden rounded-b-xl border border-[#e2dfd8]">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr = formatDateStr(currentYear, currentMonth, day);
              const isToday = dateStr === TODAY;
              const isSelected = dateStr === selectedDate;
              const isPast = dateStr < TODAY;
              const dow = idx % 7;
              const hasBooking = datesWithBookings.has(dateStr);
              const hasBlocked = datesWithBlocked.has(dateStr);

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
                  disabled={isPast}
                  className={`
                    relative flex h-16 flex-col items-start justify-start border-b border-r border-[#e4e1da] px-2 py-1 text-left text-[13px] font-medium transition-colors
                    ${isPast ? 'cursor-default text-gray-300' : ''}
                    ${!isPast && !isSelected ? 'text-[#373f4a] hover:bg-[#ece9e2]' : ''}
                    ${isSelected ? 'bg-[#e9e8e5] text-[#223248] ring-1 ring-[#8a8f96]' : ''}
                    ${isToday && !isSelected ? 'text-[#2f3f54]' : ''}
                    ${!isPast && !isSelected && dow === 5 ? 'text-[#47576b]' : ''}
                    ${!isPast && !isSelected && dow === 6 ? 'text-[#8f5757]' : ''}
                  `}
                >
                  {day}
                  {!isPast && (hasBooking || hasBlocked) && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        hasBooking
                          ? isSelected
                            ? 'bg-[#2f3f54]'
                            : 'bg-[#5b6677]'
                          : isSelected
                            ? 'bg-[#8f8a80]'
                            : 'bg-gray-300'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-[#e0ddd7] pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#5b6677]" />
              <span className="text-caption text-[#77736b]">면담 신청</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-caption text-[#77736b]">차단된 날짜</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full ring-2 ring-[#8d95a3]" />
              <span className="text-caption text-[#77736b]">오늘</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-[#d8d5cd] bg-[#e4e2db] shadow-none">
          <h2 className="mb-1 text-[2rem] text-[#333740]">
            {MONTH_NAMES[selectedMonth - 1]} {selectedDay} ({selectedDow})
          </h2>
          <p className="mb-4 text-caption text-[#7f7b72]">
            Manage daily availability
          </p>

          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => {
              const status = getSlotStatus(slot);

              if (status.type === 'booked') {
                return (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#d8e2e4] bg-[#f5f7f6] px-3 py-2.5 text-left transition-colors hover:bg-[#eef3f2]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2f3f54]">{slot}</p>
                      <p className="text-xs text-[#7f8793]">
                        {status.booking.student_name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        STATUS_CONFIG[status.booking.status]?.variant ??
                        'soft-info'
                      }
                      className="font-semibold"
                    >
                      {STATUS_CONFIG[status.booking.status]?.label ?? '예약'}
                    </Badge>
                  </button>
                );
              }

              if (status.type === 'blocked') {
                return (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className="flex w-full items-center justify-between rounded-xl bg-[#ecebe7] px-3 py-2.5 text-left transition-colors hover:bg-[#e2e0db]"
                  >
                    <p className="text-sm font-semibold text-[#8f8c85] line-through">
                      {slot}
                    </p>
                    <Badge variant="soft-amber" className="font-semibold">
                      차단
                    </Badge>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  className="flex w-full items-center justify-between rounded-xl bg-[#f5f4f1] px-3 py-2.5 text-left transition-colors hover:bg-[#ecebe7]"
                >
                  <p className="text-sm font-semibold text-[#2f3f54]">{slot}</p>
                  <Badge variant="soft-success" className="font-semibold">
                    가능
                  </Badge>
                </button>
              );
            })}
          </div>
          <Button className="mt-4 w-full rounded-xl !bg-[#5f6972] !text-white hover:!bg-[#4e5760]">
            + 슬롯 일괄 수정
          </Button>
        </Card>
      </div>

      <Card className="rounded-[28px] border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[2rem] text-[#2f333a]">
            최근 신청 활동
          </h2>
          <div className="flex items-center gap-3 text-sm text-[#6f746f]">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-[#4f5450]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              필터
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-[#4f5450]"
            >
              <Download className="h-4 w-4" />
             보내기
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            className="mb-4"
          />
        </div>
        <Table
          columns={tableColumns}
          data={pagedBookings}
          onRowClick={(row) => setSelectedBooking(row)}
          emptyMessage="신청된 면담이 없습니다."
        />

        {filteredBookings.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-[#e0ddd7] pt-4">
            <span className="text-caption text-[#9a968e]">
              {(safeBookingPage - 1) * BOOKING_PAGE_SIZE + 1}–
              {Math.min(
                safeBookingPage * BOOKING_PAGE_SIZE,
                filteredBookings.length,
              )}{' '}
              / 전체 {filteredBookings.length}건
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                disabled={safeBookingPage === 1}
                className="rounded-lg p-1.5 transition-colors hover:bg-[#e7e3dd] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 text-[#5f5b53]" />
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
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-body-sm text-[#9a968e]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setBookingPage(p)}
                      className={`h-8 min-w-8 rounded-lg text-body-sm font-medium transition-colors ${
                        p === safeBookingPage
                          ? 'bg-[#5f6972] text-white'
                          : 'text-[#5f5b53] hover:bg-[#e7e3dd]'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                type="button"
                onClick={() =>
                  setBookingPage((p) => Math.min(totalBookingPages, p + 1))
                }
                disabled={safeBookingPage === totalBookingPages}
                className="rounded-lg p-1.5 transition-colors hover:bg-[#e7e3dd] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4 text-[#5f5b53]" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <button
        type="button"
        className="fixed bottom-8 right-8 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5f6972] text-white shadow-[0_12px_28px_rgba(40,44,48,0.35)] transition-colors hover:bg-[#4f5961]"
        title="새 일정"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Drawer
        isOpen={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        title="면담 신청 상세"
        width="w-[440px]"
      >
        {selectedBooking && (
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <User className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <p className="mb-1 text-h3 font-bold text-gray-900">
                  {selectedBooking.student_name}
                </p>
                <p className="text-body-sm text-gray-400">수강생</p>
              </div>
              <Badge
                variant={
                  STATUS_CONFIG[selectedBooking.status]?.variant ?? 'default'
                }
              >
                {STATUS_CONFIG[selectedBooking.status]?.label}
              </Badge>
            </div>

            <div>
              <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-gray-400">
                면담 일시
              </p>
              <div className="space-y-4 rounded-2xl bg-gray-50 p-5">
                <div className="flex items-center justify-between gap-8">
                  <span className="shrink-0 text-body-sm text-gray-500">날짜</span>
                  <span className="text-body font-semibold text-gray-900">
                    {selectedBooking.date}&nbsp;
                    <span className="text-body-sm font-normal text-gray-500">
                      ({formatDayOfWeek(selectedBooking.date)})
                    </span>
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between gap-8">
                  <span className="shrink-0 text-body-sm text-gray-500">시간</span>
                  <span className="text-body font-semibold text-gray-900">
                    {selectedBooking.time
                      ? selectedBooking.time.slice(0, 5)
                      : '-'}
                    &nbsp;
                    {selectedBooking.duration ? (
                      <span className="text-body-sm font-normal text-gray-500">
                        ({selectedBooking.duration}분)
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-gray-400">
                신청 사유
              </p>
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="whitespace-pre-wrap text-body leading-relaxed text-gray-700">
                  {selectedBooking.reason}
                </p>
              </div>
            </div>

            {selectedBooking.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCancelBooking}
                >
                  면담 취소
                </Button>
                <Button className="flex-1" onClick={() => handleConfirmBooking()}>
                  확정하기
                </Button>
              </div>
            )}
            {selectedBooking.status === 'confirmed' && (
              <div className="pt-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleCancelBooking}
                >
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
