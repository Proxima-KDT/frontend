import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import axiosInstance from '@/api/axiosInstance';

const AuthContext = createContext(null);

function normalizeRole(rawRole) {
  const v = String(rawRole || '')
    .trim()
    .toLowerCase();
  if (v === 'teacher' || v === '강사') return 'teacher';
  if (v === 'admin' || v === '관리자') return 'admin';
  return 'student';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const buildUserFromSession = useCallback((session) => {
    const meta = session?.user?.user_metadata || {};
    return {
      id: session.user.id,
      email: session.user.email,
      name: meta.name || session.user.email?.split('@')?.[0] || '사용자',
      role: normalizeRole(meta.role),
      avatar_url: meta.avatar_url ?? null,
    };
  }, []);

  // 세션에서 프로필 조회 후 user 상태 세팅
  const loadUser = useCallback(
    async (session) => {
      if (!session) {
        setUser(null);
        return null;
      }
      try {
        const { data } = await axiosInstance.get('/api/profile/me');
        const userObj = {
          id: session.user.id,
          email: session.user.email,
          name: data.name,
          role: normalizeRole(data.role),
          avatar_url: data.avatar_url,
        };
        setUser(userObj);
        return userObj;
      } catch {
        const fallbackUser = buildUserFromSession(session);
        setUser(fallbackUser);
        return fallbackUser;
      }
    },
    [buildUserFromSession],
  );

  // 앱 시작 시 세션 복원
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await loadUser(session);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initSession();

    // 로그인/로그아웃 이벤트 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session);
      setLoading(false);
    });

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const login = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const loadedUser = await loadUser(data.session);
      if (!loadedUser)
        throw new Error(
          '프로필을 불러오지 못했습니다. 서버 상태를 확인해주세요.',
        );
      return { role: loadedUser.role };
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
