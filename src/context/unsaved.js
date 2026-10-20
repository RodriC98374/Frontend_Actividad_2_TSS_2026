import { createContext, useContext, useCallback, useEffect, useId } from 'react'
export const UnsavedContext = createContext(null)
export function useUnsavedChanges() {
  const update = useContext(UnsavedContext)
  const id = useId()
  useEffect(() => () => update?.(id, false), [id, update])
  return useCallback(value => update?.(id, value), [id, update])
}

export const DiscardContext = createContext(() => true)
export function useConfirmDiscard() { return useContext(DiscardContext) }
