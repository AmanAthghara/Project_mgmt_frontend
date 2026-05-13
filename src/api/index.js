import api from './client'

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════
export const authApi = {
  // Step 1: send OTP
  register: (data) => {
    console.log('%c[AUTH] register — step 1 (send OTP)', 'color:#a78bfa', data.email)
    return api.post('/auth/register', data)
  },

  // Step 2: verify OTP → create account
  verifyOtp: (data) => {
    console.log('%c[AUTH] verifyOtp — step 2', 'color:#a78bfa', data.email)
    return api.post('/auth/verify-otp', data)
  },

  login: (data) => {
    console.log('%c[AUTH] login', 'color:#a78bfa', data.email)
    return api.post('/auth/login', data)
  },

  forgotPassword: (email) => {
    console.log('%c[AUTH] forgotPassword', 'color:#a78bfa', email)
    return api.post('/auth/forgot-password', { email })
  },

  resetPassword: (data) => {
    console.log('%c[AUTH] resetPassword', 'color:#a78bfa')
    return api.post('/auth/reset-password', data)
  },

  changePassword: (data) => {
    console.log('%c[AUTH] changePassword', 'color:#a78bfa')
    return api.put('/auth/change-password', data)
  },

  getMe: () => {
    console.log('%c[AUTH] getMe', 'color:#a78bfa')
    return api.get('/auth/me')
  },

  updateMe: (data) => {
    console.log('%c[AUTH] updateMe', 'color:#a78bfa', data)
    return api.put('/auth/me', data)
  },
}

// ══════════════════════════════════════════════════════════════
//  PROJECTS
// ══════════════════════════════════════════════════════════════
export const projectsApi = {
  // Public projects (searchable)
  getPublic: (params = {}) => {
    console.log('%c[PROJECTS] getPublic', 'color:#4f8ef7', params)
    return api.get('/projects', { params })
  },

  // My projects (member of)
  getMine: () => {
    console.log('%c[PROJECTS] getMine', 'color:#4f8ef7')
    return api.get('/projects/me')
  },

  getById: (id) => {
    console.log('%c[PROJECTS] getById', 'color:#4f8ef7', id)
    return api.get(`/projects/${id}`)
  },

  create: (data) => {
    console.log('%c[PROJECTS] create', 'color:#4f8ef7', data)
    return api.post('/projects', data)
  },

  update: (id, data) => {
    console.log('%c[PROJECTS] update', 'color:#4f8ef7', id, data)
    return api.put(`/projects/${id}`, data)
  },

  delete: (id) => {
    console.log('%c[PROJECTS] delete', 'color:#4f8ef7', id)
    return api.delete(`/projects/${id}`)
  },

  // Members
  getMembers: (id) => {
    console.log('%c[PROJECTS] getMembers', 'color:#4f8ef7', id)
    return api.get(`/projects/${id}/members`)
  },

  removeMember: (projectId, userId) => {
    console.log('%c[PROJECTS] removeMember', 'color:#4f8ef7', { projectId, userId })
    return api.delete(`/projects/${projectId}/members/${userId}`)
  },

  promoteMember: (projectId, userId) => {
    console.log('%c[PROJECTS] promoteMember', 'color:#4f8ef7', { projectId, userId })
    return api.put(`/projects/${projectId}/members/${userId}/promote`)
  },

  searchUsers: (projectId, q) => {
    console.log('%c[PROJECTS] searchUsers', 'color:#4f8ef7', { projectId, q })
    return api.get(`/projects/${projectId}/search-users`, { params: { q } })
  },
}

// ══════════════════════════════════════════════════════════════
//  JOIN REQUESTS
// ══════════════════════════════════════════════════════════════
export const requestsApi = {
  // Admin invites a user
  invite: (projectId, data) => {
    console.log('%c[REQUESTS] adminInvite', 'color:#fbbf24', { projectId, ...data })
    return api.post(`/projects/${projectId}/invite`, data)
  },

  // Member requests to join
  requestJoin: (projectId, data = {}) => {
    console.log('%c[REQUESTS] requestJoin', 'color:#fbbf24', projectId)
    return api.post(`/projects/${projectId}/join`, data)
  },

  // Admin: get pending requests for project
  getPending: (projectId) => {
    console.log('%c[REQUESTS] getPending', 'color:#fbbf24', projectId)
    return api.get(`/projects/${projectId}/requests`)
  },

  // Admin: accept or reject
  resolve: (projectId, requestId, action) => {
    console.log('%c[REQUESTS] resolve', 'color:#fbbf24', { projectId, requestId, action })
    return api.put(`/projects/${projectId}/requests/${requestId}`, { action })
  },

// My outbound requests + invites received
  getMine: () => {
    console.log('%c[REQUESTS] getMine', 'color:#fbbf24')
    return api.get('/join-requests/me')
  },

  // Invited user accepts or rejects an admin_invite
  respondToInvite: (requestId, action) => {
    console.log('%c[REQUESTS] respondToInvite', 'color:#a78bfa', { requestId, action })
    return api.put(`/join-requests/${requestId}/respond`, { action })
  },

  // Cancel my own member_request
  cancel: (requestId) => {
    console.log('%c[REQUESTS] cancel', 'color:#fbbf24', requestId)
    return api.delete(`/join-requests/${requestId}`)
  },
}

// ══════════════════════════════════════════════════════════════
//  TASKS
// ══════════════════════════════════════════════════════════════
export const tasksApi = {
  // All tasks for a project
  getProjectTasks: (projectId, params = {}) => {
    console.log('%c[TASKS] getProjectTasks', 'color:#34d399', { projectId, params })
    return api.get(`/projects/${projectId}/tasks`, { params })
  },

  // Task stats
  getStats: (projectId) => {
    console.log('%c[TASKS] getStats', 'color:#34d399', projectId)
    return api.get(`/projects/${projectId}/tasks/stats`)
  },

  // My personal task list
  getMine: (params = {}) => {
    console.log('%c[TASKS] getMine', 'color:#34d399', params)
    return api.get('/tasks/me', { params })
  },

  getById: (projectId, taskId) => {
    console.log('%c[TASKS] getById', 'color:#34d399', { projectId, taskId })
    return api.get(`/projects/${projectId}/tasks/${taskId}`)
  },

  create: (projectId, data) => {
    console.log('%c[TASKS] create', 'color:#34d399', { projectId, ...data })
    return api.post(`/projects/${projectId}/tasks`, data)
  },

  update: (projectId, taskId, data) => {
    console.log('%c[TASKS] update', 'color:#34d399', { projectId, taskId, ...data })
    return api.put(`/projects/${projectId}/tasks/${taskId}`, data)
  },

  assign: (projectId, taskId, assigned_to) => {
    console.log('%c[TASKS] assign', 'color:#34d399', { projectId, taskId, assigned_to })
    return api.put(`/projects/${projectId}/tasks/${taskId}/assign`, { assigned_to })
  },

  markComplete: (projectId, taskId) => {
    console.log('%c[TASKS] markComplete', 'color:#34d399', { projectId, taskId })
    return api.put(`/projects/${projectId}/tasks/${taskId}/complete`)
  },

  delete: (projectId, taskId) => {
    console.log('%c[TASKS] delete', 'color:#34d399', { projectId, taskId })
    return api.delete(`/projects/${projectId}/tasks/${taskId}`)
  },
}
