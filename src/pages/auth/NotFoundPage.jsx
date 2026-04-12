import { useNavigate } from 'react-router-dom'
import Button from '@/components/common/Button'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f3f1ea] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-[6rem] font-bold text-[#e8e4dc] leading-none mb-2">404</h1>
        <h2 className="text-h2 font-semibold text-gray-900 mb-2">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-body-sm text-gray-500 mb-6">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Button icon={Home} onClick={() => navigate('/')}>
          홈으로 이동
        </Button>
      </div>
    </div>
  )
}
