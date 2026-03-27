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
export const getNotifications  = ()  => api.get('/api/notifications/')
export const markAllRead       = ()  => api.post('/api/notifications/read-all')
export const markRead          = (id) => api.post(`/api/notifications/${id}/read`)
export const checkReminders    = ()  => api.post('/api/notifications/check-reminders')

// Notes
export const getMyNote = (sessionId) => api.get(`/api/sessions/${sessionId}/notes/me`)
export const saveMyNote = (sessionId, content) => api.put(`/api/sessions/${sessionId}/notes/me`, { content })
export const getTeamNotes = (sessionId) => api.get(`/api/sessions/${sessionId}/team-notes`)
export const notifyCalendar = (sessionId) => api.post(`/api/sessions/${sessionId}/notify-calendar`)

// AI
export const getCounterargument = (data) => api.post('/api/ai/counterargument', data)
export const evaluateArgument = (data) => api.post('/api/ai/evaluate', data)
export const getResearchSuggestions = (data) => api.post('/api/ai/research', data)
export const detectFallacies = (data) => api.post('/api/ai/detect-fallacies', data)
export const getWebSources = (topic) => api.get('/api/ai/web-sources', { params: { topic } })

// Team chat
export const getChatHistory = (sessionId) => api.get(`/api/sessions/${sessionId}/chat/history`)

// Settings
export const getSettings = () => api.get('/api/settings/')
export const updateSettings = (data) => api.patch('/api/settings/', data)

// Topics — AI generate
export const generateTopic = () => api.get('/api/topics/generate')

// Calendar events
export const getEvents    = ()       => api.get('/api/events/')
export const createEvent  = (data)   => api.post('/api/events/', data)
export const deleteEvent  = (id)     => api.delete(`/api/events/${id}`)
