import axiosInstance from './axiosInstance'

export const jobsApi = {
  getList: (search = '') =>
    axiosInstance.get('/api/jobs', { params: search ? { search } : {} }).then((r) => r.data),
}
