import axiosInstance from './axiosInstance';

export const profileApi = {
  getMe: () => axiosInstance.get('/api/profile/me').then((r) => r.data),

  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance
      .post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getSkillScores: () =>
    axiosInstance.get('/api/profile/skill-scores').then((r) => {
      const d = r.data;
      return [
        { subject: '출석', score: d.attendance ?? 0 },
        { subject: 'AI 말하기', score: d.ai_speaking ?? 0 },
        { subject: 'AI 면접', score: d.ai_interview ?? 0 },
        { subject: '포트폴리오', score: d.portfolio ?? 0 },
        {
          subject: '프로젝트·과제·시험',
          score: d.project_assignment_exam ?? 0,
        },
      ];
    }),

  getFiles: () =>
    axiosInstance.get('/api/profile/files').then((r) => r.data.files ?? []),

  uploadFile: (file, fileType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    return axiosInstance
      .post('/api/profile/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  deleteFile: (fileId) =>
    axiosInstance.delete(`/api/profile/files/${fileId}`).then((r) => r.data),
};
