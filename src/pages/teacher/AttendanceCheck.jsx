import { useState } from 'react'
import {
  CheckCircle,
  Clock,
  XCircle,
  Minus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  LogOut,
} from 'lucide-react'
import { mockClassroomSeats, mockAttendanceByDate } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Tabs from '@/components/common/Tabs'
import Table from '@/components/common/Table'
import Drawer from '@/components/common/Drawer'
import { useToast } from '@/context/ToastContext'

const TODAY = '2026-04-08'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dayName = DAY_NAMES[d.getDay()]
  return `${year}년 ${month}월 ${day}일 (${dayName})`
}

// 평일 기준으로 delta일 이동 (주말 건너뜀)
function moveDateByWorkday(dateStr, delta) {
  const d = new Date(dateStr)
  let moved = 0
  const step = delta > 0 ? 1 : -1
  while (moved < Math.abs(delta)) {
    d.setDate(d.getDate() + step)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) moved++
  }
  return d.toISOString().slice(0, 10)
}

const STATUS_CONFIG = {
  present: {
    label: '출석',
    badgeVariant: 'success',
    bg: 'bg-success-50 border-success-200 hover:bg-success-100',
    icon: CheckCircle,
    iconClass: 'text-success-500',
  },
  late: {
    label: '지각',
    badgeVariant: 'warning',
    bg: 'bg-warning-50 border-warning-200 hover:bg-warning-100',
    icon: Clock,
    iconClass: 'text-warning-500',
  },
  absent: {
    label: '결석',
    badgeVariant: 'error',
    bg: 'bg-error-50 border-error-200 hover:bg-error-100',
    icon: XCircle,
    iconClass: 'text-error-500',
  },
  early_leave: {
    label: '조퇴',
    badgeVariant: 'warning',
    bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    icon: LogOut,
    iconClass: 'text-amber-500',
  },
  null: {
    label: '미확인',
    badgeVariant: 'default',
    bg: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    icon: Minus,
    iconClass: 'text-gray-400',
  },
}

