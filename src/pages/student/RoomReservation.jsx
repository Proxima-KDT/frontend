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
  Building2,
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
const pageBg = '#F7F5F0';

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
    bg: 'bg-[#e8eef2]',
    iconColor: 'text-[#4e5a61]',
    badgeVariant: 'info',
  },
  meeting: {
    label: '회의실',
    icon: Building2,
    bg: 'bg-[#ede8ee]',
    iconColor: 'text-[#6b5b73]',
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
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f1ec] px-2 py-0.5 text-xs text-[#7f786d]">
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}

// 방 정보 카드 (타입별 그룹 섹션과 단독 탭 뷰 양쪽에서 공유)
function RoomInfoCard({ room, isAvailableNow }) {
  const meta = roomTypeMeta[room.type];
  const Icon = meta.icon;
  return (
    <Card
      padding="p-4"
      className={room.status === 'closed' ? 'opacity-60' : ''}
    >
      <img
        src={getRoomImage(room)}
        alt=""
        className="mb-3 h-24 w-full rounded-xl object-cover"
        loading="lazy"
      />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${meta.bg}`}>
            <Icon size={16} className={meta.iconColor} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{room.name}</p>
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
        ) : isAvailableNow ? (
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

const roomImageByName = {
  'Study Room A':
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  'Study Room B':
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
  'Meeting Room 1':
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=900&q=80',
  'Meeting Room 2':
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=900&q=80',
  'Meeting Room 3':
    'https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=900&q=80',
};

function getRoomImage(room) {
  if (roomImageByName[room.name]) return roomImageByName[room.name];
  return room.type === 'meeting'
    ? roomImageByName['Meeting Room 1']
    : roomImageByName['Study Room A'];
}

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
  const [showRules, setShowRules] = useState(false);
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
    // 자습실 먼저(A→D)·회의실 뒤, 같은 타입은 이름 순
    return [...list].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'study' ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '', 'ko', {
        numeric: true,
        sensitivity: 'base',
      });
    });
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
    // 선택한 날짜의 기존 예약 건수 프론트 선제 검증
    const todayReservations = myReservations.filter(
      (r) => r.date === selectedDate && r.status !== 'cancelled',
    );
    if (todayReservations.length >= 3) {
      showToast({
        type: 'error',
        message: '하루 최대 3건까지만 예약할 수 있습니다.',
      });
      setShowReserveModal(false);
      setSelectedCell(null);
      return;
    }
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
      // 취소된 예약은 목록에서 즉시 제거
      setMyReservations((prev) => prev.filter((r) => r.id !== cancelTarget.id));
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

  // 내 예약 탭 필터 (오늘/예정만 - 지난 예약 탭 제거)
  const myResFiltered = useMemo(() => {
    if (myResTab === 'today')
      return myReservations.filter(
        (r) => r.date === TODAY && r.status !== 'cancelled',
      );
    if (myResTab === 'upcoming')
      return myReservations.filter(
        (r) => r.date > TODAY && r.status === 'confirmed',
      );
    return myReservations.filter((r) => r.status !== 'cancelled');
  }, [myResTab, myReservations]);

  // ─── 셀 스타일 ────────────────────────────────────────────────────────────
  const getCellStyle = (status) => {
    switch (status) {
      case 'available':
        return 'bg-[#f5fafd] hover:bg-[#edf6fb] border border-[#dfeef7] cursor-pointer text-[#4a697f]';
      case 'mine':
        return 'bg-[#4e5a61] border border-[#4e5a61] cursor-pointer text-white';
      case 'reserved':
        return 'bg-[#f1f0ec] border border-[#e6e2d9] cursor-not-allowed text-[#b0aaa1]';
      case 'closed':
        return 'bg-[#efede7] cursor-not-allowed text-[#b7b2aa]';
      case 'past':
        return 'bg-[#f8f7f4] border border-[#efede8] cursor-not-allowed text-[#c9c4bc]';
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
        return <span className="text-[0.7rem] font-semibold">예약 가능</span>;
      case 'mine':
        return (
          <span className="flex flex-col items-center gap-0.5">
            <CheckCircle size={12} />
            <span className="text-[0.7rem] font-semibold">내 예약</span>
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
    <div
      className="space-y-6 rounded-3xl px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8"
      style={{ backgroundColor: pageBg }}
    >
      <header>
        <h1 className={`text-[2.1rem] font-semibold tracking-tight text-[#2c2b28]`}>
          자습실 / 회의실 예약
        </h1>
        <p className="mt-1 text-[0.95rem] text-[#6b6560]">
          고요함 속에 피어나는 지성, 최적의 공간을 예약해 학습 흐름을 유지하세요.
        </p>
      </header>

      {/* ── 이용 규칙 배너 ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#eceae4] bg-white">
        <button
          onClick={() => setShowRules((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#4e5a61]">
            <Info size={16} />
            시설 이용 규칙 안내
          </div>
          {showRules ? (
            <ChevronUp size={16} className="text-[#7d8b93]" />
          ) : (
            <ChevronDown size={16} className="text-[#7d8b93]" />
          )}
        </button>
        {showRules && (
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              {
                icon: Clock,
                text: '이용 시간: 09:00 ~ 21:00 (1시간 단위 예약)',
              },
              { icon: CalendarCheck, text: '1인 최대 3건/일 예약 가능' },
              {
                icon: XCircle,
                text: '예약 후 노쇼(미이용) 시 당일 예약 기능 제한',
              },
              { icon: Building2, text: '회의실은 반드시 2인 이상 이용' },
              { icon: DoorOpen, text: '이용 종료 후 원상복구 및 전원 끄기' },
              { icon: CheckCircle, text: '예약은 이용 30분 전까지 취소 가능' },
            ].map(({ icon, text }, i) => {
              const RuleIcon = icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-[#5f7483]"
                >
                  <RuleIcon size={14} className="shrink-0 text-[#6f8391]" />
                  {text}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 통계 요약 카드 ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: '전체 이용 가능',
            total: stats.total,
            available: stats.availableNow,
            icon: DoorOpen,
            bg: 'bg-[#f3f1ec]',
            iconColor: 'text-[#7f786d]',
          },
          {
            label: '자습실',
            total: stats.studyTotal,
            available: stats.studyAvailable,
            icon: BookOpen,
            bg: 'bg-[#eef2f4]',
            iconColor: 'text-[#6f8391]',
          },
          {
            label: '회의실',
            total: stats.meetingTotal,
            available: stats.meetingAvailable,
            icon: Building2,
            bg: 'bg-[#f4f0f7]',
            iconColor: 'text-[#6b5b73]',
          },
        ].map(({ label, total, available, icon, bg, iconColor }) => {
          const StatIcon = icon;
          return (
            <Card key={label} padding="p-5" className="rounded-2xl border border-[#eceae4] !bg-white shadow-[0_2px_20px_rgba(60,52,40,0.04)]">
              <div className="flex items-center gap-2 mb-2">
                <StatIcon size={16} className="text-[#6f6860]" />
                <span
                  className={`text-xs font-medium ${
                    label === '회의실'
                      ? 'text-[#5c4d66]'
                      : label === '자습실'
                        ? 'text-[#4e5a61]'
                        : 'text-[#8a847a]'
                  }`}
                >
                  {label}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-[2rem] font-semibold text-[#2c2b28]`}>
                  {available}
                </span>
                <span className="text-sm text-[#b0aaa1] mb-1">/ {total}</span>
              </div>
              <p className="mt-1 text-xs text-[#9c988e]">현재 이용 가능</p>
            </Card>
          );
        })}
      </div>

      {/* ── 날짜 선택 칩 바 ─────────────────────────────────────── */}
      <div>
        <p className={`mb-2 text-[1.55rem] font-semibold text-[#2c2b28]`}>
          예약일 선택
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
            {WEEK_DATES.map(({ date, dayLabel, dayNum, isWeekend }) => {
              const isSelected = selectedDate === date;
              return (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className={`flex min-w-[76px] flex-col items-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#4e5a61] text-white border-[#4e5a61] shadow-[0_8px_24px_rgba(78,90,97,0.25)]'
                      : isWeekend
                        ? 'bg-white text-[#a67d70] border-[#eceae4] hover:border-[#d9c4bb]'
                        : 'bg-white text-[#6b6560] border-[#eceae4] hover:border-[#ddd9cf]'
                  }`}
                >
                  <span
                    className={`text-xs mb-0.5 ${isSelected ? 'text-white/80' : 'text-[#a39c92]'}`}
                  >
                    {dayLabel}
                  </span>
                  <span className="text-[1.6rem] font-semibold leading-none">
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
        <div className="flex gap-1 rounded-full border border-[#eceae4] bg-[#fbfaf7] p-1 w-fit">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-[#2c2b28] shadow-sm'
                  : 'text-[#8a847a] hover:text-[#5c5852]'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-[#4e5a61]' : 'text-[#b0aaa1]'}`}
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
              ? 'bg-[#f2f0ec] text-[#b0aaa1] border-[#e4e1d8] cursor-not-allowed opacity-60'
              : showAvailableNow
                ? 'bg-[#4e5a61] text-white border-[#4e5a61] shadow-sm'
                : 'bg-white text-[#6b6560] border-[#e4e1d8] hover:border-[#c8c2b7] hover:text-[#4e5a61]'
          }`}
        >
          <Zap
            size={14}
            className={
              showAvailableNow && selectedDate === TODAY
                ? 'text-white'
                : 'text-[#4e5a61]'
            }
          />
          지금 이용 가능
          {selectedDate === TODAY && (
            <span
              className={`text-xs rounded-full px-1.5 ${
                showAvailableNow
                  ? 'bg-white/30 text-white'
                  : 'bg-[#eef2f4] text-[#4e5a61]'
              }`}
            >
              {activeTab === 'study'
                ? stats.studyAvailable
                : activeTab === 'meeting'
                  ? stats.meetingAvailable
                  : stats.availableNow}
              개
            </span>
          )}
        </button>
      </div>

      {/* ── 타임테이블 ──────────────────────────────────────────────────── */}
      {roomsLoading ? (
        <Card padding="p-12" className="text-center">
          <p className="text-[#a39c92]">방 목록을 불러오는 중...</p>
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card padding="p-12" className="text-center">
          <Zap size={32} className="mx-auto mb-3 text-[#c5bfb4]" />
          <p className="font-medium text-[#7f786d]">
            현재 이용 가능한 방이 없습니다
          </p>
          <p className="mt-1 text-sm text-[#a39c92]">
            필터를 해제하거나 다른 탭을 선택해 보세요
          </p>
        </Card>
      ) : (
        <Card padding="p-0" className="overflow-hidden rounded-2xl border border-[#eceae4]">
          {/* 범례 */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#f0ede8] bg-[#fbfaf7]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b6560]">
              <Calendar size={13} className="text-[#8a847a]" />
              {selectedDate}
              {selectedDate === TODAY && (
                <span className="ml-1 rounded-full bg-[#f4ecd7] px-1.5 py-0.5 text-[10px] font-bold text-[#7a6330]">
                  TODAY
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#9c988e] font-medium">범례:</span>
              {[
                { color: 'bg-[#f5fafd] border-[#dfeef7]', label: '예약 가능' },
                { color: 'bg-[#4e5a61] border-[#4e5a61]', label: '내 예약' },
                { color: 'bg-[#f1f0ec] border-[#e6e2d9]', label: '예약됨' },
                { color: 'bg-[#f8f7f4] border-[#efede8]', label: '종료' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded border ${color}`} />
                  <span className="text-xs text-[#8a847a]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full text-xs border-collapse"
              style={{
                minWidth: `${Math.max(480, filteredRooms.length * 112 + 80)}px`,
              }}
            >
              <thead>
                <tr className="bg-[#faf9f6]">
                  <th
                    className="sticky left-0 z-10 w-20 min-w-20 border-b border-r border-[#eceae4] bg-[#faf9f6] px-3 py-3 text-left font-medium text-[#8a847a]"
                    aria-hidden="true"
                  />
                  {filteredRooms.map((room) => {
                    const meta = roomTypeMeta[room.type];
                    const Icon = meta.icon;
                    // 자습실→회의실 경계에 구분선 추가
                    const isFirstMeeting =
                      activeTab === 'all' &&
                      room.type === 'meeting' &&
                      filteredRooms.filter((r) => r.type === 'meeting')[0]
                        ?.id === room.id;
                    return (
                      <th
                        key={room.id}
                        className={`min-w-25 border-b border-r border-[#eceae4] px-2 py-3 text-center font-medium last:border-r-0 ${
                          room.status === 'closed' ? 'opacity-50' : ''
                        } ${isFirstMeeting ? 'border-l-2 border-l-[#d4c6d8]' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className={`p-1.5 rounded-lg ${meta.bg}`}>
                            <Icon size={14} className={meta.iconColor} />
                          </div>
                          <span
                            className={`font-semibold ${
                              room.type === 'meeting'
                                ? 'text-[#5c4d66]'
                                : 'text-[#4e5a61]'
                            }`}
                          >
                            {room.name}
                          </span>
                          <div className="flex items-center gap-1 text-[#a39c92]">
                            <MapPin size={9} />
                            <span>{room.floor}F</span>
                            <span>·</span>
                            <Users size={9} />
                            <span>{room.capacity}인</span>
                          </div>
                          {room.status === 'closed' && (
                            <span className="text-[10px] font-medium text-[#a67d70]">
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
                        isCurrent ? 'bg-[#fdf8ea]' : 'hover:bg-[#fbfaf7]'
                      }
                    >
                      {/* 시간 레이블 */}
                      <td className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-[#eceae4] bg-inherit px-3 py-2 font-medium text-[#8a847a]">
                        <div className="flex items-center gap-1.5">
                          {slot}
                          {isCurrent && (
                            <span className="rounded bg-[#f4ecd7] px-1 text-[9px] font-bold text-[#7a6330]">
                              NOW
                            </span>
                          )}
                        </div>
                      </td>
                      {/* 방별 셀 */}
                      {filteredRooms.map((room) => {
                        const status = getSlotStatus(room.id, slot);
                        const isFirstMeeting =
                          activeTab === 'all' &&
                          room.type === 'meeting' &&
                          filteredRooms.filter((r) => r.type === 'meeting')[0]
                            ?.id === room.id;
                        return (
                          <td
                            key={room.id}
                            onClick={() => handleCellClick(room, slot)}
                            className={`h-10 border-b border-r border-[#f0ede8] text-center align-middle transition-colors duration-100 last:border-r-0 ${getCellStyle(status)} ${isFirstMeeting ? 'border-l-2 border-l-[#e8dfe8]' : ''}`}
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

      {/* ── 방 카드 (편의시설 확인) ────────────────────────────────── */}
      <div>
        {activeTab === 'all' ? (
          <div className="space-y-5">
            {['study', 'meeting'].map((type) => {
              const typeRooms = filteredRooms.filter((r) => r.type === type);
              if (!typeRooms.length) return null;
              const meta = roomTypeMeta[type];
              const TypeIcon = meta.icon;
              return (
                <div key={type}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <TypeIcon size={13} className={meta.iconColor} />
                    <h3
                      className={`text-sm font-semibold ${
                        type === 'study' ? 'text-[#4e5a61]' : 'text-[#5c4d66]'
                      }`}
                    >
                      {meta.label}
                      <span className="ml-1.5 text-xs font-normal text-gray-400">
                        {typeRooms.length}개
                      </span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {typeRooms.map((room) => (
                      <RoomInfoCard
                        key={room.id}
                        room={room}
                        isAvailableNow={availableNowIds.includes(room.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRooms.map((room) => (
              <RoomInfoCard
                key={room.id}
                room={room}
                isAvailableNow={availableNowIds.includes(room.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 내 예약 목록 ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-[#2c2b28]">내 예약</h2>

        {/* 내 예약 탭 */}
        <div className="mb-4 flex w-fit gap-1 rounded-xl bg-[#efede7] p-1">
          {myResTabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMyResTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                myResTab === tab.key
                  ? 'bg-white text-[#2c2b28] shadow-sm'
                  : 'text-[#8a847a] hover:text-[#5c5852]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {myResFiltered.length === 0 ? (
          <Card padding="p-8" className="bg-[#faf9f6] text-center">
            <CalendarCheck size={28} className="mx-auto mb-2 text-[#c5bfb4]" />
            <p className="text-sm text-[#a39c92]">예약 내역이 없습니다</p>
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
                          <p className="text-sm font-semibold text-[#2c2b28]">
                            {res.room_name}
                          </p>
                          {statusBadge(res.status)}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[#8a847a]">
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
                          <p className="mt-0.5 truncate text-xs text-[#a39c92]">
                            {res.purpose}
                          </p>
                        )}
                      </div>
                    </div>
                    {res.status === 'confirmed' && res.date >= TODAY && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCancelModal(res)}
                        className="shrink-0 text-[#a33b39] hover:bg-[#f9eeed]"
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
            <div className="space-y-2 rounded-xl bg-[#faf9f6] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8a847a]">공간</span>
                <span className="font-semibold text-[#2c2b28]">
                  {selectedCell.room.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a847a]">날짜</span>
                <span className="font-semibold text-[#2c2b28]">
                  {selectedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a847a]">시간</span>
                <span className="font-semibold text-[#2c2b28]">
                  {selectedCell.timeSlot} ~{' '}
                  {TIME_SLOTS[TIME_SLOTS.indexOf(selectedCell.timeSlot) + 1] ??
                    '21:00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a847a]">위치</span>
                <span className="font-semibold text-[#2c2b28]">
                  {selectedCell.room.floor}층
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#5c5852]">
                사용 목적{' '}
                <span className="font-normal text-[#a39c92]">(선택)</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="예: 개인 공부, 팀 프로젝트 회의, 면접 준비 등"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#d9d3c8] px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#d8d2c6]"
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
            <p className="text-sm text-[#6b6560]">
              <span className="font-semibold text-[#2c2b28]">
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
                아니요
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
