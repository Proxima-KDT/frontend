import axiosInstance from './axiosInstance'

export const counselingApi = {
  getCounselors: () =>
    axiosInstance.get('/api/counseling/counselors').then((r) => r.data),

  getSlots: (counselorId) =>
    axiosInstance.get(`/api/counseling/slots/${counselorId}`).then((r) => r.data),

  book: (counselorId, date, time, reason) =>
    axiosInstance.post('/api/counseling/book', { counselor_id: counselorId, date, time, reason }).then((r) => r.data),

  getMyBookings: () =>
    axiosInstance.get('/api/counseling/bookings').then((r) => r.data),

  cancel: (bookingId) =>
    axiosInstance.delete(`/api/counseling/bookings/${bookingId}`).then((r) => r.data),
}
