import { useState, useMemo } from 'react'
import { mockAttendance, mockAttendanceMonthly } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Table from '@/components/common/Table'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import SignatureCanvas from '@/components/forms/SignatureCanvas'
import { CheckCircle, AlertTriangle, XCircle, LogOut } from 'lucide-react'

const CHECKOUT_HOUR = 17
const CHECKOUT_MINUTE = 50

export default function Attendance() {
  const [name, setName] = useState('')
  const [signatureSubmitted, setSignatureSubmitted] = useState(false)
  const [checkoutDone, setCheckoutDone] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const now = new Date()
  const isAfterCheckoutTime =
    now.getHours() * 60 + now.getMinutes() >= CHECKOUT_HOUR * 60 + CHECKOUT_MINUTE

  const handleSignatureSave = (dataUrl) => {
    setSignatureSubmitted(true)
    console.log('서명 저장:', dataUrl)
  }

  const handleConfirmCheckout = () => {
    setCheckoutDone(true)
    setShowConfirm(false)
  }

  const year = mockAttendanceMonthly.year
  const month = mockAttendanceMonthly.month

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const attendanceMap = {}
    mockAttendance.forEach((a) => {
      attendanceMap[a.date] = a.status
    })

    const cells = []
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ day: null, status: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, status: attendanceMap[dateStr] || null })
    }

    return cells
  }, [year, month])

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']

  const getStatusDot = (status) => {
    if (status === 'present') return 'bg-green-500'
    if (status === 'late') return 'bg-yellow-500'
    if (status === 'absent') return 'bg-red-500'
    return ''
  }

  const getStatusBadge = (status) => {
    if (status === 'present') return { label: '출석', variant: 'success' }
    if (status === 'late') return { label: '지각', variant: 'warning' }
    if (status === 'absent') return { label: '결석', variant: 'error' }
    return { label: '-', variant: 'default' }
  }

  const columns = [
    { key: 'date', label: '날짜', width: '35%%' },
    {
      key: 'status',
      label: '상태',
      width: '30%%',
      render: (val) => {
        const { label, variant } = getStatusBadge(val)
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      key: 'time',
      label: '시간',
      width: '35%%',
      render: (val) => val || '-',
    },
  ]

  const tableData = mockAttendance
    .filter((a) => a.status)
    .map((a, idx) => ({ ...a, id: idx }))

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-gray-900">출석</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Signature */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">출석 서명</h2>

            {/* 이름 입력 */}
            <div className="mb-4">
              <label className="block text-body-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                disabled={signatureSubmitted}
                className={`w-full px-3 py-2 rounded-lg border text-body-sm transition-colors outline-none
                  ${signatureSubmitted
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
                  }`}
              />
            </div>

            <p className="text-body-sm text-gray-500 mb-4">
              아래 캔버스에 서명하여 출석을 기록하세요.
            </p>
            <SignatureCanvas
              onSave={handleSignatureSave}
              nameValid={name.trim().length > 0}
              submitted={signatureSubmitted}
              onCheckout={() => setShowConfirm(true)}
              checkoutDisabled={!isAfterCheckoutTime}
              checkoutDone={checkoutDone}
            />

            {/* 출석 완료 상태 표시 */}
            {checkoutDone && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-body-sm font-semibold text-green-700">출석 완료</p>
                  <p className="text-caption text-green-600">{name} · 퇴실 처리되었습니다</p>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-body-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>09:00 이전 서명 시 출석 처리</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>09:00 ~ 09:30 서명 시 지각 처리</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-gray-600">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>09:30 이후 미서명 시 결석 처리</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-gray-600">
                <LogOut className="w-4 h-4 text-student-500" />
                <span>17:50 이후 퇴실 서명 시 출석 완료</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Calendar & Stats */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">
              {year}년 {month}월
            </h2>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayLabels.map((d) => (
                <div
                  key={d}
                  className={`text-center text-caption font-medium py-1 ${
                    d === '일' ? 'text-red-400' : d === '토' ? 'text-blue-400' : 'text-gray-500'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarData.map((cell, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col items-center justify-center h-10 rounded-lg text-body-sm"
                >
                  {cell.day && (
                    <>
                      <span className="text-body-sm text-gray-700">{cell.day}</span>
                      {cell.status && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getStatusDot(cell.status)}`} />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500" />출석
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />지각
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-red-500" />결석
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">이번 달 통계</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                <span className="text-h3 font-bold text-green-600">{mockAttendanceMonthly.present}</span>
                <span className="text-caption text-gray-500">출석</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl">
                <span className="text-h3 font-bold text-yellow-600">{mockAttendanceMonthly.late}</span>
                <span className="text-caption text-gray-500">지각</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl">
                <span className="text-h3 font-bold text-red-600">{mockAttendanceMonthly.absent}</span>
                <span className="text-caption text-gray-500">결석</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-primary-50 rounded-xl">
                <span className="text-h3 font-bold text-primary-600">{mockAttendanceMonthly.rate}%%</span>
                <span className="text-caption text-gray-500">출석률</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 출석 이력 */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-3">출석 이력</h2>
        <Table columns={columns} data={tableData} />
      </Card>

      {/* 퇴실 확인 모달 */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="퇴실 처리"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-body text-gray-700">
            정말 퇴실 처리를 하겠습니까?
          </p>
          <p className="text-body-sm text-gray-500">
            {name} · {now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 퇴실
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              취소
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              퇴실 확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
