import { useState, useEffect, useCallback, useRef } from 'react'

// ── Generic async hook ────────────────────────────────────────
export const useAsync = (asyncFn, deps = [], immediate = true) => {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFn(...args)
      if (mountedRef.current) {
        setData(result.data?.data ?? result.data)
        console.log('%c[useAsync] success', 'color:#34d399', result.data?.data ?? result.data)
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        const msg = err.response?.data?.message || err.message || 'Something went wrong'
        setError(msg)
        console.error('%c[useAsync] error', 'color:#f87171', msg)
      }
      throw err
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => {
    if (immediate) execute()
  }, [execute]) // eslint-disable-line

  return { data, loading, error, execute, setData }
}

// ── Debounce hook ─────────────────────────────────────────────
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Modal state ───────────────────────────────────────────────
export const useModal = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial)
  const open  = useCallback(() => setIsOpen(true),  [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle= useCallback(() => setIsOpen(v => !v), [])
  return { isOpen, open, close, toggle }
}
