import { useState, useMemo, useEffect, useCallback } from 'react';
import { roomsApi } from '@/api/rooms';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import {
  BookOpen,
  Users,
  MapPin,
  Clock,
  Info,
  Zap,
  DoorOpen,
  CheckCircle,
  XCircle,
  CalendarCheck,
  Calendar,
  Wifi,
  Monitor,
  Projector,
  Wind,
  PenLine,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_HOUR = new Date().getHours();

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

const roomTypeMeta = {
  study: {
    label: '자습실',
    icon: BookOpen,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badgeVariant: 'info',
  },
  meeting: {
    label: '회의실',
    icon: Users,
    bg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    badgeVariant: 'default',
  },
};

const amenityIcons = {
  WiFi: Wifi,
  대형모니터: Monitor,
  프로젝터: Projector,
  에어컨: Wind,
  화이트보드: PenLine,
};

function AmenityTag({ label }) {
  const Icon = amenityIcons[label];
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function generateWeekDates(todayStr) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${todayStr}T00:00:00`);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    let dayLabel;
    if (i === 0) dayLabel = '오늘';
    else if (i === 1) dayLabel = '내일';
    else dayLabel = DAY_LABELS[dow];
    return { date: dateStr, dayLabel, dayNum: Number(dd), isWeekend };
  });
}

const WEEK_DATES = generateWeekDates(TODAY);

export default function RoomReservation() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showAvailableNow, setShowAvailableNow] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [myResTab, setMyResTab] = useState('today');
  const [showRules, setShowRules] = useState(true);
  const [selectedDate, setSelectedDate] = useState(TODAY);

  // 방 목록 및 내 예약 초기 로드
  useEffect(() => {
    Promise.all([roomsApi.getList(), roomsApi.getMyReservations()])
      .then(([roomsData, reservationsData]) => {
        setRooms(roomsData);
        setMyReservations(reservationsData);
      })
      .catch(() => {})
      .finally(() => setRoomsLoading(false));
  }, []);

  // 날짜 변경 시 슬롯 새로 로드
  // DB에서 TIME 컬럼이 "HH:MM:SS" 형식으로 오기 때문에 "HH:MM"으로 정규화
  const loadSlots = useCallback(async (date, roomList) => {
    if (!roomList.length) return;
    setSlotsLoading(true);
    try {
      const allSlots = await Promise.all(
        roomList.map((r) =>
          roomsApi
            .getSlots(r.id, date)
            .then((slots) => slots)
            .catch(() => []),
        ),
      );
      const normalized = allSlots.flat().map((s) => ({
        ...s,
        start_time: s.start_time ? s.start_time.slice(0, 5) : s.start_time,
        end_time: s.end_time ? s.end_time.slice(0, 5) : s.end_time,
      }));
      setBookedSlots(normalized);
    } catch {
      setBookedSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rooms.length > 0) {
      loadSlots(selectedDate, rooms);
    }
  }, [selectedDate, rooms, loadSlots]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (date !== TODAY) setShowAvailableNow(false);
  };

  // 슬롯 상태 결정: available | mine | reserved | closed | past
  const getSlotStatus = (roomId, timeSlot) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room.status === 'closed') return 'closed';

    // past는 오늘 기준으로만 적용 — 미래 날짜는 모든 슬롯 예약 가능
    if (selectedDate === TODAY) {
      const slotHour = parseInt(timeSlot.split(':')[0], 10);
      if (slotHour < CURRENT_HOUR) return 'past';
    }

    const slot = bookedSlots.find(
      (s) =>
        s.room_id === roomId &&
        s.date === selectedDate &&
        s.start_time === timeSlot,
    );
    if (!slot) return 'available';
    if (slot.reserved_by === user?.id || slot.is_mine) return 'mine';
    return 'reserved';
  };

  // 지금 이용 가능한 방 id 목록 (현재 시간 슬롯 기준)
  const currentTimeSlot = `${String(CURRENT_HOUR).padStart(2, '0')}:00`;
  const availableNowIds = useMemo(() => {
    return rooms
      .filter((r) => {
        if (r.status === 'closed') return false;
        return !bookedSlots.some(
          (s) =>
            s.room_id === r.id &&
            s.date === TODAY &&
            s.start_time === currentTimeSlot,
        );
      })
      .map((r) => r.id);
  }, [bookedSlots, currentTimeSlot]);

  // 탭 + 빠른 필터로 표시할 방 목록
  const filteredRooms = useMemo(() => {
    let list = rooms;
    if (activeTab === 'study') list = list.filter((r) => r.type === 'study');
    if (activeTab === 'meeting')
      list = list.filter((r) => r.type === 'meeting');
    if (showAvailableNow)
      list = list.filter((r) => availableNowIds.includes(r.id));
    return list;
  }, [rooms, activeTab, showAvailableNow, availableNowIds]);

  // 통계 요약
  const stats = useMemo(() => {
    const openRooms = rooms.filter((r) => r.status !== 'closed');
    const studyRooms = openRooms.filter((r) => r.type === 'study');
    const meetingRooms = openRooms.filter((r) => r.type === 'meeting');
    const countAvailableNow = (rooms) =>
      rooms.filter((r) => availableNowIds.includes(r.id)).length;
    return {
      total: openRooms.length,
      availableNow: countAvailableNow(openRooms),
      studyTotal: studyRooms.length,
      studyAvailable: countAvailableNow(studyRooms),
      meetingTotal: meetingRooms.length,
      meetingAvailable: countAvailableNow(meetingRooms),
    };
  }, [availableNowIds]);

  // 셀 클릭 → 예약 모달
  const handleCellClick = (room, timeSlot) => {
    const status = getSlotStatus(room.id, timeSlot);
    if (status !== 'available') return;
    setSelectedCell({ room, timeSlot });
    setPurpose('');
    setShowReserveModal(true);
  };

  // 예약 확정
  const handleConfirmReserve = async () => {
    const idx = TIME_SLOTS.indexOf(selectedCell.timeSlot);
    const endTime = TIME_SLOTS[idx + 1] ?? '21:00';
    try {
      const newReservation = await roomsApi.reserve({
        room_id: selectedCell.room.id,
        date: selectedDate,
        start_time: selectedCell.timeSlot,
        end_time: endTime,
        purpose: purpose || '개인 사용',
      });
      // 내 예약 목록 업데이트
      setMyReservations((prev) => [newReservation, ...prev]);
      // 타임테이블 즉시 반영 (새 슬롯을 낙관적으로 추가)
      setBookedSlots((prev) => [
        ...prev,
        {
          room_id: selectedCell.room.id,
          date: selectedDate,
          start_time: selectedCell.timeSlot,
          end_time: endTime,
          is_mine: true,
          reserved_by: user?.id,
          purpose: purpose || '개인 사용',
        },
      ]);
      showToast({
        type: 'success',
        message: `${selectedCell.room.name} ${selectedCell.timeSlot} 예약이 확정되었습니다.`,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        '예약에 실패했습니다. 다시 시도해주세요.';
      showToast({ type: 'error', message: msg });
    } finally {
      setShowReserveModal(false);
      setSelectedCell(null);
    }
  };

  // 예약 취소 클릭
  const openCancelModal = (reservation) => {
    setCancelTarget(reservation);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await roomsApi.cancelReservation(cancelTarget.id);
      setMyReservations((prev) =>
        prev.map((r) =>
          r.id === cancelTarget.id ? { ...r, status: 'cancelled' } : r,
        ),
      );
      // 타임테이블에서 해당 슬롯 즉시 제거
      setBookedSlots((prev) =>
        prev.filter(
          (s) =>
            !(
              s.room_id === cancelTarget.room_id &&
              s.date === cancelTarget.date &&
              s.start_time === (cancelTarget.start_time ?? '').slice(0, 5)
            ),
        ),
      );
      showToast({ type: 'success', message: '예약이 취소되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '예약 취소에 실패했습니다.' });
    } finally {
      setShowCancelModal(false);
      setCancelTarget(null);
    }
  };

  // 내 예약 탭 필터
  const myResFiltered = useMemo(() => {
    if (myResTab === 'today')
      return myReservations.filter(
        (r) => r.date === TODAY && r.status !== 'cancelled',
      );
    if (myResTab === 'upcoming')
      return myReservations.filter(
        (r) => r.date > TODAY && r.status === 'confirmed',
      );
    if (myResTab === 'past')
      return myReservations.filter(
        (r) =>
          r.date < TODAY ||
          r.status === 'completed' ||
          r.status === 'cancelled',
      );
    return myReservations;
  }, [myResTab, myReservations]);

  // ─── 셀 스타일 ────────────────────────────────────────────────────────────
  const getCellStyle = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 hover:bg-green-100 border border-green-200 cursor-pointer text-green-700';
      case 'mine':
        return 'bg-blue-100 border border-blue-300 cursor-pointer text-blue-800';
      case 'reserved':
        return 'bg-gray-100 border border-gray-200 cursor-not-allowed text-gray-400';
      case 'closed':
        return 'bg-gray-200 cursor-not-allowed text-gray-400 bg-[repeating-linear-gradient(45deg,#d1d5db_0,#d1d5db_1px,#e5e7eb_0,#e5e7eb_50%)] bg-[size:8px_8px]';
      case 'past':
        return 'bg-gray-50 border border-gray-100 cursor-not-allowed text-gray-300';
      default:
        return '';
    }
  };

  const getCellContent = (roomId, timeSlot) => {
    const status = getSlotStatus(roomId, timeSlot);
    const slot = bookedSlots.find(
      (s) =>
        s.room_id === roomId &&
        s.date === selectedDate &&
        s.start_time === timeSlot,
    );
    switch (status) {
      case 'available':
        return <span className="text-xs font-medium">예약 가능</span>;
      case 'mine':
        return (
          <span className="flex flex-col items-center gap-0.5">
            <CheckCircle size={12} />
            <span className="text-xs font-medium">내 예약</span>
          </span>
        );
      case 'reserved':
        return <span className="text-xs">{slot?.reserved_by ?? '예약됨'}</span>;
      case 'closed':
        return <span className="text-xs">운영 중단</span>;
      case 'past':
        return <span className="text-xs">종료</span>;
      default:
        return null;
    }
  };

  const tabItems = [
    {
      key: 'all',
      label: '전체',
      count: rooms.filter((r) => r.status !== 'closed').length,
    },
    {
      key: 'study',
      label: '자습실',
      count: rooms.filter((r) => r.type === 'study').length,
    },
    {
      key: 'meeting',
      label: '회의실',
      count: rooms.filter((r) => r.type === 'meeting' && r.status !== 'closed')
        .length,
    },
  ];

  const myResTabItems = [
    { key: 'today', label: '오늘' },
    { key: 'upcoming', label: '예정' },
    { key: 'past', label: '지난 예약' },
  ];

  const statusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="success" size="sm">
            예약 확정
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" size="sm">
            이용 완료
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="warning" size="sm">
            취소됨
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <h1 className="text-h2 font-bold text-gray-900">자습실/회의실 예약</h1>

      {/* ── 이용 규칙 배너 ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
        <button
          onClick={() => setShowRules((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
            <Info size={16} />
            시설 이용 규칙 안내
          </div>
          {showRules ? (
            <ChevronUp size={16} className="text-blue-500" />
          ) : (
            <ChevronDown size={16} className="text-blue-500" />
          )}
        </button>
        {showRules && (
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              {
                icon: Clock,
                text: '이용 시간: 09:00 ~ 21:00 (1시간 단위 예약)',
              },
              { icon: CalendarCheck, text: '1인 최대 2건/일 예약 가능' },
              {
                icon: XCircle,
                text: '예약 후 노쇼(미이용) 시 당일 예약 기능 제한',
              },
              { icon: Users, text: '회의실은 반드시 2인 이상 이용' },
              { icon: DoorOpen, text: '이용 종료 후 원상복구 및 전원 끄기' },
              { icon: CheckCircle, text: '예약은 이용 30분 전까지 취소 가능' },
            ].map(({ icon, text }, i) => {
              const RuleIcon = icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-blue-700"
                >
                  <RuleIcon size={14} className="shrink-0 text-blue-500" />
                  {text}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 통계 요약 카드 ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: '전체 이용 가능',
            total: stats.total,
            available: stats.availableNow,
            icon: DoorOpen,
            bg: 'bg-gray-50',
            iconColor: 'text-gray-500',
          },
          {
            label: '자습실',
            total: stats.studyTotal,
            available: stats.studyAvailable,
            icon: BookOpen,
            bg: 'bg-blue-50',
            iconColor: 'text-blue-500',
          },
          {
            label: '회의실',
            total: stats.meetingTotal,
            available: stats.meetingAvailable,
            icon: Users,
            bg: 'bg-purple-50',
            iconColor: 'text-purple-500',
          },
        ].map(({ label, total, available, icon, bg, iconColor }) => {
          const StatIcon = icon;
          return (
            <Card key={label} padding="p-4" className={bg}>
              <div className="flex items-center gap-2 mb-2">
                <StatIcon size={16} className={iconColor} />
                <span className="text-xs font-medium text-gray-600">
                  {label}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-gray-900">
                  {available}
                </span>
                <span className="text-sm text-gray-400 mb-0.5">/ {total}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">현재 이용 가능</p>
            </Card>
          );
        })}
      </div>

      {/* ── 날짜 선택 칩 바 ─────────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          날짜 선택 <span className="font-normal">(7일 이내)</span>
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
            {WEEK_DATES.map(({ date, dayLabel, dayNum, isWeekend }) => {
              const isSelected = selectedDate === date;
              return (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all text-sm font-medium shrink-0 ${
                    isSelected
                      ? 'bg-student-600 text-white border-student-600 shadow-sm'
                      : isWeekend
                        ? 'bg-white text-red-500 border-gray-200 hover:border-red-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-student-300 hover:text-student-600'
                  }`}
                >
                  <span
                    className={`text-xs mb-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}
                  >
                    {dayLabel}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 탭 + 빠른 필터 ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-student-600' : 'text-gray-400'}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() =>
            selectedDate === TODAY && setShowAvailableNow((v) => !v)
          }
          disabled={selectedDate !== TODAY}
          title={selectedDate !== TODAY ? '오늘 날짜에만 사용 가능' : undefined}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            selectedDate !== TODAY
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
              : showAvailableNow
                ? 'bg-green-500 text-white border-green-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600'
          }`}
        >
          <Zap
            size={14}
            className={
              showAvailableNow && selectedDate === TODAY
                ? 'text-white'
                : 'text-green-500'
            }
          />
          지금 이용 가능
          {showAvailableNow && selectedDate === TODAY && (
            <span className="bg-white/30 text-white text-xs rounded-full px-1.5">
              {availableNowIds.length}
            </span>
          )}
        </button>
      </div>

      {/* ── 타임테이블 ──────────────────────────────────────────────────── */}
      {roomsLoading ? (
        <Card padding="p-12" className="text-center">
          <p className="text-gray-400">방 목록을 불러오는 중...</p>
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card padding="p-12" className="text-center">
          <Zap size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            현재 이용 가능한 방이 없습니다
          </p>
          <p className="text-gray-400 text-sm mt-1">
            필터를 해제하거나 다른 탭을 선택해 보세요
          </p>
        </Card>
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          {/* 범례 */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Calendar size={13} className="text-gray-500" />
              {selectedDate}
              {selectedDate === TODAY && (
                <span className="ml-1 text-[10px] bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded-full">
                  TODAY
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">범례:</span>
              {[
                { color: 'bg-green-100 border-green-200', label: '예약 가능' },
                { color: 'bg-blue-100 border-blue-300', label: '내 예약' },
                { color: 'bg-gray-100 border-gray-200', label: '예약됨' },
                { color: 'bg-gray-50 border-gray-100', label: '종료' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded border ${color}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full text-xs border-collapse"
              style={{ minWidth: '480px' }}
            >
              <thead>
                <tr className="bg-gray-50">
                  {/* 시간 열 헤더 */}
                  <th className="sticky left-0 z-10 bg-gray-50 w-20 min-w-20 px-3 py-3 text-left text-gray-500 font-medium border-b border-r border-gray-200">
                    시간
                  </th>
                  {filteredRooms.map((room) => {
                    const meta = roomTypeMeta[room.type];
                    const Icon = meta.icon;
                    return (
                      <th
                        key={room.id}
                        className={`px-2 py-3 text-center font-medium border-b border-r border-gray-200 last:border-r-0 min-w-25 ${
                          room.status === 'closed' ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className={`p-1.5 rounded-lg ${meta.bg}`}>
                            <Icon size={14} className={meta.iconColor} />
                          </div>
                          <span className="text-gray-800 font-semibold">
                            {room.name}
                          </span>
                          <div className="flex items-center gap-1 text-gray-400">
                            <MapPin size={9} />
                            <span>{room.floor}F</span>
                            <span>·</span>
                            <Users size={9} />
                            <span>{room.capacity}인</span>
                          </div>
                          {room.status === 'closed' && (
                            <span className="text-red-500 text-[10px] font-medium">
                              운영 중단
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => {
                  const slotHour = parseInt(slot.split(':')[0], 10);
                  const isCurrent =
                    selectedDate === TODAY && slotHour === CURRENT_HOUR;
                  return (
                    <tr
                      key={slot}
                      className={
                        isCurrent ? 'bg-yellow-50' : 'hover:bg-gray-50/50'
                      }
                    >
                      {/* 시간 레이블 */}
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-gray-500 font-medium border-b border-r border-gray-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {slot}
                          {isCurrent && (
                            <span className="text-[9px] bg-yellow-400 text-yellow-900 font-bold px-1 rounded">
                              NOW
                            </span>
                          )}
                        </div>
                      </td>
                      {/* 방별 셀 */}
                      {filteredRooms.map((room) => {
                        const status = getSlotStatus(room.id, slot);
                        return (
                          <td
                            key={room.id}
                            onClick={() => handleCellClick(room, slot)}
                            className={`h-10 border-b border-r border-gray-100 last:border-r-0 text-center align-middle transition-colors duration-100 ${getCellStyle(status)}`}
                          >
                            {getCellContent(room.id, slot)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── 방 정보 카드 (편의시설 확인) ────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">방 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRooms.map((room) => {
            const meta = roomTypeMeta[room.type];
            const Icon = meta.icon;
            const availableNow = availableNowIds.includes(room.id);
            return (
              <Card
                key={room.id}
                padding="p-4"
                className={room.status === 'closed' ? 'opacity-60' : ''}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${meta.bg}`}>
                      <Icon size={16} className={meta.iconColor} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {room.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <MapPin size={10} />
                        <span>{room.floor}층</span>
                        <span>·</span>
                        <Users size={10} />
                        <span>최대 {room.capacity}인</span>
                      </div>
                    </div>
                  </div>
                  {room.status === 'closed' ? (
                    <Badge variant="warning" size="sm">
                      운영 중단
                    </Badge>
                  ) : availableNow ? (
                    <Badge variant="success" size="sm">
                      지금 가능
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      사용 중
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((a) => (
                    <AmenityTag key={a} label={a} />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── 내 예약 목록 ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">내 예약</h2>

        {/* 내 예약 탭 */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
          {myResTabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMyResTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                myResTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {myResFiltered.length === 0 ? (
          <Card padding="p-8" className="text-center bg-gray-50">
            <CalendarCheck size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">예약 내역이 없습니다</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {myResFiltered.map((res) => {
              const meta = roomTypeMeta[res.room_type];
              const Icon = meta.icon;
              return (
                <Card key={res.id} padding="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${meta.bg}`}>
                        <Icon size={16} className={meta.iconColor} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {res.room_name}
                          </p>
                          {statusBadge(res.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarCheck size={11} />
                            {res.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {res.start_time} ~ {res.end_time}
                          </span>
                        </div>
                        {res.purpose && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {res.purpose}
                          </p>
                        )}
                      </div>
                    </div>
                    {res.status === 'confirmed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCancelModal(res)}
                        className="shrink-0 text-red-500 hover:bg-red-50"
                      >
                        취소
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 예약 확인 모달 ───────────────────────────────────────────────── */}
      {showReserveModal && selectedCell && (
        <Modal
          isOpen={showReserveModal}
          onClose={() => setShowReserveModal(false)}
          title="예약 확인"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">공간</span>
                <span className="font-semibold text-gray-800">
                  {selectedCell.room.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">날짜</span>
                <span className="font-semibold text-gray-800">
                  {selectedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">시간</span>
                <span className="font-semibold text-gray-800">
                  {selectedCell.timeSlot} ~{' '}
                  {TIME_SLOTS[TIME_SLOTS.indexOf(selectedCell.timeSlot) + 1] ??
                    '21:00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">위치</span>
                <span className="font-semibold text-gray-800">
                  {selectedCell.room.floor}층
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사용 목적{' '}
                <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="예: 개인 공부, 팀 프로젝트 회의, 면접 준비 등"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-student-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowReserveModal(false)}
              >
                취소
              </Button>
              <Button fullWidth onClick={handleConfirmReserve}>
                예약 확정
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 예약 취소 확인 모달 ─────────────────────────────────────────── */}
      {showCancelModal && cancelTarget && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="예약 취소"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">
                {cancelTarget.room_name}
              </span>{' '}
              ({cancelTarget.date} {cancelTarget.start_time} ~{' '}
              {cancelTarget.end_time}) 예약을 취소하시겠습니까?
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowCancelModal(false)}
              >
                닫기
              </Button>
              <Button
                fullWidth
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleConfirmCancel}
              >
                예약 취소
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
