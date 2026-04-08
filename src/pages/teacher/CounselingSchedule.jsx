import { useState, useMemo } from 'react'
import {
  mockTeacherBlockedSlots,
  mockTeacherCounselingBookings,
} from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Tabs from '@/components/common/Tabs'
import Table from '@/components/common/Table'
import Drawer from '@/components/common/Drawer'
import { useToast } from '@/context/ToastContext'
import { ChevronLeft, ChevronRight, User, X, Circle } from 'lucide-react'

const TODAY = '2026-04-08'

const MONTH_NAMES = [
  '1월','2월','3월','4월','5월','6월',
  '7월','8월','9월','10월','11월','12월',
]
const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일']

const TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
]

const STATUS_CONFIG = {
  confirmed: { label: '확정', variant: 'success' },
  pending:   { label: '대기중', variant: 'warning' },
  cancelled: { label: '취소됨', variant: 'error' },
}

function formatDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  return days
}

function formatDayOfWeek(dateStr) {
  const d = new Date(dateStr)
  return DAYS_OF_WEEK[(d.getDay() + 6) % 7]
}

export default function CounselingSchedule() {
  const { showToast } = useToast()
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(3) // 0-indexed, 3 = 4월
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [blockedSlots, setBlockedSlots] = useState(mockTeacherBlockedSlots)
  const [bookings, setBookings] = useState(mockTeacherCounselingBookings)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  // 날짜별 예약/차단 여부 (캘린더 점 표시용)
  const datesWithBookings = useMemo(
    () => new Set(bookings.filter(b => b.status !== 'cancelled').map(b => b.date)),
    [bookings]
  )
  const datesWithBlocked = useMemo(
    () => new Set(Object.keys(blockedSlots).filter(d => blockedSlots[d]?.length > 0)),
    [blockedSlots]
  )

  // 선택 날짜의 슬롯 상태 계산
  function getSlotStatus(slot) {
    const booking = bookings.find(
      b => b.date === selectedDate && b.time === slot && b.status !== 'cancelled'
    )
    if (booking) return { type: 'booked', booking }
    if (blockedSlots[selectedDate]?.includes(slot)) return { type: 'blocked' }
    return { type: 'available' }
  }

  function handleSlotClick(slot) {
    const status = getSlotStatus(slot)
    if (status.type === 'booked') {
      setSelectedBooking(status.booking)
      return
    }
    // updater 함수 외부에서 현재 상태를 읽어 분기 — StrictMode 이중 실행 시 showToast 중복 방지
    const isBlocked = blockedSlots[selectedDate]?.includes(slot)
    if (isBlocked) {
      setBlockedSlots(prev => ({
        ...prev,
        [selectedDate]: (prev[selectedDate] || []).filter(s => s !== slot),
      }))
      showToast({ message: `${slot} 차단이 해제되었습니다.`, type: 'info' })
    } else {
      setBlockedSlots(prev => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), slot],
      }))
      showToast({ message: `${slot} 슬롯이 차단되었습니다.`, type: 'warning' })
    }
  }

  function handleConfirmBooking() {
    setBookings(prev =>
      prev.map(b =>
        b.id === selectedBooking.id ? { ...b, status: 'confirmed' } : b
      )
    )
    showToast({ message: '면담이 확정되었습니다.', type: 'success' })
    setSelectedBooking(null)
  }

  function handleCancelBooking() {
    setBookings(prev =>
      prev.map(b =>
        b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
      )
    )
    showToast({ message: '면담이 취소되었습니다.', type: 'error' })
    setSelectedBooking(null)
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
    else setCurrentMonth(m => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
    else setCurrentMonth(m => m + 1)
  }

  // 통계
  const activeBookings = bookings.filter(b => b.status !== 'cancelled')
  const pendingCount = activeBookings.filter(b => b.status === 'pending').length
  const confirmedCount = activeBookings.filter(b => b.status === 'confirmed').length

  // 하단 탭 필터
  const filteredBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return false
    if (activeTab === 'pending') return b.status === 'pending'
    if (activeTab === 'confirmed') return b.status === 'confirmed'
    return true
  })

  const tabs = [
    { key: 'all', label: '전체', count: activeBookings.length },
    { key: 'pending', label: '대기중', count: pendingCount },
    { key: 'confirmed', label: '확정', count: confirmedCount },
  ]

  const tableColumns = [
    {
      key: 'student_name',
      label: '학생명',
      render: (val) => <span className="text-body-sm font-medium text-gray-800">{val}</span>,
    },
    {
      key: 'date',
      label: '날짜·시간',
      render: (val, row) => (
        <span className="text-body-sm text-gray-600">
          {val} {row.time}
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
              e.stopPropagation()
              setBookings(prev =>
                prev.map(b => b.id === row.id ? { ...b, status: 'confirmed' } : b)
              )
              showToast({ message: '면담이 확정되었습니다.', type: 'success' })
            }}
          >
            확정
          </Button>
        ) : null,
    },
  ]

  // 선택 날짜 표시 텍스트
  const selectedMonth = parseInt(selectedDate.split('-')[1])
  const selectedDay = parseInt(selectedDate.split('-')[2])
  const selectedDow = formatDayOfWeek(selectedDate)

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">상담일정</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <p className="text-caption text-gray-500 mb-1">전체 신청</p>
          <p className="text-h2 font-bold text-gray-900">{activeBookings.length}건</p>
        </Card>
        <Card>
          <p className="text-caption text-gray-500 mb-1">대기중</p>
          <p className="text-h2 font-bold text-warning-600">{pendingCount}건</p>
        </Card>
        <Card>
          <p className="text-caption text-gray-500 mb-1">확정</p>
          <p className="text-h2 font-bold text-success-600">{confirmedCount}건</p>
        </Card>
      </div>

      {/* 캘린더 + 슬롯 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 월간 캘린더 */}
        <Card>
          {/* 헤더 */}
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

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((d, i) => (
              <div
                key={d}
                className={`text-center text-caption font-medium py-1
                  ${i === 5 ? 'text-primary-400' : i === 6 ? 'text-red-400' : 'text-gray-400'}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />
              const dateStr = formatDateStr(currentYear, currentMonth, day)
              const isToday = dateStr === TODAY
              const isSelected = dateStr === selectedDate
              const isPast = dateStr < TODAY
              const dow = idx % 7
              const hasBooking = datesWithBookings.has(dateStr)
              const hasBlocked = datesWithBlocked.has(dateStr)

              return (
                <button
                  key={dateStr}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
                  disabled={isPast}
                  className={`
                    relative flex flex-col items-center justify-center h-9 rounded-xl text-body-sm font-medium
                    transition-colors cursor-pointer
                    ${isPast ? 'text-gray-300 cursor-default' : ''}
                    ${!isPast && !isSelected ? 'hover:bg-primary-50' : ''}
                    ${isSelected ? 'bg-primary-500 text-white' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-primary-300 text-primary-600' : ''}
                    ${!isPast && !isSelected && dow === 5 ? 'text-primary-400' : ''}
                    ${!isPast && !isSelected && dow === 6 ? 'text-red-400' : ''}
                  `}
                >
                  {day}
                  {/* 인디케이터 점 */}
                  {!isPast && (hasBooking || hasBlocked) && (
                    <span
                      className={`absolute bottom-1 w-1 h-1 rounded-full
                        ${hasBooking
                          ? isSelected ? 'bg-white' : 'bg-primary-400'
                          : isSelected ? 'bg-white/60' : 'bg-gray-300'
                        }`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-400" />
              <span className="text-caption text-gray-500">면담 신청</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-caption text-gray-500">차단된 날짜</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full ring-2 ring-primary-300 inline-block" />
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
              const status = getSlotStatus(slot)

              if (status.type === 'booked') {
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                      bg-primary-50 border border-primary-200
                      hover:bg-primary-100 transition-colors cursor-pointer text-left"
                  >
                    <User className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="text-body-sm font-medium text-primary-700 shrink-0">
                      {slot}
                    </span>
                    <span className="text-body-sm text-primary-600 truncate">
                      {status.booking.student_name}
                    </span>
                  </button>
                )
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
                )
              }

              return (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                    border border-transparent hover:bg-primary-50 hover:border-primary-100
                    transition-colors cursor-pointer text-left"
                >
                  <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <span className="text-body-sm text-gray-700 shrink-0">{slot}</span>
                  <span className="text-body-sm text-gray-400">가능</span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* 하단 면담 신청 목록 */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">신청된 면담</h2>
        <div className="overflow-x-auto">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />
        </div>
        <Table
          columns={tableColumns}
          data={filteredBookings}
          onRowClick={(row) => setSelectedBooking(row)}
          emptyMessage="신청된 면담이 없습니다."
        />
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
            {/* 학생 프로필 */}
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-8 h-8 text-primary-500" />
              </div>
              <div>
                <p className="text-h3 font-bold text-gray-900 mb-1">
                  {selectedBooking.student_name}
                </p>
                <p className="text-body-sm text-gray-400">수강생</p>
              </div>
              <Badge
                variant={STATUS_CONFIG[selectedBooking.status]?.variant ?? 'default'}
              >
                {STATUS_CONFIG[selectedBooking.status]?.label}
              </Badge>
            </div>

            {/* 일시 */}
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
                    {selectedBooking.time}&nbsp;
                    <span className="text-body-sm font-normal text-gray-500">
                      ({selectedBooking.duration}분)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* 신청 사유 */}
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

            {/* 액션 버튼 */}
            {selectedBooking.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCancelBooking}
                >
                  면담 취소
                </Button>
                <Button className="flex-1" onClick={handleConfirmBooking}>
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
  )
}
