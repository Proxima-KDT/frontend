import axios from 'axios'
import { supabase } from '@/lib/supabase'

// 절대 URL이 있으면 그대로 사용. 없으면(빈 문자열) 상대 경로 /api → Vite dev 서버의 proxy → 백엔드
const raw = String(import.meta.env.VITE_API_URL ?? '').trim()
const baseURL = raw.replace(/\/$/, '') || undefined

if (import.meta.env.DEV && !raw) {
  // eslint-disable-next-line no-console
  console.warn(
    '[api] VITE_API_URL 이 비어 있습니다. 요청은 /api → Vite proxy(8000)로 전달됩니다. 원격 API를 쓰려면 frontend/.env 에 VITE_API_URL 을 설정하세요.',
  )
}

const axiosInstance = axios.create({
  baseURL,
})

// 요청마다 Supabase JWT 자동 첨부
axiosInstance.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// 401 응답 시 자동 로그아웃 (로그인 흐름 중 /api/profile/me 는 제외)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isProfileMe = error.config?.url?.includes('/api/profile/me')
    if (error.response?.status === 401 && !isProfileMe) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
