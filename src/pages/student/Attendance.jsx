import { useState, useMemo, useEffect } from 'react'
import { attendanceApi } from '@/api/attendance'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Table from '@/components/common/Table'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import SignatureCanvas from '@/components/forms/SignatureCanvas'
import { CheckCircle, AlertTriangle, XCircle, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

const CHECKOUT_HOUR = 17
const CHECKOUT_MINUTE = 50

export default function Attendance() {
  const [name, setName] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [signatureSubmitted, setSignatureSubmitted] = useState(false)
  const [checkoutDone, setCheckoutDone] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [earlyLeaveDone, setEarlyLeaveDone] = useState(false)
  const [showEarlyLeaveConfirm, setShowEarlyLeaveConfirm] = useState(false)
  const [localAttendance, setLocalAttendance] = useState([])
  const { showToast } = useToast()

  // 달력 월 탐색 상태
  const now2 = new Date()
  const [viewYear, setViewYear] = useState(now2.getFullYear())
  const [viewMonth, setViewMonth] = useState(now2.getMonth() + 1)

  const now = new Date()
  const isAfterCheckoutTime =
    now.getHours() * 60 + now.getMinutes() >= CHECKOUT_HOUR * 60 + CHECKOUT_MINUTE

  // 오늘 출석 상태 조회 → 이미 체크인/퇴실한 경우 UI 반영
  useEffect(() => {
    attendanceApi.getToday()
      .then((data) => {
        if (data?.status) {
          setNameConfirmed(true)
          setSignatureSubmitted(true)
          if (data.status === 'early_leave') setEarlyLeaveDone(true)
          // 퇴실 완료 상태는 별도 필드 없으면 check_out_time으로 판단
          if (data.check_out_time) setCheckoutDone(true)
        }
      })
      .catch(() => {})
  }, [])

  // 월별 출석 데이터 fetch
  useEffect(() => {
    attendanceApi.getMonthly(viewYear, viewMonth)
      .then((data) => setLocalAttendance(data.records ?? []))
      .catch(() => {})
  }, [viewYear, viewMonth])

  const getTodayStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const getTimeStr = () =>
    new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

  const handleSignatureSave = async (dataUrl) => {
    try {
      // dataUrl → Blob → Supabase Storage 업로드
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const fileName = `signatures/${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('attendance')
        .upload(fileName, blob, { contentType: 'image/png' })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('attendance').getPublicUrl(fileName)
      await attendanceApi.checkIn(urlData.publicUrl)
      setSignatureSubmitted(true)
      showToast({ type: 'success', message: '출석 체크인이 완료되었습니다.' })
    } catch {
      // Storage 버킷이 없어도 체크인은 시도 (URL 없이)
      try {
        await attendanceApi.checkIn(null)
        setSignatureSubmitted(true)
        showToast({ type: 'success', message: '출석 체크인이 완료되었습니다.' })
      } catch {
        showToast({ type: 'error', message: '체크인에 실패했습니다.' })
      }
    }
  }

  const handleConfirmCheckout = async () => {
    try {
      await attendanceApi.checkOut()
      setCheckoutDone(true)
      showToast({ type: 'success', message: '퇴실 처리가 완료되었습니다.' })
    } catch {
      showToast({ type: 'error', message: '퇴실 처리에 실패했습니다.' })
    }
    setShowConfirm(false)
  }

  const handleConfirmEarlyLeave = async (reason = '개인 사정') => {
    try {
      await attendanceApi.earlyLeave(reason)
      const todayStr = getTodayStr()
      const timeStr = getTimeStr()
      setLocalAttendance((prev) => {
        const idx = prev.findIndex((a) => a.date === todayStr)
        if (idx >= 0) {
          return prev.map((a) => a.date === todayStr ? { ...a, status: 'early_leave' } : a)
        }
        return [...prev, { date: todayStr, status: 'early_leave', time: timeStr }]
      })
      setEarlyLeaveDone(true)
      showToast({ type: 'success', message: '조퇴 처리가 완료되었습니다.' })
    } catch {
      showToast({ type: 'error', message: '조퇴 처리에 실패했습니다.' })
    }
    setShowEarlyLeaveConfirm(false)
  }

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1)
      setViewMonth(12)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1)
      setViewMonth(1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // 현재 보는 달의 출석 데이터 필터링
  const filteredAttendance = useMemo(() => {
    return localAttendance.filter((a) => {
      const [y, m] = a.date.split('-').map(Number)
      return y === viewYear && m === viewMonth
    })
  }, [viewYear, viewMonth, localAttendance])

  // 달별 통계 계산
  const monthStats = useMemo(() => {
    const present = filteredAttendance.filter((a) => a.status === 'present').length
    const late = filteredAttendance.filter((a) => a.status === 'late').length
    const absent = filteredAttendance.filter((a) => a.status === 'absent').length
    const earlyLeave = filteredAttendance.filter((a) => a.status === 'early_leave').length
    const total = present + late + absent + earlyLeave
    const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0
    return { present, late, absent, earlyLeave, rate }
  }, [filteredAttendance])

  // 달력 셀 데이터
  const calendarData = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1)
    const lastDay = new Date(viewYear, viewMonth, 0)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const attendanceMap = {}
    filteredAttendance.forEach((a) => {
      attendanceMap[a.date] = a.status
    })

    const cells = []
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ day: null, status: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, status: attendanceMap[dateStr] || null })
    }

    return cells
  }, [viewYear, viewMonth, filteredAttendance])

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']

  const getStatusDot = (status) => {
    if (status === 'present') return 'bg-green-500'
    if (status === 'late') return 'bg-yellow-500'
    if (status === 'absent') return 'bg-red-500'
    if (status === 'early_leave') return 'bg-amber-500'
    return ''
  }

  const getStatusBadge = (status) => {
    if (status === 'present') return { label: '출석', variant: 'success' }
    if (status === 'late') return { label: '지각', variant: 'warning' }
    if (status === 'absent') return { label: '결석', variant: 'error' }
    if (status === 'early_leave') return { label: '조퇴', variant: 'warning' }
    return { label: '-', variant: 'default' }
  }

  const columns = [
    { key: 'date', label: '날짜', width: '35%' },
    {
      key: 'status',
      label: '상태',
      width: '30%',
      render: (val) => {
        const { label, variant } = getStatusBadge(val)
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      key: 'time',
      label: '시간',
      width: '35%',
      render: (val) => val || '-',
    },
  ]

  const tableData = filteredAttendance
    .filter((a) => a.status)
    .map((a, idx) => ({ ...a, id: idx }))

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-gray-900">출석</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Signature */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-gray-900">출석 서명</h2>
            {(checkoutDone || earlyLeaveDone) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-caption font-medium text-green-700">
                  {earlyLeaveDone ? '조퇴 완료' : '출석 완료'}
                </span>
              </div>
            )}
          </div>

          {/* 이름 입력 + 확인 버튼 */}
          <div className="mb-3">
            <label className="block text-body-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim() && !nameConfirmed) {
                    setNameConfirmed(true)
                  }
                }}
                placeholder="이름을 입력하세요"
                disabled={nameConfirmed}
                className={`flex-1 px-3 py-2 rounded-lg border text-body-sm transition-colors outline-none
                  ${nameConfirmed
                    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                    : 'border-gray-300 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
                  }`}
              />
              <button
                onClick={() => setNameConfirmed(true)}
                disabled={!name.trim() || nameConfirmed}
                className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap
                  ${!name.trim() || nameConfirmed
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-student-500 hover:bg-student-600 text-white cursor-pointer'
                  }`}
              >
                {nameConfirmed ? '확인됨' : '확인'}
              </button>
            </div>
          </div>

          <SignatureCanvas
            onSave={handleSignatureSave}
            disabled={!nameConfirmed}
            submitted={signatureSubmitted}
            onCheckout={() => setShowConfirm(true)}
            checkoutDisabled={!isAfterCheckoutTime}
            checkoutDone={checkoutDone}
            onEarlyLeave={() => setShowEarlyLeaveConfirm(true)}
            earlyLeaveDone={earlyLeaveDone}
          />

          {/* 안내 규칙 - 2열 그리드 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-body-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>09:00 이전 → 출석</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
              <span>09:00~09:30 → 지각</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-gray-600">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>09:30 이후 → 결석</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-gray-600">
              <LogOut className="w-4 h-4 text-student-500 shrink-0" />
              <span>17:50 이후 → 퇴실</span>
            </div>
          </div>
        </Card>

        {/* Right: Calendar & Stats */}
        <div className="space-y-4">
          <Card>
            {/* 달력 헤더 + 월 탐색 */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={goPrevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-h3 font-semibold text-gray-900">
                {viewYear}년 {viewMonth}월
              </h2>
              <button
                onClick={goNextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

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
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 flex-wrap">
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500" />출석
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />지각
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-red-500" />결석
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-amber-500" />조퇴
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">
              {viewMonth}월 통계
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                <span className="text-h3 font-bold text-green-600">{monthStats.present}</span>
                <span className="text-caption text-gray-500">출석</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl">
                <span className="text-h3 font-bold text-yellow-600">{monthStats.late}</span>
                <span className="text-caption text-gray-500">지각</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl">
                <span className="text-h3 font-bold text-red-600">{monthStats.absent}</span>
                <span className="text-caption text-gray-500">결석</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-amber-50 rounded-xl">
                <span className="text-h3 font-bold text-amber-600">{monthStats.earlyLeave}</span>
                <span className="text-caption text-gray-500">조퇴</span>
              </div>
              <div className="col-span-2 flex flex-col items-center p-3 bg-primary-50 rounded-xl">
                <span className="text-h3 font-bold text-primary-600">{monthStats.rate}%</span>
                <span className="text-caption text-gray-500">출석률</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 출석 이력 */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 font-semibold text-gray-900">
            {viewYear}년 {viewMonth}월 출석 이력
          </h2>
          <span className="text-caption text-gray-400">총 {tableData.length}건</span>
        </div>
        <div className="overflow-y-auto max-h-64">
          <Table columns={columns} data={tableData} />
        </div>
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

      {/* 조퇴 확인 모달 */}
      <Modal
        isOpen={showEarlyLeaveConfirm}
        onClose={() => setShowEarlyLeaveConfirm(false)}
        title="조퇴 처리"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-body text-gray-700">
            조퇴 처리를 하겠습니까?
          </p>
          <p className="text-body-sm text-gray-500">
            {name} · {now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 조퇴
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowEarlyLeaveConfirm(false)}>
              취소
            </Button>
            <Button
              onClick={handleConfirmEarlyLeave}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              조퇴 확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
