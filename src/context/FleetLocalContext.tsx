// Fleet Local Context
import { createContext, useContext, ReactNode } from 'react'

interface FleetLocalContextType {
  [key: string]: unknown
}

const FleetLocalContext = createContext<FleetLocalContextType>({})

export function FleetLocalProvider({ children }: { children: ReactNode }) {
  return (
    <FleetLocalContext.Provider value={{}}>
      {children}
    </FleetLocalContext.Provider>
  )
}

export function useFleetLocal() {
  return useContext(FleetLocalContext)
}
