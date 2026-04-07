import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AuthLayout from '@/components/layout/AuthLayout'
import Card from '@/components/common/Card'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import { Mail, Lock } from 'lucide-react'

const roleLabels = {
  student: { label: '학생', variant: 'student' },
  teacher: { label: '강사', variant: 'teacher' },
  admin: { label: '관리자', variant: 'admin' },
}

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'student'
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const roleInfo = roleLabels[role] || roleLabels.student

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Mock 로그인 (0.5초 딜레이)
    setTimeout(() => {
      login(role)
      showToast({ type: 'success', message: `${roleInfo.label}으로 로그인되었습니다.` })
      navigate(`/${role}`)
      setLoading(false)
    }, 500)
  }

  return (
    <AuthLayout>
      <Card>
        <div className="text-center mb-6">
          <Badge variant={roleInfo.variant} className="mb-3">
            {roleInfo.label} 로그인
          </Badge>
          <h1 className="text-h2 font-bold text-gray-900">로그인</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            로그인
          </Button>
        </form>

        <p className="text-center text-body-sm text-gray-500 mt-4">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-primary-500 font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
