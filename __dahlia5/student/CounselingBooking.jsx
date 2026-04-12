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
  confirmed: { label: '?덉빟 ?뺤젙', variant: 'success' },
  pending: { label: '寃??以?, variant: 'warning' },
  completed: { label: '?꾨즺', variant: 'default' },
  cancelled: { label: '痍⑥냼??, variant: 'error' },
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
  // Mon-based: Sun(0)??, Mon(1)??, ??  const startDow = (firstDay.getDay() + 6) % 7;
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
  // ?ㅼ쓬?ш퉴吏留??덉빟 媛??  const MAX_YEAR = THIS_MONTH === 11 ? THIS_YEAR + 1 : THIS_YEAR;
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

  // ?щ’???뱀젙 ?붾떒?꾨줈 媛?몄? ?꾩쟻?섎뒗 ?⑥닔
  const fetchMonthSlots = (counselorId, y, m) => {
    const key = `${y}-${m}`;
    counselingApi
      .getSlots(counselorId, y, m + 1) // JS month 0-based ??API 1-based
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

  // ?곷떞??蹂寃??? ?꾩옱??+ ?ㅼ쓬???щ’ 紐⑤몢 濡쒕뱶
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
    // ?꾩옱?붾낫???댁쟾?쇰줈 紐?媛?    if (currentYear === THIS_YEAR && currentMonth === THIS_MONTH) return;
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
    // ?ㅼ쓬?щ낫???댄썑濡?紐?媛?    if (currentYear === MAX_YEAR && currentMonth === MAX_MONTH) return;
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
    // ?대떦 ?붿씠 罹먯떆?섏? ?딆븯?쇰㈃ ?섏튂
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
      showToast({ type: 'success', message: '?곷떞 ?덉빟???꾨즺?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '?덉빟???ㅽ뙣?덉뒿?덈떎.' });
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
      showToast({ type: 'success', message: '?덉빟??痍⑥냼?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '?덉빟 痍⑥냼???ㅽ뙣?덉뒿?덈떎.' });
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
          硫대떞 ?덉빟
        </h1>
        <p className="mt-1 text-[0.95rem] text-[#6b6560]">
          硫섑넗 諛??숈뾽 留ㅻ땲????1:1 ?몄뀡???듯빐 ?숈뒿 諛⑺뼢???ㅺ퀎?섍퀬 ?꾩슂??吏?먯쓣 諛쏆쑝?몄슂.
        </p>
      </header>

      {/* ?? 硫섑넗 ?좏깮 ?? */}
      <section>
        <div className="mb-3">
          <h2
            className={`text-[1.4rem] font-semibold text-[#2c2b28]`}
          >
            硫섑넗 ?좏깮
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
                        {c.role === 'teacher' ? '?숈뾽 ?곷떞' : '吏꾨줈 ?곷떞'}
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

      {/* ?? 罹섎┛??+ ?쒓컙 ?좏깮 ?? */}
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
                aria-label="?댁쟾 ??
              >
                <ChevronLeft className="h-5 w-5 text-[#8a847a]" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                disabled={currentYear === MAX_YEAR && currentMonth === MAX_MONTH}
                className="rounded-xl p-2 hover:bg-[#faf9f7] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="?ㅼ쓬 ??
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
              ?덉빟 媛??            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9c988e]">
              <div className="h-3 w-3 rounded-md bg-[#4e5a61]" />
              ?좏깮??            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9c988e]">
              <div className="h-3 w-3 rounded-md bg-white ring-2 ring-[#c9a962]" />
              ?ㅻ뒛
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="!rounded-3xl !border-[#eceae4] !bg-white shadow-[0_2px_22px_rgba(60,52,40,0.04)]">
            <h3 className={`mb-3 text-[1.25rem] font-semibold text-[#2c2b28]`}>
              ?쒓컙 ?좏깮
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
                          ??                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <p className="pt-2 text-[0.72rem] text-[#a8a29e]">
                  ?좏깮: {selectedDate?.replace(/-/g, '.')}
                  {selectedTime ? ` ${toAmPm(selectedTime)}` : ''}
                  {selectedCounselor?.name ? ` 쨌 ${selectedCounselor.name}` : ''}
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
                    ?덉빟 ?뺤젙?섍린
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#efede8] bg-[#fbfaf7] p-6 text-center">
                <Calendar className="mx-auto mb-3 h-9 w-9 text-[#c9c4bc]" />
                <p className="text-sm font-semibold text-[#6b6560]">
                  ?좎쭨瑜?癒쇱? ?좏깮??二쇱꽭??                </p>
                <p className="mt-1 text-xs text-[#a8a29e]">
                  ?좏깮 媛?ν븳 ?좎쭨?먮쭔 ?쒓컙 紐⑸줉???쒖떆?⑸땲??
                </p>
              </div>
            )}
          </Card>

          <Card className="!rounded-3xl !border-[#f1d16a] !bg-[#f3c94a] shadow-[0_2px_22px_rgba(60,52,40,0.04)]">
            <p className="text-[0.75rem] font-bold tracking-[0.12em] text-[#5c4a1a]">
              Quick Guide
            </p>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-[#4a3b12]">
              以鍮꾨Ъ: 吏덈Ц 由ъ뒪?몃? 誘몃━ ?묒꽦???ㅼ떆硫?硫대떞?????⑥쑉?곸엯?덈떎.
            </p>
          </Card>
        </div>
      </section>

      {/* ?? ??硫대떞 ?덉빟 ?댁뿭 ?? */}
      <Card className="!rounded-3xl !border-[#eceae4] !bg-white shadow-[0_2px_22px_rgba(60,52,40,0.04)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className={`text-[1.7rem] font-semibold text-[#2c2b28]`}>
            ??硫대떞 ?덉빟
          </h2>
          <div className="flex gap-1 rounded-full border border-[#eceae4] bg-[#fbfaf7] p-1">
            <button
              onClick={() => setMyResTab('upcoming')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${chipClass(
                myResTab === 'upcoming',
              )}`}
            >
              ?덉젙
            </button>
            <button
              onClick={() => setMyResTab('past')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${chipClass(
                myResTab === 'past',
              )}`}
            >
              吏??硫대떞
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr_0.5fr] gap-3 px-3 pb-2 text-[0.72rem] font-semibold tracking-[0.08em] text-[#a8a29e] sm:grid">
          <span>硫섑넗</span>
          <span>?쇱떆</span>
          <span>?좏삎</span>
          <span>?곹깭</span>
          <span>?≪뀡</span>
        </div>

        <div className="space-y-2">
          {(myResTab === 'upcoming' ? activeBookings : pastBookings).length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={
                myResTab === 'upcoming'
                  ? '?덉젙??硫대떞???놁뒿?덈떎'
                  : '吏??硫대떞 湲곕줉???놁뒿?덈떎'
              }
              description="硫대떞 ?덉빟 ?댁뿭???ш린???쒖떆?⑸땲??"
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
                  <p className="text-sm text-[#3d3a36]">{b.reason || '吏꾨줈 ?곷떞'}</p>
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
                        title="痍⑥냼"
                      >
                        ??                      </button>
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

      {/* ?? 痍⑥냼 ?뺤씤 紐⑤떖 ?? */}
      <Modal
        isOpen={cancelTargetId !== null}
        onClose={() => setCancelTargetId(null)}
        title="硫대떞 ?덉빟 痍⑥냼"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-gray-600">
            ?덉빟??痍⑥냼?섎㈃ ?섎룎由????놁뒿?덈떎.
            <br />
            ?뺣쭚 痍⑥냼?섏떆寃좎뒿?덇퉴?
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setCancelTargetId(null)}
            >
              ?뚯븘媛湲?            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              onClick={handleCancelConfirm}
            >
              ?덉빟 痍⑥냼
            </Button>
          </div>
        </div>
      </Modal>

      {/* ?? ?덉빟 ?뺤씤 紐⑤떖 ?? */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="硫대떞 ?덉빟 ?뺤씤"
      >
        <div className="space-y-4">
          {/* ?덉빟 ?붿빟 */}
          <div className="space-y-2.5 rounded-2xl border border-[#e8edf3] bg-[#f5f9fd] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7d8ea6]">?곷떞 ???/span>
              <span className="text-sm font-semibold text-[#1f2f46]">
                {selectedCounselor?.name}{' '}
                <span className="font-normal text-[#6f7f96]">
                  ({selectedCounselor?.role_label})
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7d8ea6]">?쇱떆</span>
              <span className="text-sm font-semibold text-[#1f2f46]">
                {selectedDate?.replace(/-/g, '.')} {selectedTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7d8ea6]">?뚯슂 ?쒓컙</span>
              <span className="text-sm font-semibold text-[#1f2f46]">30遺?/span>
            </div>
          </div>

          {/* 硫대떞 ?ъ쑀 */}
          <Textarea
            label="硫대떞 ?ъ쑀"
            placeholder="硫대떞 紐⑹쟻?대굹 ?곷떞?섍퀬 ?띠? ?댁슜??媛꾨왂???묒꽦?댁＜?몄슂."
            value={bookingReason}
            onChange={(e) => setBookingReason(e.target.value)}
            rows={3}
            maxLength={200}
          />

          {/* ?≪뀡 踰꾪듉 */}
          <div className="flex gap-3">
            <Button
              size="md"
              className="flex-1 !rounded-2xl !border !border-[#d7dfe8] !bg-white !text-[#4e5a61] hover:!bg-[#f7f9fb]"
              onClick={handleCloseModal}
            >
              ?リ린
            </Button>
            <Button
              size="md"
              className="flex-1 !rounded-2xl !bg-[#4e5a61] hover:!bg-[#414b51] active:!bg-[#394248]"
              onClick={handleBookingConfirm}
              disabled={!bookingReason.trim()}
            >
              ?덉빟 ?뺤젙
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
