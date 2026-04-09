import axiosInstance from './axiosInstance';

export const counselingManageApi = {
  // 월별 상담 일정 캘린더 조회
  getSchedule: (year, month) =>
    axiosInstance
      .get('/api/counseling/manage/schedule', { params: { year, month } })
      .then((r) => r.data),

  // 특정 날짜 차단 슬롯 조회
  getBlockedSlots: (dateStr) =>
    axiosInstance
      .get(`/api/counseling/manage/blocked-slots/${dateStr}`)
      .then((r) => r.data),

  // 특정 날짜 차단 슬롯 업데이트 (blocked_times 배열)
  updateBlockedSlots: (dateStr, blockedTimes) =>
    axiosInstance
      .patch(`/api/counseling/manage/blocked-slots/${dateStr}`, {
        blocked_times: blockedTimes,
      })
      .then((r) => r.data),

  // 상담 예약 목록 조회
  getBookings: (params) =>
    axiosInstance
      .get('/api/counseling/manage/bookings', { params })
      .then((r) => r.data),

  // 예약 확정 / 취소
  updateBooking: (bookingId, action, reason) =>
    axiosInstance
      .patch(`/api/counseling/manage/bookings/${bookingId}`, { action, reason })
      .then((r) => r.data),
};
