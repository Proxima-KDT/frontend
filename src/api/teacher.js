import axiosInstance from './axiosInstance';

export const teacherApi = {
  // ── 학생 관리 ─────────────────────────────────────
  getStudents: () =>
    axiosInstance.get('/api/teacher/students').then((r) => r.data),

  getStudent: (studentId) =>
    axiosInstance.get(`/api/teacher/students/${studentId}`).then((r) => r.data),

  getStudentWeeklyAttendance: (studentId, date) =>
    axiosInstance
      .get(`/api/teacher/students/${studentId}/attendance/week`, {
        params: { date },
      })
      .then((r) => r.data),

  updateNotes: (studentId, notes) =>
    axiosInstance
      .patch(`/api/teacher/students/${studentId}/notes`, { notes })
      .then((r) => r.data),

  // ── 출결 관리 ─────────────────────────────────────
  getClassroomSeats: () =>
    axiosInstance.get('/api/teacher/classroom/seats').then((r) => r.data),

  getAttendanceByDate: (dateStr) =>
    axiosInstance.get(`/api/teacher/attendance/${dateStr}`).then((r) => r.data),

  updateAttendanceStatus: (dateStr, studentId, status) =>
    axiosInstance
      .patch(`/api/teacher/attendance/${dateStr}/${studentId}`, { status })
      .then((r) => r.data),

  // ── 과제 관리 ─────────────────────────────────────
  getAssignments: () =>
    axiosInstance.get('/api/teacher/assignments').then((r) => r.data),

  getAssignment: (assignmentId) =>
    axiosInstance
      .get(`/api/teacher/assignments/${assignmentId}`)
      .then((r) => r.data),

  createAssignment: (data) =>
    axiosInstance.post('/api/teacher/assignments', data).then((r) => r.data),

  deleteAssignment: (assignmentId) =>
    axiosInstance
      .delete(`/api/teacher/assignments/${assignmentId}`)
      .then((r) => r.data),

  gradeAssignmentSubmission: (assignmentId, studentId, data) =>
    axiosInstance
      .patch(
        `/api/teacher/assignments/${assignmentId}/submissions/${studentId}`,
        data,
      )
      .then((r) => r.data),

  // ── 평가 관리 ─────────────────────────────────────
  getAssessments: () =>
    axiosInstance.get('/api/teacher/assessments').then((r) => r.data),

  aiScoreAssessment: (assessmentId, studentId) =>
    axiosInstance
      .post(
        `/api/teacher/assessments/${assessmentId}/submissions/${studentId}/ai-score`,
      )
      .then((r) => r.data),

  gradeAssessmentSubmission: (assessmentId, studentId, data) =>
    axiosInstance
      .patch(
        `/api/teacher/assessments/${assessmentId}/submissions/${studentId}`,
        data,
      )
      .then((r) => r.data),

  // ── 문제 관리 ─────────────────────────────────────
  getProblems: (params) =>
    axiosInstance.get('/api/teacher/problems', { params }).then((r) => r.data),

  createProblem: (data) =>
    axiosInstance.post('/api/teacher/problems', data).then((r) => r.data),

  updateProblem: (problemId, data) =>
    axiosInstance
      .patch(`/api/teacher/problems/${problemId}`, data)
      .then((r) => r.data),

  deleteProblem: (problemId) =>
    axiosInstance
      .delete(`/api/teacher/problems/${problemId}`)
      .then((r) => r.data),

  generateAIProblem: (data) =>
    axiosInstance
      .post('/api/teacher/problems/generate-ai', data)
      .then((r) => r.data),

  // ── 상담 (음성 녹음) ──────────────────────────────
  uploadCounselingAudio: (formData) =>
    axiosInstance
      .post('/api/teacher/counseling/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  getCounselingRecords: () =>
    axiosInstance.get('/api/teacher/counseling/records').then((r) => r.data),
};
