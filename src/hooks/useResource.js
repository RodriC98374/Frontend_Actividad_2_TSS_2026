import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api.js'

export default function useResource(path, query = {}) {
  const [state, setState] = useState(null)
  const [revision, setRevision] = useState(0)
  const key = JSON.stringify(query)
  const identity = `${path}:${key}:${revision}`
  useEffect(() => {
    const controller = new AbortController()
    if (!path) return () => controller.abort()
    api
      .get(path, { query: JSON.parse(key), signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ identity, data, loading: false, error: null })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ identity, data: null, loading: false, error })
      })
    return () => controller.abort()
  }, [path, key, revision, identity])
  const reload = useCallback(() => setRevision((v) => v + 1), [])
  return {
    ...(state?.identity === identity
      ? state
      : { data: null, loading: !!path, error: null }),
    reload,
  }
}
