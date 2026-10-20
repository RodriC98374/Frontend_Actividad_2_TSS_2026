import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

import { UnsavedContext as Context, DiscardContext } from './unsaved.js'
export function UnsavedProvider({ children }) {
  const dirty = useRef(new Set())
  const update = useCallback((id, value) => {
    if (value) dirty.current.add(id)
    else dirty.current.delete(id)
  }, [])
  const confirmDiscard = useCallback(() => {
    if (!dirty.current.size) return true
    if (!window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos?')) return false
    dirty.current.clear()
    return true
  }, [])
  const blocker = useBlocker(({currentLocation, nextLocation}) => dirty.current.size > 0 && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))
  useEffect(() => {
    const warn = event => {
      if (dirty.current.size) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('Hay cambios sin guardar. ¿Quieres salir y descartarlos?')) blocker.proceed()
    else blocker.reset()
  }, [blocker])
  return <Context.Provider value={update}><DiscardContext.Provider value={confirmDiscard}>{children}</DiscardContext.Provider></Context.Provider>
}
