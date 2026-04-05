import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'

const ClubContext = createContext(null)

export function ClubProvider({ children }) {
  const { clubs } = useAuth()

  const [activeClubState, setActiveClubState] = useState(() => {
    try {
      const stored = localStorage.getItem('active_club')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Always reflect the latest role from AuthContext so role changes are
  // picked up without the user needing to re-select their club.
  const activeClub = useMemo(() => {
    if (!activeClubState) return null
    const fresh = clubs.find(c => c.id === activeClubState.id)
    return fresh ? { ...activeClubState, role: fresh.role } : activeClubState
  }, [activeClubState, clubs])

  const setActiveClub = useCallback((club) => {
    if (club) {
      localStorage.setItem('active_club', JSON.stringify(club))
      localStorage.setItem('active_club_id', String(club.id))
    } else {
      localStorage.removeItem('active_club')
      localStorage.removeItem('active_club_id')
    }
    setActiveClubState(club)
  }, [])

  const clearClub = useCallback(() => setActiveClub(null), [setActiveClub])

  return (
    <ClubContext.Provider value={{ activeClub, setActiveClub, clearClub }}>
      {children}
    </ClubContext.Provider>
  )
}

export const useClub = () => useContext(ClubContext)
