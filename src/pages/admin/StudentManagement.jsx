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
          message: '사용자 목록을 불러오지 못했습니다.',
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
      label: '수강생',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#dfe8ec] text-[#456170] flex items-center justify-center text-caption font-semibold">
            {val?.[0] ?? '?'}
          </div>
          <div>
            <span className="font-medium text-gray-900 block">{val ?? '이름 없음'}</span>
            <span className="text-caption text-gray-500">{row.enrolled_at ?? '-'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'attendance_rate',
      label: '출석률',
      render: (val) => <span className="text-body-sm font-semibold text-[#505a66]">{val ?? 0}%</span>,
    },
    {
      key: 'performance',
      label: '학습 성과',
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
      label: '상태',
      render: (val) => {
        const isRisk = val === 'at_risk';
        return (
          <Badge variant={isRisk ? 'soft-error' : 'soft-info'}>
            {isRisk ? '지원 필요' : '양호'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: '액션',
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
            Ethereal Academy
          </p>
          <h1 className="font-['Playfair_Display',Georgia,serif] text-[2.2rem] text-[#2f333a]">
            수강생 현황 (Student Roster Overview)
          </h1>
          <p className="text-sm text-[#7b7872]">개별 학습 진행도와 출결을 함께 확인합니다. (AI 기반 인사이트 포함)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a19d94]" />
            <input
              type="text"
              placeholder="수강생 검색 (Search students)"
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
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#8a857d]">평균 성과 (Average Performance)</p>
          <p className="mt-1 text-4xl font-semibold text-[#2f3f54]">{avgPerformance}%</p>
        </Card>
        <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#8a857d]">출석률 (Attendance Rate)</p>
          <p className="mt-1 text-4xl font-semibold text-[#2f3f54]">{avgAttendance}%</p>
        </Card>
        <Card className="rounded-2xl border border-[#decf8e] bg-[#e6c55a] shadow-none">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#705b1f]">지원 필요 (AI)</p>
          <p className="mt-1 text-4xl font-semibold text-[#4a3a14]">{needSupportCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <Card padding="p-0" className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="font-['Playfair_Display',Georgia,serif] text-[1.5rem] text-[#32363d]">
              최근 등록 수강생
            </h3>
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
                <p className="font-['Playfair_Display',Georgia,serif] text-[1.35rem] text-[#2f333a]">
                  {focusStudent?.name ?? '선택된 수강생 없음'}
                </p>
                <p className="text-xs text-[#7e7a72]">{focusStudent?.email ?? '-'}</p>
                <div className="mt-1">
                  <Badge variant={focusStudent?.status === 'at_risk' ? 'soft-error' : 'soft-info'}>
                    {focusStudent?.status === 'at_risk' ? '지원 필요' : '양호'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl border border-[#2c2d2f] bg-[#2b2c2f] text-white shadow-none">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8a857d]">
              빠른 통계
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#d4b74e]">
              AI 관찰 (AI Observation)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#ece8dc]">
              성과 대비 출석률이 낮은 수강생은 주간 체크인을 강화하고, 과제 제출 전 짧은 피드백 루프를 제공하면 개선 효과가 큽니다.
            </p>
          </Card>
          <Card className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8a857d]">
              최근 제출 (Recent Submissions)
            </p>
            <div className="mt-2 space-y-2 text-sm text-[#56524c]">
              <p>• 과제 제출률 상위 그룹: {filtered.filter((u) => (u.attendance_rate ?? 0) >= 90).length}명</p>
              <p>• 집중 지원 대상: {needSupportCount}명</p>
              <p>• 전체 수강생: {filtered.length}명</p>
            </div>
          </Card>
        </div>
      </div>

      <p className="text-caption text-gray-400 mt-4 text-center">
        전체 {filtered.length}명
      </p>
    </div>
  );
}
