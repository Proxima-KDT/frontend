import axiosInstance from './axiosInstance'

export const roomsApi = {
  getList: () =>
    axiosInstance.get('/api/rooms').then((r) => r.data),

  getSlots: (roomId, date) =>
    axiosInstance.get(`/api/rooms/${roomId}/slots`, { params: { date } }).then((r) => r.data),

  getMyReservations: () =>
    axiosInstance.get('/api/rooms/my-reservations').then((r) => r.data),

  reserve: (data) =>
    axiosInstance.post('/api/rooms/reserve', data).then((r) => r.data),

  cancelReservation: (reservationId) =>
    axiosInstance.delete(`/api/rooms/reservations/${reservationId}`).then((r) => r.data),
}
