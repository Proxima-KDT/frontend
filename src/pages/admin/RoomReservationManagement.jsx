import { useState, useMemo, useEffect } from 'react';
import { adminApi } from '@/api/admin';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useToast } from '@/context/ToastContext';
import {
  BookOpen,
  Users,
  MapPin,
  Clock,
  Calendar,
  CalendarRange,
  DoorOpen,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Wifi,
  Monitor,
  Projector,
  Wind,
  PenLine,
  CheckCircle,
  Layers,
} from 'lucide-react';

const TODAY = '2026-04-08';

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

const amenityIcons = {
  WiFi: Wifi,
  대형모니터: Monitor,
  프로젝터: Projector,
  에어컨: Wind,
  화이트보드: PenLine,
  콘센트: Layers,
};

const roomTypeMeta = {
  study: {
    label: '자습실',
    icon: BookOpen,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  meeting: {
    label: '회의실',
    icon: Users,
    bg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
};

const AMENITY_OPTIONS = [
  'WiFi',
  '콘센트',
  '에어컨',
  '화이트보드',
  '대형모니터',
  '프로젝터',
];

// ── 하위 컴포넌트: 편의시설 태그 ─────────────────────────────────────────
function AmenityTag({ label }) {
  const Icon = amenityIcons[label] || Layers;
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
      <Icon size={10} />
      {label}
    </span>
  );
}

// ── 탭 목록 ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'status', label: '예약 현황', icon: CalendarRange },
  { key: 'rooms', label: '방 관리', icon: DoorOpen },
];

