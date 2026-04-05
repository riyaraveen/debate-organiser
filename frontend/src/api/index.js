import api from './client'

// Auth
export const login = (email, password) => api.post('/api/auth/login', { email, password })
export const register = (data) => api.post('/api/auth/register', data)
export const getMe = () => api.get('/api/auth/me')

// Clubs
export const getMyClubs = () => api.get('/api/clubs/mine')
export const createClub = (data) => api.post('/api/clubs/', data)
export const getClubMembers = (clubId) => api.get(`/api/clubs/${clubId}/members`)
export const updateClubMemberRole = (clubId, userId, role) => api.patch(`/api/clubs/${clubId}/members/${userId}`, { role })
export const removeClubMember = (clubId, userId) => api.delete(`/api/clubs/${clubId}/members/${userId}`)

// Users
export const getUsers = () => api.get('/api/users/')
export const getUser = (id) => api.get(`/api/users/${id}`)
export const updateProfile = (data) => api.patch('/api/users/me', data)
export const updateUserRole = (userId, role) => api.patch(`/api/users/${userId}/role`, { role })

// Availability
export const getAvailability = (userId) => api.get(`/api/users/${userId}/availability`)
export const addAvailability = (date) => api.post('/api/users/me/availability', { date })
export const removeAvailability = (date) => api.delete(`/api/users/me/availability/${date}`)

// Formats
export const getFormats = (all = false) => api.get('/api/formats/', { params: all ? { all: true } : {} })
export const getFormat = (id) => api.get(`/api/formats/${id}`)
export const createFormat = (data) => api.post('/api/formats/', data)
export const updateFormat = (id, data) => api.patch(`/api/formats/${id}`, data)
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
export const addParticipant = (sessionId, data) => api.post(`/api/sessions/${sessionId}/participants`, data)
export const removeParticipant = (sessionId, participantId) => api.delete(`/api/sessions/${sessionId}/participants/${participantId}`)
export const updateParticipant = (sessionId, participantId, data) => api.patch(`/api/sessions/${sessionId}/participants/${participantId}`, data)

// Notifications
export const getNotifications = ()    => api.get('/api/notifications/')
export const markAllRead      = ()    => api.post('/api/notifications/read-all')
export const markRead         = (id)  => api.post(`/api/notifications/${id}/read`)

// Auth — password reset
export const forgotPassword  = (email)          => api.post('/api/auth/forgot-password', { email })
export const resetPassword   = (token, newPassword) => api.post('/api/auth/reset-password', { token, new_password: newPassword })

// Attendance
export const updateAttendance = (sessionId, participantId, attended) =>
  api.patch(`/api/sessions/${sessionId}/participants/${participantId}/attendance`, { attended })

// Scores
export const getSessionScores = (sessionId) => api.get(`/api/sessions/${sessionId}/scores`)
export const createScore      = (sessionId, data) => api.post(`/api/sessions/${sessionId}/scores`, data)

// Member stats
export const getUserStats = (userId) => api.get(`/api/users/${userId}/stats`)

// Notes
export const getMyNote = (sessionId) => api.get(`/api/sessions/${sessionId}/notes/me`)
export const saveMyNote = (sessionId, content) => api.put(`/api/sessions/${sessionId}/notes/me`, { content })
export const getTeamNotes = (sessionId) => api.get(`/api/sessions/${sessionId}/team-notes`)
export const getUserNote = (sessionId, userId) => api.get(`/api/sessions/${sessionId}/notes/${userId}`)
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

// Session templates
export const getTemplates = () => api.get('/api/templates/')
export const createTemplate = (data) => api.post('/api/templates/', data)
export const deleteTemplate = (id) => api.delete(`/api/templates/${id}`)

// Calendar events
export const getEvents    = ()       => api.get('/api/events/')
export const createEvent  = (data)   => api.post('/api/events/', data)
export const deleteEvent  = (id)     => api.delete(`/api/events/${id}`)

// Announcements
export const getAnnouncements    = ()       => api.get('/api/announcements/')
export const createAnnouncement  = (data)   => api.post('/api/announcements/', data)
export const deleteAnnouncement  = (id)     => api.delete(`/api/announcements/${id}`)

// Invite codes
export const getInvites         = ()     => api.get('/api/invites/')
export const createInvite       = ()     => api.post('/api/invites/')
export const deactivateInvite   = (id)   => api.delete(`/api/invites/${id}`)
export const validateInvite     = (code) => api.get(`/api/invites/validate/${code}`)
