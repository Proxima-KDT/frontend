import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import axiosInstance from '@/api/axiosInstance';
import { clearSelectedCourseStorage } from '@/context/CourseContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 세션에서 프로필 조회 후 user 상태 세팅
  const loadUser = useCallback(async (session) => {
    if (!session) {
      setUser(null);
      return false;
    }
    try {
      const { data } = await axiosInstance.get('/api/profile/me');
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: data.name,
        role: data.role,
        avatar_url: data.avatar_url,
        course_track_type: data.course_track_type ?? null,
      });
      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  // 앱 시작 시 세션 복원
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session).finally(() => setLoading(false));
    });

    // 로그인/로그아웃 이벤트 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session);
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const login = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const ok = await loadUser(data.session);
      if (!ok)
        throw new Error(
          '프로필을 불러오지 못했습니다. 서버 상태를 확인해주세요.',
        );
    },
    [loadUser],
  );

  const signUp = useCallback(async (email, password, name, role) => {
    const metadata = { name, role };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    // 다른 강사로 재로그인할 때 이전 선택 과정이 섞이지 않도록 정리
    clearSelectedCourseStorage();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        loading,
        login,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
