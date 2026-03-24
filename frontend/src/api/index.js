import api from './client'

// Auth
export const login = (email, password) => api.post('/api/auth/login', { email, password })
export const register = (data) => api.post('/api/auth/register', data)
export const getMe = () => api.get('/api/auth/me')

// Users
export const getUsers = () => api.get('/api/users/')
export const updateProfile = (data) => api.patch('/api/users/me', data)
export const updateUserRole = (userId, role) => api.patch(`/api/users/${userId}/role`, { role })

// Formats
export const getFormats = () => api.get('/api/formats/')
export const getFormat = (id) => api.get(`/api/formats/${id}`)
export const createFormat = (data) => api.post('/api/formats/', data)
export const toggleFormat = (id) => api.patch(`/api/formats/${id}/toggle`)

// Topics
export const getTopics = (params) => api.get('/api/topics/', { params })
export const getRandomTopic = (params) => api.get('/api/topics/random', { params })
export const createTopic = (data) => api.post('/api/topics/', data)
export const bulkCreateTopics = (topics) => api.post('/api/topics/bulk', topics)
export const updateTopic = (id, data) => api.patch(`/api/topics/${id}`, data)
export const deleteTopic = (id) => api.delete(`/api/topics/${id}`)

// Sessions
export const getSessions = () => api.get('/api/sessions/')
export const getSession = (id) => api.get(`/api/sessions/${id}`)
export const createSession = (data) => api.post('/api/sessions/', data)
export const updateSession = (id, data) => api.patch(`/api/sessions/${id}`, data)
export const deleteSession = (id) => api.delete(`/api/sessions/${id}`)

// Notifications
export const getNotifications = () => api.get('/api/notifications/')
export const markAllRead = () => api.post('/api/notifications/read-all')
export const markRead = (id) => api.post(`/api/notifications/${id}/read`)
