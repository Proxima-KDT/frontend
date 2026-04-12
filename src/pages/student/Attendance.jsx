import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi } from '@/api/attendance';
import { profileApi } from '@/api/profile';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
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
  Lightbulb,
  FileSignature,
} from 'lucide-react';

function AttendanceDonut({ percent }) {
  const p = Math.min(100, Math.max(0, percent));
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - p / 100);
  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#ebe8e3"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#3d3d3d"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dash}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-2xl font-semibold text-[#1f1e1c]`}>
          {Math.round(p)}%
        </span>
        <span className="text-[0.6rem] font-bold tracking-[0.12em] text-[#8a847a]">
          RATE
        </span>
      </div>
    </div>
  );
}

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
  const [scheduleWindow, setScheduleWindow] = useState(null);
  const { showToast } = useToast();

  // 달력 월 탐색 상태
  const now2 = new Date();
  const [viewYear, setViewYear] = useState(now2.getFullYear());
  const [viewMonth, setViewMonth] = useState(now2.getMonth() + 1);

  const now = new Date();
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
    attendanceApi
      .getWindow()
      .then(setScheduleWindow)
      .catch(() => setScheduleWindow({ can_checkin: true }));
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

  const calendarWeeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      rows.push(calendarData.slice(i, i + 7));
    }
    return rows;
  }, [calendarData]);

  const forecastText = useMemo(() => {
    const r = monthStats.rate;
    if (r >= 90)
      return '지금 출석 패턴을 유지하면 학기 말까지 우수한 출석률을 기대할 수 있어요.';
    if (r >= 70)
      return '현재 추세를 유지하면 이번 달 출석률은 약 90% 전후로 마감될 수 있어요. 지각·결석만 줄여도 체감이 커집니다.';
    return '출석률을 조금만 끌어올려도 전체 평가에 도움이 됩니다. 이번 주부터 규칙적인 입실을 권장해요.';
  }, [monthStats.rate]);

  const logRef = useRef(null);

  const getStatusBadge = (status) => {
    if (status === 'present') return { label: '출석', variant: 'soft-success' };
    if (status === 'late') return { label: '지각', variant: 'soft-warning' };
    if (status === 'absent') return { label: '결석', variant: 'soft-error' };
    if (status === 'early_leave')
      return { label: '조퇴', variant: 'soft-amber' };
    if (status === 'checked_in') return { label: '입실', variant: 'soft-info' };
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

  const monthTitleEn = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' },
  );

  const courseCompletion =
    summary?.rate != null
      ? Math.round(Number(summary.rate))
      : Math.round(monthStats.rate);
  const attendedDays = summary?.attended ?? '—';
  const totalCourseDays = summary?.total_weekdays ?? '—';

  const signatureStatusLine =
    checkoutDone || earlyLeaveDone
      ? earlyLeaveDone
        ? '오늘 조퇴 처리가 완료되었습니다.'
        : '출석·퇴실이 모두 완료되었습니다.'
      : signatureSubmitted
        ? '입실 완료 · 17:50 이후 퇴실 가능'
        : '입실 전 · 아래에서 서명을 완료해 주세요';

  return (
    <div className="space-y-8 rounded-3xl bg-[#F9F8F6] px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8">
      <header>
        <h1
          className={`text-[1.75rem] font-semibold tracking-tight text-[#1f1e1c] sm:text-[2rem]`}
        >
          출결 현황
        </h1>
        <p className="mt-1 text-[0.875rem] text-[#6b6560]">
          Academic Presence · 월별 출석과 서명을 한곳에서 관리합니다.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_minmax(300px,360px)] xl:items-start">
        {/* 좌측: 캘린더 + 서명 */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_8px_32px_rgba(45,42,38,0.05)] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-xl p-2 text-[#6b6560] transition hover:bg-[#f3f1ed]"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p
                  className={`text-xl font-semibold text-[#1f1e1c] sm:text-2xl`}
                >
                  {monthTitleEn}
                </p>
                <p className="text-[0.75rem] text-[#8a847a]">
                  {viewYear}년 {viewMonth}월
                </p>
              </div>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-xl p-2 text-[#6b6560] transition hover:bg-[#f3f1ed]"
                aria-label="다음 달"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {dayLabels.map((d) => (
                <div
                  key={d}
                  className={`pb-1 text-center text-[0.65rem] font-bold tracking-wider text-[#8a847a] ${
                    d === '일'
                      ? 'text-[#c97a7a]'
                      : d === '토'
                        ? 'text-[#7a9eb8]'
                        : ''
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {week.map((cell, ci) => (
                    <div
                      key={ci}
                      className={`flex min-h-[4.5rem] flex-col items-center justify-between rounded-2xl border px-0.5 py-2 sm:min-h-[5.25rem] sm:py-2.5 ${
                        cell.day
                          ? 'border-[#e8e4dc] bg-[#faf9f7]'
                          : 'border-transparent bg-transparent'
                      }`}
                    >
                      {cell.day ? (
                        <>
                          <span className="text-[0.8rem] font-semibold text-[#3d3a36] sm:text-[0.875rem]">
                            {cell.day}
                          </span>
                          <span
                            className={`mb-0.5 h-2 w-2 shrink-0 rounded-full ${
                              cell.status
                                ? getStatusDot(cell.status)
                                : 'bg-[#e5e2dc]'
                            }`}
                            title={cell.status || '기록 없음'}
                          />
                        </>
                      ) : (
                        <span className="text-transparent">.</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#ebe8e3] pt-4 text-[0.65rem] text-[#6b6560]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#5cbf7a]" />
                출석
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#e8943a]" />
                지각
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#e05d5d]" />
                결석
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#d4b03d]" />
                조퇴
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#7eb8e8]" />
                입실
              </span>
            </div>
          </div>

          {/* 서명 제출 바 */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e8e4dc] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0ede6] text-[#4a4640]">
                <FileSignature className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] text-[#3d3a36]">
                  {signatureStatusLine}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                logRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              className="shrink-0 rounded-xl border border-[#d4cfc4] bg-[#faf9f7] px-4 py-2 text-[0.8125rem] font-semibold text-[#3d3a36] transition hover:bg-[#f3f1ed]"
            >
              기록 보기
            </button>
          </div>

          <div className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_8px_32px_rgba(45,42,38,0.05)] sm:p-6">
            <h2 className="text-[1rem] font-bold text-[#1f1e1c]">출석 서명</h2>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              {checkoutDone || earlyLeaveDone ? (
                <div className="flex items-center gap-1.5 rounded-full bg-[#e8f5eb] px-3 py-1">
                  <CheckCircle className="h-4 w-4 text-[#5cbf7a]" />
                  <span className="text-[0.75rem] font-semibold text-[#2d5a3a]">
                    {earlyLeaveDone ? '조퇴 완료' : '출석 완료'}
                  </span>
                </div>
              ) : signatureSubmitted ? (
                <div className="flex items-center gap-1.5 rounded-full bg-[#e8f0fa] px-3 py-1">
                  <CheckCircle className="h-4 w-4 text-[#7eb8e8]" />
                  <span className="text-[0.75rem] font-semibold text-[#2d4a6e]">
                    입실 완료 · 퇴실 대기
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-[0.8125rem] font-medium text-[#4a4640]">
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
                  className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-[0.875rem] outline-none transition ${
                    nameConfirmed
                      ? 'cursor-not-allowed border-[#ebe8e3] bg-[#f5f4f1] text-[#8a847a]'
                      : nameMismatch
                        ? 'border-[#e05d5d] bg-[#fdf4f4] focus:border-[#e05d5d] focus:ring-2 focus:ring-[#f5d0d0]'
                        : 'border-[#d4cfc4] bg-white focus:border-[#b8b3ab] focus:ring-2 focus:ring-[#ebe8e3]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleConfirmName}
                  disabled={!name.trim() || nameConfirmed}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-[0.875rem] font-semibold transition ${
                    !name.trim() || nameConfirmed
                      ? 'cursor-not-allowed bg-[#ebe8e3] text-[#a8a29e]'
                      : 'bg-[#2d2a26] text-white hover:bg-[#1a1918]'
                  }`}
                >
                  {nameConfirmed ? '확인됨' : '확인'}
                </button>
              </div>
              {nameMismatch && (
                <p className="mt-2 flex items-center gap-1.5 text-caption text-[#c54a4a]">
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
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

            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-[#ebe8e3] pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#5c5852]">
                <CheckCircle className="h-4 w-4 shrink-0 text-[#5cbf7a]" />
                09:00 이전 → 출석
              </div>
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#5c5852]">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#e8943a]" />
                09:00~09:30 → 지각
              </div>
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#5c5852]">
                <XCircle className="h-4 w-4 shrink-0 text-[#e05d5d]" />
                09:30 이후 → 결석
              </div>
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#5c5852]">
                <LogOut className="h-4 w-4 shrink-0 text-[#7eb8e8]" />
                17:50 이후 → 퇴실
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 요약 + 마일스톤 + 예측 */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_8px_32px_rgba(45,42,38,0.05)] sm:p-6">
            <h2 className="text-[0.7rem] font-bold tracking-[0.14em] text-[#8a847a] uppercase">
              {viewMonth}월
            </h2>
            <AttendanceDonut percent={monthStats.rate} />
            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">
                  PRESENT
                </p>
                <p className="mt-1 text-xl font-bold text-[#3d8f5a]">
                  {monthStats.present}
                </p>
              </div>
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">
                  LATE
                </p>
                <p className="mt-1 text-xl font-bold text-[#d9782c]">
                  {monthStats.late}
                </p>
              </div>
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">
                  ABSENT
                </p>
                <p className="mt-1 text-xl font-bold text-[#d14b4b]">
                  {monthStats.absent}
                </p>
              </div>
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">
                  조퇴
                </p>
                <p className="mt-1 text-xl font-bold text-[#c9a227]">
                  {monthStats.earlyLeave}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#2d2a26] bg-[#2d2a26] p-5 text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-6">
            <p className="text-[0.65rem] font-semibold tracking-[0.15em] text-white/60">
              COURSE MILESTONE
            </p>
            <p className={`mt-1 text-2xl font-semibold`}>
              {courseCompletion}% Completion
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#c9a227] transition-all duration-500"
                style={{ width: `${Math.min(100, courseCompletion)}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2 text-[0.875rem] text-white/85">
              <li className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <span>출석일</span>
                <span className="font-semibold tabular-nums">
                  {attendedDays}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span>전체 수업일</span>
                <span className="font-semibold tabular-nums">
                  {totalCourseDays}
                </span>
              </li>
            </ul>
            {summary?.training_start && (
              <p className="mt-2 text-[0.7rem] text-white/45">
                {summary.training_start} ~ {summary.today}
              </p>
            )}
            <Link
              to="/student/dashboard"
              className="mt-5 block w-full rounded-xl bg-[#c9a227] py-3 text-center text-[0.8125rem] font-bold tracking-wide text-[#1f1e1c] transition hover:bg-[#ddb52e]"
            >
              전체 커리큘럼 보기
            </Link>
          </div>

          <div className="rounded-2xl border border-[#ebe5cf] bg-[#faf6e8] px-4 py-4 sm:px-5">
            <div className="flex gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a227]" />
              <div>
                <p className="text-[0.65rem] font-bold tracking-wide text-[#8a847a] uppercase">
                  Attendance Insight
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-[#4d5a38]">
                  {forecastText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={logRef}
        id="attendance-log"
        className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_8px_32px_rgba(45,42,38,0.05)] sm:p-6"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className={`text-lg font-semibold text-[#1f1e1c] sm:text-xl`}>
            {viewYear}년 {viewMonth}월 출석 이력
          </h2>
          <span className="text-[0.75rem] text-[#8a847a]">
            총 {tableData.length}건
          </span>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-[#ebe8e3]">
          <Table columns={columns} data={tableData} />
        </div>
      </div>

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
