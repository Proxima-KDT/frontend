import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { useToast } from '@/context/ToastContext';

const roleVariant = { student: 'student', teacher: 'teacher', admin: 'admin' };
const roleLabel = { student: '학생', teacher: '강사', admin: '관리자' };

function HighlightText({ text, query }) {
  if (!query.trim() || !text) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function StudentManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

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
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRoleChange = (user, newRole) => {
    adminApi
      .updateUserRole(user.id, newRole)
      .then(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
        );
        showToast({
          type: 'success',
          message: `${user.name}의 역할이 ${roleLabel[newRole]}(으)로 변경되었습니다.`,
        });
      })
      .catch(() =>
        showToast({ message: '역할 변경에 실패했습니다.', type: 'error' }),
      );
  };

  const columns = [
    {
      key: 'name',
      label: '이름',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-caption font-semibold shrink-0">
            {val?.[0]}
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              <HighlightText text={val} query={search} />
            </span>
            <span className="text-caption text-gray-500">
              <HighlightText text={row.email} query={search} />
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: '역할',
      render: (val) => (
        <Badge variant={roleVariant[val]}>{roleLabel[val]}</Badge>
      ),
    },
    {
      key: 'enrolled_at',
      label: '등록일',
    },
    {
      key: 'status',
      label: '상태',
      render: (val) => (
        <Badge variant={val === 'at_risk' ? 'error' : 'success'}>
          {val === 'at_risk' ? '위험' : '정상'}
        </Badge>
      ),
    },
    {
      key: 'attendance_rate',
      label: '출석률',
      render: (val) => (
        <span
          className={val < 80 ? 'text-error-500 font-medium' : 'text-gray-700'}
        >
          {val}%
        </span>
      ),
    },
    {
      key: 'actions',
      label: '관리',
      render: (_, row) => (
        <select
          defaultValue={row.role}
          onChange={(e) => handleRoleChange(row, e.target.value)}
          className="text-caption border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-primary-500"
        >
          <option value="student">학생</option>
          <option value="teacher">강사</option>
          <option value="admin">관리자</option>
        </select>
      ),
    },
  ];

  return (
    <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <h1 className="text-h1 font-bold text-gray-900 mb-6">학생 관리</h1>

      {/* 검색 */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="이름 또는 이메일로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-body-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {search.trim() && (
          <p className="text-caption text-gray-400 mt-2 ml-1">
            <span className="text-primary-600 font-semibold">'{search.trim()}'</span> 검색 결과 —{' '}
            <span className="font-semibold text-gray-600">{filtered.length}명</span>
            {filtered.length === 0 && ' (결과 없음)'}
          </p>
        )}
      </div>

      <Card padding="p-0">
        <Table columns={columns} data={filtered} />
      </Card>

      <p className="text-caption text-gray-400 mt-4 text-center">
        전체 {filtered.length}명 / {users.length}명
      </p>
    </div>
  );
}
