import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const loginPath = role ? `/login?role=${role}` : '/login'
    return <Navigate to={loginPath} replace />
  }

  if (role && userRole !== role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-display font-bold text-gray-300 mb-2">403</h1>
          <p className="text-h3 font-semibold text-gray-900 mb-1">접근 권한이 없습니다</p>
          <p className="text-body-sm text-gray-500 mb-4">이 페이지에 접근할 권한이 없습니다.</p>
          <a href="/" className="text-primary-500 hover:underline text-body-sm">홈으로 이동</a>
        </div>
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
