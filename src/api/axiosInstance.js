import axios from 'axios'
import { supabase } from '@/lib/supabase'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
