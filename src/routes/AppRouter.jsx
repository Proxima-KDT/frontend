import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Skeleton from '@/components/common/Skeleton';

// Auth 페이지
const LandingPage = lazy(() => import('@/pages/auth/LandingPage'));
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
const JobMatching = lazy(() => import('@/pages/student/JobMatching'));
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
const ProblemManagement = lazy(
  () => import('@/pages/teacher/ProblemManagement'),
);

// Admin 페이지
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const EquipmentManagement = lazy(
  () => import('@/pages/admin/EquipmentManagement'),
);
const StudentManagement = lazy(() => import('@/pages/admin/StudentManagement'));

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
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
          path="/student/jobs"
          element={
            <ProtectedRoute role="student">
              <JobMatching />
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
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students/:id"
          element={
            <ProtectedRoute role="teacher">
              <StudentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/questions"
          element={
            <ProtectedRoute role="teacher">
              <TeacherQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/counseling"
          element={
            <ProtectedRoute role="teacher">
              <Counseling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/problems"
          element={
            <ProtectedRoute role="teacher">
              <ProblemManagement />
            </ProtectedRoute>
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
          path="/admin/students"
          element={
            <ProtectedRoute role="admin">
              <StudentManagement />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
