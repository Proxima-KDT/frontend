import axiosInstance from './axiosInstance';

export const attendanceApi = {
  getToday: () =>
    axiosInstance.get('/api/attendance/today').then((r) => r.data),

  checkIn: (signatureUrl) =>
    axiosInstance
      .post('/api/attendance/check-in', { signature_url: signatureUrl })
      .then((r) => r.data),

  checkOut: () =>
    axiosInstance.post('/api/attendance/check-out').then((r) => r.data),

  earlyLeave: (reason) =>
    axiosInstance
      .post('/api/attendance/early-leave', { reason })
      .then((r) => r.data),

  getMonthly: (year, month) =>
    axiosInstance
      .get('/api/attendance/monthly', { params: { year, month } })
      .then((r) => r.data),

  getSummary: () =>
    axiosInstance.get('/api/attendance/summary').then((r) => r.data),
};
