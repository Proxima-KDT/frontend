import axiosInstance from './axiosInstance'

export const curriculumApi = {
  getAll: () =>
    axiosInstance.get('/api/curriculum').then((r) => r.data),

  getTasks: (phaseId) =>
    axiosInstance.get(`/api/curriculum/${phaseId}/tasks`).then((r) => r.data),

  getCoursePeriod: () =>
    axiosInstance.get('/api/curriculum/course-period').then((r) => r.data),
}
