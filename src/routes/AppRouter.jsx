import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Skeleton from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { CourseProvider } from '@/context/CourseContext';

// 강사 라우트용 래퍼 — CourseProvider 는 AppRouter 최상위에 위치.
function TeacherRoute({ children }) {
  return <ProtectedRoute role="teacher">{children}</ProtectedRoute>;
}

// Auth 페이지
const LandingPage = lazy(() => import('@/pages/auth/LandingPage'));
const MainPage9 = lazy(() => import('@/pages/auth/MainPage9'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const NotFoundPage = lazy(() => import('@/pages/auth/NotFoundPage'));

// Student 페이지
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const ProblemList = lazy(() => import('@/pages/student/ProblemList'));
const ProblemDetail = lazy(() => import('@/pages/student/ProblemDetail'));
const SubjectDetail = lazy(() => import('@/pages/student/SubjectDetail'));
const ConceptQuiz = lazy(() => import('@/pages/student/ConceptQuiz'));
const MyPage = lazy(() => import('@/pages/student/MyPage'));
const VoiceFeedback = lazy(() => import('@/pages/student/VoiceFeedback'));
const MockInterview = lazy(() => import('@/pages/student/MockInterview'));
const Attendance = lazy(() => import('@/pages/student/Attendance'));
const StudentQuestions = lazy(() => import('@/pages/student/Questions'));
const StudentEquipment = lazy(() => import('@/pages/student/Equipment'));
const RoomReservation = lazy(() => import('@/pages/student/RoomReservation'));
const CounselingBooking = lazy(
  () => import('@/pages/student/CounselingBooking'),
);
const Assignments = lazy(() => import('@/pages/student/Assignments'));
const Assessments = lazy(() => import('@/pages/student/Assessments'));

// Teacher 페이지
const TeacherDashboard = lazy(() => import('@/pages/teacher/Dashboard'));
const StudentDetail = lazy(() => import('@/pages/teacher/StudentDetail'));
const TeacherQuestions = lazy(() => import('@/pages/teacher/Questions'));
const Counseling = lazy(() => import('@/pages/teacher/Counseling'));
const CounselingSchedule = lazy(
  () => import('@/pages/teacher/CounselingSchedule'),
);
const AttendanceCheck = lazy(() => import('@/pages/teacher/AttendanceCheck'));
const AssignmentManagement = lazy(
  () => import('@/pages/teacher/AssignmentManagement'),
);
const AssessmentManagement = lazy(
  () => import('@/pages/teacher/AssessmentManagement'),
);
const ProblemManagement = lazy(
  () => import('@/pages/teacher/ProblemManagement'),
);
const TeacherCurriculum = lazy(() => import('@/pages/teacher/Curriculum'));

// Admin 페이지
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const EquipmentManagement = lazy(
  () => import('@/pages/admin/EquipmentManagement'),
);
const AdminStudentDetail = lazy(() => import('@/pages/admin/StudentDetail'));
const RoomReservationManagement = lazy(
  () => import('@/pages/admin/RoomReservationManagement'),
);
const AdminCounselingSchedule = lazy(
  () => import('@/pages/admin/CounselingSchedule'),
);
const AdminRoomReservation = lazy(
  () => import('@/pages/admin/AdminRoomReservation'),
);
const RegisterStudent = lazy(() => import('@/pages/admin/RegisterStudent'));
const RegisterTeacher = lazy(() => import('@/pages/admin/RegisterTeacher'));
const CourseManagement = lazy(() => import('@/pages/admin/CourseManagement'));
const AdminCounseling = lazy(() => import('@/pages/admin/Counseling'));

// Common 페이지 (통합 AI 에이전트 — 모든 role 공통)
const AIAgent = lazy(() => import('@/pages/common/AIAgent'));

// 루트(/)는 로그인 상태이면 role별 대시보드로, 아니면 메인 랜딩 표시
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'student') return <Navigate to="/student" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <MainPage9 />;
}

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton width="200px" height="32px" rounded="rounded-lg" />
      <Skeleton width="100%" height="200px" rounded="rounded-2xl" />
      <Skeleton width="100%" height="150px" rounded="rounded-2xl" />
    </div>
  );
}

export default function AppRouter() {
  return (
    // CourseProvider 단일 인스턴스 — 네비게이션 시 언마운트 없이 유지.
    // role !== 'teacher' 이면 내부가 no-op이라 학생/관리자 페이지도 안전.
    <CourseProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/main9" element={<MainPage9 />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <MyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/problems"
            element={
              <ProtectedRoute role="student">
                <ProblemList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/problems/:subjectId/:conceptId"
            element={
              <ProtectedRoute role="student">
                <ConceptQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/problems/:subjectId"
            element={
              <ProtectedRoute role="student">
                <SubjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/problems/:id"
            element={
              <ProtectedRoute role="student">
                <ProblemDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/voice-feedback"
            element={
              <ProtectedRoute role="student">
                <VoiceFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/mock-interview"
            element={
              <ProtectedRoute role="student">
                <MockInterview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute role="student">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/questions"
            element={
              <ProtectedRoute role="student">
                <StudentQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/equipment"
            element={
              <ProtectedRoute role="student">
                <StudentEquipment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/room-reservation"
            element={
              <ProtectedRoute role="student">
                <RoomReservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/counseling-booking"
            element={
              <ProtectedRoute role="student">
                <CounselingBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute role="student">
                <Assignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assessments"
            element={
              <ProtectedRoute role="student">
                <Assessments />
              </ProtectedRoute>
            }
          />

          {/* Teacher */}
          <Route
            path="/teacher"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/students/:id"
            element={
              <TeacherRoute>
                <StudentDetail />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/questions"
            element={
              <TeacherRoute>
                <TeacherQuestions />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/counseling"
            element={
              <TeacherRoute>
                <Counseling />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/counseling-schedule"
            element={
              <TeacherRoute>
                <CounselingSchedule />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/attendance-check"
            element={
              <TeacherRoute>
                <AttendanceCheck />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/assignments"
            element={
              <TeacherRoute>
                <AssignmentManagement />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/assessments"
            element={
              <TeacherRoute>
                <AssessmentManagement />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/problems"
            element={
              <TeacherRoute>
                <ProblemManagement />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/curriculum"
            element={
              <TeacherRoute>
                <TeacherCurriculum />
              </TeacherRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/equipment"
            element={
              <ProtectedRoute role="admin">
                <EquipmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute role="admin">
                <AdminStudentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/room-reservation"
            element={
              <ProtectedRoute role="admin">
                <RoomReservationManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/counseling-schedule"
            element={
              <ProtectedRoute role="admin">
                <AdminCounselingSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/counseling"
            element={
              <ProtectedRoute role="admin">
                <AdminCounseling />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/room-use"
            element={
              <ProtectedRoute role="admin">
                <AdminRoomReservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/register/student"
            element={
              <ProtectedRoute role="admin">
                <RegisterStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/register/teacher"
            element={
              <ProtectedRoute role="admin">
                <RegisterTeacher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute role="admin">
                <CourseManagement />
              </ProtectedRoute>
            }
          />

          {/* 통합 AI 에이전트 — 모든 role 공통 (role 별 UI 자동 분기) */}
          <Route
            path="/ai-agent"
            element={
              <ProtectedRoute>
                <AIAgent />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </CourseProvider>
  );
}
