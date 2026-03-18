import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

export interface UnsavedStatePayload {
  isDirty: boolean
  details: string[]
  saveNow?: () => Promise<void> | void
}

interface NavigationGuardState extends UnsavedStatePayload {
  setUnsavedState: (payload: UnsavedStatePayload) => void
  clearUnsavedState: () => void
}

const defaultState: NavigationGuardState = {
  isDirty: false,
  details: [],
  setUnsavedState: () => {},
  clearUnsavedState: () => {}
}

const NavigationGuardContext = createContext<NavigationGuardState>(defaultState)

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UnsavedStatePayload>({ isDirty: false, details: [] })

  const value = useMemo(
    () => ({
      ...state,
      setUnsavedState: (payload: UnsavedStatePayload) => setState(payload),
      clearUnsavedState: () => setState({ isDirty: false, details: [] })
    }),
    [state]
  )

  return <NavigationGuardContext.Provider value={value}>{children}</NavigationGuardContext.Provider>
}

export function useNavigationGuardState() {
  return useContext(NavigationGuardContext)
}
