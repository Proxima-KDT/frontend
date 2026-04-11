import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { teacherApi } from '@/api/teacher';
import { useAuth } from '@/context/AuthContext';

/**
 * 강사 사이드바 "담당 과정 드롭다운"에서 선택한 과정을 전역 상태로 보관.
 *
 * - 로그인한 강사가 담당하는 과정 목록을 로드
 * - 선택된 courseId는 localStorage에 유지 (새로고침/페이지 이동 시 유지)
 * - role !== 'teacher'면 no-op (관리자/학생 페이지에선 Provider가 래핑돼 있어도 안전)
 * - 각 강사 페이지는 useCourse()로 selectedCourseId를 구독하고, 값이 바뀌면 API 재호출
 */

const CourseContext = createContext(null);
const STORAGE_KEY = 'teacher.selectedCourseId';

export function CourseProvider({ children }) {
  const { role, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // 강사 로그인 시 담당 과정 목록 로드
  useEffect(() => {
    if (role !== 'teacher' || !user?.id) {
      setCourses([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    teacherApi
      .getMyCourses()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        // localStorage에 저장된 값이 현재 담당 과정에 없으면 첫 번째로 초기화
        setSelectedCourseIdState((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev;
          return list[0]?.id || null;
        });
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, user?.id]);

  // localStorage 동기화
  useEffect(() => {
    try {
      if (selectedCourseId) {
        localStorage.setItem(STORAGE_KEY, selectedCourseId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* noop */
    }
  }, [selectedCourseId]);

  const setSelectedCourseId = useCallback((id) => {
    setSelectedCourseIdState(id || null);
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId],
  );

  const value = useMemo(
    () => ({
      courses,
      selectedCourseId,
      setSelectedCourseId,
      selectedCourse,
      loading,
    }),
    [courses, selectedCourseId, setSelectedCourseId, selectedCourse, loading],
  );

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  // Provider 밖에서 호출돼도 no-op 기본값 반환 (관리자/학생 페이지 안전)
  if (!ctx) {
    return {
      courses: [],
      selectedCourseId: null,
      setSelectedCourseId: () => {},
      selectedCourse: null,
      loading: false,
    };
  }
  return ctx;
}

export function clearSelectedCourseStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
