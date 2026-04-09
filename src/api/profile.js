import axiosInstance from './axiosInstance'

export const profileApi = {
  getMe: () =>
    axiosInstance.get('/api/profile/me').then((r) => r.data),

  updateTargetJobs: (targetJobs) =>
    axiosInstance.put('/api/profile/target-jobs', { target_jobs: targetJobs }).then((r) => r.data),

  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosInstance.post('/api/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  getSkillScores: () =>
    axiosInstance.get('/api/profile/skill-scores').then((r) => r.data),
}
