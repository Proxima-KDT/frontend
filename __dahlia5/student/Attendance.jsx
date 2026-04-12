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

const CHECKOUT_HOUR = 17;
const CHECKOUT_MINUTE = 50;
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
  const { showToast } = useToast();

  // ?щ젰 ???먯깋 ?곹깭
  const now2 = new Date();
  const [viewYear, setViewYear] = useState(now2.getFullYear());
  const [viewMonth, setViewMonth] = useState(now2.getMonth() + 1);

  const now = new Date();
  const isAfterCheckoutTime =
    now.getHours() * 60 + now.getMinutes() >=
    CHECKOUT_HOUR * 60 + CHECKOUT_MINUTE;

  // ?ㅻ뒛 異쒖꽍 ?곹깭 議고쉶 ???대? 泥댄겕???댁떎??寃쎌슦 UI 諛섏쁺
  useEffect(() => {
    // ?꾨줈???대쫫 濡쒕뱶
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
          // check_out_time???덉쓣 ?뚮쭔 ?댁떎 ?꾨즺濡??쒖떆
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
  }, []);

  // ?붾퀎 異쒖꽍 ?곗씠??fetch
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

  // ?대쫫 ?뺤씤: ?꾨줈???대쫫怨?鍮꾧탳
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
      // dataUrl ??Blob ??Supabase Storage ?낅줈??      const res = await fetch(dataUrl);
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
        message: '?낆떎 泥섎━媛 ?꾨즺?섏뿀?듬땲?? 17:50 ?댄썑 ?댁떎?댁＜?몄슂.',
      });
    } catch {
      // Storage 踰꾪궥???놁뼱??泥댄겕?몄? ?쒕룄 (URL ?놁씠)
      try {
        await attendanceApi.checkIn(null);
        setSignatureSubmitted(true);
        showToast({
          type: 'success',
          message: '?낆떎 泥섎━媛 ?꾨즺?섏뿀?듬땲?? 17:50 ?댄썑 ?댁떎?댁＜?몄슂.',
        });
      } catch {
        showToast({ type: 'error', message: '泥댄겕?몄뿉 ?ㅽ뙣?덉뒿?덈떎.' });
      }
    }
  };

  const handleConfirmCheckout = async () => {
    try {
      await attendanceApi.checkOut();
      setCheckoutDone(true);
      showToast({ type: 'success', message: '?댁떎 泥섎━媛 ?꾨즺?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '?댁떎 泥섎━???ㅽ뙣?덉뒿?덈떎.' });
    }
    setShowConfirm(false);
  };

  const handleConfirmEarlyLeave = async (reason = '媛쒖씤 ?ъ젙') => {
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
      showToast({ type: 'success', message: '議고눜 泥섎━媛 ?꾨즺?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '議고눜 泥섎━???ㅽ뙣?덉뒿?덈떎.' });
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

  // ?꾩옱 蹂대뒗 ?ъ쓽 異쒖꽍 ?곗씠???꾪꽣留?  const filteredAttendance = useMemo(() => {
    return localAttendance.filter((a) => {
      const [y, m] = a.date.split('-').map(Number);
      return y === viewYear && m === viewMonth;
    });
  }, [viewYear, viewMonth, localAttendance]);

  // ?щ퀎 ?듦퀎 怨꾩궛
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

  // ?щ젰 ? ?곗씠??  const calendarData = useMemo(() => {
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

  const dayLabels = ['??, '??, '??, '??, '紐?, '湲?, '??];

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
      return '吏湲?異쒖꽍 ?⑦꽩???좎??섎㈃ ?숆린 留먭퉴吏 ?곗닔??異쒖꽍瑜좎쓣 湲곕??????덉뼱??';
    if (r >= 70)
      return '?꾩옱 異붿꽭瑜??좎??섎㈃ ?대쾲 ??異쒖꽍瑜좎? ??90% ?꾪썑濡?留덇컧?????덉뼱?? 吏媛겶룰껐?앸쭔 以꾩뿬??泥닿컧??而ㅼ쭛?덈떎.';
    return '異쒖꽍瑜좎쓣 議곌툑留??뚯뼱?щ젮???꾩껜 ?됯????꾩????⑸땲?? ?대쾲 二쇰???洹쒖튃?곸씤 ?낆떎??沅뚯옣?댁슂.';
  }, [monthStats.rate]);

  const logRef = useRef(null);

  const getStatusBadge = (status) => {
    if (status === 'present') return { label: '異쒖꽍', variant: 'soft-success' };
    if (status === 'late') return { label: '吏媛?, variant: 'soft-warning' };
    if (status === 'absent') return { label: '寃곗꽍', variant: 'soft-error' };
    if (status === 'early_leave') return { label: '議고눜', variant: 'soft-amber' };
    if (status === 'checked_in') return { label: '?낆떎', variant: 'soft-info' };
    return { label: '-', variant: 'default' };
  };

  const columns = [
    { key: 'date', label: '?좎쭨', width: '35%' },
    {
      key: 'status',
      label: '?곹깭',
      width: '30%',
      render: (val) => {
        const { label, variant } = getStatusBadge(val);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'time',
      label: '?쒓컙',
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
    summary?.rate != null ? Math.round(Number(summary.rate)) : Math.round(monthStats.rate);
  const attendedDays = summary?.attended ?? '??;
  const totalCourseDays = summary?.total_weekdays ?? '??;

  const signatureStatusLine =
    checkoutDone || earlyLeaveDone
      ? earlyLeaveDone
        ? '?ㅻ뒛 議고눜 泥섎━媛 ?꾨즺?섏뿀?듬땲??'
        : '異쒖꽍쨌?댁떎??紐⑤몢 ?꾨즺?섏뿀?듬땲??'
      : signatureSubmitted
        ? '?낆떎 ?꾨즺 쨌 17:50 ?댄썑 ?댁떎 媛??
        : '?낆떎 ??쨌 ?꾨옒?먯꽌 ?쒕챸???꾨즺??二쇱꽭??;

  return (
    <div className="space-y-8 rounded-3xl bg-[#F9F8F6] px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8">
      <header>
        <h1
          className={`text-[1.75rem] font-semibold tracking-tight text-[#1f1e1c] sm:text-[2rem]`}
        >
          異쒓껐 ?꾪솴
        </h1>
        <p className="mt-1 text-[0.875rem] text-[#6b6560]">
          Academic Presence 쨌 ?붾퀎 異쒖꽍怨??쒕챸???쒓납?먯꽌 愿由ы빀?덈떎.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_minmax(300px,360px)] xl:items-start">
        {/* 醫뚯륫: 罹섎┛??+ ?쒕챸 */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_8px_32px_rgba(45,42,38,0.05)] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-xl p-2 text-[#6b6560] transition hover:bg-[#f3f1ed]"
                aria-label="?댁쟾 ??
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className={`text-xl font-semibold text-[#1f1e1c] sm:text-2xl`}>
                  {monthTitleEn}
                </p>
                <p className="text-[0.75rem] text-[#8a847a]">
                  {viewYear}??{viewMonth}??                </p>
              </div>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-xl p-2 text-[#6b6560] transition hover:bg-[#f3f1ed]"
                aria-label="?ㅼ쓬 ??
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {dayLabels.map((d) => (
                <div
                  key={d}
                  className={`pb-1 text-center text-[0.65rem] font-bold tracking-wider text-[#8a847a] ${
                    d === '?? ? 'text-[#c97a7a]' : d === '?? ? 'text-[#7a9eb8]' : ''
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
                            title={cell.status || '湲곕줉 ?놁쓬'}
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
                異쒖꽍
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#e8943a]" />
                吏媛?              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#e05d5d]" />
                寃곗꽍
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#d4b03d]" />
                議고눜
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#7eb8e8]" />
                ?낆떎
              </span>
            </div>
          </div>

          {/* ?쒕챸 ?쒖텧 諛?*/}
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
              onClick={() => logRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="shrink-0 rounded-xl border border-[#d4cfc4] bg-[#faf9f7] px-4 py-2 text-[0.8125rem] font-semibold text-[#3d3a36] transition hover:bg-[#f3f1ed]"
            >
              湲곕줉 蹂닿린
            </button>
          </div>

          <div className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_8px_32px_rgba(45,42,38,0.05)] sm:p-6">
            <h2 className="text-[1rem] font-bold text-[#1f1e1c]">異쒖꽍 ?쒕챸</h2>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              {checkoutDone || earlyLeaveDone ? (
                <div className="flex items-center gap-1.5 rounded-full bg-[#e8f5eb] px-3 py-1">
                  <CheckCircle className="h-4 w-4 text-[#5cbf7a]" />
                  <span className="text-[0.75rem] font-semibold text-[#2d5a3a]">
                    {earlyLeaveDone ? '議고눜 ?꾨즺' : '異쒖꽍 ?꾨즺'}
                  </span>
                </div>
              ) : signatureSubmitted ? (
                <div className="flex items-center gap-1.5 rounded-full bg-[#e8f0fa] px-3 py-1">
                  <CheckCircle className="h-4 w-4 text-[#7eb8e8]" />
                  <span className="text-[0.75rem] font-semibold text-[#2d4a6e]">
                    ?낆떎 ?꾨즺 쨌 ?댁떎 ?湲?                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-[0.8125rem] font-medium text-[#4a4640]">
                ?대쫫 <span className="text-red-500">*</span>
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
                  placeholder="?대쫫???낅젰?섏꽭??
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
                  {nameConfirmed ? '?뺤씤?? : '?뺤씤'}
                </button>
              </div>
              {nameMismatch && (
                <p className="mt-2 flex items-center gap-1.5 text-caption text-[#c54a4a]">
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  ?깅줉???대쫫({profileName})怨??ㅻ쫭?덈떎. ?ㅼ떆 ?뺤씤?댁＜?몄슂.
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
                09:00 ?댁쟾 ??異쒖꽍
              </div>
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#5c5852]">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#e8943a]" />
                09:00~09:30 ??吏媛?              </div>
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#5c5852]">
                <XCircle className="h-4 w-4 shrink-0 text-[#e05d5d]" />
                09:30 ?댄썑 ??寃곗꽍
              </div>
              <div className="flex items-center gap-2 text-[0.8125rem] text-[#5c5852]">
                <LogOut className="h-4 w-4 shrink-0 text-[#7eb8e8]" />
                17:50 ?댄썑 ???댁떎
              </div>
            </div>
          </div>
        </div>

        {/* ?곗륫: ?붿빟 + 留덉씪?ㅽ넠 + ?덉륫 */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_8px_32px_rgba(45,42,38,0.05)] sm:p-6">
            <h2 className="text-[0.7rem] font-bold tracking-[0.14em] text-[#8a847a] uppercase">
              {viewMonth}??            </h2>
            <AttendanceDonut percent={monthStats.rate} />
            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">
                  PRESENT
                </p>
                <p className="mt-1 text-xl font-bold text-[#3d8f5a]">{monthStats.present}</p>
              </div>
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">LATE</p>
                <p className="mt-1 text-xl font-bold text-[#d9782c]">{monthStats.late}</p>
              </div>
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">
                  ABSENT
                </p>
                <p className="mt-1 text-xl font-bold text-[#d14b4b]">{monthStats.absent}</p>
              </div>
              <div className="rounded-2xl border border-[#ebe8e3] bg-[#faf9f7] px-3 py-3 text-center">
                <p className="text-[0.58rem] font-bold tracking-widest text-[#8a847a]">
                  議고눜
                </p>
                <p className="mt-1 text-xl font-bold text-[#c9a227]">{monthStats.earlyLeave}</p>
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
                <span>異쒖꽍??/span>
                <span className="font-semibold tabular-nums">{attendedDays}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>?꾩껜 ?섏뾽??/span>
                <span className="font-semibold tabular-nums">{totalCourseDays}</span>
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
              ?꾩껜 而ㅻ━?섎읆 蹂닿린
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
            {viewYear}??{viewMonth}??異쒖꽍 ?대젰
          </h2>
          <span className="text-[0.75rem] text-[#8a847a]">珥?{tableData.length}嫄?/span>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-[#ebe8e3]">
          <Table columns={columns} data={tableData} />
        </div>
      </div>

      {/* ?댁떎 ?뺤씤 紐⑤떖 */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="?댁떎 泥섎━"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-body text-gray-700">
            ?뺣쭚 ?댁떎 泥섎━瑜??섍쿋?듬땲源?
          </p>
          <p className="text-body-sm text-gray-500">
            {name} 쨌{' '}
            {now.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            ?댁떎
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              痍⑥냼
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              ?댁떎 ?뺤씤
            </Button>
          </div>
        </div>
      </Modal>

      {/* 議고눜 ?뺤씤 紐⑤떖 */}
      <Modal
        isOpen={showEarlyLeaveConfirm}
        onClose={() => setShowEarlyLeaveConfirm(false)}
        title="議고눜 泥섎━"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-body text-gray-700">議고눜 泥섎━瑜??섍쿋?듬땲源?</p>
          <p className="text-body-sm text-gray-500">
            {name} 쨌{' '}
            {now.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            議고눜
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowEarlyLeaveConfirm(false)}
            >
              痍⑥냼
            </Button>
            <Button
              onClick={() => handleConfirmEarlyLeave()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              議고눜 ?뺤씤
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
