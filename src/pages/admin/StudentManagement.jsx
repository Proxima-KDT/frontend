import { useState } from 'react'
import { Search } from 'lucide-react'
import { mockStudents } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Table from '@/components/common/Table'
import { useToast } from '@/context/ToastContext'

const roleVariant = { student: 'student', teacher: 'teacher', admin: 'admin' }
const roleLabel = { student: '학생', teacher: '강사', admin: '관리자' }

export default function StudentManagement() {
  const { showToast } = useToast()
  const [search, setSearch] = useState('')

  const allUsers = mockStudents.map((s) => ({
    ...s,
    role: 'student',
    status: s.is_at_risk ? 'at_risk' : 'active',
  }))

  const filtered = allUsers.filter((u) =>
    u.name.includes(search) || u.email.includes(search)
  )

  const handleRoleChange = (user, newRole) => {
    showToast({ type: 'success', message: `${user.name}의 역할이 ${roleLabel[newRole]}(으)로 변경되었습니다.` })
  }

  const columns = [
    {
      key: 'name',
      label: '이름',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-caption font-semibold">
            {val[0]}
          </div>
          <div>
            <span className="font-medium text-gray-900 block">{val}</span>
            <span className="text-caption text-gray-500">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: '역할',
      render: (val) => <Badge variant={roleVariant[val]}>{roleLabel[val]}</Badge>,
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
      render: (val) => <span className={val < 80 ? 'text-error-500 font-medium' : 'text-gray-700'}>{val}%</span>,
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
  ]

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">학생 관리</h1>

      {/* 검색 */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="이름 또는 이메일로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-body-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors"
        />
      </div>

      <Card padding="p-0">
        <Table columns={columns} data={filtered} />
      </Card>

      <p className="text-caption text-gray-400 mt-4 text-center">
        전체 {filtered.length}명
      </p>
    </div>
  )
}
