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
  // ?섏뾽 ?쒓컙 李?(二쇰쭚쨌?쒓컙 ??鍮꾪솢?깊솕)
  const [scheduleWindow, setScheduleWindow] = useState(null);
  const { showToast } = useToast();

  // ?щ젰 ???먯깋 ?곹깭
  const now2 = new Date();
  const [viewYear, setViewYear] = useState(now2.getFullYear());
  const [viewMonth, setViewMonth] = useState(now2.getMonth() + 1);

  const now = new Date();
  // ?댁떎 媛???쒓컖: scheduleWindow?먯꽌 class_end ?ъ슜, ?놁쑝硫?17:50 湲곕낯媛?  const [checkoutH, checkoutM] = scheduleWindow?.class_end
    ? scheduleWindow.class_end.split(':').map(Number)
    : [17, 50];
  const isAfterCheckoutTime =
    now.getHours() * 60 + now.getMinutes() >= checkoutH * 60 + checkoutM;

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
    // ?섏뾽 ?쒓컙 李?議고쉶 (二쇰쭚쨌?쒓컙 ??鍮꾪솢?깊솕 ?먮떒)
    attendanceApi
      .getWindow()
      .then(setScheduleWindow)
      .catch(() => setScheduleWindow({ can_checkin: true })); // ?ㅽ뙣 ??湲곕낯 ?덉슜
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
        message: `?낆떎 泥섎━媛 ?꾨즺?섏뿀?듬땲?? ${scheduleWindow?.class_end ?? '17:50'} ?댄썑 ?댁떎?댁＜?몄슂.`,
      });
    } catch {
      // Storage 踰꾪궥???놁뼱??泥댄겕?몄? ?쒕룄 (URL ?놁씠)
      try {
        await attendanceApi.checkIn(null);
        setSignatureSubmitted(true);
        showToast({
          type: 'success',
          message: `?낆떎 泥섎━媛 ?꾨즺?섏뿀?듬땲?? ${scheduleWindow?.class_end ?? '17:50'} ?댄썑 ?댁떎?댁＜?몄슂.`,
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

  const getStatusBadge = (status) => {
    if (status === 'present') return { label: '異쒖꽍', variant: 'success' };
    if (status === 'late') return { label: '吏媛?, variant: 'warning' };
    if (status === 'absent') return { label: '寃곗꽍', variant: 'error' };
    if (status === 'early_leave') return { label: '議고눜', variant: 'warning' };
    if (status === 'checked_in') return { label: '?낆떎', variant: 'info' };
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

  return (
    <div className="space-y-6 rounded-3xl bg-[#F9F8F6] px-2 py-4 sm:px-4">
      <h1 className="text-h2 font-bold text-gray-900">異쒖꽍</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Signature */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-gray-900">異쒖꽍 ?쒕챸</h2>
            {checkoutDone || earlyLeaveDone ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-caption font-medium text-green-700">
                  {earlyLeaveDone ? '議고눜 ?꾨즺' : '異쒖꽍 ?꾨즺'}
                </span>
              </div>
            ) : signatureSubmitted ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-caption font-medium text-blue-700">
                  ?낆떎 ?꾨즺 쨌 ?댁떎 ?湲?                </span>
              </div>
            ) : null}
          </div>

          {/* ?덈궡 洹쒖튃 - 2??洹몃━??(?섏뾽 ?쒓컙 ?숈쟻 諛섏쁺) */}
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
                  <span>{start} ?댁쟾 ??異쒖꽍</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span>{start}~{late} ??吏媛?/span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{late} ?댄썑 ??寃곗꽍</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <LogOut className="w-4 h-4 text-student-500 shrink-0" />
                  <span>{end} ?댄썑 ???댁떎</span>
                </div>
              </div>
            );
          })()}

          {/* 二쇰쭚쨌?쒓컙 ??鍮꾪솢?깊솕 ?덈궡 */}
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
                  ?섏뾽 ?쒖옉: {scheduleWindow.class_start}
                </p>
              )}
            </div>
          )}

          {/* ?대쫫 ?낅젰 + ?쒕챸 ???섏뾽 ?쒓컙 李??댁뿉?쒕쭔 ?쒖떆 */}
          {(!scheduleWindow || scheduleWindow.can_checkin) && <>
          <div className="mb-3">
            <label className="block text-body-sm font-medium text-gray-700 mb-1">
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
                {nameConfirmed ? '?뺤씤?? : '?뺤씤'}
              </button>
            </div>
            {nameMismatch && (
              <p className="flex items-center gap-1.5 mt-1.5 text-caption text-red-500">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
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
          </>}
        </Card>

        {/* Right: Calendar & Stats */}
        <div className="space-y-4">
          <Card>
            {/* ?щ젰 ?ㅻ뜑 + ???먯깋 */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={goPrevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-h3 font-semibold text-gray-900">
                {viewYear}??{viewMonth}??              </h2>
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
                    d === '??
                      ? 'text-red-400'
                      : d === '??
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
                異쒖꽍
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#e8943a]" />
                吏媛?              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#e05d5d]" />
                寃곗꽍
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#d4b03d]" />
                議고눜
              </div>
              <div className="flex items-center gap-1.5 text-caption text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#7eb8e8]" />
                ?낆떎
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-3">
              {viewMonth}???듦퀎
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-3 bg-[#edf7f0] rounded-xl">
                <span className="text-h3 font-bold text-[#3d8f5a]">
                  {monthStats.present}
                </span>
                <span className="text-caption text-gray-500">異쒖꽍</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-[#fdf5ec] rounded-xl">
                <span className="text-h3 font-bold text-[#d9782c]">
                  {monthStats.late}
                </span>
                <span className="text-caption text-gray-500">吏媛?/span>
              </div>
              <div className="flex flex-col items-center p-3 bg-[#fdf0f0] rounded-xl">
                <span className="text-h3 font-bold text-[#d14b4b]">
                  {monthStats.absent}
                </span>
                <span className="text-caption text-gray-500">寃곗꽍</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-[#faf6e8] rounded-xl">
                <span className="text-h3 font-bold text-[#c9a227]">
                  {monthStats.earlyLeave}
                </span>
                <span className="text-caption text-gray-500">議고눜</span>
              </div>
              <div className="col-span-2 flex flex-col items-center p-3 bg-primary-50 rounded-xl">
                <span className="text-h3 font-bold text-primary-600">
                  {monthStats.rate}%
                </span>
                <span className="text-caption text-gray-500">異쒖꽍瑜?/span>
              </div>
            </div>
          </Card>

          {summary && (
            <Card>
              <h2 className="text-h3 font-semibold text-gray-900 mb-3">
                ?꾩껜 ?덈젴 異쒖꽍 ?꾪솴
              </h2>
              <p className="text-caption text-gray-400 mb-3">
                {summary.training_start} ~ {summary.today}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 bg-student-50 rounded-xl">
                  <span className="text-h3 font-bold text-student-600">
                    {summary.rate}%
                  </span>
                  <span className="text-caption text-gray-500">異쒖꽍瑜?/span>
                </div>
                <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-h3 font-bold text-green-600">
                    {summary.attended}
                  </span>
                  <span className="text-caption text-gray-500">異쒖꽍??/span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-h3 font-bold text-gray-600">
                    {summary.total_weekdays}
                  </span>
                  <span className="text-caption text-gray-500">?섏뾽??/span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 異쒖꽍 ?대젰 */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 font-semibold text-gray-900">
            {viewYear}??{viewMonth}??異쒖꽍 ?대젰
          </h2>
          <span className="text-caption text-gray-400">
            珥?{tableData.length}嫄?          </span>
        </div>
        <div className="overflow-y-auto max-h-64">
          <Table columns={columns} data={tableData} />
        </div>
      </Card>

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
