import axiosInstance from './axiosInstance';

export const counselingApi = {
  getCounselors: () =>
    axiosInstance.get('/api/counseling/counselors').then((r) => r.data),

  getSlots: (counselorId, year, month) =>
    axiosInstance
      .get(`/api/counseling/slots/${counselorId}`, {
        params: { year, month },
      })
      .then((r) => {
        // 백엔드가 [{date, available_times, blocked_times}] 배열로 반환
        // 프론트에서 slots[날짜] 형태로 쓸 수 있게 {날짜: [시간]} 객체로 변환
        return Object.fromEntries(
          r.data.map((s) => [s.date, s.available_times]),
        );
      }),

  book: (counselorId, date, time, reason) =>
    axiosInstance
      .post('/api/counseling/book', {
        counselor_id: counselorId,
        date,
        time,
        reason,
      })
      .then((r) => r.data),

  getMyBookings: () =>
    axiosInstance.get('/api/counseling/bookings').then((r) => r.data),

  cancel: (bookingId) =>
    axiosInstance
      .delete(`/api/counseling/bookings/${bookingId}`)
      .then((r) => r.data),
};
