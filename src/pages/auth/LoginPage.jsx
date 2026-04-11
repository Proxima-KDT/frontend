import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AuthLayout from '@/components/layout/AuthLayout'
import Card from '@/components/common/Card'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import { Mail, Lock } from 'lucide-react'

function toKoreanAuthError(message = '') {
  if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (message.includes('Email not confirmed')) return '이메일 인증이 필요합니다.'
  if (message.includes('Too many requests')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  return '로그인에 실패했습니다.'
}

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
    if (!email || !password) return
    setLoading(true)

    try {
      await login(email, password)
      showToast({ type: 'success', message: '로그인되었습니다.' })
      // role은 AuthContext에서 profile API로 자동 조회 → onAuthStateChange 후 리다이렉트
      navigate('/')
    } catch (err) {
      const msg = toKoreanAuthError(err.message)
      showToast({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
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

        <p className="text-center text-caption text-gray-400 mt-4">
          계정이 필요하신가요? 담당 관리자(멘토)에게 문의해 주세요.
        </p>
      </Card>
    </AuthLayout>
  )
}