export default function AttendanceCheck() {
  const { showToast } = useToast()
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [attendanceData, setAttendanceData] = useState(mockAttendanceByDate)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // 선택된 날짜의 출석 레코드 (없는 날짜는 전원 미확인)
  const todayRecords = attendanceData[selectedDate] ?? mockClassroomSeats
    .filter((s) => s.student_id)
    .map((s) => ({
      student_id: s.student_id,
      student_name: s.student_name,
      seat_id: s.seat_id,
      status: null,
      check_in_time: null,
    }))

  // 통계
  const stats = {
    present: todayRecords.filter((r) => r.status === 'present').length,
    late: todayRecords.filter((r) => r.status === 'late').length,
    absent: todayRecords.filter((r) => r.status === 'absent').length,
    early_leave: todayRecords.filter((r) => r.status === 'early_leave').length,
    unknown: todayRecords.filter((r) => r.status === null).length,
  }

  // 좌석별 출석 정보 조회
  function getRecordForSeat(seatId) {
    return todayRecords.find((r) => r.seat_id === seatId) ?? null
  }

  function handleSeatClick(seat) {
    if (!seat.student_id) return
    const record = getRecordForSeat(seat.seat_id)
    setSelectedRecord({
      seat_id: seat.seat_id,
      student_id: seat.student_id,
      student_name: seat.student_name,
      status: record?.status ?? null,
      check_in_time: record?.check_in_time ?? null,
    })
    setPendingStatus(record?.status ?? null)
  }

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      setAttendanceData((prev) => {
        const existing = prev[selectedDate] ?? mockClassroomSeats
          .filter((s) => s.student_id)
          .map((s) => ({ student_id: s.student_id, student_name: s.student_name, seat_id: s.seat_id, status: null, check_in_time: null }))
        const updated = existing.map((r) =>
          r.student_id === selectedRecord.student_id
            ? { ...r, status: pendingStatus }
            : r
        )
        return { ...prev, [selectedDate]: updated }
      })
      showToast({ message: `${selectedRecord.student_name} 출석 상태가 수정되었습니다.`, type: 'success' })
      setSaving(false)
      setSelectedRecord(null)
      setPendingStatus(null)
    }, 500)
  }

  // 목록 탭 필터
  const tabList = [
    { key: 'all', label: '전체', count: todayRecords.length },
    { key: 'present', label: '출석', count: stats.present },
    { key: 'late', label: '지각', count: stats.late },
    { key: 'absent', label: '결석', count: stats.absent },
    { key: 'early_leave', label: '조퇴', count: stats.early_leave },
    { key: 'unknown', label: '미확인', count: stats.unknown },
  ]

  const filteredRecords = todayRecords.filter((r) => {
    if (activeTab === 'present') return r.status === 'present'
    if (activeTab === 'late') return r.status === 'late'
    if (activeTab === 'absent') return r.status === 'absent'
    if (activeTab === 'early_leave') return r.status === 'early_leave'
    if (activeTab === 'unknown') return r.status === null
    return true
  })

  const tableColumns = [
    {
      key: 'student_name',
      label: '학생명',
      render: (val) => <span className="text-body-sm font-medium text-gray-800">{val}</span>,
    },
    {
      key: 'seat_id',
      label: '좌석',
      render: (val) => <span className="text-body-sm text-gray-600">{val}</span>,
    },
    {
      key: 'check_in_time',
      label: '체크인 시간',
      render: (val) => <span className="text-body-sm text-gray-500">{val ?? '-'}</span>,
    },
    {
      key: 'status',
      label: '상태',
      render: (val) => {
        const cfg = STATUS_CONFIG[val] ?? STATUS_CONFIG.null
        return <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
      },
    },
  ]

  // 3행 × 3열 그리드
  const rows = [1, 2, 3, 4]
  const cols = [1, 2, 3]

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-4">출석 확인</h1>

      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setSelectedDate((d) => moveDateByWorkday(d, -1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-body font-semibold text-gray-900 min-w-[200px] text-center">
          {formatDateLabel(selectedDate)}
        </span>
        <button
          onClick={() => setSelectedDate((d) => moveDateByWorkday(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
        {selectedDate === TODAY && (
          <span className="ml-1 text-caption text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full">
            오늘
          </span>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <Card padding="p-4">
          <p className="text-caption text-gray-500 mb-1">출석</p>
          <p className="text-h2 font-bold text-success-600">{stats.present}명</p>
        </Card>
        <Card padding="p-4">
          <p className="text-caption text-gray-500 mb-1">지각</p>
          <p className="text-h2 font-bold text-warning-600">{stats.late}명</p>
        </Card>
        <Card padding="p-4">
          <p className="text-caption text-gray-500 mb-1">결석</p>
          <p className="text-h2 font-bold text-error-600">{stats.absent}명</p>
        </Card>
        <Card padding="p-4">
          <p className="text-caption text-gray-500 mb-1">조퇴</p>
          <p className="text-h2 font-bold text-amber-500">{stats.early_leave}명</p>
        </Card>
        <Card padding="p-4">
          <p className="text-caption text-gray-500 mb-1">미확인</p>
          <p className="text-h2 font-bold text-gray-500">{stats.unknown}명</p>
        </Card>
      </div>

      {/* 메인 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 강의실 배치도 */}
        <Card className="flex flex-col">
          <p className="text-body-sm font-semibold text-gray-700 mb-4">강의실 배치도</p>

          {/* 좌석 그리드 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {rows.flatMap((row) =>
              cols.map((col) => {
                const seat = mockClassroomSeats.find((s) => s.row === row && s.col === col)
                if (!seat) return null

                if (!seat.student_id) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="border-2 border-dashed border-gray-300 bg-gray-100 rounded-xl p-3 opacity-50 min-h-[90px] flex items-center justify-center"
                    >
                      <span className="text-caption text-gray-400">빈자리</span>
                    </div>
                  )
                }

                const record = getRecordForSeat(seat.seat_id)
                const status = record?.status ?? null
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.null
                const Icon = cfg.icon

                return (
                  <button
                    key={seat.seat_id}
                    onClick={() => handleSeatClick(seat)}
                    className={`border-2 rounded-xl p-3 text-left transition-colors cursor-pointer min-h-[90px] flex flex-col justify-between ${cfg.bg}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-caption text-gray-500 font-medium">{seat.seat_id}</span>
                      <Icon size={16} className={cfg.iconClass} />
                    </div>
                    <p className="text-body-sm font-semibold text-gray-800">{seat.student_name}</p>
                    <p className={`text-caption ${cfg.iconClass}`}>
                      {status === 'present' || status === 'late' || status === 'early_leave'
                        ? record?.check_in_time ?? cfg.label
                        : cfg.label}
                    </p>
                  </button>
                )
              })
            )}
          </div>

          {/* 강사석 */}
          <div className="bg-primary-100 text-primary-700 text-caption font-medium text-center py-2 rounded-lg tracking-widest">
            강 사 석
          </div>

          {/* 범례 — 카드 하단 고정 */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <Icon size={14} className={cfg.iconClass} />
                  <span className="text-caption text-gray-600">{cfg.label}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 border-2 border-dashed border-gray-400 rounded" />
              <span className="text-caption text-gray-600">빈자리</span>
            </div>
          </div>
        </Card>

        {/* 출석 목록 */}
        <Card>
          <p className="text-body-sm font-semibold text-gray-700 mb-4">출석 목록</p>
          <Tabs tabs={tabList} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />
          <Table
            columns={tableColumns}
            data={filteredRecords}
            onRowClick={(record) => {
              const seat = mockClassroomSeats.find((s) => s.student_id === record.student_id)
              if (seat) handleSeatClick(seat)
            }}
            emptyMessage="해당하는 학생이 없습니다."
          />
        </Card>
      </div>

      {/* 출석 상세 / 수정 Drawer */}
      <Drawer
        isOpen={selectedRecord !== null}
        onClose={() => { setSelectedRecord(null); setPendingStatus(null) }}
        title="출석 상세"
        width="w-[400px]"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* 학생 정보 */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <UserCheck size={22} className="text-primary-600" />
              </div>
              <div>
                <p className="text-body font-bold text-gray-900">{selectedRecord.student_name}</p>
                <p className="text-body-sm text-gray-500">좌석 {selectedRecord.seat_id}</p>
              </div>
            </div>

            {/* 체크인 시간 */}
            <div>
              <p className="text-caption font-medium text-gray-400 uppercase tracking-wider mb-2">체크인 시간</p>
              <p className="text-body font-semibold text-gray-800">
                {selectedRecord.check_in_time ?? '미서명'}
              </p>
            </div>

            {/* 상태 선택 */}
            <div>
              <p className="text-caption font-medium text-gray-400 uppercase tracking-wider mb-3">출석 상태 수정</p>
              <div className="grid grid-cols-2 gap-2">
                {(['present', 'late', 'absent', 'early_leave']).map((s) => {
                  const cfg = STATUS_CONFIG[s]
                  const isSelected = pendingStatus === s
                  const selectedStyle =
                    s === 'present' ? 'bg-success-500 border-success-500 text-white'
                    : s === 'late' ? 'bg-warning-500 border-warning-500 text-white'
                    : s === 'absent' ? 'bg-error-500 border-error-500 text-white'
                    : 'bg-amber-500 border-amber-500 text-white'
                  return (
                    <button
                      key={s}
                      onClick={() => setPendingStatus(s)}
                      className={`py-2.5 rounded-xl text-body-sm font-semibold border-2 transition-colors ${
                        isSelected
                          ? selectedStyle
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              loading={saving}
              disabled={pendingStatus === selectedRecord.status}
            >
              저장
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
