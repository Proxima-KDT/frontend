import axiosInstance from './axiosInstance';

export const adminApi = {
  // ── 학생 관리 ─────────────────────────────────────
  getStudents: (search) =>
    axiosInstance
      .get('/api/admin/students', { params: search ? { search } : undefined })
      .then((r) => r.data),

  getStudent: (studentId) =>
    axiosInstance.get(`/api/admin/students/${studentId}`).then((r) => r.data),

  getStudentWeeklyAttendance: (studentId, date) =>
    axiosInstance
      .get(`/api/admin/students/${studentId}/attendance/week`, {
        params: { date },
      })
      .then((r) => r.data),

  updateNotes: (studentId, notes) =>
    axiosInstance
      .put(`/api/admin/students/${studentId}/notes`, { notes })
      .then((r) => r.data),

  getStudentFiles: (studentId) =>
    axiosInstance
      .get(`/api/admin/students/${studentId}/files`)
      .then((r) => r.data),

  // ── 사용자 관리 ────────────────────────────────────
  getUsers: (params) =>
    axiosInstance.get('/api/admin/users', { params }).then((r) => r.data),

  updateUserRole: (userId, role) =>
    axiosInstance
      .put(`/api/admin/users/${userId}/role`, { role })
      .then((r) => r.data),

  createStudent: (data) =>
    axiosInstance.post('/api/admin/users/students', data).then((r) => r.data),

  createTeacher: (data) =>
    axiosInstance.post('/api/admin/users/teachers', data).then((r) => r.data),

  // 과정(course) + 기수(cohort) 목록
  getCourses: () =>
    axiosInstance.get('/api/admin/courses').then((r) => r.data),

  // 강의 CRUD
  createCourse: (data) =>
    axiosInstance.post('/api/admin/courses', data).then((r) => r.data),
  updateCourse: (courseId, data) =>
    axiosInstance.put(`/api/admin/courses/${courseId}`, data).then((r) => r.data),
  deleteCourse: (courseId) =>
    axiosInstance.delete(`/api/admin/courses/${courseId}`).then((r) => r.data),

  // 기수 CRUD
  createCohort: (courseId, data) =>
    axiosInstance.post(`/api/admin/courses/${courseId}/cohorts`, data).then((r) => r.data),
  updateCohort: (cohortId, data) =>
    axiosInstance.put(`/api/admin/cohorts/${cohortId}`, data).then((r) => r.data),
  deleteCohort: (cohortId) =>
    axiosInstance.delete(`/api/admin/cohorts/${cohortId}`).then((r) => r.data),

  // 강사 목록 (과정 배정용)
  getTeachers: () =>
    axiosInstance.get('/api/admin/teachers').then((r) => r.data),

  // 관리자 비밀번호 재발급
  updateUserPassword: (userId, newPassword) =>
    axiosInstance
      .post(`/api/admin/users/${userId}/password`, { new_password: newPassword })
      .then((r) => r.data),

  // ── 장비 관리 ─────────────────────────────────────
  getEquipment: (params) =>
    axiosInstance.get('/api/admin/equipment', { params }).then((r) => r.data),

  getEquipmentHistory: (equipmentId) =>
    axiosInstance
      .get(`/api/admin/equipment/${equipmentId}/history`)
      .then((r) => r.data),

  createEquipment: (data) =>
    axiosInstance.post('/api/admin/equipment', data).then((r) => r.data),

  getEquipmentRequests: (params) =>
    axiosInstance
      .get('/api/admin/equipment/requests', { params })
      .then((r) => r.data),

  approveEquipmentRequest: (requestId, returnDue) =>
    axiosInstance
      .post(`/api/admin/equipment/requests/${requestId}/approve`, {
        return_due: returnDue,
      })
      .then((r) => r.data),

  rejectEquipmentRequest: (requestId, reason) =>
    axiosInstance
      .post(`/api/admin/equipment/requests/${requestId}/reject`, { reason })
      .then((r) => r.data),

  updateEquipmentStatus: (equipmentId, data) =>
    axiosInstance
      .put(`/api/admin/equipment/${equipmentId}/status`, data)
      .then((r) => r.data),

  updateEquipment: (equipmentId, data) =>
    axiosInstance
      .put(`/api/admin/equipment/${equipmentId}`, data)
      .then((r) => r.data),

  deleteEquipment: (equipmentId) =>
    axiosInstance
      .delete(`/api/admin/equipment/${equipmentId}`)
      .then((r) => r.data),

  uploadEquipmentImage: (equipmentId, formData) =>
    axiosInstance
      .post(`/api/admin/equipment/${equipmentId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  // ── 강의실 관리 ────────────────────────────────────
  getRooms: () => axiosInstance.get('/api/admin/rooms').then((r) => r.data),

  getRoomSlots: (params) =>
    axiosInstance.get('/api/admin/rooms/slots', { params }).then((r) => r.data),

  createRoom: (data) =>
    axiosInstance.post('/api/admin/rooms', data).then((r) => r.data),

  updateRoom: (roomId, data) =>
    axiosInstance.put(`/api/admin/rooms/${roomId}`, data).then((r) => r.data),

  updateRoomStatus: (roomId, status) =>
    axiosInstance
      .put(`/api/admin/rooms/${roomId}/status`, { status })
      .then((r) => r.data),

  deleteReservation: (reservationId) =>
    axiosInstance
      .delete(`/api/admin/rooms/reservations/${reservationId}`)
      .then((r) => r.data),
};
