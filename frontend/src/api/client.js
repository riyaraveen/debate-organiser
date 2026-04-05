import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  const clubId = localStorage.getItem('active_club_id')
  if (clubId) config.headers['X-Club-ID'] = clubId
  return config
})

const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password']

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !AUTH_PATHS.some(p => err.config?.url?.includes(p))) {
      localStorage.removeItem('token')
      localStorage.removeItem('active_club')
      localStorage.removeItem('active_club_id')
      window.location.href = '/login?reason=expired'
    }
    return Promise.reject(err)
  }
)

export default api
