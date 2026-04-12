import { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { adminApi } from '@/api/admin';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { useToast } from '@/context/ToastContext';

export default function StudentManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi
      .getUsers()
      .then((data) => setUsers(data))
      .catch(() =>
        showToast({
          message: '?ъ슜??紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??',
          type: 'error',
        }),
      )
      .finally(() => {});
  }, []);

  const filtered = users.filter(
    (u) => u.name?.includes(search) || u.email?.includes(search),
  );

  const avgAttendance = filtered.length
    ? (
        filtered.reduce((sum, u) => sum + (Number(u.attendance_rate) || 0), 0) /
        filtered.length
      ).toFixed(1)
    : '0.0';
  const avgPerformance = filtered.length
    ? (
        filtered.reduce(
          (sum, u) => sum + Math.max(0, (Number(u.attendance_rate) || 0) - 5),
          0,
        ) / filtered.length
      ).toFixed(1)
    : '0.0';
  const needSupportCount = filtered.filter((u) => u.status === 'at_risk').length;
  const focusStudent =
    filtered.find((u) => u.status === 'at_risk') ?? filtered[0] ?? null;

  const columns = [
    {
      key: 'name',
      label: '?섍컯??,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#dfe8ec] text-[#456170] flex items-center justify-center text-caption font-semibold">
            {val?.[0] ?? '?'}
          </div>
          <div>
            <span className="font-medium text-gray-900 block">{val ?? '?대쫫 ?놁쓬'}</span>
            <span className="text-caption text-gray-500">{row.enrolled_at ?? '-'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'attendance_rate',
      label: '異쒖꽍瑜?,
      render: (val) => <span className="text-body-sm font-semibold text-[#505a66]">{val ?? 0}%</span>,
    },
    {
      key: 'performance',
      label: '?숈뒿 ?깃낵',
      render: (_, row) => {
        const score = Math.max(0, (Number(row.attendance_rate) || 0) - 5);
        return (
          <div className="flex items-center gap-2 min-w-[130px]">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#d8dbe0]">
              <div
                className={`h-full rounded-full ${score < 70 ? 'bg-[#b85b5b]' : 'bg-[#59656f]'}`}
                style={{ width: `${Math.min(100, score)}%` }}
              />
            </div>
            <span className={`text-body-sm font-semibold ${score < 70 ? 'text-[#b85b5b]' : 'text-[#505a66]'}`}>
              {score}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: '?곹깭',
      render: (val) => {
        const isRisk = val === 'at_risk';
        return (
          <Badge variant={isRisk ? 'soft-error' : 'soft-info'}>
            {isRisk ? '吏???꾩슂' : '?묓샇'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: '?≪뀡',
      render: () => (
        <button className="rounded-full bg-[#e9edf0] px-3 py-1 text-caption font-semibold text-[#4f5d69]">
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#8b8478]">
            Korea IT Academy
          </p>
          <h1 className="text-[2.2rem] text-[#2f333a]">
            ?섍컯???꾪솴 (Student Roster Overview)
          </h1>
          <p className="text-sm text-[#7b7872]">媛쒕퀎 ?숈뒿 吏꾪뻾?꾩? 異쒓껐???④퍡 ?뺤씤?⑸땲?? (AI 湲곕컲 ?몄궗?댄듃 ?ы븿)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a19d94]" />
            <input
              type="text"
              placeholder="?섍컯??寃??(Search students)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-full border border-[#e4e1db] bg-[#f7f6f2] pl-9 pr-4 text-body-sm outline-none"
            />
          </div>
          <Bell className="w-4 h-4 text-[#7c7a74]" />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#8a857d]">?됯퇏 ?깃낵 (Average Performance)</p>
          <p className="mt-1 text-4xl font-semibold text-[#2f3f54]">{avgPerformance}%</p>
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#8a857d]">異쒖꽍瑜?(Attendance Rate)</p>
          <p className="mt-1 text-4xl font-semibold text-[#2f3f54]">{avgAttendance}%</p>
        </Card>
        <Card className="rounded-2xl border border-[#decf8e] bg-[#e6c55a] shadow-none">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#705b1f]">吏???꾩슂 (AI)</p>
          <p className="mt-1 text-4xl font-semibold text-[#4a3a14]">{needSupportCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <Card padding="p-0" className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-[1.5rem] text-[#32363d]">
              理쒓렐 ?깅줉 ?섍컯??            </h3>
            <div className="flex gap-2">
              <button className="rounded-full bg-[#f0efeb] px-2.5 py-1 text-[11px] text-[#7a756c]">Sort: Name</button>
              <button className="rounded-full bg-[#f0efeb] px-2.5 py-1 text-[11px] text-[#7a756c]">Filter: All</button>
            </div>
          </div>
          <Table columns={columns} data={filtered} />
        </Card>
        <div className="space-y-4">
          <Card className="rounded-3xl border border-[#dbd7cf] bg-[#f8f7f4] shadow-none">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-xl bg-[#d4dbe1] flex items-center justify-center text-[#4a5968] font-semibold">
                {focusStudent?.name?.[0] ?? '?'}
              </div>
              <div>
                <p className="text-[1.35rem] text-[#2f333a]">
                  {focusStudent?.name ?? '?좏깮???섍컯???놁쓬'}
                </p>
                <p className="text-xs text-[#7e7a72]">{focusStudent?.email ?? '-'}</p>
                <div className="mt-1">
                  <Badge variant={focusStudent?.status === 'at_risk' ? 'soft-error' : 'soft-info'}>
                    {focusStudent?.status === 'at_risk' ? '吏???꾩슂' : '?묓샇'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl border border-[#2c2d2f] bg-[#2b2c2f] text-white shadow-none">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8a857d]">
              鍮좊Ⅸ ?듦퀎
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#d4b74e]">
              AI 愿李?(AI Observation)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#ece8dc]">
              ?깃낵 ?鍮?異쒖꽍瑜좎씠 ??? ?섍컯?앹? 二쇨컙 泥댄겕?몄쓣 媛뺥솕?섍퀬, 怨쇱젣 ?쒖텧 ??吏㏃? ?쇰뱶諛?猷⑦봽瑜??쒓났?섎㈃ 媛쒖꽑 ?④낵媛 ?쎈땲??
            </p>
          </Card>
          <Card className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8a857d]">
              理쒓렐 ?쒖텧 (Recent Submissions)
            </p>
            <div className="mt-2 space-y-2 text-sm text-[#56524c]">
              <p>??怨쇱젣 ?쒖텧瑜??곸쐞 洹몃９: {filtered.filter((u) => (u.attendance_rate ?? 0) >= 90).length}紐?/p>
              <p>??吏묒쨷 吏????? {needSupportCount}紐?/p>
              <p>???꾩껜 ?섍컯?? {filtered.length}紐?/p>
            </div>
          </Card>
        </div>
      </div>

      <p className="text-caption text-gray-400 mt-4 text-center">
        ?꾩껜 {filtered.length}紐?      </p>
    </div>
  );
}