export default function RoomReservationManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('status');

  // ── 예약 현황 탭 상태 ─────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [activeRoomTab, setActiveRoomTab] = useState('all');

  // ── 방 관리 탭 상태 ───────────────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'study',
    capacity: 4,
    floor: 3,
    amenities: [],
  });

  useEffect(() => {
    adminApi
      .getRooms()
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() =>
        showToast({ message: '방 목록을 불러오지 못했습니다.', type: 'error' }),
      );
  }, [showToast]);

  useEffect(() => {
    adminApi
      .getRoomSlots({ date: selectedDate })
      .then((data) => setBookedSlots(Array.isArray(data) ? data : []))
      .catch(() =>
        showToast({ message: '예약 현황을 불러오지 못했습니다.', type: 'error' }),
      );
  }, [selectedDate, showToast]);

  // ── 예약 현황 로직 ────────────────────────────────────────────────────
  const filteredRoomsForStatus = useMemo(() => {
    if (activeRoomTab === 'all') return rooms;
    return rooms.filter((r) => r.type === activeRoomTab);
  }, [activeRoomTab, rooms]);

  const getSlot = (roomId, timeSlot) =>
    bookedSlots.find(
      (s) =>
        s.room_id === roomId &&
        s.date === selectedDate &&
        s.start_time === timeSlot,
    );

  const getSlotStatus = (roomId, timeSlot) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || room.status === 'closed') return 'closed';
    const slot = getSlot(roomId, timeSlot);
    return slot ? 'reserved' : 'available';
  };

  const getCellStyle = (status) => {
    switch (status) {
      case 'available':
        return 'bg-gray-50 text-gray-300';
      case 'reserved':
        return 'bg-admin-50 border border-admin-200 cursor-pointer hover:bg-admin-100 text-admin-800';
      case 'closed':
        return 'bg-gray-200 cursor-not-allowed text-gray-400 bg-[repeating-linear-gradient(45deg,#d1d5db_0,#d1d5db_1px,#e5e7eb_0,#e5e7eb_50%)] bg-[size:8px_8px]';
      default:
        return '';
    }
  };

  const handleCellClick = (roomId, timeSlot) => {
    const status = getSlotStatus(roomId, timeSlot);
    if (status !== 'reserved') return;
    const slot = getSlot(roomId, timeSlot);
    const room = rooms.find((r) => r.id === roomId);
    setCancelTarget({ ...slot, roomName: room?.name });
  };

  const handleCancelReservation = () => {
    adminApi
      .deleteReservation(cancelTarget.id)
      .then(() => {
        setBookedSlots((prev) => prev.filter((s) => s.id !== cancelTarget.id));
        setCancelTarget(null);
        showToast({
          type: 'success',
          message:
            '\uc608\uc57d\uc774 \ucde8\uc18c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
        });
      })
      .catch(() =>
        showToast({
          message: '\ucde8\uc18c\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.',
          type: 'error',
        }),
      );
  };

  // ── 방 관리 로직 ──────────────────────────────────────────────────────
  const handleToggleStatus = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    const nextStatus = room?.status === 'closed' ? 'open' : 'closed';
    adminApi
      .updateRoomStatus(roomId, nextStatus)
      .then(() => {
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, status: nextStatus } : r)),
        );
        const next = nextStatus === 'open' ? '운영 재개' : '운영 중단';
        showToast({
          type: 'info',
          message: `${room?.name}이(가) ${next}되었습니다.`,
        });
      })
      .catch(() =>
        showToast({ message: '상태 변경에 실패했습니다.', type: 'error' }),
      );
  };

  const openAddModal = () => {
    setRoomForm({
      name: '',
      type: 'study',
      capacity: 4,
      floor: 3,
      amenities: [],
    });
    setEditTarget(null);
    setShowAddModal(true);
  };

  const openEditModal = (room) => {
    setRoomForm({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      floor: room.floor,
      amenities: [...room.amenities],
    });
    setEditTarget(room);
    setShowAddModal(true);
  };

  const handleSaveRoom = () => {
    if (!roomForm.name.trim()) {
      showToast({ type: 'error', message: '방 이름을 입력해 주세요.' });
      return;
    }
    if (editTarget) {
      adminApi
        .updateRoom(editTarget.id, roomForm)
        .then(() => {
          return adminApi.getRooms().then((data) => {
            setRooms(Array.isArray(data) ? data : []);
            showToast({ type: 'success', message: '방 정보가 수정되었습니다.' });
          });
        })
        .catch(() =>
          showToast({ message: '수정에 실패했습니다.', type: 'error' }),
        );
    } else {
      adminApi
        .createRoom(roomForm)
        .then(() => {
          return adminApi.getRooms().then((data) => {
            setRooms(Array.isArray(data) ? data : []);
            showToast({ type: 'success', message: '새 방이 추가되었습니다.' });
          });
        })
        .catch(() =>
          showToast({ message: '방 추가에 실패했습니다.', type: 'error' }),
        );
    }
    setShowAddModal(false);
  };

  const toggleAmenity = (amenity) => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const roomTabItems = [
    { key: 'all', label: '전체' },
    { key: 'study', label: '자습실' },
    { key: 'meeting', label: '회의실' },
  ];

  return (
    <div className="space-y-6 rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      {/* 페이지 헤더 */}
      <h1 className="text-h2 font-bold text-gray-900">시설 예약 관리</h1>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════ 예약 현황 탭 ══════════════════ */}
      {activeTab === 'status' && (
        <div className="space-y-5">
          {/* 날짜 선택 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              날짜 선택 <span className="font-normal">(7일 이내)</span>
            </p>
            <div className="overflow-x-auto -mx-1 px-1">
              <div
                className="flex gap-2 pb-1"
                style={{ minWidth: 'max-content' }}
              >
                {WEEK_DATES.map(({ date, dayLabel, dayNum, isWeekend }) => {
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all text-sm font-medium shrink-0 ${
                        isSelected
                          ? 'bg-admin-600 text-white border-admin-600 shadow-sm'
                          : isWeekend
                            ? 'bg-white text-red-500 border-gray-200 hover:border-red-300'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-admin-300 hover:text-admin-600'
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

          {/* 방 종류 탭 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
            {roomTabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveRoomTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeRoomTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 타임테이블 */}
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border bg-admin-50 border-admin-200" />
                  <span className="text-xs text-gray-500">
                    예약됨 (클릭 시 취소)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border bg-gray-50 border-gray-100" />
                  <span className="text-xs text-gray-500">빈 슬롯</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full text-xs border-collapse"
                style={{ minWidth: '480px' }}
              >
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 w-20 min-w-20 px-3 py-3 text-left text-gray-500 font-medium border-b border-r border-gray-200">
                      시간
                    </th>
                    {filteredRoomsForStatus.map((room) => {
                      const meta = roomTypeMeta[room.type];
                      const Icon = meta.icon;
                      return (
                        <th
                          key={room.id}
                          className={`px-2 py-3 text-center font-medium border-b border-r border-gray-200 last:border-r-0 min-w-28 ${
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
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot} className="hover:bg-gray-50/50">
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-gray-500 font-medium border-b border-r border-gray-200 whitespace-nowrap">
                        {slot}
                      </td>
                      {filteredRoomsForStatus.map((room) => {
                        const status = getSlotStatus(room.id, slot);
                        const s = getSlot(room.id, slot);
                        return (
                          <td
                            key={room.id}
                            onClick={() => handleCellClick(room.id, slot)}
                            className={`h-10 border-b border-r border-gray-100 last:border-r-0 text-center align-middle transition-colors duration-100 ${getCellStyle(status)}`}
                          >
                            {status === 'reserved' && s && (
                              <span className="text-xs font-medium truncate px-1 block">
                                {s.reserved_by}
                              </span>
                            )}
                            {status === 'closed' && (
                              <span className="text-xs">운영 중단</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 예약 취소 확인 모달 */}
          <Modal
            isOpen={!!cancelTarget}
            onClose={() => setCancelTarget(null)}
            title="예약 강제 취소"
          >
            {cancelTarget && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  아래 예약을 강제 취소하겠습니까?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <DoorOpen size={14} className="text-gray-500" />
                    <span className="font-medium text-gray-800">
                      {cancelTarget.roomName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-500" />
                    <span className="text-gray-600">
                      {cancelTarget.date} · {cancelTarget.start_time} ~{' '}
                      {cancelTarget.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-500" />
                    <span className="text-gray-600">
                      {cancelTarget.reserved_by}
                      {cancelTarget.purpose && ` · ${cancelTarget.purpose}`}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-red-600">
                  * 학생에게는 별도 안내가 필요합니다.
                </p>
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="ghost" onClick={() => setCancelTarget(null)}>
                    닫기
                  </Button>
                  <Button variant="danger" onClick={handleCancelReservation}>
                    예약 취소
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      )}

      {/* ══════════════════ 방 관리 탭 ══════════════════ */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* 상단 액션 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총{' '}
              <span className="font-semibold text-gray-900">
                {rooms.length}
              </span>
              개 방{' · '}
              운영 중{' '}
              <span className="font-semibold text-green-600">
                {rooms.filter((r) => r.status !== 'closed').length}
              </span>
              {' · '}
              중단{' '}
              <span className="font-semibold text-red-500">
                {rooms.filter((r) => r.status === 'closed').length}
              </span>
            </p>
            <Button variant="primary" size="sm" onClick={openAddModal}>
              <Plus size={14} /> 방 추가
            </Button>
          </div>

          {/* 방 카드 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => {
              const meta = roomTypeMeta[room.type];
              const Icon = meta.icon;
              const isClosed = room.status === 'closed';
              return (
                <Card
                  key={room.id}
                  padding="p-4"
                  className={isClosed ? 'opacity-60' : ''}
                >
                  <img
                    src={getRoomImage(room)}
                    alt={room.name}
                    className="mb-3 h-28 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${meta.bg}`}>
                        <Icon size={18} className={meta.iconColor} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {room.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {room.floor}층 · 최대 {room.capacity}인
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isClosed ? 'warning' : 'success'}
                        size="sm"
                      >
                        {isClosed ? '운영 중단' : '운영 중'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.map((a) => (
                      <AmenityTag key={a} label={a} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleStatus(room.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        isClosed
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-red-500 hover:text-red-600'
                      }`}
                    >
                      {isClosed ? (
                        <ToggleLeft size={16} />
                      ) : (
                        <ToggleRight size={16} />
                      )}
                      {isClosed ? '운영 재개' : '운영 중단'}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(room)}
                    >
                      <Pencil size={13} /> 수정
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* 방 추가/수정 모달 */}
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title={editTarget ? '방 정보 수정' : '새 방 추가'}
            persistent
          >
            <div className="space-y-4">
              <Input
                label="방 이름"
                placeholder="예: 자습실 D"
                value={roomForm.name}
                onChange={(e) =>
                  setRoomForm((p) => ({ ...p, name: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="종류"
                  value={roomForm.type}
                  onChange={(e) =>
                    setRoomForm((p) => ({ ...p, type: e.target.value }))
                  }
                  options={[
                    { value: 'study', label: '자습실' },
                    { value: 'meeting', label: '회의실' },
                  ]}
                />
                <Input
                  label="층"
                  type="number"
                  min={1}
                  value={roomForm.floor}
                  onChange={(e) =>
                    setRoomForm((p) => ({
                      ...p,
                      floor: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <Input
                label="수용 인원"
                type="number"
                min={1}
                value={roomForm.capacity}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    capacity: Number(e.target.value),
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  편의시설
                </p>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((a) => {
                    const selected = roomForm.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-admin-500 text-white border-admin-500'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-admin-300'
                        }`}
                      >
                        {selected && <CheckCircle size={11} />}
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                  취소
                </Button>
                <Button variant="primary" onClick={handleSaveRoom}>
                  {editTarget ? '저장' : '추가'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
