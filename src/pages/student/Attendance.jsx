import { useState, useMemo, useEffect } from 'react';
import { attendanceApi } from '@/api/attendance';
import { profileApi } from '@/api/profile';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import SignatureCanvas from '@/components/forms/SignatureCanvas';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarOff,
} from 'lucide-react';

export default function Attendance() {
  const [name, setName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [nameMismatch, setNameMismatch] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [signatureSubmitted, setSignatureSubmitted] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [earlyLeaveDone, setEarlyLeaveDone] = useState(false);
  const [showEarlyLeaveConfirm, setShowEarlyLeaveConfirm] = useState(false);
  const [localAttendance, setLocalAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  // 수업 시간 창 (주말·시간 외 비활성화)
  const [scheduleWindow, setScheduleWindow] = useState(null);
  const { showToast } = useToast();

  // 달력 월 탐색 상태
  const now2 = new Date();
  const [viewYear, setViewYear] = useState(now2.getFullYear());
  const [viewMonth, setViewMonth] = useState(now2.getMonth() + 1);

  const now = new Date();
  // 퇴실 가능 시각: scheduleWindow에서 class_end 사용, 없으면 17:50 기본값
  const [checkoutH, checkoutM] = scheduleWindow?.class_end
    ? scheduleWindow.class_end.split(':').map(Number)
    : [17, 50];
  const isAfterCheckoutTime =
    now.getHours() * 60 + now.getMinutes() >= checkoutH * 60 + checkoutM;

  // 오늘 출석 상태 조회 → 이미 체크인/퇴실한 경우 UI 반영
  useEffect(() => {
    // 프로필 이름 로드
    profileApi
      .getMe()
      .then((p) => setProfileName(p.name ?? ''))
      .catch(() => {});

    attendanceApi
      .getToday()
      .then((data) => {
        if (data?.status) {
          setNameConfirmed(true);
          setSignatureSubmitted(true);
          // check_out_time이 있을 때만 퇴실 완료로 표시
          if (data.check_out_time) {
            if (data.status === 'early_leave') setEarlyLeaveDone(true);
            else setCheckoutDone(true);
          }
        }
      })
      .catch(() => {});
    attendanceApi
      .getSummary()
      .then(setSummary)
      .catch(() => {});
    // 수업 시간 창 조회 (주말·시간 외 비활성화 판단)
    attendanceApi
      .getWindow()
      .then(setScheduleWindow)
      .catch(() => setScheduleWindow({ can_checkin: true })); // 실패 시 기본 허용
  }, []);

  // 월별 출석 데이터 fetch
  useEffect(() => {
    attendanceApi
      .getMonthly(viewYear, viewMonth)
      .then((data) => setLocalAttendance(data.records ?? []))
      .catch(() => {});
  }, [viewYear, viewMonth]);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getTimeStr = () =>
    new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  // 이름 확인: 프로필 이름과 비교
  const handleConfirmName = () => {
    if (!name.trim()) return;
    if (profileName && name.trim() !== profileName.trim()) {
      setNameMismatch(true);
      return;
    }
    setNameMismatch(false);
    setNameConfirmed(true);
  };

  const handleSignatureSave = async (dataUrl) => {
    try {
      // dataUrl → Blob → Supabase Storage 업로드
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `signatures/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('attendance')
        .upload(fileName, blob, { contentType: 'image/png' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('attendance')
        .getPublicUrl(fileName);
      await attendanceApi.checkIn(urlData.publicUrl);
      setSignatureSubmitted(true);
      showToast({
        type: 'success',
        message: `입실 처리가 완료되었습니다. ${scheduleWindow?.class_end ?? '17:50'} 이후 퇴실해주세요.`,
      });
    } catch {
      // Storage 버킷이 없어도 체크인은 시도 (URL 없이)
      try {
        await attendanceApi.checkIn(null);
        setSignatureSubmitted(true);
        showToast({
          type: 'success',
          message: `입실 처리가 완료되었습니다. ${scheduleWindow?.class_end ?? '17:50'} 이후 퇴실해주세요.`,
        });
      } catch {
        showToast({ type: 'error', message: '체크인에 실패했습니다.' });
      }
    }
  };

  const handleConfirmCheckout = async () => {
    try {
      await attendanceApi.checkOut();
      setCheckoutDone(true);
      showToast({ type: 'success', message: '퇴실 처리가 완료되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '퇴실 처리에 실패했습니다.' });
    }
    setShowConfirm(false);
  };

  const handleConfirmEarlyLeave = async (reason = '개인 사정') => {
    try {
      await attendanceApi.earlyLeave(reason);
      const todayStr = getTodayStr();
      const timeStr = getTimeStr();
      setLocalAttendance((prev) => {
        const idx = prev.findIndex((a) => a.date === todayStr);
        if (idx >= 0) {
          return prev.map((a) =>
            a.date === todayStr ? { ...a, status: 'early_leave' } : a,
          );
        }
        return [
          ...prev,
          { date: todayStr, status: 'early_leave', time: timeStr },
        ];
      });
      setEarlyLeaveDone(true);
      showToast({ type: 'success', message: '조퇴 처리가 완료되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '조퇴 처리에 실패했습니다.' });
    }
    setShowEarlyLeaveConfirm(false);
  };

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // 현재 보는 달의 출석 데이터 필터링
  const filteredAttendance = useMemo(() => {
    return localAttendance.filter((a) => {
      const [y, m] = a.date.split('-').map(Number);
      return y === viewYear && m === viewMonth;
    });
  }, [viewYear, viewMonth, localAttendance]);

  // 달별 통계 계산
  const monthStats = useMemo(() => {
    const present = filteredAttendance.filter(
      (a) => a.status === 'present',
    ).length;
    const late = filteredAttendance.filter((a) => a.status === 'late').length;
    const absent = filteredAttendance.filter(
      (a) => a.status === 'absent',
    ).length;
    const earlyLeave = filteredAttendance.filter(
      (a) => a.status === 'early_leave',
    ).length;
    const total = present + late + absent + earlyLeave;
    const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
    return { present, late, absent, earlyLeave, rate };
  }, [filteredAttendance]);

  // 달력 셀 데이터
  const calendarData = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1);
    const lastDay = new Date(viewYear, viewMonth, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const attendanceMap = {};
    filteredAttendance.forEach((a) => {
      attendanceMap[a.date] = a.status;
    });

    const cells = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ day: null, status: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, status: attendanceMap[dateStr] || null });
    }

    return cells;
  }, [viewYear, viewMonth, filteredAttendance]);

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const getStatusDot = (status) => {
    if (status === 'present') return 'bg-[#5cbf7a]';
    if (status === 'late') return 'bg-[#e8943a]';
    if (status === 'absent') return 'bg-[#e05d5d]';
    if (status === 'early_leave') return 'bg-[#d4b03d]';
    if (status === 'checked_in') return 'bg-[#7eb8e8]';
    return '';
  };

  const getStatusBadge = (status) => {
    if (status === 'present') return { label: '출석', variant: 'success' };
    if (status === 'late') return { label: '지각', variant: 'warning' };
    if (status === 'absent') return { label: '결석', variant: 'error' };
    if (status === 'early_leave') return { label: '조퇴', variant: 'warning' };
    if (status === 'checked_in') return { label: '입실', variant: 'info' };
    return { label: '-', variant: 'default' };
  };

  const columns = [
    { key: 'date', label: '날짜', width: '35%' },
    {
      key: 'status',
      label: '상태',
      width: '30%',
      render: (val) => {
        const { label, variant } = getStatusBadge(val);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'time',
      label: '시간',
      width: '35%',
      render: (val) => val || '-',
    },
  ];

  const tableData = filteredAttendance
    .filter((a) => a.status)
    .map((a, idx) => ({ ...a, id: idx }));

  return (
    <div className="space-y-6 rounded-3xl bg-[#F9F8F6] px-2 py-4 sm:px-4">
      <h1 className="text-h2 font-bold text-gray-900">출석</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Signature */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-gray-900">출석 서명</h2>
            {checkoutDone || earlyLeaveDone ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-caption font-medium text-green-700">
                  {earlyLeaveDone ? '조퇴 완료' : '출석 완료'}
                </span>
              </div>
            ) : signatureSubmitted ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-caption font-medium text-blue-700">
                  입실 완료 · 퇴실 대기
                </span>
              </div>
            ) : null}
          </div>

          {/* 안내 규칙 - 2열 그리드 (수업 시간 동적 반영) */}
          {(() => {
            const start = scheduleWindow?.class_start ?? '09:00';
            const end = scheduleWindow?.class_end ?? '17:50';
            const [sh, sm] = start.split(':').map(Number);
            const lateMinutes = sh * 60 + sm + 30;
            const late = `${String(Math.floor(lateMinutes / 60)).padStart(2, '0')}:${String(lateMinutes % 60).padStart(2, '0')}`;
            return (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{start} 이전 → 출석</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span>{start}~{late} → 지각</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{late} 이후 → 결석</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <LogOut className="w-4 h-4 text-student-500 shrink-0" />
                  <span>{end} 이후 → 퇴실</span>
                </div>
              </div>
            );
          })()}

          {/* 주말·시간 외 비활성화 안내 */}
          {scheduleWindow && !scheduleWindow.can_checkin && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              {scheduleWindow.is_weekend ? (
                <CalendarOff className="w-10 h-10 text-gray-300" />
              ) : (
                <Clock className="w-10 h-10 text-gray-300" />
              )}
              <p className="text-body-sm font-medium text-gray-500">
                {scheduleWindow.reason}
              </p>
              {scheduleWindow.is_before_window && (
                <p className="text-caption text-gray-400">
                  수업 시작: {scheduleWindow.class_start}
                </p>
              )}
            </div>
          )}

          {/* 이름 입력 + 서명 — 수업 시간 창 내에서만 표시 */}
          {(!scheduleWindow || scheduleWindow.can_checkin) && <>
          <div className="mb-3">
            <label className="block text-body-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameMismatch(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim() && !nameConfirmed) {
                    handleConfirmName();
                  }
                }}
                placeholder="이름을 입력하세요"
                disabled={nameConfirmed}
                className={`flex-1 px-3 py-2 rounded-lg border text-body-sm transition-colors outline-none
                  ${
                    nameConfirmed
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                      : nameMismatch
                        ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-300 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
                  }`}
              />
              <button
                onClick={handleConfirmName}
                disabled={!name.trim() || nameConfirmed}
                className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap
                  ${
                    !name.trim() || nameConfirmed
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-student-500 hover:bg-student-600 text-white cursor-pointer'
                  }`}
              >
                {nameConfirmed ? '확인됨' : '확인'}
              </button>
            </div>
            {nameMismatch && (
              <p className="flex items-center gap-1.5 mt-1.5 text-caption text-red-500">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                등록된 이름({profileName})과 다릅니다. 다시 확인해주세요.
              </p>
            )}
          </div>

          <SignatureCanvas
            onSave={handleSignatureSave}
            disabled={!nameConfirmed}
            submitted={signatureSubmitted}
            guideName={nameConfirmed ? name : ''}
            onCheckout={() => setShowConfirm(true)}
            checkoutDisabled={!isAfterCheckoutTime}
            checkoutDone={checkoutDone}
            onEarlyLeave={() => setShowEarlyLeaveConfirm(true)}
            earlyLeaveDone={earlyLeaveDone}
          />
          </>}
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
                    d === '일'
                      ? 'text-red-400'
                      : d === '토'
                        ? 'text-blue-400'
                        : 'text-gray-500'
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
                      <span className="text-body-sm text-gray-700">
                        {cell.day}
                      </span>
                      {cell.status && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getStatusDot(cell.status)}`}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 flex-wrap">
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#5cbf7a]" />
                출석
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#e8943a]" />
                지각
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#e05d5d]" />
                결석
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#d4b03d]" />
                조퇴
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#7eb8e8]" />
                입실
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">
              {viewMonth}월 통계
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-3 bg-[#edf7f0] rounded-xl">
                <span className="text-h3 font-bold text-[#3d8f5a]">
                  {monthStats.present}
                </span>
                <span className="text-caption text-gray-500">출석</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-[#fdf5ec] rounded-xl">
                <span className="text-h3 font-bold text-[#d9782c]">
                  {monthStats.late}
                </span>
                <span className="text-caption text-gray-500">지각</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-[#fdf0f0] rounded-xl">
                <span className="text-h3 font-bold text-[#d14b4b]">
                  {monthStats.absent}
                </span>
                <span className="text-caption text-gray-500">결석</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-[#faf6e8] rounded-xl">
                <span className="text-h3 font-bold text-[#c9a227]">
                  {monthStats.earlyLeave}
                </span>
                <span className="text-caption text-gray-500">조퇴</span>
              </div>
              <div className="col-span-2 flex flex-col items-center p-3 bg-primary-50 rounded-xl">
                <span className="text-h3 font-bold text-primary-600">
                  {monthStats.rate}%
                </span>
                <span className="text-caption text-gray-500">출석률</span>
              </div>
            </div>
          </Card>

          {summary && (
            <Card>
              <h2 className="text-h3 font-semibold text-gray-900 mb-3">
                전체 훈련 출석 현황
              </h2>
              <p className="text-caption text-gray-400 mb-3">
                {summary.training_start} ~ {summary.today}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 bg-student-50 rounded-xl">
                  <span className="text-h3 font-bold text-student-600">
                    {summary.rate}%
                  </span>
                  <span className="text-caption text-gray-500">출석률</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-h3 font-bold text-green-600">
                    {summary.attended}
                  </span>
                  <span className="text-caption text-gray-500">출석일</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-h3 font-bold text-gray-600">
                    {summary.total_weekdays}
                  </span>
                  <span className="text-caption text-gray-500">수업일</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 출석 이력 */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 font-semibold text-gray-900">
            {viewYear}년 {viewMonth}월 출석 이력
          </h2>
          <span className="text-caption text-gray-400">
            총 {tableData.length}건
          </span>
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
            {name} ·{' '}
            {now.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            퇴실
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
          <p className="text-body text-gray-700">조퇴 처리를 하겠습니까?</p>
          <p className="text-body-sm text-gray-500">
            {name} ·{' '}
            {now.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            조퇴
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowEarlyLeaveConfirm(false)}
            >
              취소
            </Button>
            <Button
              onClick={() => handleConfirmEarlyLeave()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              조퇴 확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
