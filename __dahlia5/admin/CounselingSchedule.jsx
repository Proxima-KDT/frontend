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
  X,
  Circle,
  Search,
  Bell,
  Plus,
} from 'lucide-react';

const TODAY = new Date().toISOString().slice(0, 10);
const BOOKING_PAGE_SIZE = 8;

const MONTH_NAMES = [
  '1??,
  '2??,
  '3??,
  '4??,
  '5??,
  '6??,
  '7??,
  '8??,
  '9??,
  '10??,
  '11??,
  '12??,
];
const DAYS_OF_WEEK = ['??, '??, '??, '紐?, '湲?, '??, '??];

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
  pending: { label: '?湲곗쨷', variant: 'soft-warning' },
  confirmed: { label: '?뺤젙', variant: 'soft-success' },
  completed: { label: '?꾨즺', variant: 'soft-info' },
  cancelled: { label: '痍⑥냼??, variant: 'soft-error' },
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

  // ?좎쭨蹂??덉빟/李⑤떒 ?щ? (罹섎┛?????쒖떆??
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

  // ?좏깮 ?좎쭨???щ’ ?곹깭 怨꾩궛
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

    // ?숆????낅뜲?댄듃
    setBlockedSlots((prev) => ({ ...prev, [selectedDate]: updatedSlots }));

    counselingManageApi
      .updateBlockedSlots(selectedDate, updatedSlots)
      .then(() => {
        showToast({
          message: isBlocked
            ? `${slot} 李⑤떒???댁젣?섏뿀?듬땲??`
            : `${slot} ?щ’??李⑤떒?섏뿀?듬땲??`,
          type: isBlocked ? 'info' : 'warning',
        });
      })
      .catch(() => {
        // ?ㅽ뙣 ???댁쟾 ?곹깭濡?濡ㅻ갚
        setBlockedSlots((prev) => ({ ...prev, [selectedDate]: prevSlots }));
        showToast({ message: '?щ’ ?곹깭 蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.', type: 'error' });
      });
  }

  function handleConfirmBooking() {
    counselingManageApi
      .updateBooking(selectedBooking.id, 'confirm')
      .then(() => {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id ? { ...b, status: 'confirmed' } : b,
          ),
        );
        showToast({
          message:
            '\uba74\ub2f4\uc774 \ud655\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
          type: 'success',
        });
        setSelectedBooking(null);
      })
      .catch(() =>
        showToast({
          message: '\ud655\uc815\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.',
          type: 'error',
        }),
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
        showToast({
          message:
            '\uba74\ub2f4\uc774 \ucde8\uc18c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
          type: 'error',
        });
        setSelectedBooking(null);
      })
      .catch(() =>
        showToast({
          message: '\ucde8\uc18c\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.',
          type: 'error',
        }),
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

  // ?듦퀎
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

  // ?섎떒 ???꾪꽣
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'confirmed') return b.status === 'confirmed';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true; // ?꾩껜
  });

  const tabs = [
    { key: 'all', label: '?꾩껜', count: totalCount },
    { key: 'pending', label: '?湲곗쨷', count: pendingCount },
    { key: 'confirmed', label: '?뺤젙', count: confirmedCount },
    { key: 'completed', label: '?꾨즺', count: completedCount },
    { key: 'cancelled', label: '痍⑥냼', count: cancelledCount },
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
      label: '?숈깮紐?,
      render: (val, row) => (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          <span className="text-body-sm font-medium text-gray-800">{val}</span>
          {row.course_name && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
              {row.course_name}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'date',
      label: '?좎쭨쨌?쒓컙',
      render: (val, row) => (
        <span className="text-body-sm text-gray-600">
          {val} {row.time ? row.time.slice(0, 5) : ''}
        </span>
      ),
    },
    {
      key: 'reason',
      label: '?좎껌 ?ъ쑀',
      render: (val) => (
        <p className="text-body-sm text-gray-600 line-clamp-1">{val}</p>
      ),
    },
    {
      key: 'status',
      label: '?곹깭',
      render: (val) => (
        <Badge variant={STATUS_CONFIG[val]?.variant ?? 'default'}>
          {STATUS_CONFIG[val]?.label ?? val}
        </Badge>
      ),
    },
  ];

  // ?좏깮 ?좎쭨 ?쒖떆 ?띿뒪??  const selectedMonth = parseInt(selectedDate.split('-')[1]);
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
            placeholder="?곷떞 寃??(Search consultations)"
            className="h-10 w-full rounded-full border border-[#e4e1db] bg-[#f7f6f2] pl-10 pr-4 text-sm text-[#6f6b64] placeholder:text-[#b4b0a8]"
          />
        </div>
        <div className="flex items-center gap-3 text-[#7e7a74]">
          <Bell className="h-4 w-4" />
          <h1 className="text-[1.65rem] text-[#999792]">
            ?곷떞?쇱젙 愿由?          </h1>
        </div>
      </div>

      {/* ?듦퀎 移대뱶 */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">?꾩껜 ?좎껌 (Total Requests)</p>
          <p className="text-4xl font-semibold text-[#2f3f54]">{totalCount}</p>
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">?뱀씤 ?湲?(Pending)</p>
          <p className="text-4xl font-semibold text-[#7d661e]">{pendingCount}</p>
          <div className="mt-2 h-1 rounded-full bg-[#8f7728]" />
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">?덉빟 ?뺤젙 (Confirmed)</p>
          <p className="text-4xl font-semibold text-[#2f3f54]">{confirmedCount}</p>
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="mb-1 text-sm text-[#848079]">?꾨즺 (Completed)</p>
          <p className="text-4xl font-semibold text-[#2f3f54]">{completedCount}</p>
        </Card>
      </div>

      {/* 罹섎┛??+ ?щ’ ?⑤꼸 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* ?붽컙 罹섎┛??*/}
        <Card className="rounded-[28px] border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
          {/* ?ㅻ뜑 */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[2.1rem] text-[#262a31]">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </p>
              <p className="text-sm text-[#7f7b72]">?숈궗 遺꾧린 ?쇱젙 쨌 Curator Schedule</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="rounded-lg p-1.5 transition-colors hover:bg-[#e7e3dd]"
              >
                <ChevronLeft className="h-4 w-4 text-[#5f5b53]" />
              </button>
              <button
                onClick={nextMonth}
                className="rounded-lg p-1.5 transition-colors hover:bg-[#e7e3dd]"
              >
                <ChevronRight className="h-4 w-4 text-[#5f5b53]" />
              </button>
            </div>
          </div>

          {/* ?붿씪 ?ㅻ뜑 */}
          <div className="mb-1 grid grid-cols-7 rounded-t-xl bg-[#f8f7f4]">
            {DAYS_OF_WEEK.map((d, i) => (
              <div
                key={d}
                className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f8a80]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* ?좎쭨 洹몃━??*/}
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
                  key={dateStr}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
                  disabled={isPast}
                  className={`
                    relative flex h-16 flex-col items-start justify-start border-r border-b border-[#e4e1da] px-2 py-1 text-left text-[13px] font-medium transition-colors
                    ${isPast ? 'text-gray-300 cursor-default' : ''}
                    ${!isPast && !isSelected ? 'hover:bg-[#ece9e2] text-[#373f4a]' : ''}
                    ${isSelected ? 'bg-[#e9e8e5] text-[#223248] ring-1 ring-[#8a8f96]' : ''}
                    ${isToday && !isSelected ? 'text-[#2f3f54]' : ''}
                    ${!isPast && !isSelected && dow === 5 ? 'text-[#47576b]' : ''}
                    ${!isPast && !isSelected && dow === 6 ? 'text-[#8f5757]' : ''}
                  `}
                >
                  {day}
                  {/* ?몃뵒耳?댄꽣 ??*/}
                  {!isPast && (hasBooking || hasBlocked) && (
                    <span
                      className={`absolute bottom-1 w-1 h-1 rounded-full
                        ${
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

          {/* 踰붾? */}
          <div className="mt-4 flex items-center gap-4 border-t border-[#e0ddd7] pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#5b6677]" />
              <span className="text-caption text-[#77736b]">硫대떞 ?좎껌</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-caption text-[#77736b]">李⑤떒???좎쭨</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full ring-2 ring-[#8d95a3]" />
              <span className="text-caption text-[#77736b]">?ㅻ뒛</span>
            </div>
          </div>
        </Card>

        {/* ?쒓컙 ?щ’ ?⑤꼸 */}
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
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#d8e2e4] bg-[#f5f7f6] px-3 py-2.5 text-left transition-colors hover:bg-[#eef3f2]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2f3f54]">{slot}</p>
                      <p className="text-xs text-[#7f8793]">{status.booking.student_name}</p>
                    </div>
                    <Badge variant="soft-info" className="font-semibold">?뺤젙</Badge>
                  </button>
                );
              }

              if (status.type === 'blocked') {
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className="flex w-full items-center justify-between rounded-xl bg-[#ecebe7] px-3 py-2.5 text-left transition-colors hover:bg-[#e2e0db]"
                  >
                    <p className="text-sm font-semibold text-[#8f8c85] line-through">{slot}</p>
                    <Badge variant="soft-amber" className="font-semibold">李⑤떒</Badge>
                  </button>
                );
              }

              return (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  className="flex w-full items-center justify-between rounded-xl bg-[#f5f4f1] px-3 py-2.5 text-left transition-colors hover:bg-[#ecebe7]"
                >
                  <p className="text-sm font-semibold text-[#2f3f54]">{slot}</p>
                  <Badge variant="soft-success" className="font-semibold">媛??/Badge>
                </button>
              );
            })}
          </div>
          <Button className="mt-4 w-full rounded-xl !bg-[#5f6972] !text-white hover:!bg-[#4e5760]">
            + ?щ’ ?쇨큵 ?섏젙
          </Button>
        </Card>
      </div>

      {/* ?섎떒 硫대떞 ?좎껌 紐⑸줉 */}
      <Card className="rounded-[28px] border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
        <div className="mb-4">
          <h2 className="text-[2rem] text-[#2f333a]">理쒓렐 ?좎껌 ?쒕룞</h2>
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
          emptyMessage="?좎껌??硫대떞???놁뒿?덈떎."
        />

        {/* ?섏씠吏?ㅼ씠??*/}
        {filteredBookings.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-caption text-gray-400">
              {(safeBookingPage - 1) * BOOKING_PAGE_SIZE + 1}??              {Math.min(
                safeBookingPage * BOOKING_PAGE_SIZE,
                filteredBookings.length,
              )}{' '}
              / ?꾩껜 {filteredBookings.length}嫄?            </span>
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
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('??);
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '?? ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-gray-400 text-body-sm"
                    >
                      ??                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setBookingPage(p)}
                      className={`min-w-8 h-8 rounded-lg text-body-sm font-medium transition-colors ${
                        p === safeBookingPage
                          ? 'bg-[#5f6972] text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() =>
                  setBookingPage((p) => Math.min(totalBookingPages, p + 1))
                }
                disabled={safeBookingPage === totalBookingPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <button
        type="button"
        className="fixed bottom-8 right-8 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5f6972] text-white shadow-[0_12px_28px_rgba(40,44,48,0.35)] transition-colors hover:bg-[#4f5961]"
        title="???쇱젙"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 硫대떞 ?곸꽭 Drawer */}
      <Drawer
        isOpen={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        title="硫대떞 ?좎껌 ?곸꽭"
        width="w-[440px]"
      >
        {selectedBooking && (
          <div className="space-y-8">
            {/* ?숈깮 ?꾨줈??*/}
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-8 h-8 text-primary-500" />
              </div>
              <div>
                <p className="text-h3 font-bold text-gray-900 mb-1">
                  {selectedBooking.student_name}
                </p>
                <p className="text-body-sm text-gray-400">
                  {selectedBooking.course_name || '?섍컯??}
                </p>
              </div>
              <Badge
                variant={
                  STATUS_CONFIG[selectedBooking.status]?.variant ?? 'default'
                }
              >
                {STATUS_CONFIG[selectedBooking.status]?.label}
              </Badge>
            </div>

            {/* ?쇱떆 */}
            <div>
              <p className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">
                硫대떞 ?쇱떆
              </p>
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-8">
                  <span className="text-body-sm text-gray-500 shrink-0">
                    ?좎쭨
                  </span>
                  <span className="text-body font-semibold text-gray-900">
                    {selectedBooking.date}&nbsp;
                    <span className="text-body-sm font-normal text-gray-500">
                      ({formatDayOfWeek(selectedBooking.date)})
                    </span>
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between gap-8">
                  <span className="text-body-sm text-gray-500 shrink-0">
                    ?쒓컙
                  </span>
                  <span className="text-body font-semibold text-gray-900">
                    {selectedBooking.time}&nbsp;
                    <span className="text-body-sm font-normal text-gray-500">
                      ({selectedBooking.duration}遺?
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* ?좎껌 ?ъ쑀 */}
            <div>
              <p className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">
                ?좎껌 ?ъ쑀
              </p>
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-body text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedBooking.reason}
                </p>
              </div>
            </div>

            {/* ?≪뀡 踰꾪듉 */}
            {selectedBooking.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCancelBooking}
                >
                  硫대떞 痍⑥냼
                </Button>
                <Button className="flex-1" onClick={handleConfirmBooking}>
                  ?뺤젙?섍린
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
                  硫대떞 痍⑥냼
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
