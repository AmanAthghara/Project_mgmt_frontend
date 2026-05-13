import axios from 'axios'

const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request interceptor: attach JWT + log every call ─────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.group(`%c📤 API REQUEST: ${config.method?.toUpperCase()} ${config.url}`, 'color:#4f8ef7;font-weight:600')
    console.log('URL     :', `${BASE_URL}${config.url}`)
    console.log('Method  :', config.method?.toUpperCase())
    console.log('Headers :', config.headers)
    if (config.params) console.log('Params  :', config.params)
    if (config.data)   console.log('Body    :', config.data)
    console.groupEnd()

    return config
  },
  (error) => {
    console.error('%c❌ REQUEST ERROR', 'color:#f87171', error)
    return Promise.reject(error)
  }
)

// ── Response interceptor: log + handle 401 auto-logout ───────
api.interceptors.response.use(
  (response) => {
    const { config, status, data } = response

    console.group(
      `%c📥 API RESPONSE: ${status} ${config.method?.toUpperCase()} ${config.url}`,
      'color:#34d399;font-weight:600'
    )
    console.log('Status  :', status)
    console.log('Data    :', data)
    console.groupEnd()

    return response
  },
  (error) => {
    const status  = error.response?.status
    const message = error.response?.data?.message || error.message
    const url     = error.config?.url

    console.group(`%c❌ API ERROR: ${status} ${error.config?.method?.toUpperCase()} ${url}`, 'color:#f87171;font-weight:600')
    console.log('Status  :', status)
    console.log('Message :', message)
    console.log('Errors  :', error.response?.data?.errors)
    console.log('Full    :', error.response?.data)
    console.groupEnd()

    // Auto logout on 401
    if (status === 401) {
      console.warn('%c🔒 401 Unauthorized — clearing session', 'color:#fbbf24')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
